using Microsoft.AspNetCore.Mvc;
using teamsketch_backend.DTO;
using teamsketch_backend.Model;
using teamsketch_backend.Service;

namespace teamsketch_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(UserService userService, TokenService tokenService) : ControllerBase
    {
        [HttpPost("login")]
        public async Task<IActionResult> LoginAsync([FromBody] LoginDto loginUser)
        {
            var user = await userService.AuthenticateAsync(loginUser.Email, loginUser.Password);
            if (user == null)
                return Unauthorized();

            var token = tokenService.GenerateToken(user.Id, user.Email);
            return Ok(new { token, user = UserDto.FromUser(user) });
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterAsync([FromBody] LoginDto user)
        {
            if (await userService.UserExists(user.Email))
                return BadRequest("User already exists.");

            await userService.CreateUserAsync(user);
            return Ok("Registered successfully.");
        }
    }
}