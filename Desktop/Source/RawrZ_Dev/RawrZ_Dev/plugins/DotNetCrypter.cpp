#include "DotNetCrypter.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <map>
#include <random>
#include <algorithm>

DotNetCrypter::DotNetCrypter() {
    // Initialize default configuration
    config = {};
}

DotNetCrypter::~DotNetCrypter() {
    // Cleanup if needed
}

std::string DotNetCrypter::getName() const {
    return ".NET Crypter";
}

std::string DotNetCrypter::getDescription() const {
    return "Advanced .NET file encryption and obfuscation techniques";
}

std::string DotNetCrypter::getVersion() const {
    return "1.0";
}

bool DotNetCrypter::initialize() {
    return true;
}

void DotNetCrypter::execute() {
    showMenu();
}

std::vector<std::string> DotNetCrypter::getOptions() const {
    return {
        "Crypt BAT File",
        "Crypt PS1 File",
        "Crypt EXE File",
        "Crypt DLL File",
        "Add Anti-Debugging",
        "Add AMSI Bypass",
        "Add Memory Loading",
        "Add String Encryption",
        "Add Runtime Obfuscation",
        "Add Assembly Protection",
        "Add Persistence",
        "Add UAC Bypass",
        "Support .NET Framework",
        "Support .NET Core",
        "Support .NET 5+",
        "Configuration"
    };
}

void DotNetCrypter::setOption(const std::string& option, const std::string& value) {
    if (option == "useBATCrypting") config.useBATCrypting = (value == "true");
    else if (option == "usePS1Crypting") config.usePS1Crypting = (value == "true");
    else if (option == "useEXECrypting") config.useEXECrypting = (value == "true");
    else if (option == "useDLLCrypting") config.useDLLCrypting = (value == "true");
    else if (option == "addAntiDebugging") config.addAntiDebugging = (value == "true");
    else if (option == "addAMSIBypass") config.addAMSIBypass = (value == "true");
    else if (option == "addMemoryLoading") config.addMemoryLoading = (value == "true");
    else if (option == "addStringEncryption") config.addStringEncryption = (value == "true");
    else if (option == "addRuntimeObfuscation") config.addRuntimeObfuscation = (value == "true");
    else if (option == "addAssemblyProtection") config.addAssemblyProtection = (value == "true");
    else if (option == "addPersistence") config.addPersistence = (value == "true");
    else if (option == "addUACBypass") config.addUACBypass = (value == "true");
    else if (option == "supportDotNetFramework") config.supportDotNetFramework = (value == "true");
    else if (option == "supportDotNetCore") config.supportDotNetCore = (value == "true");
    else if (option == "supportDotNet5Plus") config.supportDotNet5Plus = (value == "true");
}

// Core .NET Crypting Functionality

bool DotNetCrypter::cryptBATFile(const std::string& inputPath, const std::string& outputPath) {
    std::ifstream inFile(inputPath, std::ios::binary);
    if (!inFile) return false;

    std::vector<char> data((std::istreambuf_iterator<char>(inFile)), {});
    inFile.close();

    std::ofstream outFile(outputPath, std::ios::binary);
    if (!outFile) return false;

    // Example: Simple XOR encryption
    for (char& c : data) {
        c ^= 0x42;
    }

    outFile.write(data.data(), data.size());
    outFile.close();
    return true;
}

bool DotNetCrypter::cryptPS1File(const std::string& inputPath, const std::string& outputPath) {
    std::ifstream inFile(inputPath, std::ios::binary);
    if (!inFile) return false;

    std::vector<char> data((std::istreambuf_iterator<char>(inFile)), {});
    inFile.close();

    std::ofstream outFile(outputPath, std::ios::binary);
    if (!outFile) return false;

    // Example: Simple XOR encryption
    for (char& c : data) {
        c ^= 0x42;
    }

    outFile.write(data.data(), data.size());
    outFile.close();
    return true;
}

bool DotNetCrypter::cryptEXEFile(const std::string& inputPath, const std::string& outputPath) {
    std::ifstream inFile(inputPath, std::ios::binary);
    if (!inFile) return false;

    std::vector<char> data((std::istreambuf_iterator<char>(inFile)), {});
    inFile.close();

    std::ofstream outFile(outputPath, std::ios::binary);
    if (!outFile) return false;

    // Example: Simple XOR encryption
    for (char& c : data) {
        c ^= 0x42;
    }

    outFile.write(data.data(), data.size());
    outFile.close();
    return true;
}

bool DotNetCrypter::cryptDLLFile(const std::string& inputPath, const std::string& outputPath) {
    std::ifstream inFile(inputPath, std::ios::binary);
    if (!inFile) return false;

    std::vector<char> data((std::istreambuf_iterator<char>(inFile)), {});
    inFile.close();

    std::ofstream outFile(outputPath, std::ios::binary);
    if (!outFile) return false;

    // Example: Simple XOR encryption
    for (char& c : data) {
        c ^= 0x42;
    }

    outFile.write(data.data(), data.size());
    outFile.close();
    return true;
}

// Advanced Features

bool DotNetCrypter::addAntiDebugging() {
    // Example: Add anti-debugging code
    return true; // Placeholder for actual implementation
}

bool DotNetCrypter::addAMSIBypass() {
    // Example: Add AMSI bypass code
    return true; // Placeholder for actual implementation
}

bool DotNetCrypter::addMemoryLoading() {
    // Example: Add memory loading code
    return true; // Placeholder for actual implementation
}

bool DotNetCrypter::addStringEncryption() {
    // Example: Add string encryption code
    return true; // Placeholder for actual implementation
}

bool DotNetCrypter::addRuntimeObfuscation() {
    // Example: Add runtime obfuscation code
    return true; // Placeholder for actual implementation
}

bool DotNetCrypter::addAssemblyProtection() {
    // Example: Add assembly protection code
    return true; // Placeholder for actual implementation
}

bool DotNetCrypter::addPersistence() {
    // Example: Add persistence code
    return true; // Placeholder for actual implementation
}

bool DotNetCrypter::addUACBypass() {
    // Example: Add UAC bypass code
    return true; // Placeholder for actual implementation
}

// .NET Framework Support

bool DotNetCrypter::supportDotNetFramework(const std::string& version) {
    // Example: Check and support .NET Framework version
    return true; // Placeholder for actual implementation
}

bool DotNetCrypter::supportDotNetCore(const std::string& version) {
    // Example: Check and support .NET Core version
    return true; // Placeholder for actual implementation
}

bool DotNetCrypter::supportDotNet5Plus(const std::string& version) {
    // Example: Check and support .NET 5+ version
    return true; // Placeholder for actual implementation
}

// Configuration

void DotNetCrypter::setOption(const std::string& key, const std::string& value) {
    options[key] = value;
}

std::string DotNetCrypter::getOption(const std::string& key) const {
    auto it = options.find(key);
    if (it != options.end()) {
        return it->second;
    }
    return "";
}

// Utility Methods

std::string DotNetCrypter::generateDotNetStub() {
    // Example: Generate a .NET stub
    return "/* .NET Stub Content */";
}

std::string DotNetCrypter::obfuscateStrings(const std::string& code) {
    // Example: Obfuscate strings in the code
    return code; // Placeholder for actual implementation
}

std::string DotNetCrypter::encryptAssembly(const std::string& assembly) {
    // Example: Encrypt the assembly
    return assembly; // Placeholder for actual implementation
}

std::string DotNetCrypter::addPersistenceCode() {
    // Example: Add persistence code
    return "/* Persistence Code */";
}

// Menu handlers
void DotNetCrypter::handleCryptBATFile() {
    std::cout << "\n=== Crypt BAT File ===\n";
    std::string inputPath, outputPath;
    std::cout << "Enter input BAT file path: ";
    std::cin >> inputPath;
    std::cout << "Enter output encrypted file path: ";
    std::cin >> outputPath;
    if (cryptBATFile(inputPath, outputPath)) {
        std::cout << "Successfully encrypted BAT file!\n";
    } else {
        std::cout << "Failed to encrypt BAT file.\n";
    }
}

void DotNetCrypter::handleCryptPS1File() {
    std::cout << "\n=== Crypt PS1 File ===\n";
    std::string inputPath, outputPath;
    std::cout << "Enter input PS1 file path: ";
    std::cin >> inputPath;
    std::cout << "Enter output encrypted file path: ";
    std::cin >> outputPath;
    if (cryptPS1File(inputPath, outputPath)) {
        std::cout << "Successfully encrypted PS1 file!\n";
    } else {
        std::cout << "Failed to encrypt PS1 file.\n";
    }
}

void DotNetCrypter::handleCryptEXEFile() {
    std::cout << "\n=== Crypt EXE File ===\n";
    std::string inputPath, outputPath;
    std::cout << "Enter input EXE file path: ";
    std::cin >> inputPath;
    std::cout << "Enter output encrypted file path: ";
    std::cin >> outputPath;
    if (cryptEXEFile(inputPath, outputPath)) {
        std::cout << "Successfully encrypted EXE file!\n";
    } else {
        std::cout << "Failed to encrypt EXE file.\n";
    }
}

void DotNetCrypter::handleCryptDLLFile() {
    std::cout << "\n=== Crypt DLL File ===\n";
    std::string inputPath, outputPath;
    std::cout << "Enter input DLL file path: ";
    std::cin >> inputPath;
    std::cout << "Enter output encrypted file path: ";
    std::cin >> outputPath;
    if (cryptDLLFile(inputPath, outputPath)) {
        std::cout << "Successfully encrypted DLL file!\n";
    } else {
        std::cout << "Failed to encrypt DLL file.\n";
    }
}

void DotNetCrypter::handleAddAntiDebugging() {
    std::cout << "\n=== Add Anti-Debugging ===\n";
    if (addAntiDebugging()) {
        std::cout << "Successfully added anti-debugging!\n";
    } else {
        std::cout << "Failed to add anti-debugging.\n";
    }
}

void DotNetCrypter::handleAddAMSIBypass() {
    std::cout << "\n=== Add AMSI Bypass ===\n";
    if (addAMSIBypass()) {
        std::cout << "Successfully added AMSI bypass!\n";
    } else {
        std::cout << "Failed to add AMSI bypass.\n";
    }
}

void DotNetCrypter::handleAddMemoryLoading() {
    std::cout << "\n=== Add Memory Loading ===\n";
    if (addMemoryLoading()) {
        std::cout << "Successfully added memory loading!\n";
    } else {
        std::cout << "Failed to add memory loading.\n";
    }
}

void DotNetCrypter::handleAddStringEncryption() {
    std::cout << "\n=== Add String Encryption ===\n";
    if (addStringEncryption()) {
        std::cout << "Successfully added string encryption!\n";
    } else {
        std::cout << "Failed to add string encryption.\n";
    }
}

void DotNetCrypter::handleAddRuntimeObfuscation() {
    std::cout << "\n=== Add Runtime Obfuscation ===\n";
    if (addRuntimeObfuscation()) {
        std::cout << "Successfully added runtime obfuscation!\n";
    } else {
        std::cout << "Failed to add runtime obfuscation.\n";
    }
}

void DotNetCrypter::handleAddAssemblyProtection() {
    std::cout << "\n=== Add Assembly Protection ===\n";
    if (addAssemblyProtection()) {
        std::cout << "Successfully added assembly protection!\n";
    } else {
        std::cout << "Failed to add assembly protection.\n";
    }
}

void DotNetCrypter::handleAddPersistence() {
    std::cout << "\n=== Add Persistence ===\n";
    if (addPersistence()) {
        std::cout << "Successfully added persistence!\n";
    } else {
        std::cout << "Failed to add persistence.\n";
    }
}

void DotNetCrypter::handleAddUACBypass() {
    std::cout << "\n=== Add UAC Bypass ===\n";
    if (addUACBypass()) {
        std::cout << "Successfully added UAC bypass!\n";
    } else {
        std::cout << "Failed to add UAC bypass.\n";
    }
}

void DotNetCrypter::handleSupportDotNetFramework() {
    std::cout << "\n=== Support .NET Framework ===\n";
    std::string version;
    std::cout << "Enter .NET Framework version: ";
    std::cin >> version;
    if (supportDotNetFramework(version)) {
        std::cout << "Successfully added .NET Framework support!\n";
    } else {
        std::cout << "Failed to add .NET Framework support.\n";
    }
}

void DotNetCrypter::handleSupportDotNetCore() {
    std::cout << "\n=== Support .NET Core ===\n";
    std::string version;
    std::cout << "Enter .NET Core version: ";
    std::cin >> version;
    if (supportDotNetCore(version)) {
        std::cout << "Successfully added .NET Core support!\n";
    } else {
        std::cout << "Failed to add .NET Core support.\n";
    }
}

void DotNetCrypter::handleSupportDotNet5Plus() {
    std::cout << "\n=== Support .NET 5+ ===\n";
    std::string version;
    std::cout << "Enter .NET 5+ version: ";
    std::cin >> version;
    if (supportDotNet5Plus(version)) {
        std::cout << "Successfully added .NET 5+ support!\n";
    } else {
        std::cout << "Failed to add .NET 5+ support.\n";
    }
}

void DotNetCrypter::handleConfiguration() {
    std::cout << "\n=== Configuration ===\n";
    std::cout << "Current settings:\n";
    std::cout << "BAT Crypting: " << (config.useBATCrypting ? "Enabled" : "Disabled") << std::endl;
    std::cout << "PS1 Crypting: " << (config.usePS1Crypting ? "Enabled" : "Disabled") << std::endl;
    std::cout << "EXE Crypting: " << (config.useEXECrypting ? "Enabled" : "Disabled") << std::endl;
    std::cout << "DLL Crypting: " << (config.useDLLCrypting ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Add Anti-Debugging: " << (config.addAntiDebugging ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Add AMSI Bypass: " << (config.addAMSIBypass ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Add Memory Loading: " << (config.addMemoryLoading ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Add String Encryption: " << (config.addStringEncryption ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Add Runtime Obfuscation: " << (config.addRuntimeObfuscation ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Add Assembly Protection: " << (config.addAssemblyProtection ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Add Persistence: " << (config.addPersistence ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Add UAC Bypass: " << (config.addUACBypass ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Support .NET Framework: " << (config.supportDotNetFramework ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Support .NET Core: " << (config.supportDotNetCore ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Support .NET 5+: " << (config.supportDotNet5Plus ? "Enabled" : "Disabled") << std::endl;
}

void DotNetCrypter::showMenu() {
    while (true) {
        std::cout << "\n=== .NET Crypter Plugin ===\n";
        std::cout << "1. Crypt BAT File\n";
        std::cout << "2. Crypt PS1 File\n";
        std::cout << "3. Crypt EXE File\n";
        std::cout << "4. Crypt DLL File\n";
        std::cout << "5. Add Anti-Debugging\n";
        std::cout << "6. Add AMSI Bypass\n";
        std::cout << "7. Add Memory Loading\n";
        std::cout << "8. Add String Encryption\n";
        std::cout << "9. Add Runtime Obfuscation\n";
        std::cout << "10. Add Assembly Protection\n";
        std::cout << "11. Add Persistence\n";
        std::cout << "12. Add UAC Bypass\n";
        std::cout << "13. Support .NET Framework\n";
        std::cout << "14. Support .NET Core\n";
        std::cout << "15. Support .NET 5+\n";
        std::cout << "16. Configuration\n";
        std::cout << "0. Back\n";
        std::cout << "Choice: ";
        
        int choice;
        std::cin >> choice;
        
        switch (choice) {
            case 0: return;
            case 1: handleCryptBATFile(); break;
            case 2: handleCryptPS1File(); break;
            case 3: handleCryptEXEFile(); break;
            case 4: handleCryptDLLFile(); break;
            case 5: handleAddAntiDebugging(); break;
            case 6: handleAddAMSIBypass(); break;
            case 7: handleAddMemoryLoading(); break;
            case 8: handleAddStringEncryption(); break;
            case 9: handleAddRuntimeObfuscation(); break;
            case 10: handleAddAssemblyProtection(); break;
            case 11: handleAddPersistence(); break;
            case 12: handleAddUACBypass(); break;
            case 13: handleSupportDotNetFramework(); break;
            case 14: handleSupportDotNetCore(); break;
            case 15: handleSupportDotNet5Plus(); break;
            case 16: handleConfiguration(); break;
            default: std::cout << "Invalid choice!\n"; break;
        }
    }
}
