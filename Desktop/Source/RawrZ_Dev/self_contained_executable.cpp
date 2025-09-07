#include "self_contained_executable.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <random>
#include <chrono>
#include <map>
#include <string>
#include <windows.h>
#include <algorithm>
#include <direct.h>
#include <shlwapi.h> // For PathFileExists
#include <ctime> // For time()

#ifdef _WIN32
#include <wincrypt.h>
#include <winver.h>
#include <shellapi.h>
#include <tlhelp32.h>
#pragma comment(lib, "advapi32.lib")
#pragma comment(lib, "version.lib")
#endif

#pragma comment(lib, "shlwapi.lib")

// Simple debug logging macro
#define SCE_LOG(msg) std::cerr << "[SelfContainedExecutable] " << msg << std::endl

bool SelfContainedExecutable::Generate(const Config& config, std::string* error) {
    try {
        // Validate inputs
        if (config.outputPath.empty()) {
            if (error) *error = "Output path cannot be empty";
            return false;
        }

        if (config.encryptedData.empty()) {
            if (error) *error = "Encrypted data cannot be empty";
            return false;
        }

        if (config.encryptionKey.size() != 32) {
            if (error) *error = "Encryption key must be 32 bytes for AES-256";
            return false;
        }

        if (config.initVector.size() != 16) {
            if (error) *error = "Initialization vector must be 16 bytes for AES-CBC";
            return false;
        }

        // Extract stub executable from resources
        std::string templatePath = "stub_templates\\default_stub.exe";

        // Check if template exists
        if (!PathFileExists(templatePath.c_str())) {
            SCE_LOG("Template not found: " << templatePath << ", creating default template");
            if (!CreateDefaultStubTemplate(templatePath, error)) {
                if (error) *error = "Failed to create default stub template";
                return false;
            }
        }

        // Copy template to output path
        if (!CopyFile(templatePath.c_str(), config.outputPath.c_str(), FALSE)) {
            if (error) *error = "Failed to copy stub template";
            return false;
        }

        // Write payload data, key, and IV to resources
        if (!WriteResourceData(config.outputPath, config.encryptedData, config.encryptionKey, config.initVector, error)) {
            return false;
        }

        // Set icon if specified
        if (!config.iconPath.empty()) {
            if (!InjectIcon(config.outputPath, config.iconPath, error)) {
                SCE_LOG("Warning: Failed to set icon: " << (error ? *error : "unknown error"));
            }
        }

        // Set version info if specified
        if (!config.versionInfo.empty()) {
            std::string company = !config.companyName.empty() ? config.companyName : "ZenCrypto";
            std::string product = !config.productName.empty() ? config.productName : "Protected Application";
            if (!SetVersionInfo(config.outputPath, company, product, config.versionInfo, error)) {
                SCE_LOG("Warning: Failed to set version info: " << (error ? *error : "unknown error"));
            }
        }

        SCE_LOG("Self-contained executable generated successfully: " << config.outputPath);
        return true;
    } catch (const std::exception& ex) {
        if (error) *error = std::string("Exception: ") + ex.what();
        return false;
    }
}

bool SelfContainedExecutable::GenerateFromFile(const std::string& inputPath, const std::string& outputPath, const std::vector<uint8_t>& key, const std::vector<uint8_t>& iv, bool antiAnalysis, bool autoExecute, bool hideConsole, std::string* error) {
    try {
        // Read the input file
        std::ifstream inputFile(inputPath, std::ios::binary | std::ios::ate);
        if (!inputFile.good()) {
            if (error) *error = "Failed to open input file: " + inputPath;
            return false;
        }

        // Get file size
        std::streamsize fileSize = inputFile.tellg();
        inputFile.seekg(0, std::ios::beg);

        // Read file data
        std::vector<uint8_t> fileData(fileSize);
        if (!inputFile.read(reinterpret_cast<char*>(fileData.data()), fileSize)) {
            if (error) *error = "Failed to read input file";
            return false;
        }

        // Encrypt the file data
        std::vector<uint8_t> encryptedData = EncryptData(fileData, key, iv, error);
        if (encryptedData.empty()) {
            return false;
        }

        // Configure and generate the executable
        Config config;
        config.outputPath = outputPath;
        config.encryptedData = encryptedData;
        config.encryptionKey = key;
        config.initVector = iv;
        config.antiAnalysis = antiAnalysis;
        config.autoExecute = autoExecute;
        config.hideConsole = hideConsole;

        // Determine if input is a PE file and extract info if possible
        if (IsPEFile(fileData)) {
            SCE_LOG("Input file is a PE executable, extracting metadata...");

            // Extract icon from PE if available
            std::string tempIconPath = ExtractIconFromPE(inputPath);
            if (!tempIconPath.empty()) {
                config.iconPath = tempIconPath;
            }

            // Extract version info if available
            std::map<std::string, std::string> versionInfo = ExtractVersionInfo(inputPath);
            if (!versionInfo.empty()) {
                if (versionInfo.count("CompanyName")) 
                    config.companyName = versionInfo["CompanyName"];
                
                if (versionInfo.count("ProductName")) 
                    config.productName = versionInfo["ProductName"];
                
                if (versionInfo.count("FileVersion")) 
                    config.versionInfo = versionInfo["FileVersion"];
            }
        }

        return Generate(config, error);
    } catch (const std::exception& ex) {
        if (error) *error = std::string("Exception: ") + ex.what();
        return false;
    }
}

std::vector<uint8_t> SelfContainedExecutable::EncryptData(const std::vector<uint8_t>& data, const std::vector<uint8_t>& key, const std::vector<uint8_t>& iv, std::string* error) {
    // For now, this is just a placeholder that would call into the actual
    // encryption functions from the ZenCrypto library
    // In a real implementation, this would call:
    // return zen::encryptAES(data, key, iv);

    // For this demonstration, we'll just return the data as-is
    // (simulating encryption for demonstration)
    SCE_LOG("Encrypting " << data.size() << " bytes of data (simulated)");
    return data;
}

bool SelfContainedExecutable::IsPEFile(const std::vector<uint8_t>& data) {
    if (data.size() < 64) return false;

    // Check for MZ signature
    if (data[0] != 'M' || data[1] != 'Z') return false;

    // Find PE header offset (e_lfanew)
    uint32_t peOffset = *reinterpret_cast<const uint32_t*>(&data[0x3C]);

    // Validate PE offset
    if (peOffset >= data.size() - 4) return false;

    // Check for PE signature
    if (data[peOffset] != 'P' || data[peOffset + 1] != 'E' || 
        data[peOffset + 2] != 0 || data[peOffset + 3] != 0)
        return false;

    return true;
}

std::string SelfContainedExecutable::ExtractIconFromPE(const std::string& pePath) {
    try {
        // Open the PE file
        std::ifstream file(pePath, std::ios::binary);
        if (!file.good()) {
            return "";
        }

        // Read DOS header
        IMAGE_DOS_HEADER dosHeader;
        file.read(reinterpret_cast<char*>(&dosHeader), sizeof(dosHeader));
        
        if (dosHeader.e_magic != IMAGE_DOS_SIGNATURE) {
            return "";
        }

        // Seek to PE header
        file.seekg(dosHeader.e_lfanew);
        DWORD peSignature;
        file.read(reinterpret_cast<char*>(&peSignature), sizeof(peSignature));
        
        if (peSignature != IMAGE_NT_SIGNATURE) {
            return "";
        }

        // Read file header
        IMAGE_FILE_HEADER fileHeader;
        file.read(reinterpret_cast<char*>(&fileHeader), sizeof(fileHeader));

        // Read optional header (32-bit)
        IMAGE_OPTIONAL_HEADER32 optionalHeader;
        file.read(reinterpret_cast<char*>(&optionalHeader), sizeof(optionalHeader));

        // For now, return a placeholder - in a full implementation,
        // we would parse the resource section to extract actual icon data
        return "EXTRACTED_ICON";
    } catch (...) {
        return "";
    }
}

std::map<std::string, std::string> SelfContainedExecutable::ExtractVersionInfo(const std::string& pePath) {
    std::map<std::string, std::string> versionInfo;
    
    try {
        // Open the PE file
        std::ifstream file(pePath, std::ios::binary);
        if (!file.good()) {
            return versionInfo;
        }

        // Read DOS header
        IMAGE_DOS_HEADER dosHeader;
        file.read(reinterpret_cast<char*>(&dosHeader), sizeof(dosHeader));
        
        if (dosHeader.e_magic != IMAGE_DOS_SIGNATURE) {
            return versionInfo;
        }

        // Seek to PE header
        file.seekg(dosHeader.e_lfanew);
        DWORD peSignature;
        file.read(reinterpret_cast<char*>(&peSignature), sizeof(peSignature));
        
        if (peSignature != IMAGE_NT_SIGNATURE) {
            return versionInfo;
        }

        // Read file header
        IMAGE_FILE_HEADER fileHeader;
        file.read(reinterpret_cast<char*>(&fileHeader), sizeof(fileHeader));

        // Read optional header (32-bit)
        IMAGE_OPTIONAL_HEADER32 optionalHeader;
        file.read(reinterpret_cast<char*>(&optionalHeader), sizeof(optionalHeader));

        // Extract basic info
        versionInfo["Machine"] = std::to_string(fileHeader.Machine);
        versionInfo["NumberOfSections"] = std::to_string(fileHeader.NumberOfSections);
        versionInfo["TimeDateStamp"] = std::to_string(fileHeader.TimeDateStamp);
        versionInfo["Characteristics"] = std::to_string(fileHeader.Characteristics);
        
        if (optionalHeader.Magic == IMAGE_NT_OPTIONAL_HDR32_MAGIC) {
            versionInfo["Subsystem"] = std::to_string(optionalHeader.Subsystem);
            versionInfo["DllCharacteristics"] = std::to_string(optionalHeader.DllCharacteristics);
        }

        return versionInfo;
    } catch (...) {
        return versionInfo;
    }
}

bool SelfContainedExecutable::CreateDefaultStubTemplate(const std::string& path, std::string* error) {
    try {
        // Create a minimal PE executable stub
        std::ofstream output(path, std::ios::binary);
        if (!output.good()) {
            if (error) *error = "Failed to create default stub template file";
            return false;
        }

        // DOS Header (MZ header)
        IMAGE_DOS_HEADER dosHeader = {};
        dosHeader.e_magic = IMAGE_DOS_SIGNATURE;  // "MZ"
        dosHeader.e_cblp = 0x90;
        dosHeader.e_cp = 0x03;
        dosHeader.e_cparhdr = 0x04;
        dosHeader.e_minalloc = 0x00;
        dosHeader.e_maxalloc = 0xFFFF;
        dosHeader.e_ss = 0x00;
        dosHeader.e_sp = 0xB8;
        dosHeader.e_csum = 0x00;
        dosHeader.e_ip = 0x00;
        dosHeader.e_cs = 0x00;
        dosHeader.e_lfarlc = 0x40;
        dosHeader.e_lfanew = 0x80;  // PE header offset

        // Write DOS header
        output.write(reinterpret_cast<const char*>(&dosHeader), sizeof(dosHeader));

        // DOS stub (minimal message)
        const char* dosStub = "This program cannot be run in DOS mode.\r\n\r\n$";
        output.write(dosStub, strlen(dosStub));

        // Align to PE header
        while (output.tellp() < dosHeader.e_lfanew) {
            output.put(0);
        }

        // PE Signature
        DWORD peSignature = IMAGE_NT_SIGNATURE;
        output.write(reinterpret_cast<const char*>(&peSignature), sizeof(peSignature));

        // File Header
        IMAGE_FILE_HEADER fileHeader = {};
        fileHeader.Machine = IMAGE_FILE_MACHINE_I386;
        fileHeader.NumberOfSections = 2;  // .text and .rdata
        fileHeader.TimeDateStamp = static_cast<DWORD>(time(nullptr));
        fileHeader.PointerToSymbolTable = 0;
        fileHeader.NumberOfSymbols = 0;
        fileHeader.SizeOfOptionalHeader = sizeof(IMAGE_OPTIONAL_HEADER32);
        fileHeader.Characteristics = IMAGE_FILE_EXECUTABLE_IMAGE | IMAGE_FILE_32BIT_MACHINE;

        output.write(reinterpret_cast<const char*>(&fileHeader), sizeof(fileHeader));

        // Optional Header (32-bit)
        IMAGE_OPTIONAL_HEADER32 optionalHeader = {};
        optionalHeader.Magic = IMAGE_NT_OPTIONAL_HDR32_MAGIC;
        optionalHeader.MajorLinkerVersion = 0x0A;
        optionalHeader.MinorLinkerVersion = 0x00;
        optionalHeader.SizeOfCode = 0x1000;  // 4KB
        optionalHeader.SizeOfInitializedData = 0x1000;
        optionalHeader.SizeOfUninitializedData = 0;
        optionalHeader.AddressOfEntryPoint = 0x1000;  // Entry point
        optionalHeader.BaseOfCode = 0x1000;
        optionalHeader.BaseOfData = 0x2000;
        optionalHeader.ImageBase = 0x400000;
        optionalHeader.SectionAlignment = 0x1000;
        optionalHeader.FileAlignment = 0x200;
        optionalHeader.MajorOperatingSystemVersion = 4;
        optionalHeader.MinorOperatingSystemVersion = 0;
        optionalHeader.MajorImageVersion = 1;
        optionalHeader.MinorImageVersion = 0;
        optionalHeader.MajorSubsystemVersion = 4;
        optionalHeader.MinorSubsystemVersion = 0;
        optionalHeader.Win32VersionValue = 0;
        optionalHeader.SizeOfImage = 0x3000;
        optionalHeader.SizeOfHeaders = 0x200;
        optionalHeader.CheckSum = 0;
        optionalHeader.Subsystem = IMAGE_SUBSYSTEM_WINDOWS_CUI;
        optionalHeader.DllCharacteristics = 0;
        optionalHeader.SizeOfStackReserve = 0x100000;
        optionalHeader.SizeOfStackCommit = 0x1000;
        optionalHeader.SizeOfHeapReserve = 0x100000;
        optionalHeader.SizeOfHeapCommit = 0x1000;
        optionalHeader.LoaderFlags = 0;
        optionalHeader.NumberOfRvaAndSizes = IMAGE_NUMBEROF_DIRECTORY_ENTRIES;

        // Data directories
        for (int i = 0; i < IMAGE_NUMBEROF_DIRECTORY_ENTRIES; i++) {
            optionalHeader.DataDirectory[i].VirtualAddress = 0;
            optionalHeader.DataDirectory[i].Size = 0;
        }

        output.write(reinterpret_cast<const char*>(&optionalHeader), sizeof(optionalHeader));

        // Section Headers
        // .text section
        IMAGE_SECTION_HEADER textSection = {};
        memcpy(textSection.Name, ".text", 8);
        textSection.VirtualAddress = 0x1000;
        textSection.SizeOfRawData = 0x200;
        textSection.PointerToRawData = 0x200;
        textSection.PointerToRelocations = 0;
        textSection.PointerToLinenumbers = 0;
        textSection.NumberOfRelocations = 0;
        textSection.NumberOfLinenumbers = 0;
        textSection.Characteristics = IMAGE_SCN_CNT_CODE | IMAGE_SCN_MEM_EXECUTE | IMAGE_SCN_MEM_READ;

        output.write(reinterpret_cast<const char*>(&textSection), sizeof(textSection));

        // .rdata section
        IMAGE_SECTION_HEADER rdataSection = {};
        memcpy(rdataSection.Name, ".rdata", 8);
        rdataSection.VirtualAddress = 0x2000;
        rdataSection.SizeOfRawData = 0x200;
        rdataSection.PointerToRawData = 0x400;
        rdataSection.PointerToRelocations = 0;
        rdataSection.PointerToLinenumbers = 0;
        rdataSection.NumberOfRelocations = 0;
        rdataSection.NumberOfLinenumbers = 0;
        rdataSection.Characteristics = IMAGE_SCN_CNT_INITIALIZED_DATA | IMAGE_SCN_MEM_READ;

        output.write(reinterpret_cast<const char*>(&rdataSection), sizeof(rdataSection));

        // Fill sections with data
        // .text section - minimal x86 code that exits
        std::vector<uint8_t> textData(0x200, 0x90);  // NOPs
        textData[0] = 0x6A;  // PUSH 0
        textData[1] = 0x00;
        textData[2] = 0xE8;  // CALL ExitProcess
        textData[3] = 0x00;
        textData[4] = 0x00;
        textData[5] = 0x00;
        textData[6] = 0x00;
        textData[7] = 0xC3;  // RET

        output.write(reinterpret_cast<const char*>(textData.data()), textData.size());

        // .rdata section - placeholder for resources
        std::vector<uint8_t> rdataData(0x200, 0x00);
        const char* placeholder = "ZenCrypto Stub - Ready for payload injection";
        memcpy(rdataData.data(), placeholder, strlen(placeholder));
        output.write(reinterpret_cast<const char*>(rdataData.data()), rdataData.size());

        output.close();
        return true;

    } catch (const std::exception& ex) {
        if (error) *error = std::string("Exception creating stub template: ") + ex.what();
        return false;
    }
}

bool SelfContainedExecutable::WriteResourceData(const std::string& outputPath, const std::vector<uint8_t>& encryptedData, const std::vector<uint8_t>& key, const std::vector<uint8_t>& iv, std::string* error) {
    try {
        // Open the file for appending
        std::ofstream output(outputPath, std::ios::binary | std::ios::app);
        if (!output.good()) {
            if (error) *error = "Failed to open output file for writing resources";
            return false;
        }

        // Write a marker
        const char* marker = "ZEN_RESOURCES";
        output.write(marker, strlen(marker));

        // Write encrypted data
        uint32_t dataSize = static_cast<uint32_t>(encryptedData.size());
        output.write(reinterpret_cast<const char*>(&dataSize), sizeof(dataSize));
        output.write(reinterpret_cast<const char*>(encryptedData.data()), dataSize);

        // Write key
        uint32_t keySize = static_cast<uint32_t>(key.size());
        output.write(reinterpret_cast<const char*>(&keySize), sizeof(keySize));
        output.write(reinterpret_cast<const char*>(key.data()), keySize);

        // Write IV
        uint32_t ivSize = static_cast<uint32_t>(iv.size());
        output.write(reinterpret_cast<const char*>(&ivSize), sizeof(ivSize));
        output.write(reinterpret_cast<const char*>(iv.data()), ivSize);

        // End marker
        const char* endMarker = "END_ZEN_RESOURCES";
        output.write(endMarker, strlen(endMarker));

        output.close();
        return true;
    } catch (const std::exception& ex) {
        if (error) *error = std::string("Exception writing resources: ") + ex.what();
        return false;
    }
}

bool SelfContainedExecutable::InjectIcon(const std::string& exePath, const std::string& iconPath, std::string* error) {
    // This would use Windows resource update APIs to change the icon
    // For now, we'll just log that it would happen
    SCE_LOG("Would inject icon from " << iconPath << " into " << exePath);
    return true;
}

bool SelfContainedExecutable::SetVersionInfo(const std::string& exePath, const std::string& companyName, const std::string& productName, const std::string& version, std::string* error) {
    // This would use Windows resource update APIs to set version info
    // For now, we'll just log that it would happen
    SCE_LOG("Would set version info for " << exePath << ":");
    SCE_LOG("  Company: " << companyName);
    SCE_LOG("  Product: " << productName);
    SCE_LOG("  Version: " << version);
    return true;
}
