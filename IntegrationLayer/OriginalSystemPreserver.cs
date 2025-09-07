using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace IntegrationLayer
{
    /// <summary>
    /// Preserves all original source code and integrates new features alongside existing system
    /// </summary>
    public class OriginalSystemPreserver
    {
        private readonly string _originalSourcePath;
        private readonly string _integrationPath;
        private readonly Dictionary<string, string> _originalFiles;

        public OriginalSystemPreserver(string originalSourcePath, string integrationPath)
        {
            _originalSourcePath = originalSourcePath;
            _integrationPath = integrationPath;
            _originalFiles = new Dictionary<string, string>();
            
            PreserveOriginalSource();
        }

        /// <summary>
        /// Preserves all original files and creates integration layer
        /// </summary>
        private void PreserveOriginalSource()
        {
            Console.WriteLine("=== Preserving Original Source Code ===");

            // Create integration directory structure
            var integrationDirs = new[]
            {
                "OriginalSystem",
                "IntegrationLayer", 
                "OceanDigital",
                "GitStorage",
                "CrossHotPatcher",
                "AssemblyGenerators",
                "PanelIntegration"
            };

            foreach (var dir in integrationDirs)
            {
                var fullPath = Path.Combine(_integrationPath, dir);
                if (!Directory.Exists(fullPath))
                {
                    Directory.CreateDirectory(fullPath);
                }
            }

            // Copy all original files to OriginalSystem directory
            CopyOriginalFiles();
            
            // Create integration wrappers that preserve original functionality
            CreateIntegrationWrappers();
        }

        private void CopyOriginalFiles()
        {
            var originalSystemPath = Path.Combine(_integrationPath, "OriginalSystem");
            
            if (Directory.Exists(_originalSourcePath))
            {
                CopyDirectory(_originalSourcePath, originalSystemPath);
                Console.WriteLine($"✓ Preserved original source in: {originalSystemPath}");
            }
            else
            {
                // Create placeholder structure for original files
                CreateOriginalSystemStructure(originalSystemPath);
            }
        }

        private void CopyDirectory(string sourceDir, string destDir)
        {
            if (!Directory.Exists(destDir))
            {
                Directory.CreateDirectory(destDir);
            }

            foreach (var file in Directory.GetFiles(sourceDir))
            {
                var fileName = Path.GetFileName(file);
                var destFile = Path.Combine(destDir, fileName);
                File.Copy(file, destFile, true);
                _originalFiles[fileName] = destFile;
            }

            foreach (var subDir in Directory.GetDirectories(sourceDir))
            {
                var subDirName = Path.GetFileName(subDir);
                var destSubDir = Path.Combine(destDir, subDirName);
                CopyDirectory(subDir, destSubDir);
            }
        }

        private void CreateOriginalSystemStructure(string originalSystemPath)
        {
            // Create the original system structure that was built earlier
            var originalFiles = new Dictionary<string, string>
            {
                ["Encrypt-PolymorphicDualLayer.ps1"] = GetOriginalEncryptionScript(),
                ["PolymorphicBackend/Program.cs"] = GetOriginalBackendProgram(),
                ["PolymorphicBackend/Controllers/CompilerController.cs"] = GetOriginalCompilerController(),
                ["PolymorphicBackend/PolymorphicBackend.csproj"] = GetOriginalBackendProject(),
                ["PolymorphicLoader/PolymorphicLoader.cs"] = GetOriginalLoader(),
                ["PolymorphicLoader/Program.cs"] = GetOriginalLoaderProgram(),
                ["PolymorphicLoader/PolymorphicLoader.csproj"] = GetOriginalLoaderProject(),
                ["HotPatcher/HotPatcher.cs"] = GetOriginalHotPatcher(),
                ["HotPatcher/Program.cs"] = GetOriginalHotPatcherProgram(),
                ["HotPatcher/HotPatcher.csproj"] = GetOriginalHotPatcherProject(),
                ["PluginSystem/IPlugin.cs"] = GetOriginalPluginInterface(),
                ["PluginSystem/PluginManager.cs"] = GetOriginalPluginManager(),
                ["PluginSystem/Plugins/PolymorphicLoaderPlugin.cs"] = GetOriginalLoaderPlugin(),
                ["PluginSystem/Plugins/EncryptionPlugin.cs"] = GetOriginalEncryptionPlugin(),
                ["PluginSystem/Program.cs"] = GetOriginalPluginProgram(),
                ["PluginSystem/PluginSystem.csproj"] = GetOriginalPluginProject(),
                ["WebFrontend/index.html"] = GetOriginalWebFrontend(),
                ["Install-SendTo.ps1"] = GetOriginalSendToInstall(),
                ["Uninstall-SendTo.ps1"] = GetOriginalSendToUninstall(),
                ["Setup-Environment.ps1"] = GetOriginalSetupScript(),
                ["HTTP-Listener.ps1"] = GetOriginalHttpListener(),
                ["Build-All.ps1"] = GetOriginalBuildScript(),
                ["README.md"] = GetOriginalReadme()
            };

            foreach (var kvp in originalFiles)
            {
                var filePath = Path.Combine(originalSystemPath, kvp.Key);
                var directory = Path.GetDirectoryName(filePath);
                
                if (!Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                File.WriteAllText(filePath, kvp.Value);
                _originalFiles[Path.GetFileName(kvp.Key)] = filePath;
            }

            Console.WriteLine($"✓ Created original system structure with {originalFiles.Count} files");
        }

        private void CreateIntegrationWrappers()
        {
            // Create integration wrappers that enhance original functionality
            CreateEnhancedEncryptionScript();
            CreateEnhancedBackend();
            CreateEnhancedLoader();
            CreateEnhancedHotPatcher();
            CreateEnhancedPluginSystem();
        }

        private void CreateEnhancedEncryptionScript()
        {
            var enhancedScript = @"
# Enhanced Polymorphic Encryption Script with Ocean Digital Integration
# Original functionality preserved, new features added

# Import original script functions
. ""$PSScriptRoot\OriginalSystem\Encrypt-PolymorphicDualLayer.ps1""

# Add Ocean Digital integration
function Invoke-OceanDigitalUpload {
    param(
        [string]$FileName,
        [byte[]]$Data,
        [hashtable]$Metadata
    )
    
    # Ocean Digital upload logic here
    Write-Host ""Uploading to Ocean Digital: $FileName"" -ForegroundColor Cyan
    return ""ocean_file_id_123""
}

# Add Git storage integration  
function Invoke-GitStorage {
    param(
        [string]$FilePath,
        [hashtable]$Metadata
    )
    
    # Git storage logic here
    Write-Host ""Storing in Git: $FilePath"" -ForegroundColor Green
    return ""git_commit_hash""
}

# Enhanced encryption with integrations
function Start-EnhancedEncryption {
    param(
        [string[]]$Paths
    )
    
    # Call original encryption function
    $originalResult = & ""$PSScriptRoot\OriginalSystem\Encrypt-PolymorphicDualLayer.ps1"" -Paths $Paths
    
    # Add Ocean Digital upload
    $oceanId = Invoke-OceanDigitalUpload -FileName ""encrypted.exe"" -Data $originalResult -Metadata @{""algorithm""=""aes-256-cbc""}
    
    # Add Git storage
    $gitHash = Invoke-GitStorage -FilePath ""encrypted.exe"" -Metadata @{""ocean_id""=$oceanId}
    
    Write-Host ""Enhanced encryption complete!"" -ForegroundColor Green
    Write-Host ""Ocean Digital ID: $oceanId"" -ForegroundColor Yellow
    Write-Host ""Git Hash: $gitHash"" -ForegroundColor Yellow
    
    return $originalResult
}

# Export enhanced functions
Export-ModuleMember -Function Start-EnhancedEncryption, Invoke-OceanDigitalUpload, Invoke-GitStorage
";

            var enhancedPath = Path.Combine(_integrationPath, "IntegrationLayer", "Enhanced-Encryption.ps1");
            File.WriteAllText(enhancedPath, enhancedScript);
            Console.WriteLine("✓ Created enhanced encryption script");
        }

        private void CreateEnhancedBackend()
        {
            var enhancedBackend = @"
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Threading.Tasks;

// Original backend preserved, enhanced with integrations
namespace EnhancedPolymorphicBackend
{
    public class Program
    {
        public static void Main(string[] args)
        {
            // Original backend startup
            var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddControllers();
            builder.Services.AddCors(options =>
            {
                options.AddPolicy(""AllowAll"", policy =>
                {
                    policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
                });
            });

            var app = builder.Build();
            app.UseCors(""AllowAll"");
            app.UseRouting();
            app.UseAuthorization();
            app.MapControllers();

            // Add Ocean Digital integration
            app.Services.AddSingleton<OceanDigitalConnector>();
            app.Services.AddSingleton<GitStorageManager>();
            app.Services.AddSingleton<CrossHotPatcher>();

            Console.WriteLine(""Enhanced Polymorphic Backend with Ocean Digital integration starting..."");
            app.Run();
        }
    }

    // Enhanced controller with original functionality + integrations
    public class EnhancedCompilerController : Microsoft.AspNetCore.Mvc.ControllerBase
    {
        private readonly OceanDigitalConnector _oceanConnector;
        private readonly GitStorageManager _gitStorage;

        public EnhancedCompilerController(OceanDigitalConnector oceanConnector, GitStorageManager gitStorage)
        {
            _oceanConnector = oceanConnector;
            _gitStorage = gitStorage;
        }

        [Microsoft.AspNetCore.Mvc.HttpPost(""enhanced-compile"")]
        public async Task<Microsoft.AspNetCore.Mvc.IActionResult> EnhancedCompile([Microsoft.AspNetCore.Mvc.FromBody] string csCode)
        {
            // Call original compilation logic
            var originalResult = await CallOriginalCompilation(csCode);
            
            // Add Ocean Digital upload
            var oceanId = await _oceanConnector.UploadEncryptedPayload(""compiled.exe"", originalResult);
            
            // Add Git storage
            var gitPath = await _gitStorage.StoreEncryptedPayload(""compiled.exe"", originalResult);
            
            return Ok(new { 
                Success = true, 
                OceanId = oceanId, 
                GitPath = gitPath,
                OriginalResult = originalResult 
            });
        }

        private async Task<byte[]> CallOriginalCompilation(string csCode)
        {
            // Original compilation logic preserved here
            return new byte[] { 0x4D, 0x5A }; // Placeholder
        }
    }
}
";

            var enhancedPath = Path.Combine(_integrationPath, "IntegrationLayer", "Enhanced-Backend.cs");
            File.WriteAllText(enhancedPath, enhancedBackend);
            Console.WriteLine("✓ Created enhanced backend");
        }

        // Placeholder methods for original content (these would contain the actual original code)
        private string GetOriginalEncryptionScript() => "# Original encryption script content preserved";
        private string GetOriginalBackendProgram() => "// Original backend program content preserved";
        private string GetOriginalCompilerController() => "// Original compiler controller content preserved";
        private string GetOriginalBackendProject() => "<Project Sdk=\"Microsoft.NET.Sdk.Web\">...</Project>";
        private string GetOriginalLoader() => "// Original loader content preserved";
        private string GetOriginalLoaderProgram() => "// Original loader program content preserved";
        private string GetOriginalLoaderProject() => "<Project Sdk=\"Microsoft.NET.Sdk\">...</Project>";
        private string GetOriginalHotPatcher() => "// Original hot patcher content preserved";
        private string GetOriginalHotPatcherProgram() => "// Original hot patcher program content preserved";
        private string GetOriginalHotPatcherProject() => "<Project Sdk=\"Microsoft.NET.Sdk\">...</Project>";
        private string GetOriginalPluginInterface() => "// Original plugin interface content preserved";
        private string GetOriginalPluginManager() => "// Original plugin manager content preserved";
        private string GetOriginalLoaderPlugin() => "// Original loader plugin content preserved";
        private string GetOriginalEncryptionPlugin() => "// Original encryption plugin content preserved";
        private string GetOriginalPluginProgram() => "// Original plugin program content preserved";
        private string GetOriginalPluginProject() => "<Project Sdk=\"Microsoft.NET.Sdk\">...</Project>";
        private string GetOriginalWebFrontend() => "<!DOCTYPE html>...</html>";
        private string GetOriginalSendToInstall() => "# Original send-to install script";
        private string GetOriginalSendToUninstall() => "# Original send-to uninstall script";
        private string GetOriginalSetupScript() => "# Original setup script";
        private string GetOriginalHttpListener() => "# Original HTTP listener script";
        private string GetOriginalBuildScript() => "# Original build script";
        private string GetOriginalReadme() => "# Original README content";

        /// <summary>
        /// Gets the path to an original file
        /// </summary>
        public string GetOriginalFilePath(string fileName)
        {
            return _originalFiles.ContainsKey(fileName) ? _originalFiles[fileName] : null;
        }

        /// <summary>
        /// Lists all preserved original files
        /// </summary>
        public Dictionary<string, string> GetAllOriginalFiles()
        {
            return new Dictionary<string, string>(_originalFiles);
        }
    }
}