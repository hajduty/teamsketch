using System.Collections.Concurrent;
using System.Text.Json.Serialization;
using System.Text.Json;
using teamsketch_backend.Model;
using teamsketch_backend.Service;
using YDotNet.Server;

public sealed class Callback(ILogger<Callback> log, PermissionService permissionService, IHttpContextAccessor httpContextAccessor) : IDocumentCallback
{
    private static readonly ConcurrentDictionary<ulong, string> ClientIdToUserId = new ConcurrentDictionary<ulong, string>();

    public ValueTask OnDocumentLoadedAsync(DocumentLoadEvent @event)
    {
        log.LogInformation("Client joined - ClientId: {clientId}, DocumentName: {documentName}", @event.Context.ClientId, @event.Context.DocumentName);

        // Don't register here if ClientId is 0 - wait for awareness update
        return default;
    }

    public ValueTask OnAwarenessUpdatedAsync(ClientAwarenessEvent @event)
    {
        log.LogInformation("Awareness updated - ClientId: {clientId}", @event.Context.ClientId);

        var clientStateJson = @event.ClientState;
        if (!string.IsNullOrEmpty(clientStateJson))
        {
            try
            {
                var clientState = JsonSerializer.Deserialize<ClientAwarenessState>(clientStateJson);
                if (clientState?.UserId != null)
                {

                    var permission = permissionService.GetPermissionAsync(clientState.UserId, @event.Context.DocumentName).Result;
                    clientState.Role = permission;
                    @event.ClientState = JsonSerializer.Serialize(clientState);
                }
            }
            catch (JsonException ex)
            {
                log.LogInformation(ex, "Failed to deserialize client awareness state JSON.");
            }
        }
        return ValueTask.CompletedTask;
    }

    public async ValueTask OnDocumentChangedAsync(DocumentChangedEvent @event)
    {
        log.LogInformation("Document changed - ClientId: {clientId}", @event.Context.ClientId);

        var userId = ClientIdToUserId.GetValueOrDefault(@event.Context.ClientId);

        if (userId != null)
        {
            log.LogInformation("Document {documentName} changed by user {userId} (ClientId: {clientId})", @event.Context.DocumentName, userId, @event.Context.ClientId);

            var role = await permissionService.GetPermissionAsync(userId, @event.Context.DocumentName);

            if (role == "none" || role == "viewer")
            {
                log.LogCritical("User {userId} (ClientId: {clientId}) does not have permission to edit document {documentName}. DISCONNECTING!", userId, @event.Context.ClientId, @event.Context.DocumentName);
                var httpContext = httpContextAccessor.HttpContext;
                httpContext!.Abort();
            }
        }
        else
        {
            log.LogWarning("Document {documentName} changed by unknown client {clientId}.", @event.Context.DocumentName, @event.Context.ClientId);
        }
    }

    public ValueTask OnClientDisconnectedAsync(ClientDisconnectedEvent @event)
    {
        var clientId = @event.Context.ClientId;
        log.LogInformation("Client disconnecting - ClientId: {clientId}", clientId);

        if (ClientIdToUserId.TryRemove(clientId, out var userId))
        {
            log.LogInformation("Client {clientId} (userId: {userId}) disconnected. REASON: {r}", clientId, userId, @event.Reason);
        }
        else
        {
            log.LogInformation("Client {clientId} disconnected, but no userId was found in cache.", clientId);
        }

        return ValueTask.CompletedTask;
    }

    public sealed class Notification
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }
    }
}