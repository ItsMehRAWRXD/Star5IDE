using System;
using System.IO;
using System.Threading.Tasks;

namespace Star5IDE.GitHub
{
    public class GitHubIntegration
    {
        private readonly string _token;
        private readonly string _repoOwner = "ItsMehRAWRXD";
        private readonly string _repoName = "Star5IDE";

        public GitHubIntegration(string token)
        {
            _token = token;
        }

        public async Task CommitAndPush(string filePath, string commitMessage)
        {
            try
            {
                // Add file to git
                var addResult = await RunGitCommand($"add {filePath}");
                Console.WriteLine($"Git add: {addResult}");

                // Commit changes
                var commitResult = await RunGitCommand($"commit -m \"{commitMessage}\"");
                Console.WriteLine($"Git commit: {commitResult}");

                // Push to main branch
                var pushResult = await RunGitCommand("push origin main");
                Console.WriteLine($"Git push: {pushResult}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GitHub integration error: {ex.Message}");
            }
        }

        private async Task<string> RunGitCommand(string arguments)
        {
            var startInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "git",
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = System.Diagnostics.Process.Start(startInfo);
            var output = await process.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();
            return output;
        }
    }
}
