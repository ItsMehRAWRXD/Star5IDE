#include <windows.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <cstdint>

// PE stub template generator
class PEStubTemplate {
private:
    // DOS header structure
    struct DOSHeader {
        uint16_t e_magic;      // Magic number (MZ)
        uint16_t e_cblp;       // Bytes on last page of file
        uint16_t e_cp;         // Pages in file
        uint16_t e_crlc;       // Relocations
        uint16_t e_cparhdr;    // Size of header in paragraphs
        uint16_t e_minalloc;   // Minimum extra paragraphs needed
        uint16_t e_maxalloc;   // Maximum extra paragraphs needed
        uint16_t e_ss;         // Initial (relative) SS value
        uint16_t e_sp;         // Initial SP value
        uint16_t e_csum;       // Checksum
        uint16_t e_ip;         // Initial IP value
        uint16_t e_cs;         // Initial (relative) CS value
        uint16_t e_lfarlc;     // File address of relocation table
        uint16_t e_ovno;       // Overlay number
        uint16_t e_res[4];     // Reserved words
        uint16_t e_oemid;      // OEM identifier
        uint16_t e_oeminfo;    // OEM information
        uint16_t e_res2[10];   // Reserved words
        uint32_t e_lfanew;     // File address of new exe header
    };

    // PE header structure
    struct PEHeader {
        uint32_t signature;    // PE signature
        uint16_t machine;      // Machine type
        uint16_t numberOfSections;
        uint32_t timeDateStamp;
        uint32_t pointerToSymbolTable;
        uint32_t numberOfSymbols;
        uint16_t sizeOfOptionalHeader;
        uint16_t characteristics;
    };

    // Optional header structure
    struct OptionalHeader {
        uint16_t magic;        // Magic number
        uint8_t majorLinkerVersion;
        uint8_t minorLinkerVersion;
        uint32_t sizeOfCode;
        uint32_t sizeOfInitializedData;
        uint32_t sizeOfUninitializedData;
        uint32_t addressOfEntryPoint;
        uint32_t baseOfCode;
        uint32_t baseOfData;
        uint32_t imageBase;
        uint32_t sectionAlignment;
        uint32_t fileAlignment;
        uint16_t majorOperatingSystemVersion;
        uint16_t minorOperatingSystemVersion;
        uint16_t majorImageVersion;
        uint16_t minorImageVersion;
        uint16_t majorSubsystemVersion;
        uint16_t minorSubsystemVersion;
        uint32_t win32VersionValue;
        uint32_t sizeOfImage;
        uint32_t sizeOfHeaders;
        uint32_t checkSum;
        uint16_t subsystem;
        uint16_t dllCharacteristics;
        uint32_t sizeOfStackReserve;
        uint32_t sizeOfStackCommit;
        uint32_t sizeOfHeapReserve;
        uint32_t sizeOfHeapCommit;
        uint32_t loaderFlags;
        uint32_t numberOfRvaAndSizes;
    };

    // Section header structure
    struct SectionHeader {
        char name[8];          // Section name
        uint32_t virtualSize;
        uint32_t virtualAddress;
        uint32_t sizeOfRawData;
        uint32_t pointerToRawData;
        uint32_t pointerToRelocations;
        uint32_t pointerToLineNumbers;
        uint16_t numberOfRelocations;
        uint16_t numberOfLineNumbers;
        uint32_t characteristics;
    };

    // Data directory structure
    struct DataDirectory {
        uint32_t virtualAddress;
        uint32_t size;
    };

    // Resource directory structure
    struct ResourceDirectory {
        uint32_t characteristics;
        uint32_t timeDateStamp;
        uint16_t majorVersion;
        uint16_t minorVersion;
        uint16_t numberOfNamedEntries;
        uint16_t numberOfIdEntries;
    };

    // Resource directory entry
    struct ResourceDirectoryEntry {
        uint32_t name;
        uint32_t offsetToData;
    };

    // Resource data entry
    struct ResourceDataEntry {
        uint32_t offsetToData;
        uint32_t size;
        uint32_t codePage;
        uint32_t reserved;
    };

public:
    static bool GenerateMinimalPE(const std::string& outputPath, bool isConsole = true) {
        try {
            std::cout << "[INFO] Generating minimal PE stub..." << std::endl;
            
            // Calculate sizes and offsets
            const uint32_t dosHeaderSize = sizeof(DOSHeader);
            const uint32_t peHeaderSize = sizeof(PEHeader);
            const uint32_t optionalHeaderSize = sizeof(OptionalHeader);
            const uint32_t sectionHeaderSize = sizeof(SectionHeader);
            const uint32_t dataDirectorySize = sizeof(DataDirectory) * 16; // 16 data directories
            
            const uint32_t headersSize = dosHeaderSize + peHeaderSize + optionalHeaderSize + dataDirectorySize + (sectionHeaderSize * 2); // 2 sections
            const uint32_t codeSectionSize = 512; // Minimal code section
            const uint32_t dataSectionSize = 256; // Minimal data section
            
            const uint32_t codeSectionOffset = headersSize;
            const uint32_t dataSectionOffset = codeSectionOffset + codeSectionSize;
            
            // Create file
            std::ofstream file(outputPath, std::ios::binary);
            if (!file.is_open()) {
                std::cerr << "[ERROR] Failed to create output file: " << outputPath << std::endl;
                return false;
            }
            
            // Write DOS header
            DOSHeader dosHeader = {};
            dosHeader.e_magic = 0x5A4D; // MZ
            dosHeader.e_cblp = 0x90;
            dosHeader.e_cp = 0x03;
            dosHeader.e_crlc = 0x00;
            dosHeader.e_cparhdr = 0x04;
            dosHeader.e_minalloc = 0x00;
            dosHeader.e_maxalloc = 0xFFFF;
            dosHeader.e_ss = 0x00;
            dosHeader.e_sp = 0xB8;
            dosHeader.e_csum = 0x00;
            dosHeader.e_ip = 0x00;
            dosHeader.e_cs = 0x00;
            dosHeader.e_lfarlc = 0x40;
            dosHeader.e_ovno = 0x00;
            dosHeader.e_lfanew = dosHeaderSize;
            
            file.write(reinterpret_cast<const char*>(&dosHeader), sizeof(dosHeader));
            
            // Write PE header
            PEHeader peHeader = {};
            peHeader.signature = 0x00004550; // PE\0\0
            peHeader.machine = 0x014C; // i386
            peHeader.numberOfSections = 2;
            peHeader.timeDateStamp = static_cast<uint32_t>(time(nullptr));
            peHeader.pointerToSymbolTable = 0;
            peHeader.numberOfSymbols = 0;
            peHeader.sizeOfOptionalHeader = optionalHeaderSize + dataDirectorySize;
            peHeader.characteristics = 0x0102; // Executable file, 32 bit word machine
            
            file.write(reinterpret_cast<const char*>(&peHeader), sizeof(peHeader));
            
            // Write optional header
            OptionalHeader optHeader = {};
            optHeader.magic = 0x10B; // PE32
            optHeader.majorLinkerVersion = 0x0A;
            optHeader.minorLinkerVersion = 0x00;
            optHeader.sizeOfCode = codeSectionSize;
            optHeader.sizeOfInitializedData = dataSectionSize;
            optHeader.sizeOfUninitializedData = 0;
            optHeader.addressOfEntryPoint = 0x1000; // Entry point in code section
            optHeader.baseOfCode = 0x1000;
            optHeader.baseOfData = 0x2000;
            optHeader.imageBase = 0x400000;
            optHeader.sectionAlignment = 0x1000;
            optHeader.fileAlignment = 0x200;
            optHeader.majorOperatingSystemVersion = 5;
            optHeader.minorOperatingSystemVersion = 0;
            optHeader.majorImageVersion = 1;
            optHeader.minorImageVersion = 0;
            optHeader.majorSubsystemVersion = 5;
            optHeader.minorSubsystemVersion = 0;
            optHeader.win32VersionValue = 0;
            optHeader.sizeOfImage = 0x3000;
            optHeader.sizeOfHeaders = headersSize;
            optHeader.checkSum = 0;
            optHeader.subsystem = isConsole ? 3 : 2; // 3 = console, 2 = GUI
            optHeader.dllCharacteristics = 0;
            optHeader.sizeOfStackReserve = 0x100000;
            optHeader.sizeOfStackCommit = 0x1000;
            optHeader.sizeOfHeapReserve = 0x100000;
            optHeader.sizeOfHeapCommit = 0x1000;
            optHeader.loaderFlags = 0;
            optHeader.numberOfRvaAndSizes = 16;
            
            file.write(reinterpret_cast<const char*>(&optHeader), sizeof(optHeader));
            
            // Write data directories (all zero except for resources)
            std::vector<DataDirectory> dataDirs(16, {0, 0});
            dataDirs[2].virtualAddress = 0x3000; // Resources
            dataDirs[2].size = 0x100; // Minimal resource size
            
            file.write(reinterpret_cast<const char*>(dataDirs.data()), dataDirectorySize);
            
            // Write section headers
            // Code section
            SectionHeader codeSection = {};
            strcpy_s(codeSection.name, ".text");
            codeSection.virtualSize = codeSectionSize;
            codeSection.virtualAddress = 0x1000;
            codeSection.sizeOfRawData = codeSectionSize;
            codeSection.pointerToRawData = codeSectionOffset;
            codeSection.pointerToRelocations = 0;
            codeSection.pointerToLineNumbers = 0;
            codeSection.numberOfRelocations = 0;
            codeSection.numberOfLineNumbers = 0;
            codeSection.characteristics = 0x60000020; // Code, executable, readable
            
            file.write(reinterpret_cast<const char*>(&codeSection), sizeof(codeSection));
            
            // Data section
            SectionHeader dataSection = {};
            strcpy_s(dataSection.name, ".data");
            dataSection.virtualSize = dataSectionSize;
            dataSection.virtualAddress = 0x2000;
            dataSection.sizeOfRawData = dataSectionSize;
            dataSection.pointerToRawData = dataSectionOffset;
            dataSection.pointerToRelocations = 0;
            dataSection.pointerToLineNumbers = 0;
            dataSection.numberOfRelocations = 0;
            dataSection.numberOfLineNumbers = 0;
            dataSection.characteristics = 0xC0000040; // Data, readable, writable
            
            file.write(reinterpret_cast<const char*>(&dataSection), sizeof(dataSection));
            
            // Write code section (minimal stub)
            std::vector<uint8_t> codeStub = GenerateCodeStub(isConsole);
            file.seekp(codeSectionOffset);
            file.write(reinterpret_cast<const char*>(codeStub.data()), codeStub.size());
            
            // Pad to section alignment
            uint32_t padding = codeSectionSize - codeStub.size();
            if (padding > 0) {
                std::vector<uint8_t> pad(padding, 0);
                file.write(reinterpret_cast<const char*>(pad.data()), padding);
            }
            
            // Write data section (empty for now)
            file.seekp(dataSectionOffset);
            std::vector<uint8_t> dataSectionData(dataSectionSize, 0);
            file.write(reinterpret_cast<const char*>(dataSectionData.data()), dataSectionSize);
            
            file.close();
            
            std::cout << "[SUCCESS] Minimal PE stub generated: " << outputPath << std::endl;
            return true;
            
        } catch (const std::exception& ex) {
            std::cerr << "[ERROR] Exception during PE generation: " << ex.what() << std::endl;
            return false;
        }
    }

private:
    static std::vector<uint8_t> GenerateCodeStub(bool isConsole) {
        // Generate minimal x86 assembly stub
        std::vector<uint8_t> stub;
        
        if (isConsole) {
            // Console application stub
            stub = {
                0x68, 0x00, 0x00, 0x00, 0x00,  // push 0 (exit code)
                0x68, 0x00, 0x00, 0x00, 0x00,  // push 0 (message)
                0x68, 0x00, 0x00, 0x00, 0x00,  // push 0 (caption)
                0x68, 0x00, 0x00, 0x00, 0x00,  // push 0 (type)
                0xB8, 0x00, 0x00, 0x00, 0x00,  // mov eax, 0 (ExitProcess)
                0xFF, 0xD0,                      // call eax
                0xC3                             // ret
            };
        } else {
            // GUI application stub
            stub = {
                0x68, 0x00, 0x00, 0x00, 0x00,  // push 0 (exit code)
                0xB8, 0x00, 0x00, 0x00, 0x00,  // mov eax, 0 (ExitProcess)
                0xFF, 0xD0,                      // call eax
                0xC3                             // ret
            };
        }
        
        return stub;
    }
};

// Test function
int main() {
    std::cout << "PE Stub Template Generator" << std::endl;
    std::cout << "==========================" << std::endl;
    std::cout << std::endl;
    
    // Generate console stub
    if (PEStubTemplate::GenerateMinimalPE("console_stub.exe", true)) {
        std::cout << "Console stub generated successfully!" << std::endl;
    }
    
    // Generate GUI stub
    if (PEStubTemplate::GenerateMinimalPE("gui_stub.exe", false)) {
        std::cout << "GUI stub generated successfully!" << std::endl;
    }
    
    return 0;
}
