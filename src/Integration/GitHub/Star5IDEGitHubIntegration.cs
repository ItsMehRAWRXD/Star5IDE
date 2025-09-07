using System;
using System.IO;
using System.Threading.Tasks;
using System.Diagnostics;

namespace Star5IDE.Integration.GitHub
{
    /// <summary>
    /// GitHub integration for Star5IDE
    /// Works alongside existing Star5IDE functionality
    /// </summary>
    public class Star5IDEGitHubIntegration
    {
        private readonly string _token;
        private readonly string _repoOwner = "ItsMehRAWRXD";
        private readonly string _repoName = "Star5IDE";

        public Star5IDEGitHubIntegration(string token)
        {
            _token = token;
        }

        /// <summary>
        /// Commit and push changes to GitHub
        /// </summary>
        public async Task CommitAndPush(string filePath, string commitMessage)
        {
            try
            {
                Console.WriteLine($"[GitHub] Committing: {filePath}");
                
                // Add file to git
                await RunGitCommand($"add {filePath}");
                
                // Commit changes
                await RunGitCommand($"commit -m \"{commitMessage}\"");
                
                // Push to main branch
                await RunGitCommand("push origin main");
                
                Console.WriteLine($"[GitHub] Successfully committed and pushed: {filePath}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GitHub] Error: {ex.Message}");
            }
        }

        /// <summary>
        /// Commit generated assembly code
        /// </summary>
        public async Task CommitAssemblyCode(string generatorName, string assemblyCode)
        {
            var fileName = $"integration/generated/{generatorName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.asm";
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), fileName);
            
            // Ensure directory exists
            Directory.CreateDirectory(Path.GetDirectoryName(filePath));
            
            // Write assembly code
            await File.WriteAllTextAsync(filePath, assemblyCode);
            
            // Commit to GitHub
            await CommitAndPush(fileName, $"Generated assembly code: {generatorName}");
        }

        /// <summary>
        /// Commit system status
        /// </summary>
        public async Task CommitSystemStatus(Dictionary<string, object> status)
        {
            var fileName = $"integration/status/system_status_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), fileName);
            
            // Ensure directory exists
            Directory.CreateDirectory(Path.GetDirectoryName(filePath));
            
            // Write status
            var statusJson = System.Text.Json.JsonSerializer.Serialize(status, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(filePath, statusJson);
            
            // Commit to GitHub
            await CommitAndPush(fileName, "System status update");
        }

        private async Task<string> RunGitCommand(string arguments)
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "git",
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(startInfo);
            var output = await process.StandardOutput.ReadAsStringAsync();
            var error = await process.StandardError.ReadAsStringAsync();
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                throw new Exception($"Git command failed: {error}");
            }

            return output;
        }
    }
}
