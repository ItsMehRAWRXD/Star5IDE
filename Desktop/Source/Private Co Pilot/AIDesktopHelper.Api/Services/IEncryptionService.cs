using System.Security.Cryptography;

namespace AIDesktopHelper.Api.Services
{
    public interface IEncryptionService
    {
        Task<EncryptionResult> EncryptAsync(string plaintext, EncryptionAlgorithm algorithm = EncryptionAlgorithm.AES256);
        Task<string> DecryptAsync(EncryptionResult encryptedData);
        Task<byte[]> EncryptBytesAsync(byte[] data, EncryptionAlgorithm algorithm = EncryptionAlgorithm.AES256);
        Task<byte[]> DecryptBytesAsync(byte[] encryptedData, byte[] iv, EncryptionAlgorithm algorithm = EncryptionAlgorithm.AES256);
        Task<string> GenerateSecureKeyAsync(EncryptionAlgorithm algorithm);
        Task<bool> ValidateKeyAsync(string key, EncryptionAlgorithm algorithm);
    }

    public enum EncryptionAlgorithm
    {
        AES256,
        Camellia256
    }

    public class EncryptionResult
    {
        public byte[] Ciphertext { get; set; } = Array.Empty<byte>();
        public byte[] IV { get; set; } = Array.Empty<byte>();
        public byte[] KeyId { get; set; } = Array.Empty<byte>();
        public EncryptionAlgorithm Algorithm { get; set; }
        public DateTime Timestamp { get; set; }
        public string Base64Data => Convert.ToBase64String(Ciphertext);
        public string Base64IV => Convert.ToBase64String(IV);
    }
}
