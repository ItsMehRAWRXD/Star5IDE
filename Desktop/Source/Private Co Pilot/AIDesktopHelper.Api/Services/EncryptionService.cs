using System.Security.Cryptography;
using System.Text;
using Org.BouncyCastle.Crypto.Engines;
using Org.BouncyCastle.Crypto.Modes;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Security;

namespace AIDesktopHelper.Api.Services
{
    public class EncryptionService : IEncryptionService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EncryptionService> _logger;
        private readonly Dictionary<string, byte[]> _keyCache;
        private readonly SemaphoreSlim _keyCacheSemaphore;

        public EncryptionService(IConfiguration configuration, ILogger<EncryptionService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            _keyCache = new Dictionary<string, byte[]>();
            _keyCacheSemaphore = new SemaphoreSlim(1, 1);
        }

        public async Task<EncryptionResult> EncryptAsync(string plaintext, EncryptionAlgorithm algorithm = EncryptionAlgorithm.AES256)
        {
            if (string.IsNullOrEmpty(plaintext))
                throw new ArgumentException("Plaintext cannot be null or empty", nameof(plaintext));

            var data = Encoding.UTF8.GetBytes(plaintext);
            var encryptedData = await EncryptBytesAsync(data, algorithm);
            var key = await GetOrGenerateKeyAsync(algorithm);
            var iv = GenerateIV(algorithm);

            byte[] ciphertext;
            if (algorithm == EncryptionAlgorithm.AES256)
            {
                ciphertext = await EncryptAESAsync(data, key, iv);
            }
            else
            {
                ciphertext = await EncryptCamelliaAsync(data, key, iv);
            }

            return new EncryptionResult
            {
                Ciphertext = ciphertext,
                IV = iv,
                KeyId = ComputeKeyId(key),
                Algorithm = algorithm,
                Timestamp = DateTime.UtcNow
            };
        }

        public async Task<string> DecryptAsync(EncryptionResult encryptedData)
        {
            if (encryptedData == null)
                throw new ArgumentNullException(nameof(encryptedData));

            var key = await GetKeyByIdAsync(encryptedData.KeyId, encryptedData.Algorithm);
            byte[] plaintext;

            if (encryptedData.Algorithm == EncryptionAlgorithm.AES256)
            {
                plaintext = await DecryptAESAsync(encryptedData.Ciphertext, key, encryptedData.IV);
            }
            else
            {
                plaintext = await DecryptCamelliaAsync(encryptedData.Ciphertext, key, encryptedData.IV);
            }

            return Encoding.UTF8.GetString(plaintext);
        }

        public async Task<byte[]> EncryptBytesAsync(byte[] data, EncryptionAlgorithm algorithm = EncryptionAlgorithm.AES256)
        {
            if (data == null || data.Length == 0)
                throw new ArgumentException("Data cannot be null or empty", nameof(data));

            var key = await GetOrGenerateKeyAsync(algorithm);
            var iv = GenerateIV(algorithm);

            if (algorithm == EncryptionAlgorithm.AES256)
            {
                return await EncryptAESAsync(data, key, iv);
            }
            else
            {
                return await EncryptCamelliaAsync(data, key, iv);
            }
        }

        public async Task<byte[]> DecryptBytesAsync(byte[] encryptedData, byte[] iv, EncryptionAlgorithm algorithm = EncryptionAlgorithm.AES256)
        {
            if (encryptedData == null || encryptedData.Length == 0)
                throw new ArgumentException("Encrypted data cannot be null or empty", nameof(encryptedData));

            if (iv == null || iv.Length == 0)
                throw new ArgumentException("IV cannot be null or empty", nameof(iv));

            var key = await GetOrGenerateKeyAsync(algorithm);

            if (algorithm == EncryptionAlgorithm.AES256)
            {
                return await DecryptAESAsync(encryptedData, key, iv);
            }
            else
            {
                return await DecryptCamelliaAsync(encryptedData, key, iv);
            }
        }

        private async Task<byte[]> EncryptAESAsync(byte[] data, byte[] key, byte[] iv)
        {
            using var aes = Aes.Create();
            aes.Key = key;
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using var encryptor = aes.CreateEncryptor();
            using var msEncrypt = new MemoryStream();
            using var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write);
            
            await csEncrypt.WriteAsync(data, 0, data.Length);
            await csEncrypt.FlushFinalBlockAsync();
            
            return msEncrypt.ToArray();
        }

        private async Task<byte[]> DecryptAESAsync(byte[] ciphertext, byte[] key, byte[] iv)
        {
            using var aes = Aes.Create();
            aes.Key = key;
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using var decryptor = aes.CreateDecryptor();
            using var msDecrypt = new MemoryStream(ciphertext);
            using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
            using var msPlain = new MemoryStream();
            
            await csDecrypt.CopyToAsync(msPlain);
            return msPlain.ToArray();
        }

        private async Task<byte[]> EncryptCamelliaAsync(byte[] data, byte[] key, byte[] iv)
        {
            var engine = new CamelliaEngine();
            var cipher = new CbcBlockCipher(engine);
            var keyParam = new KeyParameter(key);
            var ivParam = new ParametersWithIV(keyParam, iv);
            
            cipher.Init(true, ivParam);
            
            var output = new byte[cipher.GetOutputSize(data.Length)];
            var len = cipher.ProcessBytes(data, 0, data.Length, output, 0);
            cipher.DoFinal(output, len);
            
            return await Task.FromResult(output);
        }

        private async Task<byte[]> DecryptCamelliaAsync(byte[] ciphertext, byte[] key, byte[] iv)
        {
            var engine = new CamelliaEngine();
            var cipher = new CbcBlockCipher(engine);
            var keyParam = new KeyParameter(key);
            var ivParam = new ParametersWithIV(keyParam, iv);
            
            cipher.Init(false, ivParam);
            
            var output = new byte[cipher.GetOutputSize(ciphertext.Length)];
            var len = cipher.ProcessBytes(ciphertext, 0, ciphertext.Length, output, 0);
            cipher.DoFinal(output, len);
            
            return await Task.FromResult(output);
        }

        private byte[] GenerateIV(EncryptionAlgorithm algorithm)
        {
            var ivSize = algorithm == EncryptionAlgorithm.AES256 ? 16 : 16; // Both use 128-bit IV
            var iv = new byte[ivSize];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(iv);
            return iv;
        }

        private async Task<byte[]> GetOrGenerateKeyAsync(EncryptionAlgorithm algorithm)
        {
            var keyName = $"encryption_key_{algorithm}";
            
            await _keyCacheSemaphore.WaitAsync();
            try
            {
                if (_keyCache.TryGetValue(keyName, out var cachedKey))
                {
                    return cachedKey;
                }

                var key = await LoadKeyFromSecureStorageAsync(keyName, algorithm);
                if (key == null)
                {
                    key = await GenerateSecureKeyAsync(algorithm);
                    await SaveKeyToSecureStorageAsync(keyName, key);
                }

                _keyCache[keyName] = key;
                return key;
            }
            finally
            {
                _keyCacheSemaphore.Release();
            }
        }

        private async Task<byte[]> GetKeyByIdAsync(byte[] keyId, EncryptionAlgorithm algorithm)
        {
            // In a real implementation, you'd look up the key by ID
            // For now, we'll use the current key
            return await GetOrGenerateKeyAsync(algorithm);
        }

        public async Task<string> GenerateSecureKeyAsync(EncryptionAlgorithm algorithm)
        {
            var keySize = algorithm == EncryptionAlgorithm.AES256 ? 32 : 32; // 256 bits = 32 bytes
            var key = new byte[keySize];
            
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(key);
            
            return await Task.FromResult(Convert.ToBase64String(key));
        }

        public async Task<bool> ValidateKeyAsync(string key, EncryptionAlgorithm algorithm)
        {
            if (string.IsNullOrEmpty(key))
                return false;

            try
            {
                var keyBytes = Convert.FromBase64String(key);
                var expectedSize = algorithm == EncryptionAlgorithm.AES256 ? 32 : 32;
                return await Task.FromResult(keyBytes.Length == expectedSize);
            }
            catch
            {
                return false;
            }
        }

        private async Task<byte[]> LoadKeyFromSecureStorageAsync(string keyName, EncryptionAlgorithm algorithm)
        {
            // In production, load from secure key vault
            var keyString = _configuration[$"Encryption:{keyName}"];
            if (!string.IsNullOrEmpty(keyString))
            {
                return Convert.FromBase64String(keyString);
            }
            return await Task.FromResult<byte[]>(null);
        }

        private async Task SaveKeyToSecureStorageAsync(string keyName, byte[] key)
        {
            // In production, save to secure key vault
            // For now, we'll just log that we would save it
            _logger.LogInformation($"Would save key {keyName} to secure storage");
            await Task.CompletedTask;
        }

        private byte[] ComputeKeyId(byte[] key)
        {
            using var sha256 = SHA256.Create();
            return sha256.ComputeHash(key);
        }
    }
}
