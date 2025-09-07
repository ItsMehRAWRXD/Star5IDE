using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;

namespace PolymorphicPluginSystem
{
    public class PluginManager
    {
        private readonly Dictionary<string, IPlugin> _plugins = new Dictionary<string, IPlugin>();
        private readonly Dictionary<string, Assembly> _loadedAssemblies = new Dictionary<string, Assembly>();
        private readonly string _pluginDirectory;

        public PluginManager(string pluginDirectory)
        {
            _pluginDirectory = pluginDirectory;
            if (!Directory.Exists(_pluginDirectory))
            {
                Directory.CreateDirectory(_pluginDirectory);
            }
        }

        public void LoadPlugins()
        {
            Console.WriteLine($"[*] Loading plugins from: {_pluginDirectory}");

            foreach (var file in Directory.GetFiles(_pluginDirectory, "*.dll"))
            {
                try
                {
                    LoadPlugin(file);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[!] Failed to load plugin {Path.GetFileName(file)}: {ex.Message}");
                }
            }

            Console.WriteLine($"[+] Loaded {_plugins.Count} plugins");
        }

        private void LoadPlugin(string pluginPath)
        {
            var assembly = Assembly.LoadFrom(pluginPath);
            _loadedAssemblies[Path.GetFileName(pluginPath)] = assembly;

            foreach (var type in assembly.GetTypes())
            {
                if (typeof(IPlugin).IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract)
                {
                    var plugin = (IPlugin)Activator.CreateInstance(type);
                    _plugins[plugin.Name] = plugin;
                    
                    Console.WriteLine($"[+] Loaded plugin: {plugin.Name} v{plugin.Version}");
                    Console.WriteLine($"    {plugin.Description}");
                }
            }
        }

        public IPlugin GetPlugin(string name)
        {
            return _plugins.TryGetValue(name, out var plugin) ? plugin : null;
        }

        public T GetPlugin<T>(string name) where T : class, IPlugin
        {
            return GetPlugin(name) as T;
        }

        public IEnumerable<IPlugin> GetAllPlugins()
        {
            return _plugins.Values;
        }

        public IEnumerable<T> GetPluginsOfType<T>() where T : class, IPlugin
        {
            return _plugins.Values.OfType<T>();
        }

        public void ExecutePlugin(string pluginName, string[] args)
        {
            var plugin = GetPlugin(pluginName);
            if (plugin != null)
            {
                try
                {
                    plugin.Execute(args);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[!] Plugin execution failed: {ex.Message}");
                }
            }
            else
            {
                Console.WriteLine($"[!] Plugin not found: {pluginName}");
            }
        }

        public void UnloadPlugin(string pluginName)
        {
            if (_plugins.TryGetValue(pluginName, out var plugin))
            {
                plugin.Shutdown();
                _plugins.Remove(pluginName);
                Console.WriteLine($"[+] Unloaded plugin: {pluginName}");
            }
        }

        public void UnloadAllPlugins()
        {
            foreach (var plugin in _plugins.Values)
            {
                plugin.Shutdown();
            }
            _plugins.Clear();
            _loadedAssemblies.Clear();
        }
    }
}