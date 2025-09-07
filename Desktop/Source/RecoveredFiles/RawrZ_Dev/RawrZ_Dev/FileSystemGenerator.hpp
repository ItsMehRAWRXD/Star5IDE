#pragma once

#include <string>
#include <vector>
#include <fstream>
#include <map>
#include <memory>
#include <filesystem>
#include <windows.h>
#include <wincrypt.h>
#include <shellapi.h>

struct Config {
    std::string outputPath;
    std::string pathPrefix = "path_";
    std::vector<uint8_t> encryptedData;
    std::vector<uint8_t> key;
    std::vector<uint8_t> iv;
    std::string iconPath;
    std::map<std::string, std::string> versionInfo;
    bool generateStandalone = true;
    bool injectIntoExisting = false;
    std::string templatePath; // Path to template executable
};

class FileSystemGenerator {
public:
    // Main generation methods
    static bool GenerateExecutable(Config& config, std::string* error);
    static bool InjectDataIntoFile(const std::string& filePath, const Config& config, std::string* error);
    static bool CreateStubFile(const Config& config, std::string* error);
    
    // Utility methods
    static std::string BuildFullPath(const Config& config);
    static bool ValidateConfig(const Config& config, std::string* error);
    
    // Encryption/Decryption helpers
    static std::vector<uint8_t> EncryptData(const std::vector<uint8_t>& data, 
                                           const std::vector<uint8_t>& key, 
                                           const std::vector<uint8_t>& iv);
    static std::vector<uint8_t> DecryptData(const std::vector<uint8_t>& encryptedData, 
                                           const std::vector<uint8_t>& key, 
                                           const std::vector<uint8_t>& iv);

private:
    // PE manipulation methods
    static bool CreateMinimalPE(const std::string& outputPath, std::string* error);
    static bool WriteResourceToPE(const std::string& filePath, const std::vector<uint8_t>& data, 
                                 const std::vector<uint8_t>& key, const std::vector<uint8_t>& iv, 
                                 std::string* error);
    static bool CopyTemplateExecutable(const std::string& templatePath, const std::string& outputPath, 
                                      std::string* error);
    
    // Metadata methods
    static bool ExtractMetadata(const std::string& inputExe, std::string& iconPath, 
                               std::map<std::string, std::string>& versionInfo);
    static bool SetFileIcon(const std::string& filePath, const std::string& iconPath, std::string* error);
    static bool SetVersionInfo(const std::string& filePath, const std::map<std::string, std::string>& versionInfo, 
                              std::string* error);
    
    // Helper methods
    static bool FileExists(const std::string& path);
    static std::vector<uint8_t> ReadFileToBytes(const std::string& filePath);
    static bool WriteBytesToFile(const std::string& filePath, const std::vector<uint8_t>& data);
    static std::string GenerateRandomKey(size_t length);
    static std::string GenerateRandomIV(size_t length);
};
