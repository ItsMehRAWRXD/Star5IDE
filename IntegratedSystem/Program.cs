using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.IO;

namespace IntegratedSystem
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("=== Integrated Polymorphic System ===");
            Console.WriteLine("Connecting to Ocean Digital, Panel, and Git Storage...");

            try
            {
                // Load configuration
                var config = LoadConfiguration();
                
                // Initialize the integrated system
                var system = new IntegratedPolymorphicSystem(config);
                await system.InitializeAsync();

                // Start command processing loop
                _ = Task.Run(async () => await CommandProcessingLoop(system));

                // Keep the system running
                Console.WriteLine("System is running. Press 'q' to quit, 'h' for health check, 's' for status");
                
                while (true)
                {
                    var key = Console.ReadKey(true);
                    
                    switch (key.KeyChar)
                    {
                        case 'q':
                        case 'Q':
                            Console.WriteLine("\nShutting down...");
                            await system.ShutdownAsync();
                            return;
                            
                        case 'h':
                        case 'H':
                            var health = await system.GetSystemHealth();
                            Console.WriteLine($"\nSystem Health: {health.Status}");
                            Console.WriteLine($"Generators: {health.Generators}");
                            Console.WriteLine($"Total Instructions: {health.TotalInstructions}");
                            Console.WriteLine($"Git Commits: {health.GitCommits}");
                            break;
                            
                        case 's':
                        case 'S':
                            Console.WriteLine("\nSystem Status: RUNNING");
                            Console.WriteLine("Cross-hot-patching: ACTIVE");
                            Console.WriteLine("Ocean Digital: CONNECTED");
                            Console.WriteLine("Git Storage: ACTIVE");
                            break;
                            
                        case 'e':
                        case 'E':
                            await TestEncryption(system);
                            break;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"System failed to start: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
        }

        private static Dictionary<string, object> LoadConfiguration()
        {
            // Load from config file or environment variables
            var config = new Dictionary<string, object>
            {
                ["panel_url"] = Environment.GetEnvironmentVariable("PANEL_URL") ?? "http://localhost:8080",
                ["panel_token"] = Environment.GetEnvironmentVariable("PANEL_TOKEN"),
                ["ocean_url"] = Environment.GetEnvironmentVariable("OCEAN_URL") ?? "https://api.oceandigital.com",
                ["ocean_api_key"] = Environment.GetEnvironmentVariable("OCEAN_API_KEY") ?? "your_api_key_here",
                ["ocean_app_id"] = Environment.GetEnvironmentVariable("OCEAN_APP_ID") ?? "polymorphic_encryption",
                ["git_repo_path"] = Environment.GetEnvironmentVariable("GIT_REPO_PATH") ?? "./polymorphic_repo",
                ["git_remote_url"] = Environment.GetEnvironmentVariable("GIT_REMOTE_URL"),
                ["git_branch"] = Environment.GetEnvironmentVariable("GIT_BRANCH") ?? "main"
            };

            // Try to load from config file
            var configFile = "config.json";
            if (File.Exists(configFile))
            {
                try
                {
                    var configJson = File.ReadAllText(configFile);
                    var fileConfig = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(configJson);
                    
                    foreach (var kvp in fileConfig)
                    {
                        config[kvp.Key] = kvp.Value;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Warning: Failed to load config file: {ex.Message}");
                }
            }

            return config;
        }

        private static async Task CommandProcessingLoop(IntegratedPolymorphicSystem system)
        {
            while (true)
            {
                try
                {
                    await system.ProcessPanelCommands();
                    await Task.Delay(TimeSpan.FromSeconds(10)); // Check every 10 seconds
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Command processing error: {ex.Message}");
                    await Task.Delay(TimeSpan.FromSeconds(30)); // Wait longer on error
                }
            }
        }

        private static async Task TestEncryption(IntegratedPolymorphicSystem system)
        {
            try
            {
                Console.WriteLine("\n=== Testing Encryption ===");
                
                // Create test payload
                var testPayload = System.Text.Encoding.UTF8.GetBytes("This is a test payload for polymorphic encryption");
                
                var request = new EncryptionRequest
                {
                    FileName = "test_payload.bin",
                    Payload = testPayload,
                    Algorithm = "aes-256-cbc",
                    PolyMode = "aes-ctr",
                    OutputExtension = ".exe"
                };

                var result = await system.ProcessEncryptionRequest(request);
                
                if (result.Success)
                {
                    Console.WriteLine($"✓ Encryption successful!");
                    Console.WriteLine($"  File: {result.FileName}");
                    Console.WriteLine($"  Ocean ID: {result.OceanFileId}");
                    Console.WriteLine($"  Git Path: {result.GitPath}");
                    Console.WriteLine($"  Size: {result.OriginalSize} -> {result.EncryptedSize} bytes");
                }
                else
                {
                    Console.WriteLine($"✗ Encryption failed: {result.Error}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Test encryption failed: {ex.Message}");
            }
        }
    }
}