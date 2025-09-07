#include "test_environment.h"
#include <sstream>
#include <iomanip>

// Simple XOR encryption for testing
std::string xorEncrypt(const std::string& data, const std::string& key) {
    std::string result = data;
    for (size_t i = 0; i < data.size(); ++i) {
        result[i] = data[i] ^ key[i % key.size()];
    }
    return result;
}

std::vector<char> encryptFileAES(const std::vector<char>& data, const std::string& key) {
    // Mock implementation - in real scenario, use proper AES encryption
    std::string dataStr(data.begin(), data.end());
    std::string encrypted = xorEncrypt(dataStr, key);
    return std::vector<char>(encrypted.begin(), encrypted.end());
}

std::string base64Encode(const std::vector<char>& data) {
    // Simple base64-like encoding for testing
    const std::string base64_chars = 
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        "abcdefghijklmnopqrstuvwxyz"
        "0123456789+/";
    
    std::string encoded;
    int val = 0, valb = -6;
    
    for (unsigned char c : data) {
        val = (val << 8) + c;
        valb += 8;
        while (valb >= 0) {
            encoded.push_back(base64_chars[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    
    if (valb > -6) {
        encoded.push_back(base64_chars[((val << 8) >> (valb + 8)) & 0x3F]);
    }
    
    while (encoded.size() % 4) {
        encoded.push_back('=');
    }
    
    return encoded;
}

std::vector<std::string> splitIntoChunks(const std::vector<char>& data) {
    std::vector<std::string> chunks;
    std::string dataStr(data.begin(), data.end());
    
    size_t chunkSize = 50; // Small chunks for testing
    for (size_t i = 0; i < dataStr.size(); i += chunkSize) {
        chunks.push_back(dataStr.substr(i, chunkSize));
    }
    
    return chunks;
}

std::string generateCSharpStub(const std::vector<std::string>& chunks, 
                              const std::string& key, 
                              bool useAES, 
                              bool useXOR) {
    // Generate a simple C# stub for testing
    std::stringstream stub;
    
    stub << "using System;\n";
    stub << "using System.Text;\n";
    stub << "using System.Collections.Generic;\n\n";
    stub << "public class Program {\n";
    stub << "    public static void Main() {\n";
    stub << "        // Decryption key\n";
    stub << "        string key = \"" << key << "\";\n\n";
    stub << "        // Encrypted chunks\n";
    stub << "        List<string> chunks = new List<string>();\n";
    
    for (size_t i = 0; i < chunks.size(); i++) {
        stub << "        chunks.Add(\"" << chunks[i] << "\");\n";
    }
    
    stub << "\n";
    stub << "        // Reconstruct and decrypt payload\n";
    stub << "        string encrypted = string.Join(\"\", chunks);\n";
    stub << "        byte[] payload = Decrypt(encrypted, key);\n";
    stub << "        Console.WriteLine(\"Payload decrypted successfully!\");\n";
    stub << "    }\n\n";
    stub << "    static byte[] Decrypt(string data, string key) {\n";
    stub << "        // Simple XOR decryption for testing\n";
    stub << "        byte[] result = new byte[data.Length];\n";
    stub << "        for (int i = 0; i < data.Length; i++) {\n";
    stub << "            result[i] = (byte)(data[i] ^ key[i % key.Length]);\n";
    stub << "        }\n";
    stub << "        return result;\n";
    stub << "    }\n";
    stub << "}\n";
    
    return stub.str();
}

// Mock encryption methods
std::vector<char> encryptHybrid(const std::vector<char>& data) {
    std::string dataStr(data.begin(), data.end());
    std::string encrypted = xorEncrypt(dataStr, "hybrid_key");
    return std::vector<char>(encrypted.begin(), encrypted.end());
}

std::vector<char> encryptTriple(const std::vector<char>& data) {
    std::string dataStr(data.begin(), data.end());
    std::string encrypted = xorEncrypt(xorEncrypt(xorEncrypt(dataStr, "key1"), "key2"), "key3");
    return std::vector<char>(encrypted.begin(), encrypted.end());
}

std::vector<char> encryptEnhanced(const std::vector<char>& data) {
    std::string dataStr(data.begin(), data.end());
    std::string encrypted = xorEncrypt(dataStr, "enhanced_key");
    // Add some simple obfuscation
    for (char& c : encrypted) {
        c = ~c;
    }
    return std::vector<char>(encrypted.begin(), encrypted.end());
}

std::vector<char> encryptCrossPlatform(const std::vector<char>& data) {
    std::string dataStr(data.begin(), data.end());
    std::string encrypted = xorEncrypt(dataStr, "cross_platform_key");
    return std::vector<char>(encrypted.begin(), encrypted.end());
}

std::vector<char> encryptCBC(const std::vector<char>& data) {
    std::string dataStr(data.begin(), data.end());
    std::string encrypted = xorEncrypt(dataStr, "cbc_mode_key");
    return std::vector<char>(encrypted.begin(), encrypted.end());
}
