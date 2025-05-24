using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using teamsketch_backend.DTO;
using teamsketch_backend.Service;

namespace teamsketch_backend.Controllers
{
    [Authorize]
    [Route("api/Room/[controller]")]
    [ApiController]
    public class PermissionController(PermissionService permissionService) : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> AddUser([FromBody] PermissionDto permission)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                var result = await permissionService.AddPermissionAsync(permission, userId);

                if (!result.IsSuccess)
                {
                    return BadRequest(new { message = result.Error });
                }

                return Ok(new { message = "Permission added successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> RemoveUser([FromBody] PermissionDto permission)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                var result = await permissionService.DeletePermissionAsync(permission, userId);

                if (!result.IsSuccess)
                {
                    return BadRequest(new { message = result.Error });
                }

                return Ok(new { message = "Permission deleted successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut]
        public async Task<IActionResult> EditUser([FromBody] PermissionDto permission)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                var result = await permissionService.EditPermissionAsync(permission, userId);

                if (!result.IsSuccess)
                {
                    return BadRequest(new { message = result.Error });
                }

                return Ok(new { message = "Permission edited successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{roomId}")]
        public async Task<IActionResult> GetPermissions(string roomId)
        {
            try
            {
                var permissions = await permissionService.GetPermissionsByRoomAsync(roomId);

                return Ok(permissions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMyRooms()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var permissions = await permissionService.GetRoomsForUser(userId);

                return Ok(permissions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
