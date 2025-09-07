#pragma once
#include <string>
#include <vector>

// Configuration structure for string encryption
struct StringEncryptorConfig {
    bool useXOREncryption;
    bool useAESEncryption;
    bool useROT13;
    bool useBase64;
    bool useHexEncoding;
    bool useCustomAlphabet;
    bool addJunkCode;
    bool addPolymorphic;
    bool addAntiDebug;
    bool addTimingChecks;
};

// String Encryptor Plugin Interface
class StringEncryptor {
private:
    StringEncryptorConfig config;

    // Utility functions
    std::string generateXOREncryption();
    std::string generateAESEncryption();
    std::string generateROT13();
    std::string generateBase64();
    std::string generateHexEncoding();
    std::string generateCustomAlphabet();
    std::string generateJunkCode();
    std::string generatePolymorphic();
    std::string generateAntiDebug();
    std::string generateTimingChecks();

    // Menu handlers
    void handleXOREncryption();
    void handleAESEncryption();
    void handleROT13();
    void handleBase64();
    void handleHexEncoding();
    void handleCustomAlphabet();
    void handleJunkCode();
    void handlePolymorphic();
    void handleAntiDebug();
    void handleTimingChecks();
    void handleConfiguration();

public:
    StringEncryptor();
    ~StringEncryptor();

    // Plugin interface methods
    std::string getName() const;
    std::string getDescription() const;
    std::string getVersion() const;
    bool initialize();
    void execute();
    std::vector<std::string> getOptions() const;
    void setOption(const std::string& option, const std::string& value);

    // String Encryption Methods
    std::string encryptWithXOR(const std::string& input, const std::string& key);
    std::string encryptWithAES(const std::string& input, const std::string& key);
    std::string encryptWithROT13(const std::string& input);
    std::string encryptWithBase64(const std::string& input);
    std::string encryptWithHex(const std::string& input);
    std::string encryptWithCustomAlphabet(const std::string& input, const std::string& alphabet);
    std::string addJunkCode(const std::string& input);
    std::string addPolymorphic(const std::string& input);
    std::string addAntiDebug(const std::string& input);
    std::string addTimingChecks(const std::string& input);

    // Configuration methods
    void setUseXOREncryption(bool use);
    void setUseAESEncryption(bool use);
    void setUseROT13(bool use);
    void setUseBase64(bool use);
    void setUseHexEncoding(bool use);
    void setUseCustomAlphabet(bool use);
    void setAddJunkCode(bool add);
    void setAddPolymorphic(bool add);
    void setAddAntiDebug(bool add);
    void setAddTimingChecks(bool add);

    // Menu interface
    void showMenu();
};
