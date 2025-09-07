// Native C++ Unpacker for ZenCrypto Stubs
// Compile with: cl /O2 /GS- unpack.cpp (MSVC) or g++ -O2 -s -static unpack.cpp -o unpack.exe (MinGW)

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <cstdio>

// Simple memmem implementation (not in MSVC)
const void* memmem(const void* hay, SIZE_T hayLen,
                   const void* needle, SIZE_T needleLen)
{
    if (needleLen == 0 || needleLen > hayLen) return nullptr;

    const BYTE* h = static_cast<const BYTE*>(hay);
    const BYTE* n = static_cast<const BYTE*>(needle);

    for (SIZE_T i = 0; i <= hayLen - needleLen; ++i)
    {
        if (!memcmp(h + i, n, needleLen))
            return h + i;
    }
    return nullptr;
}

int wmain(int argc, wchar_t** argv)
{
    if (argc != 3) {
        wprintf(L"Usage: %s <packed.exe> <outfile>\n", argv[0]);
        wprintf(L"Example: %s calc_stub_openssl.exe extracted_payload.bin\n", argv[0]);
        return 1;
    }

    wprintf(L"ZenCrypto Native Unpacker\n");
    wprintf(L"Input: %s\n", argv[1]);
    wprintf(L"Output: %s\n", argv[2]);

    // Open the packed executable
    HANDLE hFile = CreateFileW(argv[1], GENERIC_READ,
                               FILE_SHARE_READ, nullptr,
                               OPEN_EXISTING, 0, nullptr);
    if (hFile == INVALID_HANDLE_VALUE) {
        wprintf(L"Error: Failed to open input file\n");
        return 2;
    }

    // Get file size
    LARGE_INTEGER fs; 
    GetFileSizeEx(hFile, &fs);
    wprintf(L"File size: %lld bytes\n", fs.QuadPart);

    // Allocate memory for file content
    BYTE* map = (BYTE*)VirtualAlloc(nullptr, fs.QuadPart,
                                    MEM_COMMIT | MEM_RESERVE,
                                    PAGE_READWRITE);
    if (!map) { 
        CloseHandle(hFile); 
        wprintf(L"Error: Failed to allocate memory\n");
        return 3; 
    }

    // Read file into memory
    DWORD br; 
    ReadFile(hFile, map, fs.QuadPart, &br, nullptr);
    CloseHandle(hFile);

    wprintf(L"Read %lu bytes\n", br);

    // Look for the ZEN_RESOURCES marker
    const char kMarker[] = "ZEN_RESOURCES";
    const char kEndMarker[] = "END_ZEN_RESOURCES";
    
    const BYTE* p = static_cast<const BYTE*>(memmem(map, fs.QuadPart,
                                        kMarker, sizeof(kMarker)-1));
    if (!p) { 
        wprintf(L"Error: ZEN_RESOURCES marker not found\n");
        VirtualFree(map, 0, MEM_RELEASE);
        return 4; 
    }

    wprintf(L"Found marker at offset: %td\n", p - map);
    p += sizeof(kMarker)-1;

    // Extract encrypted data length and data
    DWORD len; 
    memcpy(&len, p, 4); 
    p += 4;
    const BYTE* data = p; 
    p += len;
    
    wprintf(L"Encrypted data size: %lu bytes\n", len);

    // Skip key (length + data)
    DWORD keyLen;
    memcpy(&keyLen, p, 4); 
    p += 4 + keyLen;
    wprintf(L"Key size: %lu bytes\n", keyLen);

    // Skip IV (length + data)
    DWORD ivLen;
    memcpy(&ivLen, p, 4); 
    p += 4 + ivLen;
    wprintf(L"IV size: %lu bytes\n", ivLen);

    // Verify end marker
    if (memcmp(p, kEndMarker, sizeof(kEndMarker)-1)) {
        wprintf(L"Error: END_ZEN_RESOURCES marker mismatch\n");
        VirtualFree(map, 0, MEM_RELEASE);
        return 5;
    }

    wprintf(L"End marker verified\n");

    // Write the encrypted data to output file
    // Note: This is the encrypted payload - you'll need to decrypt it separately
    HANDLE out = CreateFileW(argv[2], GENERIC_WRITE,
                             0, nullptr, CREATE_ALWAYS, 0, nullptr);
    if (out == INVALID_HANDLE_VALUE) {
        wprintf(L"Error: Failed to create output file\n");
        VirtualFree(map, 0, MEM_RELEASE);
        return 6;
    }
    
    WriteFile(out, data, len, &br, nullptr);
    CloseHandle(out);

    // Cleanup
    VirtualFree(map, 0, MEM_RELEASE);

    wprintf(L"Successfully extracted %lu bytes to: %s\n", len, argv[2]);
    wprintf(L"Note: This is encrypted data. Decrypt with AES-256-CBC using the key/IV.\n");
    
    return 0;
}
