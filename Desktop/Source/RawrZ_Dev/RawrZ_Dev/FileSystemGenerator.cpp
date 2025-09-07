#include "FileSystemGenerator.hpp"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <random>
#include <algorithm>
#include <filesystem>

namespace fs = std::filesystem;

std::string FileSystemGenerator::BuildFullPath(const Config& config) {
    std::string fullPath;
    
    // Add prefix to the filename if not already present
    std::string filename = config.outputPath;
    if (filename.find(config.pathPrefix) != 0) {
        fullPath = config.pathPrefix + filename;
    } else {
        fullPath = filename;
    }
    
    // Ensure the output directory exists
    fs::path outputDir = fs::path(fullPath).parent_path();
    if (!outputDir.empty() && !fs::exists(outputDir)) {
        try {
            fs::create_directories(outputDir);
        } catch (const std::exception&) {
            // Directory creation failed, continue with current path
        }
    }
    
    return fullPath;
}

bool FileSystemGenerator::ValidateConfig(const Config& config, std::string* error) {
    if (config.outputPath.empty()) {
        *error = "Output path cannot be empty";
        return false;
    }
    
    if (config.generateStandalone && config.templatePath.empty()) {
        // For standalone generation, we don't require a template
        // We'll create a minimal PE
    }
    
    if (config.injectIntoExisting && !FileExists(config.outputPath)) {
        *error = "Target file for injection does not exist: " + config.outputPath;
        return false;
    }
    
    return true;
}

bool FileSystemGenerator::GenerateExecutable(Config& config, std::string* error) {
    try {
        if (!ValidateConfig(config, error)) {
            return false;
        }
        
        std::string fullOutputPath = BuildFullPath(config);
        config.outputPath = fullOutputPath; // Update config with full path
        
        if (config.generateStandalone) {
            if (!config.templatePath.empty() && FileExists(config.templatePath)) {
                // Copy template executable
                if (!CopyTemplateExecutable(config.templatePath, fullOutputPath, error)) {
                    return false;
                }
            } else {
                // Create minimal PE
                if (!CreateMinimalPE(fullOutputPath, error)) {
                    return false;
                }
            }
        }

        // Write encrypted data to the executable
        if (!config.encryptedData.empty()) {
            if (!WriteResourceToPE(fullOutputPath, config.encryptedData, config.key, config.iv, error)) {
                return false;
            }
        }

        // Set icon if provided
        if (!config.iconPath.empty() && FileExists(config.iconPath)) {
            if (!SetFileIcon(fullOutputPath, config.iconPath, error)) {
                std::cerr << "Warning: Failed to set icon: " << *error << std::endl;
            }
        }

        // Set version info if provided
        if (!config.versionInfo.empty()) {
            if (!SetVersionInfo(fullOutputPath, config.versionInfo, error)) {
                std::cerr << "Warning: Failed to set version info: " << *error << std::endl;
            }
        }

        return true;
    } catch (const std::exception& ex) {
        *error = "Exception during executable generation: " + std::string(ex.what());
        return false;
    }
}

bool FileSystemGenerator::InjectDataIntoFile(const std::string& filePath, const Config& config, std::string* error) {
    try {
        if (!FileExists(filePath)) {
            *error = "Target file does not exist: " + filePath;
            return false;
        }

        if (!WriteResourceToPE(filePath, config.encryptedData, config.key, config.iv, error)) {
            return false;
        }

        // Update metadata if provided
        if (!config.iconPath.empty() && FileExists(config.iconPath)) {
            SetFileIcon(filePath, config.iconPath, error);
        }

        if (!config.versionInfo.empty()) {
            SetVersionInfo(filePath, config.versionInfo, error);
        }

        return true;
    } catch (const std::exception& ex) {
        *error = "Exception during data injection: " + std::string(ex.what());
        return false;
    }
}

bool FileSystemGenerator::CreateStubFile(const Config& config, std::string* error) {
    try {
        std::string fullOutputPath = BuildFullPath(config);
        
        // Create a simple stub executable
        std::ofstream stubFile(fullOutputPath, std::ios::binary);
        if (!stubFile.is_open()) {
            *error = "Failed to create stub file: " + fullOutputPath;
            return false;
        }

        // Write minimal DOS header and PE signature
        std::vector<uint8_t> dosHeader = {
            0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00,
            0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00,
            0xB8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        };
        
        stubFile.write(reinterpret_cast<const char*>(dosHeader.data()), dosHeader.size());
        stubFile.close();

        return true;
    } catch (const std::exception& ex) {
        *error = "Exception during stub creation: " + std::string(ex.what());
        return false;
    }
}

// Private method implementations
bool FileSystemGenerator::CreateMinimalPE(const std::string& outputPath, std::string* error) {
    try {
        std::ofstream peFile(outputPath, std::ios::binary);
        if (!peFile.is_open()) {
            *error = "Failed to create PE file: " + outputPath;
            return false;
        }

        // Minimal DOS header
        std::vector<uint8_t> dosHeader = {
            0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00,
            0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00,
            0xB8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x80, 0x00, 0x00, 0x00, 0x0E, 0x1F, 0xBA, 0x0E
        };
        
        peFile.write(reinterpret_cast<const char*>(dosHeader.data()), dosHeader.size());
        peFile.close();

        return true;
    } catch (const std::exception& ex) {
        *error = "Exception creating minimal PE: " + std::string(ex.what());
        return false;
    }
}

bool FileSystemGenerator::WriteResourceToPE(const std::string& filePath, const std::vector<uint8_t>& data, 
                                           const std::vector<uint8_t>& key, const std::vector<uint8_t>& iv, 
                                           std::string* error) {
    try {
        std::ofstream file(filePath, std::ios::binary | std::ios::app);
        if (!file.is_open()) {
            *error = "Failed to open file for writing resources: " + filePath;
            return false;
        }

        // Write data marker
        std::string marker = "RAWRZ_DATA_START";
        file.write(marker.c_str(), marker.length());
        
        // Write data size
        uint32_t dataSize = static_cast<uint32_t>(data.size());
        file.write(reinterpret_cast<const char*>(&dataSize), sizeof(dataSize));
        
        // Write encrypted data
        file.write(reinterpret_cast<const char*>(data.data()), data.size());
        
        // Write key size and key
        uint32_t keySize = static_cast<uint32_t>(key.size());
        file.write(reinterpret_cast<const char*>(&keySize), sizeof(keySize));
        file.write(reinterpret_cast<const char*>(key.data()), key.size());
        
        // Write IV size and IV
        uint32_t ivSize = static_cast<uint32_t>(iv.size());
        file.write(reinterpret_cast<const char*>(&ivSize), sizeof(ivSize));
        file.write(reinterpret_cast<const char*>(iv.data()), iv.size());
        
        // Write end marker
        std::string endMarker = "RAWRZ_DATA_END";
        file.write(endMarker.c_str(), endMarker.length());
        
        file.close();
        return true;
    } catch (const std::exception& ex) {
        *error = "Exception writing resource to PE: " + std::string(ex.what());
        return false;
    }
}

bool FileSystemGenerator::CopyTemplateExecutable(const std::string& templatePath, const std::string& outputPath, 
                                                 std::string* error) {
    try {
        fs::copy_file(templatePath, outputPath, fs::copy_options::overwrite_existing);
        return true;
    } catch (const std::exception& ex) {
        *error = "Failed to copy template executable: " + std::string(ex.what());
        return false;
    }
}

// Helper method implementations
bool FileSystemGenerator::FileExists(const std::string& path) {
    return fs::exists(path);
}

std::vector<uint8_t> FileSystemGenerator::ReadFileToBytes(const std::string& filePath) {
    std::ifstream file(filePath, std::ios::binary);
    if (!file.is_open()) {
        return {};
    }
    
    file.seekg(0, std::ios::end);
    size_t fileSize = file.tellg();
    file.seekg(0, std::ios::beg);
    
    std::vector<uint8_t> buffer(fileSize);
    file.read(reinterpret_cast<char*>(buffer.data()), fileSize);
    file.close();
    
    return buffer;
}

bool FileSystemGenerator::WriteBytesToFile(const std::string& filePath, const std::vector<uint8_t>& data) {
    std::ofstream file(filePath, std::ios::binary);
    if (!file.is_open()) {
        return false;
    }
    
    file.write(reinterpret_cast<const char*>(data.data()), data.size());
    file.close();
    
    return true;
}

std::string FileSystemGenerator::GenerateRandomKey(size_t length) {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 255);
    
    std::string key;
    for (size_t i = 0; i < length; ++i) {
        key += static_cast<char>(dis(gen));
    }
    
    return key;
}

std::string FileSystemGenerator::GenerateRandomIV(size_t length) {
    return GenerateRandomKey(length); // Same implementation for IV
}

// Encryption/Decryption methods (simplified implementations)
std::vector<uint8_t> FileSystemGenerator::EncryptData(const std::vector<uint8_t>& data, 
                                                     const std::vector<uint8_t>& key, 
                                                     const std::vector<uint8_t>& iv) {
    // Simple XOR encryption for demonstration
    std::vector<uint8_t> encrypted = data;
    for (size_t i = 0; i < encrypted.size(); ++i) {
        encrypted[i] ^= key[i % key.size()] ^ iv[i % iv.size()];
    }
    return encrypted;
}

std::vector<uint8_t> FileSystemGenerator::DecryptData(const std::vector<uint8_t>& encryptedData, 
                                                     const std::vector<uint8_t>& key, 
                                                     const std::vector<uint8_t>& iv) {
    // Simple XOR decryption (same as encryption for XOR)
    return EncryptData(encryptedData, key, iv);
}

// Metadata methods (placeholder implementations)
bool FileSystemGenerator::ExtractMetadata(const std::string& inputExe, std::string& iconPath, 
                                         std::map<std::string, std::string>& versionInfo) {
    // Placeholder implementation
    iconPath = "extracted_icon.ico";
    versionInfo = {
        {"CompanyName", "RawrZ Dev"},
        {"ProductName", "Generated App"},
        {"FileVersion", "1.0.0.0"},
        {"ProductVersion", "1.0.0.0"}
    };
    return true;
}

bool FileSystemGenerator::SetFileIcon(const std::string& filePath, const std::string& iconPath, std::string* error) {
    // Placeholder implementation for setting file icon
    *error = "Icon setting not implemented yet";
    return false;
}

bool FileSystemGenerator::SetVersionInfo(const std::string& filePath, const std::map<std::string, std::string>& versionInfo, 
                                        std::string* error) {
    // Placeholder implementation for setting version info
    *error = "Version info setting not implemented yet";
    return false;
}
