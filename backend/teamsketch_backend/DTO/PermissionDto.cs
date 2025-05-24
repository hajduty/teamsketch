namespace teamsketch_backend.DTO
{
    public class PermissionDto
    {
        public required string RoomId { get; set; }
        public required string UserEmail { get; set; }
        public required string Role { get; set; }
    }
}
