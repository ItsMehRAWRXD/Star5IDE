using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Star5IDE.Integration.OceanDigital;
using Star5IDE.Integration.CrossHotPatcher;
using Star5IDE.Integration.GitHub;

namespace Star5IDE.Integration
{
    /// <summary>
    /// Main integration class for Star5IDE
    /// Adds Ocean Digital + Cross-Hot-Patching + GitHub integration
    /// WITHOUT modifying existing Star5IDE functionality
    /// </summary>
    public class Star5IDEIntegration
    {
        private readonly Star5IDEOceanConnector _oceanConnector;
        private readonly Star5IDECrossHotPatcher _crossHotPatcher;
        private readonly Star5IDEGitHubIntegration _gitHubIntegration;
        private bool _isRunning = false;

        public Star5IDEIntegration()
        {
            // Initialize with your tokens
            _oceanConnector = new Star5IDEOceanConnector("dop_v1_ccce0b4c48181e9ef566a7b2a5105194256b8302af99761a57a7cad6d3007c4e");
            _crossHotPatcher = new Star5IDECrossHotPatcher(_oceanConnector);
            _gitHubIntegration = new Star5IDEGitHubIntegration("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");
        }

        /// <summary>
        /// Start integration system
        /// </summary>
        public async Task StartIntegration()
        {
            if (_isRunning)
            {
                Console.WriteLine("[Star5IDE Integration] Already running");
                return;
            }

            _isRunning = true;
            Console.WriteLine("=== Star5IDE Integration Started ===");
            Console.WriteLine("Original Star5IDE functionality: PRESERVED");
            Console.WriteLine("New features: Ocean Digital + Cross-Hot-Patching + GitHub");
            Console.WriteLine();

            try
            {
                // Start cross-hot-patching in background
                _ = Task.Run(async () => await _crossHotPatcher.StartCrossPatching());
                
                // Start GitHub integration in background
                _ = Task.Run(async () => await StartGitHubIntegration());
                
                // Start status monitoring
                _ = Task.Run(async () => await StartStatusMonitoring());
                
                Console.WriteLine("[Star5IDE Integration] All systems started successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Star5IDE Integration] Error starting: {ex.Message}");
                _isRunning = false;
            }
        }

        /// <summary>
        /// Stop integration system
        /// </summary>
        public void StopIntegration()
        {
            _isRunning = false;
            _crossHotPatcher.StopCrossPatching();
            Console.WriteLine("[Star5IDE Integration] Stopped");
        }

        private async Task StartGitHubIntegration()
        {
            Console.WriteLine("[GitHub Integration] Started");
            
            while (_isRunning)
            {
                try
                {
                    // Commit system status every 10 minutes
                    var status = GetSystemStatus();
                    await _gitHubIntegration.CommitSystemStatus(status);
                    
                    await Task.Delay(TimeSpan.FromMinutes(10));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[GitHub Integration] Error: {ex.Message}");
                    await Task.Delay(TimeSpan.FromMinutes(5));
                }
            }
        }

        private async Task StartStatusMonitoring()
        {
            Console.WriteLine("[Status Monitoring] Started");
            
            while (_isRunning)
            {
                try
                {
                    var status = GetSystemStatus();
                    Console.WriteLine($"[Status] Cross-Hot-Patcher: {status["cross_hot_patcher_running"]}, Generators: {status["generator_count"]}");
                    
                    await Task.Delay(TimeSpan.FromMinutes(5));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Status Monitoring] Error: {ex.Message}");
                    await Task.Delay(TimeSpan.FromMinutes(2));
                }
            }
        }

        /// <summary>
        /// Get system status
        /// </summary>
        public Dictionary<string, object> GetSystemStatus()
        {
            var crossHotPatcherStatus = _crossHotPatcher.GetStatus();
            
            return new Dictionary<string, object>
            {
                ["timestamp"] = DateTime.UtcNow,
                ["integration_running"] = _isRunning,
                ["cross_hot_patcher_running"] = crossHotPatcherStatus["is_running"],
                ["generator_count"] = crossHotPatcherStatus["generator_count"],
                ["generators"] = crossHotPatcherStatus["generators"],
                ["ocean_digital_connected"] = true,
                ["github_connected"] = true
            };
        }

        /// <summary>
        /// Upload file to Ocean Digital
        /// </summary>
        public async Task<string> UploadToOceanDigital(string fileName, byte[] data)
        {
            return await _oceanConnector.UploadStar5IDEContent(fileName, data);
        }

        /// <summary>
        /// Download file from Ocean Digital
        /// </summary>
        public async Task<byte[]> DownloadFromOceanDigital(string fileName)
        {
            return await _oceanConnector.DownloadFile(fileName);
        }

        public void Dispose()
        {
            StopIntegration();
            _oceanConnector?.Dispose();
        }
    }
}
