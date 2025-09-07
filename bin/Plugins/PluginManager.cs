using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;

namespace PolymorphicRig.Plugins
{
    public class PluginManager
    {
        private readonly List<IPlugin> _plugins = new List<IPlugin>();
        private readonly Dictionary<string, IPlugin> _pluginMap = new Dictionary<string, IPlugin>();

        public IReadOnlyList<IPlugin> LoadedPlugins => _plugins.AsReadOnly();

        public void LoadPlugins(string pluginDirectory)
        {
            if (!Directory.Exists(pluginDirectory))
            {
                Console.WriteLine($"Plugin directory does not exist: {pluginDirectory}");
                return;
            }

            foreach (var file in Directory.GetFiles(pluginDirectory, "*.dll"))
            {
                try
                {
                    var assembly = Assembly.LoadFrom(file);
                    LoadPluginsFromAssembly(assembly);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to load assembly {file}: {ex.Message}");
                }
            }

            Console.WriteLine($"Loaded {_plugins.Count} plugins total");
        }

        private void LoadPluginsFromAssembly(Assembly assembly)
        {
            foreach (var type in assembly.GetTypes())
            {
                if (typeof(IPlugin).IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract)
                {
                    try
                    {
                        var plugin = (IPlugin)Activator.CreateInstance(type)!;
                        _plugins.Add(plugin);
                        _pluginMap[plugin.Name.ToLower()] = plugin;
                        Console.WriteLine($"Loaded plugin: {plugin.Name} - {plugin.Description}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to instantiate plugin {type.Name}: {ex.Message}");
                    }
                }
            }
        }

        public bool ExecutePlugin(string pluginName, string[] args = null)
        {
            var normalizedName = pluginName.ToLower();
            if (_pluginMap.TryGetValue(normalizedName, out var plugin))
            {
                try
                {
                    if (args != null && args.Length > 0)
                    {
                        plugin.Configure(args);
                    }
                    plugin.Execute();
                    return true;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Plugin '{plugin.Name}' execution failed: {ex.Message}");
                    return false;
                }
            }
            else
            {
                Console.WriteLine($"Plugin '{pluginName}' not found.");
                Console.WriteLine("Available plugins:");
                foreach (var p in _plugins)
                {
                    Console.WriteLine($"  - {p.Name}: {p.Description}");
                }
                return false;
            }
        }

        public void ListPlugins()
        {
            if (_plugins.Count == 0)
            {
                Console.WriteLine("No plugins loaded.");
                return;
            }

            Console.WriteLine("Available plugins:");
            foreach (var plugin in _plugins)
            {
                Console.WriteLine($"  - {plugin.Name}: {plugin.Description}");
            }
        }
    }
}