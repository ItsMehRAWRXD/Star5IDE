#pragma once
#include <string>
#include <vector>

// Configuration structure for lateral movement
struct LateralMovementConfig {
    bool usePSRemoting;
    bool useWMIExecution;
    bool useScheduledTasks;
    bool useServiceCreation;
    bool useRDPHijacking;
    bool useSSHConnection;
    bool useSMBExecution;
    bool useWinRMExecution;
    bool useDCOMExecution;
    bool useRPCExecution;
    bool useRegistryPersistence;
    bool useGPOAbuse;
    bool useCredentialDumping;
    bool usePassTheHash;
    bool usePassTheTicket;
    bool useOverPassTheHash;
    bool useGoldenTicket;
    bool useSilverTicket;
    bool useEncryption;
    bool useAntiAnalysis;
    bool useEvasion;
};

// Lateral Movement Plugin Interface
class LateralMovement {
private:
    LateralMovementConfig config;

    // Utility functions
    std::string generatePSRemoting();
    std::string generateWMIExecution();
    std::string generateScheduledTasks();
    std::string generateServiceCreation();
    std::string generateRDPHijacking();
    std::string generateSSHConnection();
    std::string generateSMBExecution();
    std::string generateWinRMExecution();
    std::string generateDCOMExecution();
    std::string generateRPCExecution();
    std::string generateRegistryPersistence();
    std::string generateGPOAbuse();
    std::string generateCredentialDumping();
    std::string generatePassTheHash();
    std::string generatePassTheTicket();
    std::string generateOverPassTheHash();
    std::string generateGoldenTicket();
    std::string generateSilverTicket();
    std::string generateEncryption();
    std::string generateAntiAnalysis();
    std::string generateEvasion();

    // Menu handlers
    void handlePSRemoting();
    void handleWMIExecution();
    void handleScheduledTasks();
    void handleServiceCreation();
    void handleRDPHijacking();
    void handleSSHConnection();
    void handleSMBExecution();
    void handleWinRMExecution();
    void handleDCOMExecution();
    void handleRPCExecution();
    void handleRegistryPersistence();
    void handleGPOAbuse();
    void handleCredentialDumping();
    void handlePassTheHash();
    void handlePassTheTicket();
    void handleOverPassTheHash();
    void handleGoldenTicket();
    void handleSilverTicket();
    void handleEncryption();
    void handleAntiAnalysis();
    void handleEvasion();
    void handleConfiguration();

public:
    LateralMovement();
    ~LateralMovement();

    // Plugin interface methods
    std::string getName() const;
    std::string getDescription() const;
    std::string getVersion() const;
    bool initialize();
    void execute();
    std::vector<std::string> getOptions() const;
    void setOption(const std::string& option, const std::string& value);

    // Lateral Movement Methods
    std::string createPSRemoting(const std::string& target, const std::string& command);
    std::string createWMIExecution(const std::string& target, const std::string& command);
    std::string createScheduledTasks(const std::string& target, const std::string& command);
    std::string createServiceCreation(const std::string& target, const std::string& service);
    std::string createRDPHijacking(const std::string& target, const std::string& session);
    std::string createSSHConnection(const std::string& target, const std::string& credentials);
    std::string createSMBExecution(const std::string& target, const std::string& share);
    std::string createWinRMExecution(const std::string& target, const std::string& command);
    std::string createDCOMExecution(const std::string& target, const std::string& object);
    std::string createRPCExecution(const std::string& target, const std::string& interface);
    std::string createRegistryPersistence(const std::string& target, const std::string& key);
    std::string createGPOAbuse(const std::string& domain, const std::string& policy);
    std::string createCredentialDumping(const std::string& target, const std::string& method);
    std::string createPassTheHash(const std::string& target, const std::string& hash);
    std::string createPassTheTicket(const std::string& target, const std::string& ticket);
    std::string createOverPassTheHash(const std::string& target, const std::string& hash);
    std::string createGoldenTicket(const std::string& domain, const std::string& krbtgt);
    std::string createSilverTicket(const std::string& service, const std::string& hash);
    std::string addEncryption(const std::string& code, const std::string& key);
    std::string addAntiAnalysis(const std::string& code);
    std::string addEvasion(const std::string& code);

    // Configuration methods
    void setUsePSRemoting(bool use);
    void setUseWMIExecution(bool use);
    void setUseScheduledTasks(bool use);
    void setUseServiceCreation(bool use);
    void setUseRDPHijacking(bool use);
    void setUseSSHConnection(bool use);
    void setUseSMBExecution(bool use);
    void setUseWinRMExecution(bool use);
    void setUseDCOMExecution(bool use);
    void setUseRPCExecution(bool use);
    void setUseRegistryPersistence(bool use);
    void setUseGPOAbuse(bool use);
    void setUseCredentialDumping(bool use);
    void setUsePassTheHash(bool use);
    void setUsePassTheTicket(bool use);
    void setUseOverPassTheHash(bool use);
    void setUseGoldenTicket(bool use);
    void setUseSilverTicket(bool use);
    void setUseEncryption(bool use);
    void setUseAntiAnalysis(bool use);
    void setUseEvasion(bool use);

    // Menu interface
    void showMenu();
};
