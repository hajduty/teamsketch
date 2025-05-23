using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace teamsketch_backend.Model
{
    public class Permission
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        [JsonPropertyName("userId")]
        public string? UserId { get; set; }
        [JsonPropertyName("roomId")]
        public string? RoomId { get; set; }
        [JsonPropertyName("role")]
        public string? Role { get; set; }
    }
}
