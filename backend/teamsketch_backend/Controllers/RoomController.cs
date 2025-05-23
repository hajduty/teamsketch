using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
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

        public RoomController(IDocumentStorage documentStore, TokenService tokenService, PermissionService permissionService)
        {
            _tokenService = tokenService;
            _documentStore = documentStore;
            _permissionService = permissionService;
        }

        [HttpGet("collaboration/{roomName}/{token}")]
        public async Task<IActionResult> RoomAsync(string roomName, string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized("Token is required.");
            }

            if (_tokenService.IsTokenValid(token, out var principal))
            {
                var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var doc = await _documentStore.GetDocAsync(roomName);

                if (doc == null)
                {
                    await _permissionService.AddPermissionAsync(userId, roomName, "owner");
                }

                var role = await _permissionService.GetPermissionAsync(userId, roomName);

                if (role == "none")
                {
                    return Unauthorized("You do not have permission to access this room.");
                }

                return new YDotNetActionResult(roomName);
            }
            else
            {
                return Unauthorized("Token is invalid.");
            }
        }
    }
}
