#include <iostream>
#include <string>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <random>
#include <algorithm>
#include <vector>

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

void testEncryption(const std::string& method) {
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
    std::vector<char> encrypted = encryptData(data, method);
    
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
    std::cout << "RawrZ Encryption Methods Test" << std::endl;
    std::cout << "=============================" << std::endl;
    
    // Test all encryption methods
    testEncryption("Hybrid");
    testEncryption("Triple");
    testEncryption("Enhanced");
    testEncryption("CrossPlatform");
    
    std::cout << "\nAll encryption tests completed!" << std::endl;
    std::cout << "Check the generated .encrypted files." << std::endl;
    
    return 0;
}
