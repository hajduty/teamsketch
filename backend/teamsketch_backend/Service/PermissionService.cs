using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using MongoDB.Driver;
using System.Security;
using teamsketch_backend.Data;
using teamsketch_backend.DTO;
using teamsketch_backend.Helper;
using teamsketch_backend.Model;

namespace teamsketch_backend.Service
{
    public class PermissionService
    {
        private readonly IMongoCollection<Permission> _permissions;
        private readonly IMongoCollection<RoomMetadata> _roomMetadata;
        private readonly IMongoCollection<User> _users;

        //private readonly IMemoryCache _cache;
        private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(5);

        public PermissionService(DbContext context, IMemoryCache cache)
        {
            _permissions = context.Permissions;
            //_cache = cache;
            _roomMetadata = context.RoomMetadata;
            _users = context.Users;
        }

        private string GetCacheKey(string userId, string roomId) => $"perm_{userId}_{roomId}";

        private async Task<string?> GetUserIdByEmailAsync(string email)
        {
            try
            {
                var user = await _users.Find(u => u.Email == email).FirstOrDefaultAsync();
                return user?.Id;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: GetUserIdByEmailAsync failed: {ex.Message}");
                return null;
            }
        }

        private async Task<string?> GetUserEmailByIdAsync(string userId)
        {
            try
            {
                var user = await _users.Find(u => u.Id == userId).FirstOrDefaultAsync();
                return user?.Email;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: GetUserEmailByIdAsync failed: {ex.Message}");
                return null;
            }
        }

        public async Task<List<PermissionDto>> GetPermissionsByRoomAsync(string roomId)
        {
            try
            {
                var permissions = await _permissions.Find(p => p.RoomId == roomId).ToListAsync();

                var permissionDtos = new List<PermissionDto>();
                foreach (var permission in permissions)
                {
                    var userEmail = await GetUserEmailByIdAsync(permission.UserId) ?? "unknown";
                    permissionDtos.Add(new PermissionDto
                    {
                        UserEmail = userEmail,
                        RoomId = permission.RoomId,
                        Role = permission.Role
                    });
                }
                return permissionDtos;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: GetPermissionsByRoomAsync failed: {ex.Message}");
                return new List<PermissionDto>(); // Return empty list on error
            }
        }

        public async Task<string> GetPermissionAsync(string userId, string roomId)
        {
            try
            {
                var cacheKey = GetCacheKey(userId, roomId);

                //if (_cache.TryGetValue(cacheKey, out string cachedRole))
                //{
                //    return cachedRole;
                //}

                var permission = await _permissions.Find(p => p.UserId == userId && p.RoomId == roomId).FirstOrDefaultAsync();

                var role = permission?.Role ?? "none";

                //_cache.Set(cacheKey, role, _cacheDuration);

                return role;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: GetPermissionAsync failed: {ex.Message}");
                return "none"; // Return "none" if error
            }
        }

        public async Task<Result> AddOwnerPermissionAsync(string roomId, string userId)
        {
            try
            {
                var userEmail = await GetUserEmailByIdAsync(userId);
                if (string.IsNullOrEmpty(userEmail))
                {
                    return Result.Fail($"ERROR: Cannot add owner permission, user email not found for userId {userId}");
                }

                var cacheKey = GetCacheKey(userId, roomId);
                //_cache.Remove(cacheKey);

                var existingPermission = await GetPermissionAsync(userId, roomId);
                if (existingPermission != "none")
                {
                    return Result.Fail($"DEBUG: Owner permission already exists: {existingPermission}");
                }

                var newPermission = new Permission
                {
                    UserId = userId,
                    UserEmail = userEmail,
                    RoomId = roomId,
                    Role = "owner"
                };

                try
                {
                    await _permissions.InsertOneAsync(newPermission);
                    //_cache.Set(cacheKey, "owner", _cacheDuration);

                    var verification = await _permissions.Find(p => p.UserId == userId && p.RoomId == roomId).FirstOrDefaultAsync();

                    Console.WriteLine($"DEBUG: Successfully added owner permission - Verified: {verification != null}");
                    return Result.Ok();
                }
                catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey)
                {
                    //_cache.Set(cacheKey, "owner", _cacheDuration);
                    return Result.Fail($"DEBUG: Duplicate key handled for owner permission");
                }
                catch (Exception ex)
                {
                    return Result.Fail($"ERROR: Failed to insert owner permission: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                return Result.Fail($"ERROR: AddOwnerPermissionAsync failed: {ex.Message}");
            }
        }

        public async Task<Result> AddPermissionAsync(PermissionDto permission, string currentUserId, bool isOwnerOperation = false)
        {
            try
            {
                var targetUserId = await GetUserIdByEmailAsync(permission.UserEmail);
                if (string.IsNullOrEmpty(targetUserId))
                {
                    return Result.Fail($"ERROR: Cannot add permission, userId not found for email {permission.UserEmail}");
                }

                if (!isOwnerOperation)
                {
                    await EnsureRoomOwnershipAsync(permission.RoomId, currentUserId);
                }

                var existingPermission = await GetPermissionAsync(targetUserId, permission.RoomId);

                if (existingPermission != "none")
                {
                    return Result.Fail($"DEBUG: Permission already exists: {existingPermission}");
                }

                var newPermission = new Permission
                {
                    UserId = targetUserId,
                    UserEmail = permission.UserEmail,
                    RoomId = permission.RoomId,
                    Role = permission.Role
                };

                try
                {
                    await _permissions.InsertOneAsync(newPermission);
                    var cacheKey = GetCacheKey(targetUserId, permission.RoomId);
                    //_cache.Set(cacheKey, permission.Role, _cacheDuration);
                    Console.WriteLine($"DEBUG: Successfully added permission - UserId: {targetUserId}, Role: {permission.Role}");
                    return Result.Ok();
                }
                catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey)
                {
                    var cacheKey = GetCacheKey(targetUserId, permission.RoomId);
                    //_cache.Set(cacheKey, permission.Role, _cacheDuration);
                    return Result.Fail($"DEBUG: Duplicate key handled for UserId: {targetUserId}");
                }
            }
            catch (Exception ex)
            {
                return Result.Fail($"ERROR: AddPermissionAsync failed: {ex.Message}");
            }
        }

        public async Task<Result> EditPermissionAsync(PermissionDto permission, string currentUserId)
        {
            try
            {
                var targetUserId = await GetUserIdByEmailAsync(permission.UserEmail);
                if (string.IsNullOrEmpty(targetUserId))
                    return Result.Fail($"ERROR: Cannot edit permission, userId not found for email {permission.UserEmail}");

                await EnsureRoomOwnershipAsync(permission.RoomId, currentUserId);

                var existingPermission = await _permissions.Find(p => p.UserId == targetUserId && p.RoomId == permission.RoomId).FirstOrDefaultAsync();
                if (existingPermission == null)
                    return Result.Fail("ERROR: Permission not found for this user and room");

                if (existingPermission.Role == "owner")
                    return Result.Fail("ERROR: Cannot edit owner permissions");

                var filter = Builders<Permission>.Filter.Where(p => p.UserId == targetUserId && p.RoomId == permission.RoomId);
                var update = Builders<Permission>.Update.Set(p => p.Role, permission.Role);

                await _permissions.UpdateOneAsync(filter, update);

                var cacheKey = GetCacheKey(targetUserId, permission.RoomId);
                //_cache.Set(cacheKey, permission.Role, _cacheDuration);

                Console.WriteLine($"DEBUG: Edited permission for user {targetUserId}");
                return Result.Ok();
            }
            catch (Exception ex)
            {
                return Result.Fail($"ERROR: EditPermissionAsync failed: {ex.Message}");
            }
        }

        public async Task<Result> DeletePermissionAsync(PermissionDto permission, string currentUserId)
        {
            try
            {
                var targetUserId = await GetUserIdByEmailAsync(permission.UserEmail);
                if (string.IsNullOrEmpty(targetUserId))
                    return Result.Fail($"ERROR: Cannot delete permission, userId not found for email {permission.UserEmail}");

                await EnsureRoomOwnershipAsync(permission.RoomId, currentUserId);

                var existingPermission = await _permissions.Find(p => p.UserId == targetUserId && p.RoomId == permission.RoomId).FirstOrDefaultAsync();
                if (existingPermission == null)
                    return Result.Fail("ERROR: Permission not found for this user and room");

                if (existingPermission.Role == "owner")
                    return Result.Fail("ERROR: Cannot delete owner permissions");

                await _permissions.DeleteOneAsync(p => p.UserId == targetUserId && p.RoomId == permission.RoomId);

                var cacheKey = GetCacheKey(targetUserId, permission.RoomId);
                //_cache.Remove(cacheKey);

                Console.WriteLine($"DEBUG: Deleted permission for user {targetUserId}");
                return Result.Ok();
            }
            catch (Exception ex)
            {
                return Result.Fail($"ERROR: DeletePermissionAsync failed: {ex.Message}");
            }
        }

        public async Task InternalDeletePermissionByIdAsync(string targetUserId, string roomId)
        {
            try
            {
                var existingPermission = await _permissions.Find(p => p.UserId == targetUserId && p.RoomId == roomId).FirstOrDefaultAsync();
                if (existingPermission == null)
                {
                    Console.WriteLine($"ERROR: Permission not found for user {targetUserId} and room {roomId}");
                    return;
                }

                await _permissions.DeleteOneAsync(p => p.UserId == targetUserId && p.RoomId == roomId);

                var cacheKey = GetCacheKey(targetUserId, roomId);
                //_cache.Remove(cacheKey);

                Console.WriteLine($"DEBUG: Internally deleted permission for user {targetUserId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: InternalDeletePermissionByIdAsync failed: {ex.Message}");
            }
        }

        public async Task<List<Permission>> GetRoomsForUser(string id)
        {
            try
            {
                var rooms = await _permissions.Find(r => r.UserId == id).ToListAsync();

                return rooms;
            }
            catch (Exception ex)
            {
                throw new FileNotFoundException($"ERROR: GetRoomsForUser failed: {ex.Message}");
            }
        }

        private async Task EnsureRoomOwnershipAsync(string roomId, string currentUserId)
        {
            try
            {
                var isOwner = await _permissions.Find(p => p.UserId == currentUserId && p.RoomId == roomId && p.Role == "owner").AnyAsync();
                if (!isOwner)
                {
                    throw new SecurityException("Access denied: User is not an owner of the room");
                }
            }
            catch (SecurityException)
            {
                throw;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: EnsureRoomOwnershipAsync failed: {ex.Message}");
                throw;
            }
        }
    }
}
