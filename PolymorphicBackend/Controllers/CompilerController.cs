using Microsoft.AspNetCore.Mvc;
using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;

namespace PolymorphicBackend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CompilerController : ControllerBase
    {
        [HttpPost("compile")]
        public async Task<IActionResult> Compile([FromBody] CompileRequest request)
        {
            try
            {
                // Generate unique temporary file names
                var tempCsFile = Path.GetTempFileName();
                var tempExeFile = Path.ChangeExtension(tempCsFile, ".exe");

                try
                {
                    // Write the C# code to the temporary file
                    await File.WriteAllTextAsync(tempCsFile, request.Code);

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
                    await process.WaitForExitAsync();

                    if (process.ExitCode != 0)
                    {
                        var errorOutput = await process.StandardError.ReadToEndAsync();
                        return BadRequest(new { Error = errorOutput });
                    }

                    // Read the compiled executable
                    var exeBytes = await File.ReadAllBytesAsync(tempExeFile);

                    // Return the executable as a file
                    return File(exeBytes, "application/octet-stream", "output.exe");
                }
                finally
                {
                    // Clean up temporary files
                    if (File.Exists(tempCsFile)) File.Delete(tempCsFile);
                    if (File.Exists(tempExeFile)) File.Delete(tempExeFile);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromQuery] string pass, [FromQuery] string cipher, [FromQuery] string poly, [FromQuery] string ext)
        {
            try
            {
                // Read uploaded file
                using var memoryStream = new MemoryStream();
                await Request.Body.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();

                // Create temporary input file
                var tempIn = Path.GetTempFileName();
                await File.WriteAllBytesAsync(tempIn, fileBytes);

                try
                {
                    // Call the PowerShell encryption script
                    var tempOut = Path.ChangeExtension(Path.GetTempFileName(), ext ?? ".exe");
                    
                    var startInfo = new ProcessStartInfo
                    {
                        FileName = "powershell.exe",
                        Arguments = $"-ExecutionPolicy Bypass -File \"{Path.Combine(Directory.GetCurrentDirectory(), "..", "Encrypt-PolymorphicDualLayer.ps1")}\" -InputFile \"{tempIn}\" -OutputFile \"{tempOut}\" -Cipher \"{cipher}\" -PolyMode \"{poly}\"",
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };

                    using var process = Process.Start(startInfo);
                    await process.WaitForExitAsync();

                    if (process.ExitCode != 0)
                    {
                        var errorOutput = await process.StandardError.ReadToEndAsync();
                        return BadRequest(new { Error = errorOutput });
                    }

                    // Read the encrypted file
                    var encryptedBytes = await File.ReadAllBytesAsync(tempOut);

                    // Return the encrypted file
                    return File(encryptedBytes, "application/octet-stream", $"encrypted{ext ?? ".exe"}");
                }
                finally
                {
                    // Clean up temporary files
                    if (File.Exists(tempIn)) File.Delete(tempIn);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }
    }

    public class CompileRequest
    {
        public string Code { get; set; }
    }
}