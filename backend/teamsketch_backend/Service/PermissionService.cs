using Microsoft.Extensions.Caching.Memory;
using MongoDB.Driver;
using System.Security;
using teamsketch_backend.Data;
using teamsketch_backend.Model;

namespace teamsketch_backend.Service
{
    public class PermissionService
    {
        private readonly IMongoCollection<Permission> _permissions;
        private readonly IMemoryCache _cache;
        private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(5);

        public PermissionService(DbContext context, IMemoryCache cache)
        {
            _permissions = context.Permissions;
            _cache = cache;
        }

        private string GetCacheKey(string userId, string roomId) => $"perm_{userId}_{roomId}";

        public async Task AddPermissionAsync(string userId, string roomId, string role)
        {
            var existingPermission = await GetPermissionAsync(userId, roomId);
            if (existingPermission != "none")
            {
                throw new InvalidOperationException("Permission already exists for this user and room");
            }

            var newPermission = new Permission
            {
                UserId = userId,
                RoomId = roomId,
                Role = role
            };

            await _permissions.InsertOneAsync(newPermission);
        }

        public async Task<string> GetPermissionAsync(string userId, string roomId)
        {
            var cacheKey = GetCacheKey(userId, roomId);
            
            if (_cache.TryGetValue(cacheKey, out string cachedRole))
            {
                return cachedRole;
            }

            var permission = await _permissions
                .Find(p => p.UserId == userId && p.RoomId == roomId)
                .FirstOrDefaultAsync();

            var role = permission?.Role ?? "none";

            _cache.Set(cacheKey, role, _cacheDuration);

            return role;
        }

        public async Task EditPermissionAsync(string userId, string roomId, string role)
        {
            var filter = Builders<Permission>.Filter
                .Where(p => p.UserId == userId && p.RoomId == roomId);

            var update = Builders<Permission>.Update.Set(p => p.Role, role);

            var result = await _permissions.UpdateOneAsync(filter, update);

            if (result.MatchedCount == 0)
            {
                throw new KeyNotFoundException("Permission not found for this user and room");
            }
        }

        public async Task DeletePermissionAsync(string userId, string roomId)
        {
            var result = await _permissions.DeleteOneAsync(p =>
                p.UserId == userId && p.RoomId == roomId);

            if (result.DeletedCount == 0)
            {
                throw new KeyNotFoundException("Permission not found for this user and room");
            }
        }

    }
}
