
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.Text;
using teamsketch_backend.Data;
using teamsketch_backend.Service;
using YDotNet.Server;
using YDotNet.Server.MongoDB;

namespace teamsketch_backend
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddMemoryCache();

            builder.Services.AddSingleton<DbContext>();
            builder.Services.AddSingleton<TokenService>();
            builder.Services.AddSingleton<UserService>();
            builder.Services.AddSingleton<RoomMetadataService>();
            builder.Services.AddSingleton<PermissionService>();

            var config = builder.Configuration;
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(opt =>
                {
                    opt.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["token"];
                            var path = context.HttpContext.Request.Path;

                            if (!string.IsNullOrEmpty(accessToken) &&
                                path.StartsWithSegments("/api/Room/collaboration"))
                            {
                                context.Token = accessToken;
                            }

                            return Task.CompletedTask;
                        }
                    };


                    opt.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = config["Jwt:Issuer"],
                        ValidAudience = config["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!))
                    };
                });

            builder.Services.Configure<DocumentManagerOptions>(options =>
            {
                options.CacheDuration = TimeSpan.FromSeconds(10);
            });

            var yDotNet = builder.Services.AddYDotNet().AutoCleanup().AddCallback<Callback>().AddWebSockets();

            yDotNet.Services.AddSingleton<IMongoClient>(_ => new MongoClient(builder.Configuration["MongoDb:ConnectionString"]));

            yDotNet.AddMongoStorage(options =>
            {
                options.DatabaseName = builder.Configuration["MongoDb:DatabaseName"]!;
            });

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowOrigin",
                    builder =>
                    {
                        builder.WithOrigins("http://localhost:5173")
                               .AllowAnyHeader()
                               .AllowAnyMethod();
                    });

                options.AddPolicy("NoCredentials", 
                    builder =>
                    {
                        builder.WithOrigins("http://localhost:5173")
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                    });
            });

            //builder.Services.AddSingleton<IWebSocketConnectionService, WebSocketConnectionService>();
            builder.Services.AddHttpContextAccessor();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            
            app.UseCors("AllowOrigin");

            app.UseHttpsRedirection();

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseWebSockets();

            app.MapControllers();

            app.Run();
        }
    }
}
