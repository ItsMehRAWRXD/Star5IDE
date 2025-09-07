using System;
using System.Collections.Generic;
using System.IO;

namespace PluginSystem
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("=== Polymorphic Plugin System v1.0 ===");
            Console.WriteLine("Modular encryption and loader system\n");

            var pluginManager = new PluginManager();

            // Load plugins from the plugins directory
            var pluginDirectory = Path.Combine(Directory.GetCurrentDirectory(), "Plugins");
            pluginManager.LoadPlugins(pluginDirectory);

            // Register built-in plugins
            RegisterBuiltInPlugins(pluginManager);

            // Process command line arguments
            if (args.Length > 0)
            {
                ProcessCommandLineArgs(pluginManager, args);
                return;
            }

            // Interactive mode
            InteractiveMode(pluginManager);
        }

        private static void RegisterBuiltInPlugins(PluginManager pluginManager)
        {
            // Register built-in plugins
            var encryptionPlugin = new Plugins.EncryptionPlugin();
            var loaderPlugin = new Plugins.PolymorphicLoaderPlugin();

            pluginManager.RegisterPlugin(encryptionPlugin);
            pluginManager.RegisterPlugin(loaderPlugin);
        }

        private static void ProcessCommandLineArgs(PluginManager pluginManager, string[] args)
        {
            var command = string.Join(" ", args);
            ProcessCommand(pluginManager, command);
        }

        private static void InteractiveMode(PluginManager pluginManager)
        {
            Console.WriteLine("Interactive mode. Type 'help' for available commands.\n");

            while (true)
            {
                Console.Write("PluginSystem> ");
                var command = Console.ReadLine();

                if (string.IsNullOrEmpty(command))
                    continue;

                if (command.ToLower() == "exit")
                    break;

                ProcessCommand(pluginManager, command);
                Console.WriteLine();
            }

            pluginManager.CleanupAllPlugins();
            Console.WriteLine("Goodbye!");
        }

        private static void ProcessCommand(PluginManager pluginManager, string command)
        {
            var parts = command.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0) return;

            switch (parts[0].ToLower())
            {
                case "list":
                    pluginManager.ListPlugins();
                    break;

                case "execute":
                    if (parts.Length >= 2)
                    {
                        pluginManager.ExecutePlugin(parts[1]);
                    }
                    else
                    {
                        Console.WriteLine("Usage: execute <plugin_name>");
                    }
                    break;

                case "execute-all":
                    pluginManager.ExecuteAllPlugins();
                    break;

                case "encrypt":
                    if (parts.Length >= 3)
                    {
                        ExecuteEncryption(pluginManager, parts[1], parts[2]);
                    }
                    else
                    {
                        Console.WriteLine("Usage: encrypt <algorithm> <file_path>");
                    }
                    break;

                case "decrypt":
                    if (parts.Length >= 3)
                    {
                        ExecuteDecryption(pluginManager, parts[1], parts[2]);
                    }
                    else
                    {
                        Console.WriteLine("Usage: decrypt <algorithm> <file_path>");
                    }
                    break;

                case "load":
                    if (parts.Length >= 2)
                    {
                        var loaderPlugin = pluginManager.GetPlugin<Plugins.PolymorphicLoaderPlugin>("PolymorphicLoader");
                        if (loaderPlugin != null)
                        {
                            var payload = File.ReadAllBytes(parts[1]);
                            loaderPlugin.LoadPayload(payload);
                            Console.WriteLine($"Loaded payload from {parts[1]}");
                        }
                        else
                        {
                            Console.WriteLine("PolymorphicLoader plugin not found");
                        }
                    }
                    else
                    {
                        Console.WriteLine("Usage: load <payload_file>");
                    }
                    break;

                case "help":
                    ShowHelp();
                    break;

                default:
                    Console.WriteLine($"Unknown command: {parts[0]}. Type 'help' for available commands.");
                    break;
            }
        }

        private static void ExecuteEncryption(PluginManager pluginManager, string algorithm, string filePath)
        {
            var encryptionPlugin = pluginManager.GetPlugin<Plugins.EncryptionPlugin>("EncryptionPlugin");
            if (encryptionPlugin == null)
            {
                Console.WriteLine("EncryptionPlugin not found");
                return;
            }

            if (!File.Exists(filePath))
            {
                Console.WriteLine($"File not found: {filePath}");
                return;
            }

            try
            {
                var data = File.ReadAllBytes(filePath);
                var parameters = new Dictionary<string, object>();
                var encryptedData = encryptionPlugin.Encrypt(data, algorithm, parameters);

                var outputPath = filePath + ".encrypted";
                File.WriteAllBytes(outputPath, encryptedData);

                Console.WriteLine($"Encrypted {filePath} to {outputPath}");
                Console.WriteLine($"Key: {BitConverter.ToString((byte[])parameters["key"]).Replace("-", "")}");
                Console.WriteLine($"IV: {BitConverter.ToString((byte[])parameters["iv"]).Replace("-", "")}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encryption failed: {ex.Message}");
            }
        }

        private static void ExecuteDecryption(PluginManager pluginManager, string algorithm, string filePath)
        {
            var encryptionPlugin = pluginManager.GetPlugin<Plugins.EncryptionPlugin>("EncryptionPlugin");
            if (encryptionPlugin == null)
            {
                Console.WriteLine("EncryptionPlugin not found");
                return;
            }

            if (!File.Exists(filePath))
            {
                Console.WriteLine($"File not found: {filePath}");
                return;
            }

            try
            {
                var data = File.ReadAllBytes(filePath);
                var parameters = new Dictionary<string, object>();

                Console.Write("Enter key (hex): ");
                var keyHex = Console.ReadLine();
                Console.Write("Enter IV (hex): ");
                var ivHex = Console.ReadLine();

                parameters["key"] = ConvertHexToBytes(keyHex);
                parameters["iv"] = ConvertHexToBytes(ivHex);

                var decryptedData = encryptionPlugin.Decrypt(data, algorithm, parameters);

                var outputPath = filePath.Replace(".encrypted", ".decrypted");
                File.WriteAllBytes(outputPath, decryptedData);

                Console.WriteLine($"Decrypted {filePath} to {outputPath}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Decryption failed: {ex.Message}");
            }
        }

        private static byte[] ConvertHexToBytes(string hex)
        {
            hex = hex.Replace("-", "").Replace(" ", "");
            var bytes = new byte[hex.Length / 2];
            for (int i = 0; i < bytes.Length; i++)
            {
                bytes[i] = Convert.ToByte(hex.Substring(i * 2, 2), 16);
            }
            return bytes;
        }

        private static void ShowHelp()
        {
            Console.WriteLine("\n=== Available Commands ===");
            Console.WriteLine("  list                    - List all registered plugins");
            Console.WriteLine("  execute <plugin>        - Execute a specific plugin");
            Console.WriteLine("  execute-all             - Execute all plugins");
            Console.WriteLine("  encrypt <alg> <file>    - Encrypt a file");
            Console.WriteLine("  decrypt <alg> <file>    - Decrypt a file");
            Console.WriteLine("  load <payload>          - Load a payload into the loader");
            Console.WriteLine("  help                    - Show this help");
            Console.WriteLine("  exit                    - Exit the program");
            Console.WriteLine("\nSupported algorithms: aes-256-cbc, camellia-256-cbc, chacha20, aes-256-ctr, camellia-256-ctr");
        }
    }
}