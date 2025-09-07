using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;

namespace HotPatcher
{
    public class HotPatcher
    {
        private readonly Dictionary<string, byte[]> _patches = new Dictionary<string, byte[]>();
        private readonly Dictionary<string, IntPtr> _markers = new Dictionary<string, IntPtr>();

        // car() marker addresses (will be populated at runtime)
        public void RegisterMarker(string markerName, IntPtr address)
        {
            _markers[markerName] = address;
            Console.WriteLine($"Registered marker '{markerName}' at 0x{address:X}");
        }

        // Load patch from file
        public void LoadPatch(string patchName, string filePath)
        {
            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"Patch file not found: {filePath}");
            }

            var patchBytes = File.ReadAllBytes(filePath);
            _patches[patchName] = patchBytes;
            Console.WriteLine($"Loaded patch '{patchName}' ({patchBytes.Length} bytes)");
        }

        // Apply patch to specific marker
        public bool ApplyPatch(string patchName, string markerName)
        {
            if (!_patches.ContainsKey(patchName))
            {
                Console.WriteLine($"Patch '{patchName}' not found");
                return false;
            }

            if (!_markers.ContainsKey(markerName))
            {
                Console.WriteLine($"Marker '{markerName}' not found");
                return false;
            }

            var patch = _patches[patchName];
            var markerAddress = _markers[markerName];

            try
            {
                // Change memory protection to allow writing
                if (!VirtualProtect(markerAddress, (uint)patch.Length, 0x40, out uint oldProtect))
                {
                    Console.WriteLine($"Failed to change memory protection: {Marshal.GetLastWin32Error()}");
                    return false;
                }

                // Apply the patch
                Marshal.Copy(patch, 0, markerAddress, patch.Length);

                // Flush instruction cache
                FlushInstructionCache(Process.GetCurrentProcess().Handle, markerAddress, (uint)patch.Length);

                // Restore original protection
                VirtualProtect(markerAddress, (uint)patch.Length, oldProtect, out _);

                Console.WriteLine($"Applied patch '{patchName}' to marker '{markerName}'");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to apply patch: {ex.Message}");
                return false;
            }
        }

        // Generate fresh template
        public byte[] GenerateFreshTemplate(string templateType, int size = 256)
        {
            var random = new Random();
            var template = new byte[size];

            switch (templateType.ToLower())
            {
                case "xor":
                    // Generate XOR-based template
                    for (int i = 0; i < size; i++)
                    {
                        template[i] = (byte)(random.Next(256) ^ (i % 256));
                    }
                    break;

                case "aes":
                    // Generate AES-like template
                    for (int i = 0; i < size; i += 16)
                    {
                        var block = new byte[16];
                        random.NextBytes(block);
                        Array.Copy(block, 0, template, i, Math.Min(16, size - i));
                    }
                    break;

                case "chacha":
                    // Generate ChaCha20-like template
                    for (int i = 0; i < size; i += 4)
                    {
                        var word = (uint)random.Next();
                        var bytes = BitConverter.GetBytes(word);
                        Array.Copy(bytes, 0, template, i, Math.Min(4, size - i));
                    }
                    break;

                default:
                    // Generate random template
                    random.NextBytes(template);
                    break;
            }

            Console.WriteLine($"Generated fresh {templateType} template ({size} bytes)");
            return template;
        }

        // Save template to file
        public void SaveTemplate(byte[] template, string filePath)
        {
            File.WriteAllBytes(filePath, template);
            Console.WriteLine($"Saved template to {filePath}");
        }

        // List all available patches and markers
        public void ListPatches()
        {
            Console.WriteLine("\n=== Available Patches ===");
            foreach (var patch in _patches)
            {
                Console.WriteLine($"  {patch.Key}: {patch.Value.Length} bytes");
            }
        }

        public void ListMarkers()
        {
            Console.WriteLine("\n=== Available Markers ===");
            foreach (var marker in _markers)
            {
                Console.WriteLine($"  {marker.Key}: 0x{marker.Value:X}");
            }
        }

        // Interactive command processor
        public void ProcessCommand(string command)
        {
            var parts = command.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0) return;

            switch (parts[0].ToLower())
            {
                case "load":
                    if (parts.Length >= 3)
                    {
                        LoadPatch(parts[1], parts[2]);
                    }
                    else
                    {
                        Console.WriteLine("Usage: load <patch_name> <file_path>");
                    }
                    break;

                case "apply":
                    if (parts.Length >= 3)
                    {
                        ApplyPatch(parts[1], parts[2]);
                    }
                    else
                    {
                        Console.WriteLine("Usage: apply <patch_name> <marker_name>");
                    }
                    break;

                case "generate":
                    if (parts.Length >= 2)
                    {
                        var size = parts.Length >= 3 ? int.Parse(parts[2]) : 256;
                        var template = GenerateFreshTemplate(parts[1], size);
                        var fileName = $"template_{parts[1]}_{DateTime.Now:yyyyMMdd_HHmmss}.bin";
                        SaveTemplate(template, fileName);
                    }
                    else
                    {
                        Console.WriteLine("Usage: generate <template_type> [size]");
                        Console.WriteLine("Types: xor, aes, chacha, random");
                    }
                    break;

                case "list":
                    if (parts.Length >= 2)
                    {
                        switch (parts[1].ToLower())
                        {
                            case "patches":
                                ListPatches();
                                break;
                            case "markers":
                                ListMarkers();
                                break;
                            default:
                                Console.WriteLine("Usage: list <patches|markers>");
                                break;
                        }
                    }
                    else
                    {
                        Console.WriteLine("Usage: list <patches|markers>");
                    }
                    break;

                case "help":
                    Console.WriteLine("\n=== Hot Patcher Commands ===");
                    Console.WriteLine("  load <patch_name> <file_path>  - Load patch from file");
                    Console.WriteLine("  apply <patch_name> <marker>    - Apply patch to marker");
                    Console.WriteLine("  generate <type> [size]         - Generate fresh template");
                    Console.WriteLine("  list <patches|markers>         - List available items");
                    Console.WriteLine("  help                           - Show this help");
                    Console.WriteLine("  exit                           - Exit patcher");
                    break;

                case "exit":
                    Console.WriteLine("Exiting hot patcher...");
                    break;

                default:
                    Console.WriteLine($"Unknown command: {parts[0]}. Type 'help' for available commands.");
                    break;
            }
        }

        // P/Invoke declarations
        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool VirtualProtect(IntPtr lpAddress, uint dwSize, uint flNewProtect, out uint lpflOldProtect);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool FlushInstructionCache(IntPtr hProcess, IntPtr lpBaseAddress, uint dwSize);
    }
}