using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.IO;

namespace OceanDigital
{
    public class OceanDigitalConnector
    {
        private readonly HttpClient _httpClient;
        private readonly string _oceanBaseUrl;
        private readonly string _apiKey;
        private readonly string _appId;

        public OceanDigitalConnector(string oceanBaseUrl, string apiKey, string appId)
        {
            _oceanBaseUrl = oceanBaseUrl.TrimEnd('/');
            _apiKey = apiKey;
            _appId = appId;
            _httpClient = new HttpClient();
            
            _httpClient.DefaultRequestHeaders.Add("X-API-Key", _apiKey);
            _httpClient.DefaultRequestHeaders.Add("X-App-ID", _appId);
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "PolymorphicEncryption/1.0");
        }

        // Upload encrypted payload to Ocean Digital
        public async Task<string> UploadEncryptedPayload(string fileName, byte[] payload, 
            Dictionary<string, object> metadata = null)
        {
            try
            {
                var formData = new MultipartFormDataContent();
                
                // Add file content
                var fileContent = new ByteArrayContent(payload);
                fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");
                formData.Add(fileContent, "file", fileName);

                // Add metadata
                if (metadata != null)
                {
                    var metadataJson = JsonSerializer.Serialize(metadata);
                    formData.Add(new StringContent(metadataJson), "metadata");
                }

                // Add system info
                formData.Add(new StringContent("polymorphic_encryption"), "system");
                formData.Add(new StringContent(DateTime.UtcNow.ToString("O")), "timestamp");

                var response = await _httpClient.PostAsync($"{_oceanBaseUrl}/api/v1/upload", formData);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<UploadResult>(responseContent);
                    return result?.FileId;
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    throw new Exception($"Upload failed: {response.StatusCode} - {errorContent}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to upload to Ocean Digital: {ex.Message}");
                throw;
            }
        }

        // Download payload from Ocean Digital
        public async Task<byte[]> DownloadPayload(string fileId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_oceanBaseUrl}/api/v1/download/{fileId}");
                
                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadAsByteArrayAsync();
                }
                else
                {
                    throw new Exception($"Download failed: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to download from Ocean Digital: {ex.Message}");
                throw;
            }
        }

        // Get file metadata
        public async Task<FileMetadata> GetFileMetadata(string fileId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_oceanBaseUrl}/api/v1/metadata/{fileId}");
                
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    return JsonSerializer.Deserialize<FileMetadata>(json);
                }
                else
                {
                    throw new Exception($"Failed to get metadata: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to get file metadata: {ex.Message}");
                throw;
            }
        }

        // List files in Ocean Digital
        public async Task<List<FileInfo>> ListFiles(string filter = null)
        {
            try
            {
                var url = $"{_oceanBaseUrl}/api/v1/files";
                if (!string.IsNullOrEmpty(filter))
                {
                    url += $"?filter={Uri.EscapeDataString(filter)}";
                }

                var response = await _httpClient.GetAsync(url);
                
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<FileListResult>(json);
                    return result?.Files ?? new List<FileInfo>();
                }
                else
                {
                    throw new Exception($"Failed to list files: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to list files: {ex.Message}");
                return new List<FileInfo>();
            }
        }

        // Send system status to Ocean Digital
        public async Task<bool> SendSystemStatus(Dictionary<string, object> statusData)
        {
            try
            {
                var payload = new
                {
                    timestamp = DateTime.UtcNow,
                    system = "polymorphic_encryption",
                    app_id = _appId,
                    status = statusData
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_oceanBaseUrl}/api/v1/status", content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send system status: {ex.Message}");
                return false;
            }
        }

        // Send hot patch event to Ocean Digital
        public async Task<bool> SendHotPatchEvent(string eventType, Dictionary<string, object> eventData)
        {
            try
            {
                var payload = new
                {
                    timestamp = DateTime.UtcNow,
                    event_type = eventType,
                    system = "polymorphic_encryption",
                    app_id = _appId,
                    data = eventData
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_oceanBaseUrl}/api/v1/events", content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send hot patch event: {ex.Message}");
                return false;
            }
        }

        // Get configuration from Ocean Digital
        public async Task<Dictionary<string, object>> GetConfiguration()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_oceanBaseUrl}/api/v1/config/{_appId}");
                
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    return JsonSerializer.Deserialize<Dictionary<string, object>>(json);
                }
                else
                {
                    return new Dictionary<string, object>();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to get configuration: {ex.Message}");
                return new Dictionary<string, object>();
            }
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }

    public class UploadResult
    {
        public string FileId { get; set; }
        public string FileName { get; set; }
        public long Size { get; set; }
        public DateTime UploadTime { get; set; }
    }

    public class FileMetadata
    {
        public string FileId { get; set; }
        public string FileName { get; set; }
        public long Size { get; set; }
        public DateTime UploadTime { get; set; }
        public Dictionary<string, object> Metadata { get; set; }
    }

    public class FileInfo
    {
        public string FileId { get; set; }
        public string FileName { get; set; }
        public long Size { get; set; }
        public DateTime UploadTime { get; set; }
        public string System { get; set; }
    }

    public class FileListResult
    {
        public List<FileInfo> Files { get; set; }
        public int TotalCount { get; set; }
    }
}