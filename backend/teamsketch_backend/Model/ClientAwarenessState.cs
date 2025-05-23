using System.Text.Json.Serialization;

namespace teamsketch_backend.Model
{
    public class ClientAwarenessState
    {
        [JsonPropertyName("userId")]
        public string? UserId { get; set; }
        [JsonPropertyName("role")]
        public string? Role { get; set; }
        [JsonPropertyName("username")]
        public string? Username { get; set; }
        [JsonPropertyName("cursorPosition")]
        public CursorPosition? CursorPosition { get; set; }
    }

    public class CursorPosition
    {
        [JsonPropertyName("x")]
        public double X { get; set; }
        [JsonPropertyName("y")]
        public double Y { get; set; }
    }
}
