using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace teamsketch_backend.Model
{
    public class RoomMetadata
    {
        [BsonId]
        public string RoomId { get; set; } = default!;
        public string OwnerId { get; set; } = default!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? Title { get; set; }
    }
}
