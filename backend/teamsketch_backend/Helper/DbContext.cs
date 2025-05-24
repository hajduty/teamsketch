using MongoDB.Driver;
using teamsketch_backend.Model;

namespace teamsketch_backend.Data
{
    public class DbContext
    {
        private readonly IMongoDatabase _database;

        public DbContext(IConfiguration config)
        {
            var client = new MongoClient(config["MongoDb:ConnectionString"]);
            _database = client.GetDatabase(config["MongoDb:DatabaseName"]);
            CreateIndexes();
        }

        public IMongoCollection<User> Users => _database.GetCollection<User>("users");
        public IMongoCollection<RoomMetadata> RoomMetadata => _database.GetCollection<RoomMetadata>("roomMetadata");
        public IMongoCollection<Permission> Permissions => _database.GetCollection<Permission>("permissions");

        private void CreateIndexes()
        {
            var permissionKeys = Builders<Permission>.IndexKeys
                .Ascending(p => p.UserId)
                .Ascending(p => p.RoomId);

            var permissionIndexOptions = new CreateIndexOptions { Unique = true };
            var permissionIndexModel = new CreateIndexModel<Permission>(permissionKeys, permissionIndexOptions);

            Permissions.Indexes.CreateOne(permissionIndexModel);
        }

    }
}
