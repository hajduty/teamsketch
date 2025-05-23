using teamsketch_backend.Model;

namespace teamsketch_backend.DTO
{
    public class UserDto
    {
        public string Id { get; set; }
        public string Email { get; set; }

        public static UserDto FromUser(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Email = user.Email
            };
        }
    }
}
