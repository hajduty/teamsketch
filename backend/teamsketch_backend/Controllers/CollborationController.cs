using Microsoft.AspNetCore.Mvc;
using YDotNet.Server.WebSockets;

namespace teamsketch_backend.Controllers
{
    public class CollborationController : Controller
    {
        [HttpGet("/collaboration/{roomName}")]
        public IActionResult Room(string roomName)
        {
            return new YDotNetActionResult(roomName);
        }
    }
}
