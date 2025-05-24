using teamsketch_backend.Data;
using teamsketch_backend.Model;
using MongoDB.Driver;
using Microsoft.AspNetCore.Identity;
using teamsketch_backend.DTO;
using System.Diagnostics;

namespace teamsketch_backend.Service
{
    public class UserService
    {
        private readonly DbContext _context;

        public UserService(DbContext context)
        {
            _context = context;
        }

        public async Task<List<User>> GetAllAsync() => await _context.Users.Find(_ => true).ToListAsync();

        public async Task<User?> GetByIdAsync(string id) =>
            await _context.Users.Find(u => u.Id == id).FirstOrDefaultAsync();

        public async Task UpdateAsync(string id, User updatedUser) =>
            await _context.Users.ReplaceOneAsync(u => u.Id == id, updatedUser);

        public async Task DeleteAsync(string id) =>
            await _context.Users.DeleteOneAsync(u => u.Id == id);

        public async Task<bool> UserExists(string email)
        {
            return await _context.Users.Find(u => u.Email == email).AnyAsync();
        }

        public async Task CreateUserAsync(LoginDto user)
        {
            var newUser = new User
            {
                Email = user.Email,
                Password = user.Password
            };
            var hasher = new PasswordHasher<User>();
            newUser.Password = hasher.HashPassword(newUser, newUser.Password);
            await _context.Users.InsertOneAsync(newUser);
        }

        public async Task<User?> AuthenticateAsync(string email, string password)
        {
            var user = await _context.Users.Find(u => u.Email == email).FirstOrDefaultAsync();
            Debug.WriteLine(user.Id);
            if (user == null) return null;

            var hasher = new PasswordHasher<User>();
            var result = hasher.VerifyHashedPassword(user, user.Password, password);
            return result == PasswordVerificationResult.Success ? user : null;
        }
    }
}
