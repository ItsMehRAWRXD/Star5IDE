#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <tlhelp32.h>

// Structure for patch information
typedef struct {
    DWORD offset;
    BYTE* data;
    SIZE_T size;
    char description[256];
} PATCH_INFO;

// Find process by name
DWORD FindProcessByName(const char* processName) {
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) {
        return 0;
    }
    
    PROCESSENTRY32 pe32;
    pe32.dwSize = sizeof(PROCESSENTRY32);
    
    if (Process32First(hSnapshot, &pe32)) {
        do {
            if (strcmp(pe32.szExeFile, processName) == 0) {
                CloseHandle(hSnapshot);
                return pe32.th32ProcessID;
            }
        } while (Process32Next(hSnapshot, &pe32));
    }
    
    CloseHandle(hSnapshot);
    return 0;
}

// Find car() marker addresses in target process
LPVOID* FindCarMarkers(HANDLE hProcess, LPVOID baseAddress, SIZE_T imageSize, int* markerCount) {
    // Signature for car() function (NOP sled)
    BYTE carSignature[] = { 0x90, 0x90, 0x90, 0x90, 0x90 };
    LPVOID* markers = malloc(sizeof(LPVOID) * 100); // Max 100 markers
    *markerCount = 0;
    
    BYTE* buffer = malloc(imageSize);
    SIZE_T bytesRead;
    
    if (ReadProcessMemory(hProcess, baseAddress, buffer, imageSize, &bytesRead)) {
        for (SIZE_T i = 0; i < bytesRead - sizeof(carSignature); i++) {
            if (memcmp(buffer + i, carSignature, sizeof(carSignature)) == 0) {
                markers[(*markerCount)++] = (LPVOID)((BYTE*)baseAddress + i);
                if (*markerCount >= 100) break;
            }
        }
    }
    
    free(buffer);
    return markers;
}

// Apply patch to memory
BOOL ApplyPatch(HANDLE hProcess, LPVOID address, const BYTE* patch, SIZE_T size) {
    DWORD oldProtect;
    
    // Change memory protection
    if (!VirtualProtectEx(hProcess, address, size, PAGE_EXECUTE_READWRITE, &oldProtect)) {
        printf("[!] Failed to change memory protection at 0x%p\n", address);
        return FALSE;
    }
    
    // Write patch
    SIZE_T bytesWritten;
    if (!WriteProcessMemory(hProcess, address, patch, size, &bytesWritten)) {
        printf("[!] Failed to write patch at 0x%p\n", address);
        VirtualProtectEx(hProcess, address, size, oldProtect, &oldProtect);
        return FALSE;
    }
    
    // Restore original protection
    VirtualProtectEx(hProcess, address, size, oldProtect, &oldProtect);
    
    // Flush instruction cache
    FlushInstructionCache(hProcess, address, size);
    
    printf("[+] Applied patch at 0x%p (%zu bytes)\n", address, size);
    return TRUE;
}

// Generate polymorphic patch
BYTE* GeneratePolymorphicPatch(SIZE_T* patchSize, int variant) {
    // Different patch variants for polymorphism
    switch (variant % 4) {
        case 0: {
            // JMP to custom code
            static BYTE patch[] = {
                0xE9, 0x00, 0x00, 0x00, 0x00,  // JMP rel32
                0x90, 0x90, 0x90               // NOP padding
            };
            *patchSize = sizeof(patch);
            return patch;
        }
        case 1: {
            // CALL to hook function
            static BYTE patch[] = {
                0xE8, 0x00, 0x00, 0x00, 0x00,  // CALL rel32
                0x90, 0x90, 0x90               // NOP padding
            };
            *patchSize = sizeof(patch);
            return patch;
        }
        case 2: {
            // Push/ret trampoline
            static BYTE patch[] = {
                0x68, 0x00, 0x00, 0x00, 0x00,  // PUSH imm32
                0xC3,                           // RET
                0x90, 0x90                      // NOP padding
            };
            *patchSize = sizeof(patch);
            return patch;
        }
        case 3: {
            // XOR decryption stub
            static BYTE patch[] = {
                0x31, 0xC0,                     // XOR EAX, EAX
                0x40,                           // INC EAX
                0x31, 0xDB,                     // XOR EBX, EBX
                0x90, 0x90, 0x90               // NOP padding
            };
            *patchSize = sizeof(patch);
            return patch;
        }
    }
    
    *patchSize = 0;
    return NULL;
}

// Send command via named pipe
BOOL SendCommand(const char* command) {
    HANDLE hPipe = CreateFileA(
        "\\\\.\\pipe\\PolymorphicLoader",
        GENERIC_READ | GENERIC_WRITE,
        0, NULL, OPEN_EXISTING, 0, NULL
    );
    
    if (hPipe == INVALID_HANDLE_VALUE) {
        printf("[!] Failed to connect to named pipe\n");
        return FALSE;
    }
    
    DWORD bytesWritten;
    if (!WriteFile(hPipe, command, strlen(command) + 1, &bytesWritten, NULL)) {
        printf("[!] Failed to send command\n");
        CloseHandle(hPipe);
        return FALSE;
    }
    
    // Read response if available
    char response[256] = {0};
    DWORD bytesRead;
    if (ReadFile(hPipe, response, sizeof(response) - 1, &bytesRead, NULL)) {
        printf("[+] Response: %s\n", response);
    }
    
    CloseHandle(hPipe);
    return TRUE;
}

// Interactive command-line interface
void InteractiveCLI(HANDLE hProcess, DWORD processId) {
    char command[256];
    
    printf("\n========================================\n");
    printf("   Hot Patcher Interactive Mode\n");
    printf("   Target PID: %d\n", processId);
    printf("========================================\n");
    printf("Commands:\n");
    printf("  patch <address> <bytes>  - Apply patch at address\n");
    printf("  find                     - Find car() markers\n");
    printf("  poly <variant>          - Apply polymorphic patch\n");
    printf("  cmd <command>           - Send command via pipe\n");
    printf("  status                  - Get loader status\n");
    printf("  dump <address> <size>   - Dump memory\n");
    printf("  exit                    - Exit\n\n");
    
    while (1) {
        printf("HotPatcher> ");
        if (!fgets(command, sizeof(command), stdin)) break;
        
        // Remove newline
        command[strcspn(command, "\n")] = 0;
        
        if (strncmp(command, "patch ", 6) == 0) {
            // Parse patch command
            LPVOID address;
            char hexBytes[512];
            if (sscanf(command + 6, "%p %s", &address, hexBytes) == 2) {
                // Convert hex string to bytes
                SIZE_T len = strlen(hexBytes) / 2;
                BYTE* patch = malloc(len);
                for (SIZE_T i = 0; i < len; i++) {
                    sscanf(hexBytes + i * 2, "%2hhx", &patch[i]);
                }
                ApplyPatch(hProcess, address, patch, len);
                free(patch);
            }
        }
        else if (strcmp(command, "find") == 0) {
            // Find car() markers
            MODULEENTRY32 me32;
            me32.dwSize = sizeof(MODULEENTRY32);
            HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE, processId);
            
            if (Module32First(hSnapshot, &me32)) {
                int markerCount;
                LPVOID* markers = FindCarMarkers(hProcess, me32.modBaseAddr, me32.modBaseSize, &markerCount);
                printf("[+] Found %d car() markers:\n", markerCount);
                for (int i = 0; i < markerCount; i++) {
                    printf("    [%d] 0x%p\n", i, markers[i]);
                }
                free(markers);
            }
            CloseHandle(hSnapshot);
        }
        else if (strncmp(command, "poly ", 5) == 0) {
            // Apply polymorphic patch
            int variant = atoi(command + 5);
            SIZE_T patchSize;
            BYTE* patch = GeneratePolymorphicPatch(&patchSize, variant);
            if (patch) {
                printf("[*] Generated polymorphic patch variant %d\n", variant);
                // Apply to first car() marker (example)
                MODULEENTRY32 me32;
                me32.dwSize = sizeof(MODULEENTRY32);
                HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE, processId);
                if (Module32First(hSnapshot, &me32)) {
                    int markerCount;
                    LPVOID* markers = FindCarMarkers(hProcess, me32.modBaseAddr, me32.modBaseSize, &markerCount);
                    if (markerCount > 0) {
                        ApplyPatch(hProcess, markers[0], patch, patchSize);
                    }
                    free(markers);
                }
                CloseHandle(hSnapshot);
            }
        }
        else if (strncmp(command, "cmd ", 4) == 0) {
            // Send command via pipe
            SendCommand(command + 4);
        }
        else if (strcmp(command, "status") == 0) {
            // Get status
            SendCommand("status");
        }
        else if (strncmp(command, "dump ", 5) == 0) {
            // Dump memory
            LPVOID address;
            SIZE_T size;
            if (sscanf(command + 5, "%p %zu", &address, &size) == 2) {
                BYTE* buffer = malloc(size);
                SIZE_T bytesRead;
                if (ReadProcessMemory(hProcess, address, buffer, size, &bytesRead)) {
                    printf("[+] Memory dump at 0x%p:\n", address);
                    for (SIZE_T i = 0; i < bytesRead; i++) {
                        printf("%02X ", buffer[i]);
                        if ((i + 1) % 16 == 0) printf("\n");
                    }
                    printf("\n");
                }
                free(buffer);
            }
        }
        else if (strcmp(command, "exit") == 0) {
            break;
        }
        else {
            printf("[!] Unknown command\n");
        }
    }
}

int main(int argc, char* argv[]) {
    printf("========================================\n");
    printf("   Hot Patcher v2.0\n");
    printf("   Runtime Process Patcher\n");
    printf("========================================\n\n");
    
    DWORD processId = 0;
    const char* patchFile = NULL;
    
    // Parse arguments
    if (argc < 2) {
        printf("Usage: %s <process_name|pid> [patch_file]\n", argv[0]);
        printf("       %s -i <process_name|pid>  (interactive mode)\n", argv[0]);
        return 1;
    }
    
    BOOL interactive = FALSE;
    if (strcmp(argv[1], "-i") == 0 && argc >= 3) {
        interactive = TRUE;
        argv++;
        argc--;
    }
    
    // Get process ID
    processId = atoi(argv[1]);
    if (processId == 0) {
        // Try to find by name
        processId = FindProcessByName(argv[1]);
        if (processId == 0) {
            printf("[!] Process '%s' not found\n", argv[1]);
            return 1;
        }
    }
    
    printf("[+] Target process ID: %d\n", processId);
    
    // Open the target process
    HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, processId);
    if (!hProcess) {
        printf("[!] Failed to open process (error: %d)\n", GetLastError());
        printf("    Try running as administrator\n");
        return 1;
    }
    
    printf("[+] Process handle: 0x%p\n", hProcess);
    
    if (interactive) {
        // Enter interactive mode
        InteractiveCLI(hProcess, processId);
    }
    else if (argc >= 3) {
        // Apply patch from file
        patchFile = argv[2];
        FILE* fp = fopen(patchFile, "rb");
        if (!fp) {
            printf("[!] Failed to open patch file: %s\n", patchFile);
            CloseHandle(hProcess);
            return 1;
        }
        
        // Read patch file
        fseek(fp, 0, SEEK_END);
        SIZE_T patchSize = ftell(fp);
        fseek(fp, 0, SEEK_SET);
        
        BYTE* patch = malloc(patchSize);
        fread(patch, 1, patchSize, fp);
        fclose(fp);
        
        printf("[+] Loaded patch: %zu bytes\n", patchSize);
        
        // Find and patch car() markers
        MODULEENTRY32 me32;
        me32.dwSize = sizeof(MODULEENTRY32);
        HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE, processId);
        
        if (Module32First(hSnapshot, &me32)) {
            int markerCount;
            LPVOID* markers = FindCarMarkers(hProcess, me32.modBaseAddr, me32.modBaseSize, &markerCount);
            
            printf("[+] Found %d car() markers\n", markerCount);
            
            // Apply patch to first marker
            if (markerCount > 0) {
                ApplyPatch(hProcess, markers[0], patch, patchSize);
            }
            
            free(markers);
        }
        
        CloseHandle(hSnapshot);
        free(patch);
    }
    
    // Clean up
    CloseHandle(hProcess);
    
    printf("\n[+] Hot patching completed\n");
    return 0;
}