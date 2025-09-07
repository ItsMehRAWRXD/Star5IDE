using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text;

namespace Star5IDE.Integration.OceanDigital
{
    /// <summary>
    /// Ocean Digital integration for Star5IDE
    /// Works alongside existing Star5IDE functionality
    /// </summary>
    public class Star5IDEOceanConnector
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiToken;
        private readonly string _bucketName = "star5ide-integration";

        public Star5IDEOceanConnector(string apiToken)
        {
            _apiToken = apiToken;
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiToken}");
        }

        /// <summary>
        /// Upload file to Ocean Digital Spaces
        /// </summary>
        public async Task<string> UploadFile(string fileName, byte[] data, string contentType = "application/octet-stream")
        {
            try
            {
                var content = new ByteArrayContent(data);
                content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
                
                var url = $"https://{_bucketName}.nyc3.digitaloceanspaces.com/{fileName}";
                var response = await _httpClient.PutAsync(url, content);
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[Ocean Digital] Uploaded: {fileName} -> {url}");
                    return url;
                }
                throw new Exception($"Upload failed: {response.StatusCode} - {await response.Content.ReadAsStringAsync()}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Ocean Digital] Upload error: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Download file from Ocean Digital Spaces
        /// </summary>
        public async Task<byte[]> DownloadFile(string fileName)
        {
            try
            {
                var url = $"https://{_bucketName}.nyc3.digitaloceanspaces.com/{fileName}";
                var response = await _httpClient.GetAsync(url);
                
                if (response.IsSuccessStatusCode)
                {
                    var data = await response.Content.ReadAsByteArrayAsync();
                    Console.WriteLine($"[Ocean Digital] Downloaded: {fileName} ({data.Length} bytes)");
                    return data;
                }
                throw new Exception($"Download failed: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Ocean Digital] Download error: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Upload Star5IDE generated content
        /// </summary>
        public async Task<string> UploadStar5IDEContent(string contentName, byte[] data)
        {
            var fileName = $"star5ide/{DateTime.UtcNow:yyyy/MM/dd}/{contentName}_{DateTime.UtcNow:HHmmss}.bin";
            return await UploadFile(fileName, data);
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }
}
