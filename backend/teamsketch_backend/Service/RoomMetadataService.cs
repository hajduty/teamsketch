using MongoDB.Driver;
using teamsketch_backend.Data;
using teamsketch_backend.Model;

namespace teamsketch_backend.Service
{
    public class RoomMetadataService
    {
        private readonly DbContext _context;

        public RoomMetadataService(DbContext context)
        {
            _context = context;
        }

        public async Task<RoomMetadata?> GetByRoomIdAsync(string roomId)
        {
            return await _context.RoomMetadata
                .Find(r => r.RoomId == roomId)
                .FirstOrDefaultAsync();
        }

        public async Task<List<RoomMetadata>> GetAllByOwnerAsync(string ownerId)
        {
            return await _context.RoomMetadata
                .Find(r => r.OwnerId == ownerId)
                .ToListAsync();
        }

        public async Task CreateRoomAsync(string roomId, string ownerId, string? title = null)
        {
            var exists = await GetByRoomIdAsync(roomId);
            if (exists != null)
                return;

            var metadata = new RoomMetadata
            {
                RoomId = roomId,
                OwnerId = ownerId,
                Title = title
            };

            if (ownerId == "public")
            {
                metadata.Public = true;
            }

            await _context.RoomMetadata.InsertOneAsync(metadata);
        }

        public async Task<bool> IsOwnerAsync(string roomId, string userId)
        {
            var metadata = await GetByRoomIdAsync(roomId);
            return metadata?.OwnerId == userId;
        }

        public async Task UpdateTitleAsync(string roomId, string title)
        {
            var update = Builders<RoomMetadata>.Update.Set(r => r.Title, title);
            await _context.RoomMetadata.UpdateOneAsync(
                r => r.RoomId == roomId,
                update
            );
        }

        public async Task DeleteRoomAsync(string roomId)
        {
            await _context.RoomMetadata.DeleteOneAsync(r => r.RoomId == roomId);
        }
    }
}
