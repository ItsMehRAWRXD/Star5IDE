#pragma once
#include <string>
#include <vector>

// Configuration structure for persistence management
struct PersistenceManagerConfig {
    bool useRegistryPersistence;
    bool useStartupFolder;
    bool useScheduledTasks;
    bool useWMIEventConsumer;
    bool useServiceInstallation;
    bool useDLLHijacking;
    bool useCOMHijacking;
    bool useBrowserExtensions;
    bool useOfficeMacros;
    bool useLNKFiles;
    bool useJunctionPoints;
    bool useAlternateDataStreams;
    bool useBootSector;
    bool useMBRModification;
    bool useEncryption;
    bool useAntiAnalysis;
    bool useEvasionTechniques;
};

// Persistence Manager Plugin Interface
class PersistenceManager {
private:
    PersistenceManagerConfig config;

    // Utility functions
    std::string generateRegistryPersistence();
    std::string generateStartupFolder();
    std::string generateScheduledTasks();
    std::string generateWMIEventConsumer();
    std::string generateServiceInstallation();
    std::string generateDLLHijacking();
    std::string generateCOMHijacking();
    std::string generateBrowserExtensions();
    std::string generateOfficeMacros();
    std::string generateLNKFiles();
    std::string generateJunctionPoints();
    std::string generateAlternateDataStreams();
    std::string generateBootSector();
    std::string generateMBRModification();
    std::string generateEncryption();
    std::string generateAntiAnalysis();
    std::string generateEvasionTechniques();

    // Menu handlers
    void handleRegistryPersistence();
    void handleStartupFolder();
    void handleScheduledTasks();
    void handleWMIEventConsumer();
    void handleServiceInstallation();
    void handleDLLHijacking();
    void handleCOMHijacking();
    void handleBrowserExtensions();
    void handleOfficeMacros();
    void handleLNKFiles();
    void handleJunctionPoints();
    void handleAlternateDataStreams();
    void handleBootSector();
    void handleMBRModification();
    void handleEncryption();
    void handleAntiAnalysis();
    void handleEvasionTechniques();
    void handleConfiguration();

public:
    PersistenceManager();
    ~PersistenceManager();

    // Plugin interface methods
    std::string getName() const;
    std::string getDescription() const;
    std::string getVersion() const;
    bool initialize();
    void execute();
    std::vector<std::string> getOptions() const;
    void setOption(const std::string& option, const std::string& value);

    // Persistence Methods
    std::string createRegistryPersistence(const std::string& payload, const std::string& key);
    std::string createStartupFolder(const std::string& payload);
    std::string createScheduledTasks(const std::string& payload, const std::string& trigger);
    std::string createWMIEventConsumer(const std::string& payload, const std::string& event);
    std::string createServiceInstallation(const std::string& payload, const std::string& serviceName);
    std::string createDLLHijacking(const std::string& payload, const std::string& targetDLL);
    std::string createCOMHijacking(const std::string& payload, const std::string& targetCOM);
    std::string createBrowserExtensions(const std::string& payload, const std::string& browser);
    std::string createOfficeMacros(const std::string& payload, const std::string& document);
    std::string createLNKFiles(const std::string& payload, const std::string& shortcut);
    std::string createJunctionPoints(const std::string& payload, const std::string& junction);
    std::string createAlternateDataStreams(const std::string& payload, const std::string& file);
    std::string createBootSector(const std::string& payload);
    std::string createMBRModification(const std::string& payload);
    std::string addEncryption(const std::string& data, const std::string& key);
    std::string addAntiAnalysis(const std::string& code);
    std::string addEvasionTechniques(const std::string& code);

    // Configuration methods
    void setUseRegistryPersistence(bool use);
    void setUseStartupFolder(bool use);
    void setUseScheduledTasks(bool use);
    void setUseWMIEventConsumer(bool use);
    void setUseServiceInstallation(bool use);
    void setUseDLLHijacking(bool use);
    void setUseCOMHijacking(bool use);
    void setUseBrowserExtensions(bool use);
    void setUseOfficeMacros(bool use);
    void setUseLNKFiles(bool use);
    void setUseJunctionPoints(bool use);
    void setUseAlternateDataStreams(bool use);
    void setUseBootSector(bool use);
    void setUseMBRModification(bool use);
    void setUseEncryption(bool use);
    void setUseAntiAnalysis(bool use);
    void setUseEvasionTechniques(bool use);

    // Menu interface
    void showMenu();
};
