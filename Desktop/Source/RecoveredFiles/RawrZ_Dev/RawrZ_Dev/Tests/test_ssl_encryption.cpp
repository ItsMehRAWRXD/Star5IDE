#include <iostream>
#include <string>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <random>
#include <algorithm>
#include <vector>
#include <cstring>

// OpenSSL includes
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <openssl/err.h>

// Enhanced encryption function with multiple algorithms
std::vector<char> encryptData(const std::vector<char>& data, const std::string& method) {
    std::vector<char> encrypted = data;
    
    if (method == "Hybrid") {
        // Hybrid encryption: XOR + bit rotation + salt
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(0, 255);
        
        // Add salt
        char salt = dis(gen);
        encrypted.insert(encrypted.begin(), salt);
        
        // Layer 1: XOR with salt
        for (size_t i = 1; i < encrypted.size(); ++i) {
            encrypted[i] ^= salt;
        }
        
        // Layer 2: Bit rotation
        for (size_t i = 1; i < encrypted.size(); ++i) {
            encrypted[i] = (encrypted[i] << 1) | (encrypted[i] >> 7);
        }
        
        // Layer 3: Position-based XOR
        for (size_t i = 1; i < encrypted.size(); ++i) {
            encrypted[i] ^= static_cast<unsigned char>(i & 0xFF);
        }
        
    } else if (method == "Triple") {
        // Triple encryption: 3 rounds with different keys
        std::vector<unsigned char> keys = {0x55, 0xAA, 0x33};
        
        for (int round = 0; round < 3; ++round) {
            for (size_t i = 0; i < encrypted.size(); ++i) {
                encrypted[i] ^= keys[round];
                encrypted[i] = (encrypted[i] << 2) | (encrypted[i] >> 6);
                encrypted[i] ^= (i + round) % 256;
            }
        }
        
    } else if (method == "Enhanced") {
        // Enhanced encryption: multiple layers with checksum
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(0, 255);
        
        // Generate key
        char key = dis(gen);
        encrypted.insert(encrypted.begin(), key);
        
        // Layer 1: XOR with key
        for (size_t i = 1; i < encrypted.size(); ++i) {
            encrypted[i] ^= key;
        }
        
        // Layer 2: Bit rotation with position
        for (size_t i = 1; i < encrypted.size(); ++i) {
            int shift = (i % 7) + 1;
            encrypted[i] = (encrypted[i] << shift) | (encrypted[i] >> (8 - shift));
        }
        
        // Layer 3: S-Box transformation
        unsigned char sbox[256];
        for (int i = 0; i < 256; i++) {
            sbox[i] = (i * 7 + 13) % 256;
        }
        
        for (size_t i = 1; i < encrypted.size(); ++i) {
            encrypted[i] = sbox[(unsigned char)encrypted[i]];
        }
        
        // Layer 4: Final XOR
        for (size_t i = 1; i < encrypted.size(); ++i) {
            encrypted[i] ^= static_cast<unsigned char>(0xAA);
        }
        
    } else if (method == "CrossPlatform") {
        // Cross-platform compatible encryption
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(0, 255);
        
        // Add IV
        char iv = dis(gen);
        encrypted.insert(encrypted.begin(), iv);
        
        // CBC-like encryption
        char prev = iv;
        for (size_t i = 1; i < encrypted.size(); ++i) {
            encrypted[i] ^= prev;
            encrypted[i] = encrypted[i] ^ 0x42 ^ (i % 256);
            prev = encrypted[i];
        }
        
    } else {
        // Default simple XOR with random key
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(0, 255);
        
        char key = dis(gen);
        encrypted.insert(encrypted.begin(), key);
        
        for (size_t i = 1; i < encrypted.size(); ++i) {
            encrypted[i] ^= key;
        }
    }
    
    return encrypted;
}

// Real OpenSSL encryption methods
std::vector<char> encryptWithOpenSSL(const std::vector<char>& data, const std::string& method) {
    std::vector<char> encrypted;
    
    if (method == "AES-256-GCM") {
        EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
        if (!ctx) {
            std::cerr << "Error: Failed to create OpenSSL context" << std::endl;
            return encrypted;
        }
        
        // Generate random key and IV
        unsigned char key[32];  // 256-bit key
        unsigned char iv[12];   // 96-bit IV for GCM
        unsigned char tag[16];  // 128-bit tag
        
        if (RAND_bytes(key, sizeof(key)) != 1 || RAND_bytes(iv, sizeof(iv)) != 1) {
            std::cerr << "Error: Failed to generate random bytes" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return encrypted;
        }
        
        // Initialize encryption
        if (EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, key, iv) != 1) {
            std::cerr << "Error: Failed to initialize encryption" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return encrypted;
        }
        
        // Prepare output buffer (data + key + iv + tag)
        encrypted.resize(data.size() + sizeof(key) + sizeof(iv) + sizeof(tag));
        
        // Copy key and IV to beginning
        memcpy(encrypted.data(), key, sizeof(key));
        memcpy(encrypted.data() + sizeof(key), iv, sizeof(iv));
        
        int outLen;
        // Encrypt data
        if (EVP_EncryptUpdate(ctx, (unsigned char*)encrypted.data() + sizeof(key) + sizeof(iv), 
                             &outLen, (const unsigned char*)data.data(), data.size()) != 1) {
            std::cerr << "Error: Failed to encrypt data" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return std::vector<char>();
        }
        
        int finalLen;
        if (EVP_EncryptFinal_ex(ctx, (unsigned char*)encrypted.data() + sizeof(key) + sizeof(iv) + outLen, 
                               &finalLen) != 1) {
            std::cerr << "Error: Failed to finalize encryption" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return std::vector<char>();
        }
        
        // Get the tag
        if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, sizeof(tag), tag) != 1) {
            std::cerr << "Error: Failed to get tag" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return std::vector<char>();
        }
        
        // Copy tag to end
        memcpy(encrypted.data() + sizeof(key) + sizeof(iv) + outLen + finalLen, tag, sizeof(tag));
        
        EVP_CIPHER_CTX_free(ctx);
        
    } else if (method == "AES-256-CBC") {
        EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
        if (!ctx) {
            std::cerr << "Error: Failed to create OpenSSL context" << std::endl;
            return encrypted;
        }
        
        // Generate random key and IV
        unsigned char key[32];  // 256-bit key
        unsigned char iv[16];   // 128-bit IV for CBC
        
        if (RAND_bytes(key, sizeof(key)) != 1 || RAND_bytes(iv, sizeof(iv)) != 1) {
            std::cerr << "Error: Failed to generate random bytes" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return encrypted;
        }
        
        // Initialize encryption
        if (EVP_EncryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, key, iv) != 1) {
            std::cerr << "Error: Failed to initialize encryption" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return encrypted;
        }
        
        // Prepare output buffer (data + key + iv)
        encrypted.resize(data.size() + sizeof(key) + sizeof(iv) + 16); // +16 for padding
        
        // Copy key and IV to beginning
        memcpy(encrypted.data(), key, sizeof(key));
        memcpy(encrypted.data() + sizeof(key), iv, sizeof(iv));
        
        int outLen;
        // Encrypt data
        if (EVP_EncryptUpdate(ctx, (unsigned char*)encrypted.data() + sizeof(key) + sizeof(iv), 
                             &outLen, (const unsigned char*)data.data(), data.size()) != 1) {
            std::cerr << "Error: Failed to encrypt data" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return std::vector<char>();
        }
        
        int finalLen;
        if (EVP_EncryptFinal_ex(ctx, (unsigned char*)encrypted.data() + sizeof(key) + sizeof(iv) + outLen, 
                               &finalLen) != 1) {
            std::cerr << "Error: Failed to finalize encryption" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return std::vector<char>();
        }
        
        // Resize to actual size
        encrypted.resize(sizeof(key) + sizeof(iv) + outLen + finalLen);
        
        EVP_CIPHER_CTX_free(ctx);
        
    } else if (method == "ChaCha20") {
        EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
        if (!ctx) {
            std::cerr << "Error: Failed to create OpenSSL context" << std::endl;
            return encrypted;
        }
        
        // Generate random key and nonce
        unsigned char key[32];   // 256-bit key
        unsigned char nonce[12]; // 96-bit nonce
        
        if (RAND_bytes(key, sizeof(key)) != 1 || RAND_bytes(nonce, sizeof(nonce)) != 1) {
            std::cerr << "Error: Failed to generate random bytes" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return encrypted;
        }
        
        // Initialize encryption
        if (EVP_EncryptInit_ex(ctx, EVP_chacha20(), NULL, key, nonce) != 1) {
            std::cerr << "Error: Failed to initialize encryption" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return encrypted;
        }
        
        // Prepare output buffer (data + key + nonce)
        encrypted.resize(data.size() + sizeof(key) + sizeof(nonce));
        
        // Copy key and nonce to beginning
        memcpy(encrypted.data(), key, sizeof(key));
        memcpy(encrypted.data() + sizeof(key), nonce, sizeof(nonce));
        
        int outLen;
        // Encrypt data
        if (EVP_EncryptUpdate(ctx, (unsigned char*)encrypted.data() + sizeof(key) + sizeof(nonce), 
                             &outLen, (const unsigned char*)data.data(), data.size()) != 1) {
            std::cerr << "Error: Failed to encrypt data" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return std::vector<char>();
        }
        
        EVP_CIPHER_CTX_free(ctx);
    }
    
    return encrypted;
}

void testEncryption(const std::string& method, bool useOpenSSL = false) {
    std::cout << "\n=== Testing " << method << " Encryption ===" << std::endl;
    
    // Read test file
    std::ifstream file("test_payload.txt", std::ios::binary);
    if (!file) {
        std::cerr << "Error: Cannot open test_payload.txt!" << std::endl;
        return;
    }
    
    std::vector<char> data((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    file.close();
    
    std::cout << "Original data size: " << data.size() << " bytes" << std::endl;
    std::cout << "Original data preview: ";
    for (size_t i = 0; i < std::min(data.size(), size_t(50)); ++i) {
        std::cout << data[i];
    }
    if (data.size() > 50) std::cout << "...";
    std::cout << std::endl;
    
    // Encrypt
    std::vector<char> encrypted;
    if (useOpenSSL) {
        encrypted = encryptWithOpenSSL(data, method);
    } else {
        encrypted = encryptData(data, method);
    }
    
    if (encrypted.empty()) {
        std::cerr << "Encryption failed!" << std::endl;
        return;
    }
    
    std::cout << "Encrypted data size: " << encrypted.size() << " bytes" << std::endl;
    std::cout << "Encryption overhead: " << (encrypted.size() - data.size()) << " bytes" << std::endl;
    std::cout << "Encrypted data preview (hex): ";
    for (size_t i = 0; i < std::min(encrypted.size(), size_t(32)); ++i) {
        std::cout << std::hex << std::setw(2) << std::setfill('0') 
                  << (unsigned char)encrypted[i] << " ";
    }
    if (encrypted.size() > 32) std::cout << "...";
    std::cout << std::dec << std::endl;
    
    // Save encrypted file
    std::string outputPath = "test_payload." + method + ".encrypted";
    std::ofstream outFile(outputPath, std::ios::binary);
    if (outFile) {
        outFile.write(encrypted.data(), encrypted.size());
        outFile.close();
        std::cout << "Encrypted file saved: " << outputPath << std::endl;
    } else {
        std::cerr << "Error: Cannot write encrypted file!" << std::endl;
    }
    
    std::cout << "=== " << method << " Encryption Test Complete ===" << std::endl;
}

int main() {
    // Initialize OpenSSL
    OPENSSL_init_crypto(OPENSSL_INIT_LOAD_CRYPTO_STRINGS, NULL);
    
    std::cout << "RawrZ Encryption Methods Test (Custom + Real OpenSSL)" << std::endl;
    std::cout << "====================================================" << std::endl;
    
    // Test custom encryption methods
    std::cout << "\n--- CUSTOM ENCRYPTION METHODS ---" << std::endl;
    testEncryption("Hybrid", false);
    testEncryption("Triple", false);
    testEncryption("Enhanced", false);
    testEncryption("CrossPlatform", false);
    
    // Test real OpenSSL encryption methods
    std::cout << "\n--- REAL OPENSSL ENCRYPTION METHODS ---" << std::endl;
    testEncryption("AES-256-GCM", true);
    testEncryption("AES-256-CBC", true);
    testEncryption("ChaCha20", true);
    
    std::cout << "\nAll encryption tests completed!" << std::endl;
    std::cout << "Check the generated .encrypted files." << std::endl;
    
    return 0;
}
