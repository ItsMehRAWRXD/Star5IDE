using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text;

namespace Star5IDE.OceanDigital
{
    public class OceanDigitalConnector
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiToken;
        private readonly string _baseUrl = "https://api.digitalocean.com/v2";

        public OceanDigitalConnector(string apiToken)
        {
            _apiToken = apiToken;
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiToken}");
        }

        public async Task<string> UploadToSpaces(string bucketName, string fileName, byte[] data)
        {
            try
            {
                var content = new ByteArrayContent(data);
                var response = await _httpClient.PutAsync($"https://{bucketName}.nyc3.digitaloceanspaces.com/{fileName}", content);
                
                if (response.IsSuccessStatusCode)
                {
                    return $"https://{bucketName}.nyc3.digitaloceanspaces.com/{fileName}";
                }
                throw new Exception($"Upload failed: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ocean Digital upload failed: {ex.Message}");
                throw;
            }
        }

        public async Task<byte[]> DownloadFromSpaces(string bucketName, string fileName)
        {
            try
            {
                var response = await _httpClient.GetAsync($"https://{bucketName}.nyc3.digitaloceanspaces.com/{fileName}");
                return await response.Content.ReadAsByteArrayAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ocean Digital download failed: {ex.Message}");
                throw;
            }
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }
}
