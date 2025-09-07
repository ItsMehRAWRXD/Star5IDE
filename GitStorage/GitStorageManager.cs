using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GitStorage
{
    public class GitStorageManager
    {
        private readonly string _repositoryPath;
        private readonly string _remoteUrl;
        private readonly string _branchName;
        private readonly string _userName;
        private readonly string _userEmail;

        public GitStorageManager(string repositoryPath, string remoteUrl = null, 
            string branchName = "main", string userName = "PolymorphicBot", string userEmail = "bot@polymorphic.local")
        {
            _repositoryPath = repositoryPath;
            _remoteUrl = remoteUrl;
            _branchName = branchName;
            _userName = userName;
            _userEmail = userEmail;

            InitializeRepository();
        }

        private void InitializeRepository()
        {
            if (!Directory.Exists(_repositoryPath))
            {
                Directory.CreateDirectory(_repositoryPath);
            }

            // Initialize git repository if not exists
            if (!Directory.Exists(Path.Combine(_repositoryPath, ".git")))
            {
                RunGitCommand("init");
                RunGitCommand($"config user.name \"{_userName}\"");
                RunGitCommand($"config user.email \"{_userEmail}\"");
                
                if (!string.IsNullOrEmpty(_remoteUrl))
                {
                    RunGitCommand($"remote add origin {_remoteUrl}");
                }
            }
        }

        // Store encrypted payload in Git
        public async Task<string> StoreEncryptedPayload(string fileName, byte[] payload, 
            Dictionary<string, object> metadata = null)
        {
            try
            {
                var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
                var safeFileName = SanitizeFileName(fileName);
                var filePath = Path.Combine(_repositoryPath, "payloads", $"{timestamp}_{safeFileName}");
                
                // Ensure payloads directory exists
                var payloadsDir = Path.Combine(_repositoryPath, "payloads");
                if (!Directory.Exists(payloadsDir))
                {
                    Directory.CreateDirectory(payloadsDir);
                }

                // Write payload to file
                await File.WriteAllBytesAsync(filePath, payload);

                // Create metadata file
                if (metadata != null)
                {
                    var metadataPath = filePath + ".meta";
                    var metadataJson = System.Text.Json.JsonSerializer.Serialize(metadata, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
                    await File.WriteAllTextAsync(metadataPath, metadataJson);
                }

                // Add to git
                var relativePath = Path.GetRelativePath(_repositoryPath, filePath);
                RunGitCommand($"add \"{relativePath}\"");

                if (metadata != null)
                {
                    var metadataRelativePath = Path.GetRelativePath(_repositoryPath, filePath + ".meta");
                    RunGitCommand($"add \"{metadataRelativePath}\"");
                }

                // Commit
                var commitMessage = $"Store encrypted payload: {safeFileName} ({payload.Length} bytes)";
                RunGitCommand($"commit -m \"{commitMessage}\"");

                // Push to remote if configured
                if (!string.IsNullOrEmpty(_remoteUrl))
                {
                    RunGitCommand($"push origin {_branchName}");
                }

                return relativePath;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to store encrypted payload: {ex.Message}");
                throw;
            }
        }

        // Store assembly code in Git
        public async Task<string> StoreAssemblyCode(string generatorName, string assemblyCode, 
            Dictionary<string, object> metadata = null)
        {
            try
            {
                var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
                var fileName = $"{generatorName}_{timestamp}.asm";
                var filePath = Path.Combine(_repositoryPath, "assembly", fileName);
                
                // Ensure assembly directory exists
                var assemblyDir = Path.Combine(_repositoryPath, "assembly");
                if (!Directory.Exists(assemblyDir))
                {
                    Directory.CreateDirectory(assemblyDir);
                }

                // Write assembly code
                await File.WriteAllTextAsync(filePath, assemblyCode);

                // Create metadata file
                if (metadata != null)
                {
                    var metadataPath = filePath + ".meta";
                    var metadataJson = System.Text.Json.JsonSerializer.Serialize(metadata, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
                    await File.WriteAllTextAsync(metadataPath, metadataJson);
                }

                // Add to git
                var relativePath = Path.GetRelativePath(_repositoryPath, filePath);
                RunGitCommand($"add \"{relativePath}\"");

                if (metadata != null)
                {
                    var metadataRelativePath = Path.GetRelativePath(_repositoryPath, filePath + ".meta");
                    RunGitCommand($"add \"{metadataRelativePath}\"");
                }

                // Commit
                var commitMessage = $"Store assembly code: {generatorName} ({assemblyCode.Length} chars)";
                RunGitCommand($"commit -m \"{commitMessage}\"");

                // Push to remote if configured
                if (!string.IsNullOrEmpty(_remoteUrl))
                {
                    RunGitCommand($"push origin {_branchName}");
                }

                return relativePath;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to store assembly code: {ex.Message}");
                throw;
            }
        }

        // Store hot patch in Git
        public async Task<string> StoreHotPatch(string patchName, byte[] patchData, 
            Dictionary<string, object> metadata = null)
        {
            try
            {
                var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
                var fileName = $"{patchName}_{timestamp}.patch";
                var filePath = Path.Combine(_repositoryPath, "patches", fileName);
                
                // Ensure patches directory exists
                var patchesDir = Path.Combine(_repositoryPath, "patches");
                if (!Directory.Exists(patchesDir))
                {
                    Directory.CreateDirectory(patchesDir);
                }

                // Write patch data
                await File.WriteAllBytesAsync(filePath, patchData);

                // Create metadata file
                if (metadata != null)
                {
                    var metadataPath = filePath + ".meta";
                    var metadataJson = System.Text.Json.JsonSerializer.Serialize(metadata, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
                    await File.WriteAllTextAsync(metadataPath, metadataJson);
                }

                // Add to git
                var relativePath = Path.GetRelativePath(_repositoryPath, filePath);
                RunGitCommand($"add \"{relativePath}\"");

                if (metadata != null)
                {
                    var metadataRelativePath = Path.GetRelativePath(_repositoryPath, filePath + ".meta");
                    RunGitCommand($"add \"{metadataRelativePath}\"");
                }

                // Commit
                var commitMessage = $"Store hot patch: {patchName} ({patchData.Length} bytes)";
                RunGitCommand($"commit -m \"{commitMessage}\"");

                // Push to remote if configured
                if (!string.IsNullOrEmpty(_remoteUrl))
                {
                    RunGitCommand($"push origin {_branchName}");
                }

                return relativePath;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to store hot patch: {ex.Message}");
                throw;
            }
        }

        // Store system logs in Git
        public async Task<string> StoreSystemLogs(Dictionary<string, object> logData)
        {
            try
            {
                var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
                var fileName = $"system_log_{timestamp}.json";
                var filePath = Path.Combine(_repositoryPath, "logs", fileName);
                
                // Ensure logs directory exists
                var logsDir = Path.Combine(_repositoryPath, "logs");
                if (!Directory.Exists(logsDir))
                {
                    Directory.CreateDirectory(logsDir);
                }

                // Write log data
                var logJson = System.Text.Json.JsonSerializer.Serialize(logData, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
                await File.WriteAllTextAsync(filePath, logJson);

                // Add to git
                var relativePath = Path.GetRelativePath(_repositoryPath, filePath);
                RunGitCommand($"add \"{relativePath}\"");

                // Commit
                var commitMessage = $"Store system logs: {timestamp}";
                RunGitCommand($"commit -m \"{commitMessage}\"");

                // Push to remote if configured
                if (!string.IsNullOrEmpty(_remoteUrl))
                {
                    RunGitCommand($"push origin {_branchName}");
                }

                return relativePath;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to store system logs: {ex.Message}");
                throw;
            }
        }

        // Get latest commits
        public List<GitCommit> GetLatestCommits(int count = 10)
        {
            try
            {
                var output = RunGitCommand($"log --oneline -n {count}");
                var commits = new List<GitCommit>();

                foreach (var line in output.Split('\n', StringSplitOptions.RemoveEmptyEntries))
                {
                    var parts = line.Split(' ', 2);
                    if (parts.Length >= 2)
                    {
                        commits.Add(new GitCommit
                        {
                            Hash = parts[0],
                            Message = parts[1]
                        });
                    }
                }

                return commits;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to get latest commits: {ex.Message}");
                return new List<GitCommit>();
            }
        }

        // Pull latest changes from remote
        public bool PullLatestChanges()
        {
            try
            {
                if (!string.IsNullOrEmpty(_remoteUrl))
                {
                    RunGitCommand($"pull origin {_branchName}");
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to pull latest changes: {ex.Message}");
                return false;
            }
        }

        // Get repository status
        public GitStatus GetRepositoryStatus()
        {
            try
            {
                var statusOutput = RunGitCommand("status --porcelain");
                var branchOutput = RunGitCommand("branch --show-current");
                var commitCount = RunGitCommand("rev-list --count HEAD");

                return new GitStatus
                {
                    CurrentBranch = branchOutput.Trim(),
                    UncommittedChanges = statusOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries).Length,
                    TotalCommits = int.TryParse(commitCount.Trim(), out int count) ? count : 0,
                    HasRemote = !string.IsNullOrEmpty(_remoteUrl)
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to get repository status: {ex.Message}");
                return new GitStatus();
            }
        }

        private string RunGitCommand(string arguments)
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "git",
                    Arguments = arguments,
                    WorkingDirectory = _repositoryPath,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                var output = process.StandardOutput.ReadToEnd();
                var error = process.StandardError.ReadToEnd();
                process.WaitForExit();

                if (process.ExitCode != 0)
                {
                    throw new Exception($"Git command failed: {error}");
                }

                return output;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Git command failed: {ex.Message}");
                throw;
            }
        }

        private string SanitizeFileName(string fileName)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            var sanitized = fileName;
            
            foreach (var c in invalidChars)
            {
                sanitized = sanitized.Replace(c, '_');
            }
            
            return sanitized;
        }
    }

    public class GitCommit
    {
        public string Hash { get; set; }
        public string Message { get; set; }
    }

    public class GitStatus
    {
        public string CurrentBranch { get; set; }
        public int UncommittedChanges { get; set; }
        public int TotalCommits { get; set; }
        public bool HasRemote { get; set; }
    }
}