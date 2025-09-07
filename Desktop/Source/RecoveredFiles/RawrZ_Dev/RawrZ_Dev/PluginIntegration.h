#pragma once
#include <string>

// Plugin system integration functions
void InitializeRawrZPluginSystem();
void ShowRawrZPluginMenu();
void ListRawrZPlugins();
void GetRawrZPluginInfo(const std::string& pluginName);
void ConfigureRawrZPlugin(const std::string& pluginName, const std::string& option, const std::string& value);
void CleanupRawrZPluginSystem();
