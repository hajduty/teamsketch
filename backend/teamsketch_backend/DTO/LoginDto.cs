using System.ComponentModel.DataAnnotations;

namespace teamsketch_backend.DTO
{
    public class LoginDto
    {
        public required string Email { get; set; } 
        public required string Password { get; set; }
    }
}
