using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading.Tasks;

namespace PolymorphicBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompilerController : ControllerBase
    {
        [HttpPost("compile")]
        public async Task<IActionResult> CompileCode([FromBody] CompileRequest request)
        {
            if (string.IsNullOrEmpty(request.Code))
            {
                return BadRequest(new { Error = "No code provided" });
            }

            // Generate unique temporary file names
            var tempDir = Path.Combine(Path.GetTempPath(), $"compile_{Guid.NewGuid()}");
            Directory.CreateDirectory(tempDir);
            
            var tempCsFile = Path.Combine(tempDir, "source.cs");
            var tempExeFile = Path.Combine(tempDir, $"output{request.Extension ?? ".exe"}");

            try
            {
                // Write the C# code to the temporary file
                await System.IO.File.WriteAllTextAsync(tempCsFile, request.Code);

                // Compile the C# code to an executable
                var startInfo = new ProcessStartInfo
                {
                    FileName = "csc.exe",
                    Arguments = $"\"{tempCsFile}\" /out:\"{tempExeFile}\" /target:exe /platform:x64",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WorkingDirectory = tempDir
                };

                using var process = Process.Start(startInfo);
                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    var errorOutput = await process.StandardError.ReadToEndAsync();
                    return BadRequest(new { Error = errorOutput });
                }

                // Read the compiled executable
                var exeBytes = await System.IO.File.ReadAllBytesAsync(tempExeFile);

                // Apply polymorphic encryption if requested
                if (request.ApplyPolymorphic)
                {
                    exeBytes = await ApplyPolymorphicEncryption(exeBytes, request.Cipher, request.PolyMode);
                }

                // Return the executable as a file
                var fileName = Path.GetFileNameWithoutExtension(request.FileName ?? "output") + request.Extension;
                return File(exeBytes, "application/octet-stream", fileName);
            }
            finally
            {
                // Clean up temporary files
                if (Directory.Exists(tempDir))
                {
                    Directory.Delete(tempDir, true);
                }
            }
        }

        [HttpPost("encrypt")]
        public async Task<IActionResult> EncryptFile()
        {
            if (!Request.HasFormContentType)
            {
                return BadRequest(new { Error = "Invalid content type" });
            }

            var form = await Request.ReadFormAsync();
            var file = form.Files.FirstOrDefault();
            
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { Error = "No file uploaded" });
            }

            var cipher = form["cipher"].ToString() ?? "aes-256-cbc";
            var poly = form["poly"].ToString() ?? "xor";
            var ext = form["ext"].ToString() ?? ".exe";

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            var fileBytes = ms.ToArray();

            var encryptedBytes = await ApplyPolymorphicEncryption(fileBytes, cipher, poly);
            
            var outputName = Path.GetFileNameWithoutExtension(file.FileName) + ext;
            return File(encryptedBytes, "application/octet-stream", outputName);
        }

        private async Task<byte[]> ApplyPolymorphicEncryption(byte[] data, string cipher, string polyMode)
        {
            // This is a placeholder - integrate with the actual encryption logic
            // For now, just XOR with a random key as example
            var key = (byte)Random.Shared.Next(256);
            var encrypted = new byte[data.Length + 1];
            encrypted[0] = key;
            
            for (int i = 0; i < data.Length; i++)
            {
                key = (byte)((key + i) ^ (key >> 3));
                encrypted[i + 1] = (byte)(data[i] ^ key);
            }
            
            return encrypted;
        }
    }

    public class CompileRequest
    {
        public string Code { get; set; }
        public string FileName { get; set; }
        public string Extension { get; set; } = ".exe";
        public bool ApplyPolymorphic { get; set; } = false;
        public string Cipher { get; set; } = "aes-256-cbc";
        public string PolyMode { get; set; } = "xor";
    }
}