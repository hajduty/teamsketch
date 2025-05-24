using System.Collections.Concurrent;
using System.Text.Json.Serialization;
using System.Text.Json;
using teamsketch_backend.Model;
using teamsketch_backend.Service;
using YDotNet.Server;
using teamsketch_backend.DTO;
using YDotNet.Document.Cells;
using YDotNet.Document;
using System.Data;

public sealed class Callback(ILogger<Callback> log, PermissionService permissionService, IHttpContextAccessor httpContextAccessor) : IDocumentCallback
{
    private static readonly ConcurrentDictionary<ulong, string> ClientIdToUserId = new ConcurrentDictionary<ulong, string>();
    private static readonly ConcurrentDictionary<ulong, bool> HasHandledFirstChange = new();
    //private static readonly ConcurrentBag<ulong> ClientRolesToCleanup = new();

    public ValueTask OnDocumentLoadedAsync(DocumentLoadEvent @event)
    {
        log.LogInformation("Client joined - ClientId: {clientId}, DocumentName: {documentName}", @event.Context.ClientId, @event.Context.DocumentName);


        return default;
    }

    public ValueTask OnAwarenessUpdatedAsync(ClientAwarenessEvent @event)
    {
        //log.LogInformation("Awareness updated - ClientId: {clientId}", @event.Context.ClientId);

        var clientStateJson = @event.ClientState;
        if (!string.IsNullOrEmpty(clientStateJson))
        {
            try
            {
                var clientState = JsonSerializer.Deserialize<ClientAwarenessState>(clientStateJson);
                if (clientState?.UserId != null)
                {
                    ClientIdToUserId[@event.Context.ClientId] = clientState.UserId;
                }
            }
            catch (JsonException ex)
            {
                log.LogInformation(ex, "Failed to deserialize client awareness state JSON.");
            }
        }
        return default;
    }

    public async ValueTask OnDocumentChangedAsync(DocumentChangedEvent @event)
    {
        var doc = @event.Document;
        var rolesMap = doc.Map("roles");
        var clientId = @event.Context.ClientId;
        var userId = ClientIdToUserId.GetValueOrDefault(clientId);

        var isFirstChange = !HasHandledFirstChange.ContainsKey(clientId);
        HasHandledFirstChange[clientId] = true;

        if (isFirstChange)
        {
            log.LogInformation("Skipping permission check for first sync change - ClientId: {clientId}", clientId);
            return;
        }

        // Modifying document from backend not working?
        // Handle cleanup first in separate transaction
        //if (ClientRolesToCleanup.TryTake(out var clientIdToRemove))
        //{
        //    log.LogInformation("Trying to remove role for client {}", clientIdToRemove.ToString());
        //
        //    using (var cleanupTxn = doc.WriteTransaction())
        //    {
        //        if (rolesMap.Remove(cleanupTxn, clientIdToRemove.ToString()))
        //        {
        //            log.LogInformation("Removed role for disconnected ClientId: {clientId}", clientIdToRemove);
        //        }
        //        cleanupTxn.Commit();
        //    }
        //}

        // Handle role setting in separate transaction
        if (userId != null)
        {
            var role = await permissionService.GetPermissionAsync(userId, @event.Context.DocumentName);

            // Modifying document from backend not working?
            //log.LogInformation("Setting role for user {userId} (ClientId: {clientId}) to role: {role}", userId, clientId, role);
            //
            //var ctx = new DocumentContext(@event.Context.DocumentName, ClientId: clientId);
            //
            //await @event.Source.UpdateDocAsync(ctx, roles =>
            //{
            //    using (var roleTxn = roles.WriteTransaction())
            //    {
            //        var roleMap = roles.Map("roles");
            //        roleMap.Insert(roleTxn, userId.ToString(), Input.String(role));
            //    }
            //});

            //using (var readTxn = doc.ReadTransaction())
            //{
            //    var storedValue = rolesMap.Get(readTxn, userId.ToString());
            //    if (storedValue != null)
            //    {
            //        // Try to get the actual string value
            //        log.LogInformation("Verification: Role stored for userId {clientId} is: {stringValue}", userId, storedValue.String);
            //    }
            //    else
            //    {
            //        log.LogInformation("Verification: No role found for userId {clientId}", userId);
            //    }
            //}


            if (role != "owner" && role != "editor")
            {
                log.LogCritical("User {userId} (ClientId: {clientId}) does not have permission to edit document {documentName}. DISCONNECTING!", userId, clientId, @event.Context.DocumentName);
                var httpContext = httpContextAccessor.HttpContext;
                httpContext!.Abort();
                await permissionService.InternalDeletePermissionByIdAsync(userId, @event.Context.DocumentName);
            }
        }
        else
        {
            log.LogWarning("Document {documentName} changed by unknown client {clientId}.", @event.Context.DocumentName, clientId);
        }
    }

    public ValueTask OnClientDisconnectedAsync(ClientDisconnectedEvent @event)
    {
        var clientId = @event.Context.ClientId;
        log.LogInformation("Client disconnecting - ClientId: {clientId}", clientId);
        //ClientRolesToCleanup.Add(clientId);

        if (ClientIdToUserId.TryRemove(clientId, out var userId))
        {
            log.LogInformation("Client {clientId} (userId: {userId}) disconnected. REASON: {r}", clientId, userId, @event.Reason);
        }
        else
        {
            log.LogInformation("Client {clientId} disconnected, but no userId was found in cache.", clientId);
        }

        if (HasHandledFirstChange.TryRemove(clientId, out var test))
        {
            log.LogInformation("Removed firstChange bool");
        } else
        {
            log.LogInformation("tried removing but no success");
        }

        return default;
    }

    public sealed class Notification
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }
    }
}