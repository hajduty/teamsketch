using System.Net.WebSockets;
using System.Text;

namespace teamsketch_backend.Service
{
    public class WebSocketService
    {
        private static HashSet<WebSocket> _clients = new HashSet<WebSocket>();

        public async Task HandleWebSocketAsync(WebSocket webSocket)
        {
            Console.WriteLine("New WebSocket connection request...");

            if (webSocket.State != WebSocketState.Open)
            {
                Console.WriteLine("WebSocket failed to open.");
                return;
            }

            _clients.Add(webSocket);

            var buffer = new byte[1024 * 4];

            try
            {
                while (webSocket.State == WebSocketState.Open)
                {
                    var result = await webSocket.ReceiveAsync(
                        new ArraySegment<byte>(buffer), CancellationToken.None
                    );

                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await webSocket.CloseAsync(
                            WebSocketCloseStatus.NormalClosure, "", CancellationToken.None
                        );
                        break;
                    }

                    var data = buffer.Take(result.Count).ToArray();
                    Console.WriteLine($"Received {data.Length} bytes");

                    foreach (var client in _clients.ToList())
                    {
                        if (client.State == WebSocketState.Open)
                        {
                            await client.SendAsync(
                                new ArraySegment<byte>(data),
                                WebSocketMessageType.Binary,
                                true,
                                CancellationToken.None
                            );
                        }
                        else
                        {
                            _clients.Remove(client);
                        }
                    }
                }
            }
            catch (WebSocketException ex)
            {
                Console.WriteLine($"WebSocket Error: {ex.Message}");
                await webSocket.CloseAsync(WebSocketCloseStatus.InternalServerError, "Error occurred", CancellationToken.None);
            }
            finally
            {
                _clients.Remove(webSocket);

                if (webSocket.State == WebSocketState.Open || webSocket.State == WebSocketState.CloseReceived)
                {
                    try
                    {
                        await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                    }
                    catch (WebSocketException ex)
                    {
                        Console.WriteLine($"Failed to close WebSocket: {ex.Message}");
                    }
                }

                webSocket.Dispose();
            }
        }
    }
}
