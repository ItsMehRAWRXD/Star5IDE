#pragma once
#include <string>
#include <vector>

// Configuration structure for shell generation
struct ShellGeneratorConfig {
    bool useReverseShells;
    bool useBindShells;
    bool useEncryptedShells;
    bool useWebShells;
    bool useDNSShells;
    bool useICMPShells;
    bool useHTTPShells;
    bool useSSHShells;
    bool useSMTPShells;
    bool useFTPShells;
    bool useSMBShells;
    bool useRDPShells;
    bool useVNCShells;
    bool useCustomProtocols;
    bool addAntiAnalysis;
    bool addEncryption;
    bool addObfuscation;
    bool addPersistence;
    bool addEvasion;
};

// Shell Generator Plugin Interface
class ShellGenerator {
private:
    ShellGeneratorConfig config;

    // Utility functions
    std::string generateReverseShell();
    std::string generateBindShell();
    std::string generateEncryptedShell();
    std::string generateWebShell();
    std::string generateDNSShell();
    std::string generateICMPShell();
    std::string generateHTTPShell();
    std::string generateSSHShell();
    std::string generateSMTPShell();
    std::string generateFTPShell();
    std::string generateSMBShell();
    std::string generateRDPShell();
    std::string generateVNCShell();
    std::string generateCustomProtocol();
    std::string generateAntiAnalysis();
    std::string generateEncryption();
    std::string generateObfuscation();
    std::string generatePersistence();
    std::string generateEvasion();

    // Menu handlers
    void handleReverseShell();
    void handleBindShell();
    void handleEncryptedShell();
    void handleWebShell();
    void handleDNSShell();
    void handleICMPShell();
    void handleHTTPShell();
    void handleSSHShell();
    void handleSMTPShell();
    void handleFTPShell();
    void handleSMBShell();
    void handleRDPShell();
    void handleVNCShell();
    void handleCustomProtocol();
    void handleAntiAnalysis();
    void handleEncryption();
    void handleObfuscation();
    void handlePersistence();
    void handleEvasion();
    void handleConfiguration();

public:
    ShellGenerator();
    ~ShellGenerator();

    // Plugin interface methods
    std::string getName() const;
    std::string getDescription() const;
    std::string getVersion() const;
    bool initialize();
    void execute();
    std::vector<std::string> getOptions() const;
    void setOption(const std::string& option, const std::string& value);

    // Shell Generation Methods
    std::string createReverseShell(const std::string& protocol, const std::string& host, int port);
    std::string createBindShell(const std::string& protocol, int port);
    std::string createEncryptedShell(const std::string& protocol, const std::string& key);
    std::string createWebShell(const std::string& language, const std::string& path);
    std::string createDNSShell(const std::string& domain);
    std::string createICMPShell(const std::string& target);
    std::string createHTTPShell(const std::string& url);
    std::string createSSHShell(const std::string& host, int port, const std::string& credentials);
    std::string createSMTPShell(const std::string& server, const std::string& credentials);
    std::string createFTPShell(const std::string& server, const std::string& credentials);
    std::string createSMBShell(const std::string& share, const std::string& credentials);
    std::string createRDPShell(const std::string& host, const std::string& credentials);
    std::string createVNCShell(const std::string& host, int port, const std::string& password);
    std::string createCustomProtocol(const std::string& protocol, const std::string& config);
    std::string addAntiAnalysis(const std::string& shell);
    std::string addEncryption(const std::string& shell, const std::string& key);
    std::string addObfuscation(const std::string& shell);
    std::string addPersistence(const std::string& shell);
    std::string addEvasion(const std::string& shell);

    // Configuration methods
    void setUseReverseShells(bool use);
    void setUseBindShells(bool use);
    void setUseEncryptedShells(bool use);
    void setUseWebShells(bool use);
    void setUseDNSShells(bool use);
    void setUseICMPShells(bool use);
    void setUseHTTPShells(bool use);
    void setUseSSHShells(bool use);
    void setUseSMTPShells(bool use);
    void setUseFTPShells(bool use);
    void setUseSMBShells(bool use);
    void setUseRDPShells(bool use);
    void setUseVNCShells(bool use);
    void setUseCustomProtocols(bool use);
    void setAddAntiAnalysis(bool add);
    void setAddEncryption(bool add);
    void setAddObfuscation(bool add);
    void setAddPersistence(bool add);
    void setAddEvasion(bool add);

    // Menu interface
    void showMenu();
};
