using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace PluginSystem.Plugins
{
    public class EncryptionPlugin : IEncryptionPlugin
    {
        public string Name => "EncryptionPlugin";
        public string Version => "1.0.0";
        public string Description => "Multi-algorithm encryption plugin with OpenSSL integration";
        public Dictionary<string, object> Configuration { get; set; } = new Dictionary<string, object>();

        private readonly Dictionary<string, string> _algorithmMap = new Dictionary<string, string>
        {
            { "aes-256-cbc", "aes-256-cbc" },
            { "camellia-256-cbc", "camellia-256-cbc" },
            { "chacha20", "chacha20" },
            { "aes-256-ctr", "aes-256-ctr" },
            { "camellia-256-ctr", "camellia-256-ctr" }
        };

        public void Initialize()
        {
            Console.WriteLine("Initializing Encryption plugin...");
            Configuration["DefaultAlgorithm"] = "aes-256-cbc";
            Configuration["KeySize"] = 32;
            Configuration["IVSize"] = 16;
        }

        public void Execute()
        {
            Console.WriteLine("=== Encryption Plugin Execution ===");
            Console.WriteLine("Available algorithms:");
            foreach (var algorithm in GetSupportedAlgorithms())
            {
                Console.WriteLine($"  - {algorithm}");
            }
        }

        public byte[] Encrypt(byte[] data, string algorithm, Dictionary<string, object> parameters)
        {
            if (!_algorithmMap.ContainsKey(algorithm.ToLower()))
            {
                throw new ArgumentException($"Unsupported algorithm: {algorithm}");
            }

            var opensslAlgorithm = _algorithmMap[algorithm.ToLower()];
            
            // Generate random key and IV if not provided
            var key = parameters.ContainsKey("key") ? (byte[])parameters["key"] : GenerateRandomBytes(32);
            var iv = parameters.ContainsKey("iv") ? (byte[])parameters["iv"] : GenerateRandomBytes(16);

            // Create temporary files
            var tempInput = Path.GetTempFileName();
            var tempOutput = Path.GetTempFileName();

            try
            {
                // Write input data
                File.WriteAllBytes(tempInput, data);

                // Convert key and IV to hex
                var keyHex = BitConverter.ToString(key).Replace("-", "");
                var ivHex = BitConverter.ToString(iv).Replace("-", "");

                // Build OpenSSL command
                var arguments = $"enc -{opensslAlgorithm} -K {keyHex} -iv {ivHex} -in \"{tempInput}\" -out \"{tempOutput}\"";

                // Execute OpenSSL
                var startInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "openssl",
                    Arguments = arguments,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = System.Diagnostics.Process.Start(startInfo);
                process.WaitForExit();

                if (process.ExitCode != 0)
                {
                    var error = process.StandardError.ReadToEnd();
                    throw new Exception($"OpenSSL encryption failed: {error}");
                }

                // Read encrypted data
                var encryptedData = File.ReadAllBytes(tempOutput);

                // Store key and IV in parameters for decryption
                parameters["key"] = key;
                parameters["iv"] = iv;

                return encryptedData;
            }
            finally
            {
                // Clean up temporary files
                if (File.Exists(tempInput)) File.Delete(tempInput);
                if (File.Exists(tempOutput)) File.Delete(tempOutput);
            }
        }

        public byte[] Decrypt(byte[] data, string algorithm, Dictionary<string, object> parameters)
        {
            if (!_algorithmMap.ContainsKey(algorithm.ToLower()))
            {
                throw new ArgumentException($"Unsupported algorithm: {algorithm}");
            }

            if (!parameters.ContainsKey("key") || !parameters.ContainsKey("iv"))
            {
                throw new ArgumentException("Key and IV are required for decryption");
            }

            var opensslAlgorithm = _algorithmMap[algorithm.ToLower()];
            var key = (byte[])parameters["key"];
            var iv = (byte[])parameters["iv"];

            // Create temporary files
            var tempInput = Path.GetTempFileName();
            var tempOutput = Path.GetTempFileName();

            try
            {
                // Write encrypted data
                File.WriteAllBytes(tempInput, data);

                // Convert key and IV to hex
                var keyHex = BitConverter.ToString(key).Replace("-", "");
                var ivHex = BitConverter.ToString(iv).Replace("-", "");

                // Build OpenSSL command
                var arguments = $"enc -d -{opensslAlgorithm} -K {keyHex} -iv {ivHex} -in \"{tempInput}\" -out \"{tempOutput}\"";

                // Execute OpenSSL
                var startInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "openssl",
                    Arguments = arguments,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = System.Diagnostics.Process.Start(startInfo);
                process.WaitForExit();

                if (process.ExitCode != 0)
                {
                    var error = process.StandardError.ReadToEnd();
                    throw new Exception($"OpenSSL decryption failed: {error}");
                }

                // Read decrypted data
                return File.ReadAllBytes(tempOutput);
            }
            finally
            {
                // Clean up temporary files
                if (File.Exists(tempInput)) File.Delete(tempInput);
                if (File.Exists(tempOutput)) File.Delete(tempOutput);
            }
        }

        public string[] GetSupportedAlgorithms()
        {
            return new string[] { "aes-256-cbc", "camellia-256-cbc", "chacha20", "aes-256-ctr", "camellia-256-ctr" };
        }

        public void Cleanup()
        {
            Console.WriteLine("Encryption plugin cleaned up");
        }

        private byte[] GenerateRandomBytes(int length)
        {
            var bytes = new byte[length];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            return bytes;
        }
    }
}