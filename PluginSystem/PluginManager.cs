using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;

namespace PluginSystem
{
    public class PluginManager
    {
        private readonly List<IPlugin> _plugins = new List<IPlugin>();
        private readonly Dictionary<string, IPlugin> _pluginRegistry = new Dictionary<string, IPlugin>();

        public void LoadPlugins(string pluginDirectory)
        {
            if (!Directory.Exists(pluginDirectory))
            {
                Console.WriteLine($"Plugin directory does not exist: {pluginDirectory}");
                return;
            }

            var pluginFiles = Directory.GetFiles(pluginDirectory, "*.dll");
            Console.WriteLine($"Found {pluginFiles.Length} plugin files in {pluginDirectory}");

            foreach (var file in pluginFiles)
            {
                try
                {
                    LoadPluginFromFile(file);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to load plugin from {file}: {ex.Message}");
                }
            }
        }

        private void LoadPluginFromFile(string filePath)
        {
            var assembly = Assembly.LoadFrom(filePath);
            var pluginTypes = assembly.GetTypes()
                .Where(t => typeof(IPlugin).IsAssignableFrom(t) && !t.IsInterface && !t.IsAbstract);

            foreach (var type in pluginTypes)
            {
                try
                {
                    var plugin = (IPlugin)Activator.CreateInstance(type);
                    RegisterPlugin(plugin);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to create instance of {type.Name}: {ex.Message}");
                }
            }
        }

        public void RegisterPlugin(IPlugin plugin)
        {
            if (_pluginRegistry.ContainsKey(plugin.Name))
            {
                Console.WriteLine($"Plugin '{plugin.Name}' is already registered. Replacing...");
                _pluginRegistry.Remove(plugin.Name);
                _plugins.RemoveAll(p => p.Name == plugin.Name);
            }

            _plugins.Add(plugin);
            _pluginRegistry[plugin.Name] = plugin;
            
            Console.WriteLine($"Registered plugin: {plugin.Name} v{plugin.Version}");
            Console.WriteLine($"  Description: {plugin.Description}");
            
            try
            {
                plugin.Initialize();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to initialize plugin '{plugin.Name}': {ex.Message}");
            }
        }

        public T GetPlugin<T>(string name) where T : class, IPlugin
        {
            if (_pluginRegistry.TryGetValue(name, out var plugin))
            {
                return plugin as T;
            }
            return null;
        }

        public IPlugin GetPlugin(string name)
        {
            _pluginRegistry.TryGetValue(name, out var plugin);
            return plugin;
        }

        public IEnumerable<T> GetPlugins<T>() where T : class, IPlugin
        {
            return _plugins.OfType<T>();
        }

        public IEnumerable<IPlugin> GetAllPlugins()
        {
            return _plugins.AsReadOnly();
        }

        public void ExecutePlugin(string name)
        {
            var plugin = GetPlugin(name);
            if (plugin != null)
            {
                try
                {
                    Console.WriteLine($"Executing plugin: {plugin.Name}");
                    plugin.Execute();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error executing plugin '{plugin.Name}': {ex.Message}");
                }
            }
            else
            {
                Console.WriteLine($"Plugin '{name}' not found");
            }
        }

        public void ExecuteAllPlugins()
        {
            foreach (var plugin in _plugins)
            {
                try
                {
                    Console.WriteLine($"Executing plugin: {plugin.Name}");
                    plugin.Execute();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error executing plugin '{plugin.Name}': {ex.Message}");
                }
            }
        }

        public void CleanupAllPlugins()
        {
            foreach (var plugin in _plugins)
            {
                try
                {
                    plugin.Cleanup();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error cleaning up plugin '{plugin.Name}': {ex.Message}");
                }
            }
        }

        public void ListPlugins()
        {
            Console.WriteLine("\n=== Registered Plugins ===");
            if (_plugins.Count == 0)
            {
                Console.WriteLine("No plugins registered");
                return;
            }

            foreach (var plugin in _plugins)
            {
                Console.WriteLine($"  {plugin.Name} v{plugin.Version}");
                Console.WriteLine($"    Description: {plugin.Description}");
                Console.WriteLine($"    Type: {plugin.GetType().Name}");
                Console.WriteLine();
            }
        }

        public void UnloadPlugin(string name)
        {
            if (_pluginRegistry.TryGetValue(name, out var plugin))
            {
                try
                {
                    plugin.Cleanup();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error cleaning up plugin '{name}': {ex.Message}");
                }

                _plugins.Remove(plugin);
                _pluginRegistry.Remove(name);
                Console.WriteLine($"Unloaded plugin: {name}");
            }
            else
            {
                Console.WriteLine($"Plugin '{name}' not found");
            }
        }
    }
}