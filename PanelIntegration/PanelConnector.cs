using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace PanelIntegration
{
    public class PanelConnector
    {
        private readonly HttpClient _httpClient;
        private readonly string _panelBaseUrl;
        private readonly string _authToken;

        public PanelConnector(string panelBaseUrl, string authToken = null)
        {
            _panelBaseUrl = panelBaseUrl.TrimEnd('/');
            _authToken = authToken;
            _httpClient = new HttpClient();
            
            if (!string.IsNullOrEmpty(_authToken))
            {
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_authToken}");
            }
        }

        // Send status update to panel
        public async Task<bool> SendStatusUpdate(string status, Dictionary<string, object> data = null)
        {
            try
            {
                var payload = new
                {
                    timestamp = DateTime.UtcNow,
                    status = status,
                    data = data ?? new Dictionary<string, object>()
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_panelBaseUrl}/api/status", content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send status update: {ex.Message}");
                return false;
            }
        }

        // Send encryption result to panel
        public async Task<bool> SendEncryptionResult(string fileName, string algorithm, string polyMode, 
            byte[] encryptedData, Dictionary<string, object> metadata = null)
        {
            try
            {
                var payload = new
                {
                    timestamp = DateTime.UtcNow,
                    type = "encryption_result",
                    fileName = fileName,
                    algorithm = algorithm,
                    polyMode = polyMode,
                    dataSize = encryptedData.Length,
                    metadata = metadata ?? new Dictionary<string, object>()
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_panelBaseUrl}/api/encryption", content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send encryption result: {ex.Message}");
                return false;
            }
        }

        // Send hot patch event to panel
        public async Task<bool> SendHotPatchEvent(string patchName, string targetMarker, 
            bool success, Dictionary<string, object> details = null)
        {
            try
            {
                var payload = new
                {
                    timestamp = DateTime.UtcNow,
                    type = "hot_patch",
                    patchName = patchName,
                    targetMarker = targetMarker,
                    success = success,
                    details = details ?? new Dictionary<string, object>()
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_panelBaseUrl}/api/hotpatch", content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send hot patch event: {ex.Message}");
                return false;
            }
        }

        // Send assembly generation event
        public async Task<bool> SendAssemblyGeneration(string generatorName, string targetArch, 
            int instructionCount, Dictionary<string, object> features = null)
        {
            try
            {
                var payload = new
                {
                    timestamp = DateTime.UtcNow,
                    type = "assembly_generation",
                    generatorName = generatorName,
                    targetArchitecture = targetArch,
                    instructionCount = instructionCount,
                    features = features ?? new Dictionary<string, object>()
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_panelBaseUrl}/api/assembly", content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send assembly generation event: {ex.Message}");
                return false;
            }
        }

        // Get commands from panel
        public async Task<List<PanelCommand>> GetCommands()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_panelBaseUrl}/api/commands");
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var commands = JsonSerializer.Deserialize<List<PanelCommand>>(json);
                    return commands ?? new List<PanelCommand>();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to get commands: {ex.Message}");
            }
            return new List<PanelCommand>();
        }

        // Send system health check
        public async Task<bool> SendHealthCheck(Dictionary<string, object> healthData)
        {
            try
            {
                var payload = new
                {
                    timestamp = DateTime.UtcNow,
                    type = "health_check",
                    system = "polymorphic_encryption",
                    health = healthData
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_panelBaseUrl}/api/health", content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send health check: {ex.Message}");
                return false;
            }
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }

    public class PanelCommand
    {
        public string Id { get; set; }
        public string Type { get; set; }
        public string Action { get; set; }
        public Dictionary<string, object> Parameters { get; set; }
        public DateTime Timestamp { get; set; }
        public bool Executed { get; set; }
    }
}