using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PanelIntegration;
using OceanDigital;
using GitStorage;
using CrossHotPatcher;
using AssemblyGenerators;

namespace IntegratedSystem
{
    public class IntegratedPolymorphicSystem
    {
        private readonly PanelConnector _panelConnector;
        private readonly OceanDigitalConnector _oceanConnector;
        private readonly GitStorageManager _gitStorage;
        private readonly CrossHotPatcher _crossHotPatcher;
        private readonly Dictionary<string, object> _configuration;

        public IntegratedPolymorphicSystem(Dictionary<string, object> config)
        {
            _configuration = config;
            
            // Initialize connectors
            _panelConnector = new PanelConnector(
                config["panel_url"].ToString(),
                config.ContainsKey("panel_token") ? config["panel_token"].ToString() : null
            );

            _oceanConnector = new OceanDigitalConnector(
                config["ocean_url"].ToString(),
                config["ocean_api_key"].ToString(),
                config["ocean_app_id"].ToString()
            );

            _gitStorage = new GitStorageManager(
                config["git_repo_path"].ToString(),
                config.ContainsKey("git_remote_url") ? config["git_remote_url"].ToString() : null,
                config.ContainsKey("git_branch") ? config["git_branch"].ToString() : "main"
            );

            _crossHotPatcher = new CrossHotPatcher(_panelConnector, _oceanConnector, _gitStorage);
        }

        // Initialize the complete system
        public async Task InitializeAsync()
        {
            Console.WriteLine("=== Initializing Integrated Polymorphic System ===");

            try
            {
                // Send initialization status to panel
                await _panelConnector.SendStatusUpdate("system_initializing", new Dictionary<string, object>
                {
                    ["timestamp"] = DateTime.UtcNow,
                    ["version"] = "1.0.0"
                });

                // Get configuration from Ocean Digital
                var oceanConfig = await _oceanConnector.GetConfiguration();
                Console.WriteLine($"Retrieved configuration from Ocean Digital: {oceanConfig.Count} settings");

                // Pull latest changes from Git
                var gitPulled = _gitStorage.PullLatestChanges();
                Console.WriteLine($"Git pull: {(gitPulled ? "Success" : "No remote or failed")}");

                // Start cross-hot-patching system
                await _crossHotPatcher.StartCrossHotPatching();
                Console.WriteLine("Cross-hot-patching system started");

                // Send initialization complete
                await _panelConnector.SendStatusUpdate("system_initialized", new Dictionary<string, object>
                {
                    ["timestamp"] = DateTime.UtcNow,
                    ["git_status"] = _gitStorage.GetRepositoryStatus(),
                    ["ocean_config_count"] = oceanConfig.Count
                });

                Console.WriteLine("=== System Initialization Complete ===");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"System initialization failed: {ex.Message}");
                await _panelConnector.SendStatusUpdate("initialization_failed", new Dictionary<string, object>
                {
                    ["error"] = ex.Message,
                    ["timestamp"] = DateTime.UtcNow
                });
                throw;
            }
        }

        // Process encryption request
        public async Task<EncryptionResult> ProcessEncryptionRequest(EncryptionRequest request)
        {
            try
            {
                Console.WriteLine($"Processing encryption request: {request.FileName}");

                // Send status to panel
                await _panelConnector.SendStatusUpdate("encryption_started", new Dictionary<string, object>
                {
                    ["file_name"] = request.FileName,
                    ["algorithm"] = request.Algorithm,
                    ["poly_mode"] = request.PolyMode,
                    ["timestamp"] = DateTime.UtcNow
                });

                // Generate polymorphic payload
                var polymorphicPayload = await _crossHotPatcher.GeneratePolymorphicPayload(request.Payload);

                // Upload to Ocean Digital
                var fileName = $"{request.FileName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.encrypted";
                var fileId = await _oceanConnector.UploadEncryptedPayload(fileName, polymorphicPayload, new Dictionary<string, object>
                {
                    ["original_file"] = request.FileName,
                    ["algorithm"] = request.Algorithm,
                    ["poly_mode"] = request.PolyMode,
                    ["original_size"] = request.Payload.Length,
                    ["encrypted_size"] = polymorphicPayload.Length
                });

                // Store in Git
                var gitPath = await _gitStorage.StoreEncryptedPayload(fileName, polymorphicPayload, new Dictionary<string, object>
                {
                    ["ocean_file_id"] = fileId,
                    ["algorithm"] = request.Algorithm,
                    ["poly_mode"] = request.PolyMode,
                    ["original_size"] = request.Payload.Length
                });

                // Send result to panel
                await _panelConnector.SendEncryptionResult(fileName, request.Algorithm, request.PolyMode, polymorphicPayload, new Dictionary<string, object>
                {
                    ["ocean_file_id"] = fileId,
                    ["git_path"] = gitPath,
                    ["compression_ratio"] = (double)polymorphicPayload.Length / request.Payload.Length
                });

                Console.WriteLine($"Encryption complete: {fileName} (Ocean ID: {fileId})");

                return new EncryptionResult
                {
                    Success = true,
                    FileName = fileName,
                    OceanFileId = fileId,
                    GitPath = gitPath,
                    EncryptedData = polymorphicPayload,
                    OriginalSize = request.Payload.Length,
                    EncryptedSize = polymorphicPayload.Length
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encryption failed: {ex.Message}");
                
                await _panelConnector.SendStatusUpdate("encryption_failed", new Dictionary<string, object>
                {
                    ["file_name"] = request.FileName,
                    ["error"] = ex.Message,
                    ["timestamp"] = DateTime.UtcNow
                });

                return new EncryptionResult
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        // Get system health
        public async Task<SystemHealth> GetSystemHealth()
        {
            try
            {
                var systemStatus = await _crossHotPatcher.GetSystemStatus();
                var gitStatus = _gitStorage.GetRepositoryStatus();
                var latestCommits = _gitStorage.GetLatestCommits(5);

                var health = new SystemHealth
                {
                    Status = "healthy",
                    Timestamp = DateTime.UtcNow,
                    Generators = (int)systemStatus["generators"],
                    TotalInstructions = (int)systemStatus["total_instructions"],
                    HotPatchMarkers = (int)systemStatus["hot_patch_markers"],
                    GitCommits = gitStatus.TotalCommits,
                    GitUncommittedChanges = gitStatus.UncommittedChanges,
                    RecentCommits = latestCommits
                };

                // Send health check to Ocean Digital
                await _oceanConnector.SendSystemStatus(new Dictionary<string, object>
                {
                    ["status"] = health.Status,
                    ["generators"] = health.Generators,
                    ["total_instructions"] = health.TotalInstructions,
                    ["git_commits"] = health.GitCommits
                });

                return health;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Health check failed: {ex.Message}");
                return new SystemHealth
                {
                    Status = "unhealthy",
                    Timestamp = DateTime.UtcNow,
                    Error = ex.Message
                };
            }
        }

        // Process panel commands
        public async Task ProcessPanelCommands()
        {
            try
            {
                var commands = await _panelConnector.GetCommands();
                
                foreach (var command in commands)
                {
                    if (command.Executed) continue;

                    Console.WriteLine($"Processing panel command: {command.Type} - {command.Action}");

                    switch (command.Type.ToLower())
                    {
                        case "encryption":
                            await ProcessEncryptionCommand(command);
                            break;
                        case "hot_patch":
                            await ProcessHotPatchCommand(command);
                            break;
                        case "system":
                            await ProcessSystemCommand(command);
                            break;
                        default:
                            Console.WriteLine($"Unknown command type: {command.Type}");
                            break;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to process panel commands: {ex.Message}");
            }
        }

        private async Task ProcessEncryptionCommand(PanelCommand command)
        {
            // Implementation for encryption commands
            Console.WriteLine($"Processing encryption command: {command.Action}");
        }

        private async Task ProcessHotPatchCommand(PanelCommand command)
        {
            // Implementation for hot patch commands
            Console.WriteLine($"Processing hot patch command: {command.Action}");
        }

        private async Task ProcessSystemCommand(PanelCommand command)
        {
            // Implementation for system commands
            Console.WriteLine($"Processing system command: {command.Action}");
        }

        // Shutdown the system
        public async Task ShutdownAsync()
        {
            Console.WriteLine("=== Shutting Down Integrated System ===");

            try
            {
                await _crossHotPatcher.StopSystem();
                
                await _panelConnector.SendStatusUpdate("system_shutdown", new Dictionary<string, object>
                {
                    ["timestamp"] = DateTime.UtcNow
                });

                // Store final logs
                var finalHealth = await GetSystemHealth();
                await _gitStorage.StoreSystemLogs(new Dictionary<string, object>
                {
                    ["shutdown"] = true,
                    ["final_health"] = finalHealth,
                    ["timestamp"] = DateTime.UtcNow
                });

                Console.WriteLine("=== System Shutdown Complete ===");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Shutdown error: {ex.Message}");
            }
            finally
            {
                _panelConnector?.Dispose();
                _oceanConnector?.Dispose();
            }
        }
    }

    public class EncryptionRequest
    {
        public string FileName { get; set; }
        public byte[] Payload { get; set; }
        public string Algorithm { get; set; }
        public string PolyMode { get; set; }
        public string OutputExtension { get; set; }
    }

    public class EncryptionResult
    {
        public bool Success { get; set; }
        public string FileName { get; set; }
        public string OceanFileId { get; set; }
        public string GitPath { get; set; }
        public byte[] EncryptedData { get; set; }
        public int OriginalSize { get; set; }
        public int EncryptedSize { get; set; }
        public string Error { get; set; }
    }

    public class SystemHealth
    {
        public string Status { get; set; }
        public DateTime Timestamp { get; set; }
        public int Generators { get; set; }
        public int TotalInstructions { get; set; }
        public int HotPatchMarkers { get; set; }
        public int GitCommits { get; set; }
        public int GitUncommittedChanges { get; set; }
        public List<GitCommit> RecentCommits { get; set; }
        public string Error { get; set; }
    }
}