/**
 * Pure Native EXE Stub Attacher
 * Attaches stub functionality to existing .exe files
 * No .NET dependencies - pure Win32 API
 */

#include <windows.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <random>
#include <chrono>
#include <map>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <direct.h>
#include <shlwapi.h>
#include <tlhelp32.h>
#include <psapi.h>
#include <winternl.h>
#include <imagehlp.h>

#pragma comment(lib, "advapi32.lib")
#pragma comment(lib, "version.lib")
#pragma comment(lib, "shlwapi.lib")
#pragma comment(lib, "psapi.lib")
#pragma comment(lib, "ntdll.lib")
#pragma comment(lib, "imagehlp.lib")

// Stub types that can be attached
enum class StubType {
    ANTI_DEBUG,
    ANTI_VM,
    LICENSE_CHECK,
    SELF_DESTRUCT,
    ENCRYPTED_PAYLOAD,
    CUSTOM_LOADER,
    UPDATE_MECHANISM,
    TELEMETRY_BLOCKER
};

// Stub configuration
struct StubAttachmentConfig {
    std::string targetExePath;      // Path to target .exe file
    std::string outputExePath;      // Path for modified .exe
    StubType stubType;              // Type of stub to attach
    bool preserveOriginal;           // Keep original file
    bool encryptStub;               // Encrypt the stub code
    std::vector<uint8_t> encryptionKey; // Encryption key for stub
    std::string customStubCode;     // Custom stub code if needed
    bool addResourceSection;        // Add stub as resource
    bool injectCodeSection;         // Inject stub into code section
    bool modifyEntryPoint;          // Modify entry point to run stub first
};

class EXEStubAttacher {
private:
    // PE file manipulation
    static bool IsValidPE(const std::string& filePath);
    static bool BackupOriginalFile(const std::string& originalPath);
    static bool ReadPEFile(const std::string& filePath, std::vector<uint8_t>& data);
    static bool WritePEFile(const std::string& filePath, const std::vector<uint8_t>& data);
    
    // Stub generation
    static std::vector<uint8_t> GenerateAntiDebugStub();
    static std::vector<uint8_t> GenerateAntiVMStub();
    static std::vector<uint8_t> GenerateLicenseCheckStub();
    static std::vector<uint8_t> GenerateSelfDestructStub();
    static std::vector<uint8_t> GenerateEncryptedPayloadStub();
    static std::vector<uint8_t> GenerateCustomLoaderStub();
    static std::vector<uint8_t> GenerateUpdateMechanismStub();
    static std::vector<uint8_t> GenerateTelemetryBlockerStub();
    
    // PE modification
    static bool InjectStubAsResource(const std::vector<uint8_t>& exeData, 
                                   const std::vector<uint8_t>& stubData, 
                                   std::vector<uint8_t>& modifiedData);
    static bool InjectStubAsCodeSection(const std::vector<uint8_t>& exeData, 
                                      const std::vector<uint8_t>& stubData, 
                                      std::vector<uint8_t>& modifiedData);
    static bool ModifyEntryPoint(std::vector<uint8_t>& exeData, 
                               const std::vector<uint8_t>& stubData);
    
    // Encryption utilities
    static std::vector<uint8_t> EncryptStub(const std::vector<uint8_t>& stubData, 
                                           const std::vector<uint8_t>& key);
    static std::vector<uint8_t> GenerateRandomKey(size_t length);
    
    // Utility functions
    static std::string GetStubTypeName(StubType type);
    static void LogMessage(const std::string& message);
    static bool CreateDirectoryIfNotExists(const std::string& path);

public:
    static bool AttachStubToExe(const StubAttachmentConfig& config);
    static bool BatchAttachStubs(const std::vector<std::string>& exePaths, 
                                const StubAttachmentConfig& baseConfig);
    static void PrintUsage();
    static void ListSupportedStubTypes();
};

// Implementation of stub generation methods
std::vector<uint8_t> EXEStubAttacher::GenerateAntiDebugStub() {
    std::vector<uint8_t> stub;
    
    // Anti-debug stub assembly (x86)
    uint8_t antiDebugCode[] = {
        0x64, 0xA1, 0x30, 0x00, 0x00, 0x00,  // mov eax, fs:[0x30]
        0x8B, 0x40, 0x02,                      // mov eax, [eax+0x02]
        0x84, 0xC0,                            // test al, al
        0x75, 0x05,                            // jnz detected
        0xE9, 0x00, 0x00, 0x00, 0x00,          // jmp continue (placeholder)
        0xE8, 0x00, 0x00, 0x00, 0x00,          // call exit
        0x90, 0x90, 0x90, 0x90, 0x90           // nops for alignment
    };
    
    stub.assign(antiDebugCode, antiDebugCode + sizeof(antiDebugCode));
    return stub;
}

std::vector<uint8_t> EXEStubAttacher::GenerateAntiVMStub() {
    std::vector<uint8_t> stub;
    
    // Anti-VM stub assembly
    uint8_t antiVMCode[] = {
        0x31, 0xC0,                            // xor eax, eax
        0x64, 0x8B, 0x40, 0x30,                // mov eax, fs:[0x30]
        0x8B, 0x40, 0x0C,                      // mov eax, [eax+0x0C]
        0x8B, 0x70, 0x14,                      // mov esi, [eax+0x14]
        0xAD,                                   // lodsd
        0x96,                                   // xchg eax, esi
        0xAD,                                   // lodsd
        0x8B, 0x58, 0x10,                      // mov ebx, [eax+0x10]
        0x81, 0xFB, 0x00, 0x00, 0x00, 0x00,   // cmp ebx, 0 (placeholder)
        0x75, 0x05,                            // jnz detected
        0xE9, 0x00, 0x00, 0x00, 0x00,          // jmp continue
        0xE8, 0x00, 0x00, 0x00, 0x00,          // call exit
        0x90, 0x90, 0x90                       // nops
    };
    
    stub.assign(antiVMCode, antiVMCode + sizeof(antiVMCode));
    return stub;
}

std::vector<uint8_t> EXEStubAttacher::GenerateLicenseCheckStub() {
    std::vector<uint8_t> stub;
    
    // License check stub
    uint8_t licenseCode[] = {
        0x68, 0x00, 0x00, 0x00, 0x00,          // push license_key
        0x68, 0x00, 0x00, 0x00, 0x00,          // push license_server
        0xE8, 0x00, 0x00, 0x00, 0x00,          // call validate_license
        0x85, 0xC0,                            // test eax, eax
        0x75, 0x05,                            // jnz valid
        0xE8, 0x00, 0x00, 0x00, 0x00,          // call show_error
        0xE9, 0x00, 0x00, 0x00, 0x00,          // jmp continue
        0x90, 0x90, 0x90, 0x90                 // nops
    };
    
    stub.assign(licenseCode, licenseCode + sizeof(licenseCode));
    return stub;
}

std::vector<uint8_t> EXEStubAttacher::GenerateSelfDestructStub() {
    std::vector<uint8_t> stub;
    
    // Self-destruct stub
    uint8_t selfDestructCode[] = {
        0x68, 0x00, 0x00, 0x00, 0x00,          // push filename
        0xE8, 0x00, 0x00, 0x00, 0x00,          // call DeleteFileA
        0x68, 0x00, 0x00, 0x00, 0x00,          // push exit_code
        0xE8, 0x00, 0x00, 0x00, 0x00,          // call ExitProcess
        0x90, 0x90, 0x90, 0x90, 0x90           // nops
    };
    
    stub.assign(selfDestructCode, selfDestructCode + sizeof(selfDestructCode));
    return stub;
}

std::vector<uint8_t> EXEStubAttacher::GenerateEncryptedPayloadStub() {
    std::vector<uint8_t> stub;
    
    // Encrypted payload loader stub
    uint8_t encryptedLoaderCode[] = {
        0x60,                                   // pushad
        0x9C,                                   // pushfd
        0x68, 0x00, 0x00, 0x00, 0x00,          // push key
        0x68, 0x00, 0x00, 0x00, 0x00,          // push iv
        0x68, 0x00, 0x00, 0x00, 0x00,          // push encrypted_data
        0xE8, 0x00, 0x00, 0x00, 0x00,          // call decrypt
        0x9D,                                   // popfd
        0x61,                                   // popad
        0xE9, 0x00, 0x00, 0x00, 0x00,          // jmp original_entry
        0x90, 0x90, 0x90                       // nops
    };
    
    stub.assign(encryptedLoaderCode, encryptedLoaderCode + sizeof(encryptedLoaderCode));
    return stub;
}

std::vector<uint8_t> EXEStubAttacher::GenerateCustomLoaderStub() {
    std::vector<uint8_t> stub;
    
    // Custom loader stub
    uint8_t customLoaderCode[] = {
        0x60,                                   // pushad
        0x9C,                                   // pushfd
        0xE8, 0x00, 0x00, 0x00, 0x00,          // call custom_init
        0x85, 0xC0,                            // test eax, eax
        0x74, 0x05,                            // jz skip
        0xE8, 0x00, 0x00, 0x00, 0x00,          // call custom_function
        0x9D,                                   // popfd
        0x61,                                   // popad
        0xE9, 0x00, 0x00, 0x00, 0x00,          // jmp original_entry
        0x90, 0x90, 0x90, 0x90                 // nops
    };
    
    stub.assign(customLoaderCode, customLoaderCode + sizeof(customLoaderCode));
    return stub;
}

std::vector<uint8_t> EXEStubAttacher::GenerateUpdateMechanismStub() {
    std::vector<uint8_t> stub;
    
    // Update mechanism stub
    uint8_t updateCode[] = {
        0x68, 0x00, 0x00, 0x00, 0x00,          // push update_url
        0x68, 0x00, 0x00, 0x00, 0x00,          // push current_version
        0xE8, 0x00, 0x00, 0x00, 0x00,          // call check_update
        0x85, 0xC0,                            // test eax, eax
        0x74, 0x0A,                            // jz no_update
        0xE8, 0x00, 0x00, 0x00, 0x00,          // call download_update
        0xE8, 0x00, 0x00, 0x00, 0x00,          // call apply_update
        0xE9, 0x00, 0x00, 0x00, 0x00,          // jmp continue
        0x90, 0x90, 0x90                       // nops
    };
    
    stub.assign(updateCode, updateCode + sizeof(updateCode));
    return stub;
}

std::vector<uint8_t> EXEStubAttacher::GenerateTelemetryBlockerStub() {
    std::vector<uint8_t> stub;
    
    // Telemetry blocker stub
    uint8_t telemetryCode[] = {
        0x68, 0x00, 0x00, 0x00, 0x00,          // push telemetry_url
        0xE8, 0x00, 0x00, 0x00, 0x00,          // call block_telemetry
        0x68, 0x00, 0x00, 0x00, 0x00,          // push analytics_url
        0xE8, 0x00, 0x00, 0x00, 0x00,          // call block_analytics
        0xE9, 0x00, 0x00, 0x00, 0x00,          // jmp continue
        0x90, 0x90, 0x90, 0x90, 0x90           // nops
    };
    
    stub.assign(telemetryCode, telemetryCode + sizeof(telemetryCode));
    return stub;
}

// Main stub attachment method
bool EXEStubAttacher::AttachStubToExe(const StubAttachmentConfig& config) {
    LogMessage("Starting stub attachment process...");
    
    // Validate target file
    if (!IsValidPE(config.targetExePath)) {
        LogMessage("Error: Target file is not a valid PE executable");
        return false;
    }
    
    // Backup original if requested
    if (config.preserveOriginal) {
        if (!BackupOriginalFile(config.targetExePath)) {
            LogMessage("Error: Failed to backup original file");
            return false;
        }
    }
    
    // Read the target executable
    std::vector<uint8_t> exeData;
    if (!ReadPEFile(config.targetExePath, exeData)) {
        LogMessage("Error: Failed to read target executable");
        return false;
    }
    
    // Generate stub based on type
    std::vector<uint8_t> stubData;
    switch (config.stubType) {
        case StubType::ANTI_DEBUG:
            stubData = GenerateAntiDebugStub();
            break;
        case StubType::ANTI_VM:
            stubData = GenerateAntiVMStub();
            break;
        case StubType::LICENSE_CHECK:
            stubData = GenerateLicenseCheckStub();
            break;
        case StubType::SELF_DESTRUCT:
            stubData = GenerateSelfDestructStub();
            break;
        case StubType::ENCRYPTED_PAYLOAD:
            stubData = GenerateEncryptedPayloadStub();
            break;
        case StubType::CUSTOM_LOADER:
            stubData = GenerateCustomLoaderStub();
            break;
        case StubType::UPDATE_MECHANISM:
            stubData = GenerateUpdateMechanismStub();
            break;
        case StubType::TELEMETRY_BLOCKER:
            stubData = GenerateTelemetryBlockerStub();
            break;
    }
    
    // Encrypt stub if requested
    if (config.encryptStub) {
        if (config.encryptionKey.empty()) {
            config.encryptionKey = GenerateRandomKey(32);
        }
        stubData = EncryptStub(stubData, config.encryptionKey);
    }
    
    // Modify the executable
    std::vector<uint8_t> modifiedData;
    bool success = false;
    
    if (config.addResourceSection) {
        success = InjectStubAsResource(exeData, stubData, modifiedData);
    } else if (config.injectCodeSection) {
        success = InjectStubAsCodeSection(exeData, stubData, modifiedData);
    } else {
        // Default: inject as resource
        success = InjectStubAsResource(exeData, stubData, modifiedData);
    }
    
    if (!success) {
        LogMessage("Error: Failed to inject stub into executable");
        return false;
    }
    
    // Modify entry point if requested
    if (config.modifyEntryPoint) {
        if (!ModifyEntryPoint(modifiedData, stubData)) {
            LogMessage("Warning: Failed to modify entry point");
        }
    }
    
    // Write the modified executable
    if (!WritePEFile(config.outputExePath, modifiedData)) {
        LogMessage("Error: Failed to write modified executable");
        return false;
    }
    
    LogMessage("Stub attachment completed successfully!");
    LogMessage("Output file: " + config.outputExePath);
    
    return true;
}

// Utility methods
std::string EXEStubAttacher::GetStubTypeName(StubType type) {
    switch (type) {
        case StubType::ANTI_DEBUG: return "Anti-Debug";
        case StubType::ANTI_VM: return "Anti-VM";
        case StubType::LICENSE_CHECK: return "License Check";
        case StubType::SELF_DESTRUCT: return "Self-Destruct";
        case StubType::ENCRYPTED_PAYLOAD: return "Encrypted Payload";
        case StubType::CUSTOM_LOADER: return "Custom Loader";
        case StubType::UPDATE_MECHANISM: return "Update Mechanism";
        case StubType::TELEMETRY_BLOCKER: return "Telemetry Blocker";
        default: return "Unknown";
    }
}

void EXEStubAttacher::LogMessage(const std::string& message) {
    std::cout << "[EXE Stub Attacher] " << message << std::endl;
}

void EXEStubAttacher::ListSupportedStubTypes() {
    std::cout << "\nSupported Stub Types:" << std::endl;
    std::cout << "1. Anti-Debug - Detects debuggers and analysis tools" << std::endl;
    std::cout << "2. Anti-VM - Detects virtual machines and sandboxes" << std::endl;
    std::cout << "3. License Check - Validates software licenses" << std::endl;
    std::cout << "4. Self-Destruct - Removes file after execution" << std::endl;
    std::cout << "5. Encrypted Payload - Loads encrypted data" << std::endl;
    std::cout << "6. Custom Loader - Executes custom initialization code" << std::endl;
    std::cout << "7. Update Mechanism - Checks for and applies updates" << std::endl;
    std::cout << "8. Telemetry Blocker - Blocks analytics and telemetry" << std::endl;
}

void EXEStubAttacher::PrintUsage() {
    std::cout << "\nEXE Stub Attacher - Pure Native Implementation" << std::endl;
    std::cout << "Usage: exe_stub_attacher.exe <target_exe> <output_exe> <stub_type> [options]" << std::endl;
    std::cout << "\nStub Types:" << std::endl;
    std::cout << "  anti-debug, anti-vm, license, self-destruct, encrypted, custom, update, telemetry" << std::endl;
    std::cout << "\nOptions:" << std::endl;
    std::cout << "  --encrypt          Encrypt the stub code" << std::endl;
    std::cout << "  --resource         Inject stub as resource section" << std::endl;
    std::cout << "  --code-section     Inject stub into code section" << std::endl;
    std::cout << "  --modify-entry     Modify entry point to run stub first" << std::endl;
    std::cout << "  --preserve         Keep original file" << std::endl;
    std::cout << "\nExamples:" << std::endl;
    std::cout << "  exe_stub_attacher.exe target.exe protected.exe anti-debug --encrypt" << std::endl;
    std::cout << "  exe_stub_attacher.exe app.exe secure.exe license --resource --modify-entry" << std::endl;
}

// Main function
int main(int argc, char* argv[]) {
    if (argc < 4) {
        EXEStubAttacher::PrintUsage();
        return 1;
    }
    
    std::string targetExe = argv[1];
    std::string outputExe = argv[2];
    std::string stubTypeStr = argv[3];
    
    // Parse stub type
    StubType stubType = StubType::ANTI_DEBUG; // default
    if (stubTypeStr == "anti-debug") stubType = StubType::ANTI_DEBUG;
    else if (stubTypeStr == "anti-vm") stubType = StubType::ANTI_VM;
    else if (stubTypeStr == "license") stubType = StubType::LICENSE_CHECK;
    else if (stubTypeStr == "self-destruct") stubType = StubType::SELF_DESTRUCT;
    else if (stubTypeStr == "encrypted") stubType = StubType::ENCRYPTED_PAYLOAD;
    else if (stubTypeStr == "custom") stubType = StubType::CUSTOM_LOADER;
    else if (stubTypeStr == "update") stubType = StubType::UPDATE_MECHANISM;
    else if (stubTypeStr == "telemetry") stubType = StubType::TELEMETRY_BLOCKER;
    
    // Parse options
    StubAttachmentConfig config;
    config.targetExePath = targetExe;
    config.outputExePath = outputExe;
    config.stubType = stubType;
    config.preserveOriginal = true;
    config.encryptStub = false;
    config.addResourceSection = true;
    config.injectCodeSection = false;
    config.modifyEntryPoint = false;
    
    for (int i = 4; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "--encrypt") config.encryptStub = true;
        else if (arg == "--resource") config.addResourceSection = true;
        else if (arg == "--code-section") config.injectCodeSection = true;
        else if (arg == "--modify-entry") config.modifyEntryPoint = true;
        else if (arg == "--preserve") config.preserveOriginal = true;
    }
    
    // Execute stub attachment
    if (EXEStubAttacher::AttachStubToExe(config)) {
        std::cout << "\n✅ Stub attachment completed successfully!" << std::endl;
        return 0;
    } else {
        std::cout << "\n❌ Stub attachment failed!" << std::endl;
        return 1;
    }
}
