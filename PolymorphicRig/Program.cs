using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using PolymorphicPluginSystem;

namespace PolymorphicRig
{
    class Program
    {
        private static PluginManager _pluginManager;
        private static bool _running = true;

        static void Main(string[] args)
        {
            PrintBanner();

            // Initialize plugin manager
            var pluginDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "plugins");
            _pluginManager = new PluginManager(pluginDir);
            _pluginManager.LoadPlugins();

            if (args.Length > 0)
            {
                // Execute command from arguments
                ExecuteCommand(args);
            }
            else
            {
                // Enter interactive mode
                InteractiveMode();
            }
        }

        static void PrintBanner()
        {
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine(@"
╔═══════════════════════════════════════════════════════════════╗
║     ____       __                                 __    _     ║
║    / __ \___  / /_  ______ ___  ____  _________  / /_  (_)____║
║   / /_/ / _ \/ / / / / __ `__ \/ __ \/ ___/ __ \/ __ \/ / ___/║
║  / ____/ (_) / / /_/ / / / / / / /_/ / /  / /_/ / / / / / /__  ║
║ /_/    \___/_/\__, /_/ /_/ /_/\____/_/  / .___/_/ /_/_/\___/  ║
║              /____/                     /_/                    ║
║                                                                ║
║           Advanced Polymorphic Encryption Rig v2.0            ║
║              With Hot Patching & Plugin Support               ║
╚═══════════════════════════════════════════════════════════════╝
");
            Console.ResetColor();
        }

        static void InteractiveMode()
        {
            Console.WriteLine("\nType 'help' for available commands\n");

            while (_running)
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.Write("PolyRig> ");
                Console.ResetColor();

                var input = Console.ReadLine();
                if (string.IsNullOrWhiteSpace(input))
                    continue;

                var args = ParseCommandLine(input);
                ExecuteCommand(args);
            }
        }

        static void ExecuteCommand(string[] args)
        {
            if (args.Length == 0)
                return;

            var command = args[0].ToLower();
            var commandArgs = args.Skip(1).ToArray();

            try
            {
                switch (command)
                {
                    case "help":
                        ShowHelp();
                        break;

                    case "list":
                        ListPlugins();
                        break;

                    case "load":
                        if (commandArgs.Length > 0)
                            LoadPlugin(commandArgs[0]);
                        else
                            Console.WriteLine("[!] Usage: load <plugin_file>");
                        break;

                    case "exec":
                    case "run":
                        if (commandArgs.Length > 0)
                            ExecutePlugin(commandArgs[0], commandArgs.Skip(1).ToArray());
                        else
                            Console.WriteLine("[!] Usage: exec <plugin_name> [args...]");
                        break;

                    case "encrypt":
                        EncryptFile(commandArgs);
                        break;

                    case "decrypt":
                        DecryptFile(commandArgs);
                        break;

                    case "patch":
                        ApplyPatch(commandArgs);
                        break;

                    case "compile":
                        CompileCode(commandArgs);
                        break;

                    case "generate":
                        GenerateTemplate(commandArgs);
                        break;

                    case "status":
                        ShowStatus();
                        break;

                    case "clear":
                    case "cls":
                        Console.Clear();
                        PrintBanner();
                        break;

                    case "exit":
                    case "quit":
                        _running = false;
                        Console.WriteLine("Goodbye!");
                        break;

                    default:
                        // Try to execute as plugin
                        var plugin = _pluginManager.GetPlugin(command);
                        if (plugin != null)
                        {
                            plugin.Execute(commandArgs);
                        }
                        else
                        {
                            Console.WriteLine($"[!] Unknown command: {command}");
                            Console.WriteLine("    Type 'help' for available commands");
                        }
                        break;
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"[!] Error: {ex.Message}");
                Console.ResetColor();
            }
        }

        static void ShowHelp()
        {
            Console.WriteLine("\n=== Available Commands ===\n");
            Console.WriteLine("  help                        - Show this help message");
            Console.WriteLine("  list                        - List loaded plugins");
            Console.WriteLine("  load <plugin_file>          - Load a plugin from file");
            Console.WriteLine("  exec <plugin> [args...]     - Execute a plugin");
            Console.WriteLine("  encrypt <file> [options]    - Encrypt a file with polymorphic layers");
            Console.WriteLine("  decrypt <file> [options]    - Decrypt an encrypted file");
            Console.WriteLine("  patch <process> <file>      - Apply hot patch to process");
            Console.WriteLine("  compile <source> [options]  - Compile C# code to executable");
            Console.WriteLine("  generate <template> <out>   - Generate fresh polymorphic template");
            Console.WriteLine("  status                      - Show system status");
            Console.WriteLine("  clear                       - Clear screen");
            Console.WriteLine("  exit                        - Exit the program");
            Console.WriteLine("\n=== Encryption Options ===\n");
            Console.WriteLine("  --cipher <name>             - Cipher algorithm (aes-256-cbc, camellia-256-cbc, chacha20)");
            Console.WriteLine("  --poly <mode>               - Polymorphic mode (xor, aes-ctr, camellia-ctr, chacha-ks)");
            Console.WriteLine("  --ext <extension>           - Output file extension (.exe, .dll, .bin, etc.)");
            Console.WriteLine("  --key <hex>                 - Encryption key (32 bytes hex)");
            Console.WriteLine("\n=== Examples ===\n");
            Console.WriteLine("  encrypt payload.bin --cipher aes-256-cbc --poly aes-ctr --ext .exe");
            Console.WriteLine("  patch notepad.exe patches/hook.bin");
            Console.WriteLine("  exec PolymorphicLoader encrypted.exe --multilayer");
            Console.WriteLine("  generate loader template.bin");
            Console.WriteLine();
        }

        static void ListPlugins()
        {
            var plugins = _pluginManager.GetAllPlugins().ToList();
            
            if (plugins.Count == 0)
            {
                Console.WriteLine("[*] No plugins loaded");
                return;
            }

            Console.WriteLine($"\n=== Loaded Plugins ({plugins.Count}) ===\n");
            
            foreach (var plugin in plugins)
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine($"  {plugin.Name} v{plugin.Version}");
                Console.ResetColor();
                Console.WriteLine($"    {plugin.Description}");
                
                if (plugin is IEncryptionPlugin enc)
                {
                    Console.WriteLine($"    Algorithms: {string.Join(", ", enc.SupportedAlgorithms)}");
                }
                else if (plugin is ILoaderPlugin loader)
                {
                    Console.WriteLine($"    Hot Patching: {(loader.SupportsHotPatching ? "Yes" : "No")}");
                }
                
                Console.WriteLine();
            }
        }

        static void LoadPlugin(string pluginFile)
        {
            if (!File.Exists(pluginFile))
            {
                Console.WriteLine($"[!] Plugin file not found: {pluginFile}");
                return;
            }

            // Copy to plugin directory and load
            var pluginDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "plugins");
            var destFile = Path.Combine(pluginDir, Path.GetFileName(pluginFile));
            
            File.Copy(pluginFile, destFile, true);
            _pluginManager.LoadPlugins();
            
            Console.WriteLine($"[+] Plugin loaded: {Path.GetFileName(pluginFile)}");
        }

        static void ExecutePlugin(string pluginName, string[] args)
        {
            _pluginManager.ExecutePlugin(pluginName, args);
        }

        static void EncryptFile(string[] args)
        {
            if (args.Length < 1)
            {
                Console.WriteLine("[!] Usage: encrypt <file> [options]");
                return;
            }

            var inputFile = args[0];
            if (!File.Exists(inputFile))
            {
                Console.WriteLine($"[!] File not found: {inputFile}");
                return;
            }

            // Parse options
            var options = ParseOptions(args.Skip(1).ToArray());
            var cipher = options.GetValueOrDefault("cipher", "aes-256-cbc");
            var poly = options.GetValueOrDefault("poly", "xor");
            var ext = options.GetValueOrDefault("ext", ".exe");

            Console.WriteLine($"[*] Encrypting {inputFile}");
            Console.WriteLine($"    Cipher: {cipher}");
            Console.WriteLine($"    Polymorphic: {poly}");
            Console.WriteLine($"    Extension: {ext}");

            // Use encryption plugin if available
            var encPlugin = _pluginManager.GetPluginsOfType<IEncryptionPlugin>().FirstOrDefault();
            if (encPlugin != null)
            {
                var data = File.ReadAllBytes(inputFile);
                var encrypted = encPlugin.Encrypt(data, cipher, options);
                
                var outputFile = Path.GetFileNameWithoutExtension(inputFile) + ext;
                File.WriteAllBytes(outputFile, encrypted);
                
                Console.WriteLine($"[+] Encrypted file saved: {outputFile}");
            }
            else
            {
                // Fallback to simple XOR encryption
                var data = File.ReadAllBytes(inputFile);
                var key = (byte)new Random().Next(256);
                var encrypted = new byte[data.Length + 1];
                encrypted[0] = key;
                
                for (int i = 0; i < data.Length; i++)
                {
                    key = (byte)((key + i) ^ (key >> 3));
                    encrypted[i + 1] = (byte)(data[i] ^ key);
                }
                
                var outputFile = Path.GetFileNameWithoutExtension(inputFile) + ext;
                File.WriteAllBytes(outputFile, encrypted);
                
                Console.WriteLine($"[+] Encrypted file saved: {outputFile} (XOR fallback)");
            }
        }

        static void DecryptFile(string[] args)
        {
            if (args.Length < 1)
            {
                Console.WriteLine("[!] Usage: decrypt <file> [options]");
                return;
            }

            var inputFile = args[0];
            if (!File.Exists(inputFile))
            {
                Console.WriteLine($"[!] File not found: {inputFile}");
                return;
            }

            Console.WriteLine($"[*] Decrypting {inputFile}");

            // Simple XOR decryption
            var encrypted = File.ReadAllBytes(inputFile);
            var key = encrypted[0];
            var decrypted = new byte[encrypted.Length - 1];
            
            for (int i = 1; i < encrypted.Length; i++)
            {
                key = (byte)((key + i - 1) ^ (key >> 3));
                decrypted[i - 1] = (byte)(encrypted[i] ^ key);
            }
            
            var outputFile = Path.GetFileNameWithoutExtension(inputFile) + ".decrypted.bin";
            File.WriteAllBytes(outputFile, decrypted);
            
            Console.WriteLine($"[+] Decrypted file saved: {outputFile}");
        }

        static void ApplyPatch(string[] args)
        {
            if (args.Length < 2)
            {
                Console.WriteLine("[!] Usage: patch <process_name|pid> <patch_file>");
                return;
            }

            var processTarget = args[0];
            var patchFile = args[1];

            if (!File.Exists(patchFile))
            {
                Console.WriteLine($"[!] Patch file not found: {patchFile}");
                return;
            }

            // Use hot patcher plugin
            var patcherPlugin = _pluginManager.GetPluginsOfType<IPatcherPlugin>().FirstOrDefault();
            if (patcherPlugin != null)
            {
                patcherPlugin.Execute(new[] { processTarget, patchFile });
            }
            else
            {
                Console.WriteLine("[!] No patcher plugin available");
            }
        }

        static void CompileCode(string[] args)
        {
            if (args.Length < 1)
            {
                Console.WriteLine("[!] Usage: compile <source_file> [options]");
                return;
            }

            var sourceFile = args[0];
            if (!File.Exists(sourceFile))
            {
                Console.WriteLine($"[!] Source file not found: {sourceFile}");
                return;
            }

            Console.WriteLine($"[*] Compiling {sourceFile}");

            // This would integrate with the .NET backend service
            Console.WriteLine("[*] Feature requires backend service to be running");
        }

        static void GenerateTemplate(string[] args)
        {
            if (args.Length < 2)
            {
                Console.WriteLine("[!] Usage: generate <template_type> <output_file>");
                Console.WriteLine("    Template types: loader, decryptor, injector");
                return;
            }

            var templateType = args[0];
            var outputFile = args[1];

            var patcherPlugin = _pluginManager.GetPluginsOfType<IPatcherPlugin>().FirstOrDefault();
            if (patcherPlugin != null)
            {
                patcherPlugin.Execute(new[] { "-generate", templateType, outputFile });
            }
            else
            {
                Console.WriteLine("[!] No patcher plugin available");
            }
        }

        static void ShowStatus()
        {
            Console.WriteLine("\n=== System Status ===\n");
            Console.WriteLine($"  Plugins Loaded: {_pluginManager.GetAllPlugins().Count()}");
            Console.WriteLine($"  Process ID: {System.Diagnostics.Process.GetCurrentProcess().Id}");
            Console.WriteLine($"  Memory Usage: {GC.GetTotalMemory(false) / (1024 * 1024)} MB");
            Console.WriteLine($"  Platform: {Environment.OSVersion}");
            Console.WriteLine($"  Runtime: .NET {Environment.Version}");
            Console.WriteLine();
        }

        static string[] ParseCommandLine(string commandLine)
        {
            var args = new List<string>();
            var current = "";
            var inQuotes = false;

            foreach (char c in commandLine)
            {
                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == ' ' && !inQuotes)
                {
                    if (!string.IsNullOrEmpty(current))
                    {
                        args.Add(current);
                        current = "";
                    }
                }
                else
                {
                    current += c;
                }
            }

            if (!string.IsNullOrEmpty(current))
                args.Add(current);

            return args.ToArray();
        }

        static Dictionary<string, string> ParseOptions(string[] args)
        {
            var options = new Dictionary<string, string>();

            for (int i = 0; i < args.Length; i++)
            {
                if (args[i].StartsWith("--") && i + 1 < args.Length)
                {
                    var key = args[i].Substring(2);
                    var value = args[i + 1];
                    options[key] = value;
                    i++; // Skip next arg
                }
            }

            return options;
        }
    }
}