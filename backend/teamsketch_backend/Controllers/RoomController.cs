using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using teamsketch_backend.DTO;
using teamsketch_backend.Model;
using teamsketch_backend.Service;
using YDotNet.Server.Storage;
using YDotNet.Server.WebSockets;

namespace teamsketch_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomController : ControllerBase
    {
        private readonly IDocumentStorage _documentStore;
        private readonly TokenService _tokenService;
        private readonly PermissionService _permissionService;
        private readonly RoomMetadataService _metadataService;

        public RoomController(IDocumentStorage documentStore, TokenService tokenService, PermissionService permissionService, RoomMetadataService roomMetadataService)
        {
            _tokenService = tokenService;
            _documentStore = documentStore;
            _permissionService = permissionService;
            _metadataService = roomMetadataService;
        }

        [HttpGet("collaboration/{roomName}/{token}")]
        public async Task<IActionResult> RoomAsync(string roomName, string token)
        {
            Console.WriteLine($"DEBUG: RoomAsync called with roomName={roomName}, token={token}");
            try
            {
                if (string.IsNullOrEmpty(token))
                {
                    Console.WriteLine($"DEBUG: Token is empty {roomName}, token={token}");
                    return Unauthorized("Token is required.");
                }

                if (_tokenService.IsTokenValid(token, out var principal))
                {
                    var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                    Console.WriteLine($"DEBUG: UserId from token: {userId}");
                    //Console.WriteLine($"DEBUG: UserId from token: {userId}");
                    //Console.WriteLine($"DEBUG: All claims: {string.Join(", ", principal.Claims.Select(c => $"{c.Type}={c.Value}"))}");

                    var doc = await _documentStore.GetDocAsync(roomName);

                    if (doc == null)
                    {
                        Console.WriteLine($"DEBUG: Creating new room {roomName} for user {userId}");

                        // Create new room with owner permission
                        await _metadataService.CreateRoomAsync(roomName, userId);

                        try
                        {
                            // Use the new AddOwnerPermissionAsync method instead
                            await _permissionService.AddOwnerPermissionAsync(roomName, userId);
                            //Console.WriteLine($"DEBUG: Successfully added owner permission for {userId}");
                        }
                        catch (Exception ex)
                        {
                            //.WriteLine($"DEBUG: Failed to add owner permission: {ex.Message}");
                            return BadRequest($"Failed to create room: {ex.Message}");
                        }

                        return new YDotNetActionResult(roomName);
                    }

                    // Check permission using userId (not email)
                    var role = await _permissionService.GetPermissionAsync(userId, roomName);

                    //Console.WriteLine($"DEBUG: User {userId} has role '{role}' in room {roomName}");

                    if (role == "none")
                    {
                        Console.WriteLine($"DEBUG: No perms (why no add) {roomName}, token={token}");
                        return Unauthorized("You do not have permission to access this room.");
                    }

                    return new YDotNetActionResult(roomName);
                }
                else
                {
                    Console.WriteLine($"DEBUG: Token is lrly invalid {roomName}, token={token}");
                    return Unauthorized("Token is invalid.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DEBUG: Exception occurred: {ex.Message}");
                return BadRequest($"An error occurred: {ex.Message}");
            }
        }
    }
}