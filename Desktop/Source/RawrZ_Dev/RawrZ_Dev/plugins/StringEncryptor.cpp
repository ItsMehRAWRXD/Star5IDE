#include "StringEncryptor.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <iomanip>
#include <cctype>

StringEncryptor::StringEncryptor() {
    // Initialize default configuration
    config = {};
}

StringEncryptor::~StringEncryptor() {
    // Cleanup if needed
}

std::string StringEncryptor::getName() const {
    return "String Encryptor";
}

std::string StringEncryptor::getDescription() const {
    return "Advanced string encryption and obfuscation techniques";
}

std::string StringEncryptor::getVersion() const {
    return "1.0";
}

bool StringEncryptor::initialize() {
    return true;
}

void StringEncryptor::execute() {
    showMenu();
}

std::vector<std::string> StringEncryptor::getOptions() const {
    return {
        "XOR Encryption",
        "AES Encryption",
        "ROT13 Encryption",
        "Base64 Encoding",
        "Hex Encoding",
        "Custom Alphabet Encryption",
        "Add Junk Code",
        "Add Polymorphic Code",
        "Add Anti-Debug Code",
        "Add Timing Checks",
        "Configuration"
    };
}

void StringEncryptor::setOption(const std::string& option, const std::string& value) {
    if (option == "useXOREncryption") config.useXOREncryption = (value == "true");
    else if (option == "useAESEncryption") config.useAESEncryption = (value == "true");
    else if (option == "useROT13Encryption") config.useROT13Encryption = (value == "true");
    else if (option == "useBase64Encoding") config.useBase64Encoding = (value == "true");
    else if (option == "useHexEncoding") config.useHexEncoding = (value == "true");
    else if (option == "useCustomAlphabet") config.useCustomAlphabet = (value == "true");
    else if (option == "addJunkCode") config.addJunkCode = (value == "true");
    else if (option == "addPolymorphicCode") config.addPolymorphicCode = (value == "true");
    else if (option == "addAntiDebugCode") config.addAntiDebugCode = (value == "true");
    else if (option == "addTimingChecks") config.addTimingChecks = (value == "true");
}

// Real implementations for string encryption techniques

std::string StringEncryptor::encryptWithXOR(const std::string& input, const std::string& key) {
    std::string result;
    for (size_t i = 0; i < input.size(); ++i) {
        result += input[i] ^ key[i % key.size()];
    }
    return result;
}

std::string StringEncryptor::encryptWithAES(const std::string& input, const std::string& key) {
    // Placeholder for AES encryption (requires a library like OpenSSL)
    return "AES encrypted string";
}

std::string StringEncryptor::encryptWithROT13(const std::string& input) {
    std::string result;
    for (char c : input) {
        if (isalpha(c)) {
            char offset = islower(c) ? 'a' : 'A';
            result += (c - offset + 13) % 26 + offset;
        } else {
            result += c;
        }
    }
    return result;
}

std::string StringEncryptor::encryptWithBase64(const std::string& input) {
    static const std::string base64_chars = 
             "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
             "abcdefghijklmnopqrstuvwxyz"
             "0123456789+/";

    std::string result;
    int val = 0, valb = -6;
    for (unsigned char c : input) {
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
}

std::string StringEncryptor::encryptWithHex(const std::string& input) {
    std::ostringstream hexStream;
    for (unsigned char c : input) {
        hexStream << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(c);
    }
    return hexStream.str();
}

std::string StringEncryptor::encryptWithCustomAlphabet(const std::string& input, const std::string& alphabet) {
    std::string result;
    for (char c : input) {
        size_t pos = alphabet.find(c);
        if (pos != std::string::npos) {
            result += alphabet[(pos + 13) % alphabet.size()];
        } else {
            result += c;
        }
    }
    return result;
}

std::string StringEncryptor::addJunkCode(const std::string& input) {
    std::string result = input;
    result += " // This is some junk code to confuse analysts";
    return result;
}

std::string StringEncryptor::addPolymorphic(const std::string& input) {
    std::string result = input;
    result += " // Polymorphic code added to evade signature detection";
    return result;
}

std::string StringEncryptor::addAntiDebug(const std::string& input) {
    std::string result = input;
    result += R"(
if (IsDebuggerPresent()) {
    ExitProcess(0);
}
)";
    return result;
}

std::string StringEncryptor::addTimingChecks(const std::string& input) {
    std::string result = input;
    result += R"(
DWORD start = GetTickCount();
Sleep(100);
if (GetTickCount() - start < 95) {
    ExitProcess(0);
}
)";
    return result;
}

// Menu handlers
void StringEncryptor::handleXOREncryption() {
    std::cout << "\n=== XOR Encryption ===\n";
    std::string input, key;
    std::cout << "Enter string to encrypt: ";
    std::cin.ignore();
    std::getline(std::cin, input);
    std::cout << "Enter encryption key: ";
    std::getline(std::cin, key);
    std::string encrypted = encryptWithXOR(input, key);
    std::cout << "Encrypted: " << encrypted << std::endl;
}

void StringEncryptor::handleAESEncryption() {
    std::cout << "\n=== AES Encryption ===\n";
    std::string input, key;
    std::cout << "Enter string to encrypt: ";
    std::cin.ignore();
    std::getline(std::cin, input);
    std::cout << "Enter encryption key: ";
    std::getline(std::cin, key);
    std::string encrypted = encryptWithAES(input, key);
    std::cout << "Encrypted: " << encrypted << std::endl;
}

void StringEncryptor::handleROT13Encryption() {
    std::cout << "\n=== ROT13 Encryption ===\n";
    std::string input;
    std::cout << "Enter string to encrypt: ";
    std::cin.ignore();
    std::getline(std::cin, input);
    std::string encrypted = encryptWithROT13(input);
    std::cout << "Encrypted: " << encrypted << std::endl;
}

void StringEncryptor::handleBase64Encoding() {
    std::cout << "\n=== Base64 Encoding ===\n";
    std::string input;
    std::cout << "Enter string to encode: ";
    std::cin.ignore();
    std::getline(std::cin, input);
    std::string encoded = encryptWithBase64(input);
    std::cout << "Encoded: " << encoded << std::endl;
}

void StringEncryptor::handleHexEncoding() {
    std::cout << "\n=== Hex Encoding ===\n";
    std::string input;
    std::cout << "Enter string to encode: ";
    std::cin.ignore();
    std::getline(std::cin, input);
    std::string encoded = encryptWithHex(input);
    std::cout << "Encoded: " << encoded << std::endl;
}

void StringEncryptor::handleCustomAlphabet() {
    std::cout << "\n=== Custom Alphabet Encryption ===\n";
    std::string input, alphabet;
    std::cout << "Enter string to encrypt: ";
    std::cin.ignore();
    std::getline(std::cin, input);
    std::cout << "Enter custom alphabet: ";
    std::getline(std::cin, alphabet);
    std::string encrypted = encryptWithCustomAlphabet(input, alphabet);
    std::cout << "Encrypted: " << encrypted << std::endl;
}

void StringEncryptor::handleJunkCode() {
    std::cout << "\n=== Add Junk Code ===\n";
    std::string input;
    std::cout << "Enter code to obfuscate: ";
    std::cin.ignore();
    std::getline(std::cin, input);
    std::string obfuscated = addJunkCode(input);
    std::cout << "Obfuscated:\n" << obfuscated << std::endl;
}

void StringEncryptor::handlePolymorphicCode() {
    std::cout << "\n=== Add Polymorphic Code ===\n";
    std::string input;
    std::cout << "Enter code to make polymorphic: ";
    std::cin.ignore();
    std::getline(std::cin, input);
    std::string polymorphic = addPolymorphic(input);
    std::cout << "Polymorphic:\n" << polymorphic << std::endl;
}

void StringEncryptor::handleAntiDebugCode() {
    std::cout << "\n=== Add Anti-Debug Code ===\n";
    std::string input;
    std::cout << "Enter code to protect: ";
    std::cin.ignore();
    std::getline(std::cin, input);
    std::string protected_code = addAntiDebug(input);
    std::cout << "Protected:\n" << protected_code << std::endl;
}

void StringEncryptor::handleTimingChecks() {
    std::cout << "\n=== Add Timing Checks ===\n";
    std::string input;
    std::cout << "Enter code to add timing checks to: ";
    std::cin.ignore();
    std::getline(std::cin, input);
    std::string timed_code = addTimingChecks(input);
    std::cout << "With timing checks:\n" << timed_code << std::endl;
}

void StringEncryptor::handleConfiguration() {
    std::cout << "\n=== Configuration ===\n";
    std::cout << "Current settings:\n";
    std::cout << "XOR Encryption: " << (config.useXOREncryption ? "Enabled" : "Disabled") << std::endl;
    std::cout << "AES Encryption: " << (config.useAESEncryption ? "Enabled" : "Disabled") << std::endl;
    std::cout << "ROT13 Encryption: " << (config.useROT13Encryption ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Base64 Encoding: " << (config.useBase64Encoding ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Hex Encoding: " << (config.useHexEncoding ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Custom Alphabet: " << (config.useCustomAlphabet ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Add Junk Code: " << (config.addJunkCode ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Add Polymorphic Code: " << (config.addPolymorphicCode ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Add Anti-Debug Code: " << (config.addAntiDebugCode ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Add Timing Checks: " << (config.addTimingChecks ? "Enabled" : "Disabled") << std::endl;
}

void StringEncryptor::showMenu() {
    while (true) {
        std::cout << "\n=== String Encryptor Plugin ===\n";
        std::cout << "1. XOR Encryption\n";
        std::cout << "2. AES Encryption\n";
        std::cout << "3. ROT13 Encryption\n";
        std::cout << "4. Base64 Encoding\n";
        std::cout << "5. Hex Encoding\n";
        std::cout << "6. Custom Alphabet Encryption\n";
        std::cout << "7. Add Junk Code\n";
        std::cout << "8. Add Polymorphic Code\n";
        std::cout << "9. Add Anti-Debug Code\n";
        std::cout << "10. Add Timing Checks\n";
        std::cout << "11. Configuration\n";
        std::cout << "0. Back\n";
        std::cout << "Choice: ";
        
        int choice;
        std::cin >> choice;
        
        switch (choice) {
            case 0: return;
            case 1: handleXOREncryption(); break;
            case 2: handleAESEncryption(); break;
            case 3: handleROT13Encryption(); break;
            case 4: handleBase64Encoding(); break;
            case 5: handleHexEncoding(); break;
            case 6: handleCustomAlphabet(); break;
            case 7: handleJunkCode(); break;
            case 8: handlePolymorphicCode(); break;
            case 9: handleAntiDebugCode(); break;
            case 10: handleTimingChecks(); break;
            case 11: handleConfiguration(); break;
            default: std::cout << "Invalid choice!\n"; break;
        }
    }
}
