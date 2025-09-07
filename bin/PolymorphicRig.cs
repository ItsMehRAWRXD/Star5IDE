using System;
using System.IO;
using System.Linq;
using PolymorphicRig.Plugins;

namespace PolymorphicRig
{
    class Program
    {
        private static PluginManager _pluginManager = new PluginManager();
        private static readonly string PluginDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "plugins");

        static void Main(string[] args)
        {
            Console.WriteLine("=== Polymorphic Rig CLI v1.0 ===");
            Console.WriteLine("Advanced polymorphic encryption and hot patching toolkit");
            Console.WriteLine();

            // Load plugins
            LoadPlugins();

            if (args.Length == 0)
            {
                ShowHelp();
                ShowInteractiveMenu();
                return;
            }

            // Parse command line arguments
            var command = args[0].ToLower();
            var pluginArgs = args.Skip(1).ToArray();

            switch (command)
            {
                case "list":
                case "ls":
                    _pluginManager.ListPlugins();
                    break;
                case "help":
                case "-h":
                case "--help":
                    ShowHelp();
                    break;
                case "interactive":
                case "-i":
                    ShowInteractiveMenu();
                    break;
                default:
                    // Try to execute as plugin
                    if (!_pluginManager.ExecutePlugin(command, pluginArgs))
                    {
                        Console.WriteLine($"Unknown command: {command}");
                        ShowHelp();
                    }
                    break;
            }
        }

        private static void LoadPlugins()
        {
            Console.WriteLine($"Loading plugins from: {PluginDirectory}");
            
            // Ensure plugin directory exists
            if (!Directory.Exists(PluginDirectory))
            {
                Directory.CreateDirectory(PluginDirectory);
                Console.WriteLine("Created plugins directory.");
            }

            _pluginManager.LoadPlugins(PluginDirectory);
            Console.WriteLine();
        }

        private static void ShowHelp()
        {
            Console.WriteLine("Usage: rig <command> [options]");
            Console.WriteLine();
            Console.WriteLine("Commands:");
            Console.WriteLine("  list, ls              List available plugins");
            Console.WriteLine("  help, -h, --help      Show this help message");
            Console.WriteLine("  interactive, -i       Enter interactive mode");
            Console.WriteLine();
            Console.WriteLine("Plugin Commands:");
            Console.WriteLine("  polymorphicloader     Execute polymorphic loader");
            Console.WriteLine("    --payload, -p       Specify payload file path");
            Console.WriteLine("    --reverse-wrapper   Enable reverse PE wrapper");
            Console.WriteLine("    --hot-patcher       Enable reverse hot patcher");
            Console.WriteLine();
            Console.WriteLine("  hotpatcher            Execute hot patcher");
            Console.WriteLine("    --target, -t        Target file to patch");
            Console.WriteLine("    --template, -tm     Template type (basic/advanced/stealth/car)");
            Console.WriteLine("    --no-fresh          Skip fresh template generation");
            Console.WriteLine();
            Console.WriteLine("Examples:");
            Console.WriteLine("  rig list");
            Console.WriteLine("  rig polymorphicloader --payload payload.bin --reverse-wrapper");
            Console.WriteLine("  rig hotpatcher --template advanced --target loader.exe");
            Console.WriteLine("  rig interactive");
            Console.WriteLine();
        }

        private static void ShowInteractiveMenu()
        {
            Console.WriteLine("=== Interactive Mode ===");
            Console.WriteLine("Type 'exit' to quit, 'help' for commands");
            Console.WriteLine();

            while (true)
            {
                Console.Write("rig> ");
                var input = Console.ReadLine()?.Trim();
                
                if (string.IsNullOrEmpty(input))
                    continue;

                if (input.ToLower() == "exit")
                {
                    Console.WriteLine("Goodbye!");
                    break;
                }

                if (input.ToLower() == "help")
                {
                    ShowInteractiveHelp();
                    continue;
                }

                if (input.ToLower() == "clear")
                {
                    Console.Clear();
                    Console.WriteLine("=== Polymorphic Rig CLI v1.0 ===");
                    continue;
                }

                // Parse interactive command
                var parts = input.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length == 0) continue;

                var command = parts[0].ToLower();
                var args = parts.Skip(1).ToArray();

                switch (command)
                {
                    case "list":
                    case "ls":
                        _pluginManager.ListPlugins();
                        break;
                    case "status":
                        ShowStatus();
                        break;
                    case "reload":
                        LoadPlugins();
                        break;
                    default:
                        if (!_pluginManager.ExecutePlugin(command, args))
                        {
                            Console.WriteLine($"Unknown command: {command}");
                            Console.WriteLine("Type 'help' for available commands.");
                        }
                        break;
                }
                
                Console.WriteLine();
            }
        }

        private static void ShowInteractiveHelp()
        {
            Console.WriteLine("Interactive Commands:");
            Console.WriteLine("  help                  Show this help");
            Console.WriteLine("  exit                  Exit interactive mode");
            Console.WriteLine("  clear                 Clear screen");
            Console.WriteLine("  list, ls              List plugins");
            Console.WriteLine("  status                Show system status");
            Console.WriteLine("  reload                Reload plugins");
            Console.WriteLine();
            Console.WriteLine("Plugin Commands:");
            _pluginManager.ListPlugins();
            Console.WriteLine();
        }

        private static void ShowStatus()
        {
            Console.WriteLine("=== System Status ===");
            Console.WriteLine($"Plugins Directory: {PluginDirectory}");
            Console.WriteLine($"Loaded Plugins: {_pluginManager.LoadedPlugins.Count}");
            Console.WriteLine($"Runtime: {Environment.Version}");
            Console.WriteLine($"Platform: {Environment.OSVersion}");
            Console.WriteLine($"Working Directory: {Environment.CurrentDirectory}");
            Console.WriteLine($"Process ID: {Environment.ProcessId}");
            Console.WriteLine($"Memory Usage: {GC.GetTotalMemory(false) / 1024 / 1024} MB");
            Console.WriteLine($"Timestamp: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
        }
    }
}