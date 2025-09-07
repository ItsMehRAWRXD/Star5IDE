#pragma once
#include <string>
#include <vector>

// Configuration structure for network scanning
struct NetworkScannerConfig {
    bool usePortScanning;
    bool useServiceDetection;
    bool useOSDetection;
    bool useVulnerabilityScanning;
    bool useNetworkMapping;
    bool usePacketSniffing;
    bool useARPScanning;
    bool useDNSEnumeration;
    bool useSNMPEnumeration;
    bool useSMBEnumeration;
    bool useWebEnumeration;
    bool useDatabaseEnumeration;
    bool useWirelessScanning;
    bool useBluetoothScanning;
    bool useEncryption;
    bool useStealthMode;
    bool addAntiDetection;
};

// Network Scanner Plugin Interface
class NetworkScanner {
private:
    NetworkScannerConfig config;

    // Utility functions
    std::string generatePortScanner();
    std::string generateServiceDetector();
    std::string generateOSDetector();
    std::string generateVulnerabilityScanner();
    std::string generateNetworkMapper();
    std::string generatePacketSniffer();
    std::string generateARPScanner();
    std::string generateDNSEnumerator();
    std::string generateSNMPEnumerator();
    std::string generateSMBEnumerator();
    std::string generateWebEnumerator();
    std::string generateDatabaseEnumerator();
    std::string generateWirelessScanner();
    std::string generateBluetoothScanner();
    std::string generateEncryption();
    std::string generateStealthMode();
    std::string generateAntiDetection();

    // Menu handlers
    void handlePortScanner();
    void handleServiceDetector();
    void handleOSDetector();
    void handleVulnerabilityScanner();
    void handleNetworkMapper();
    void handlePacketSniffer();
    void handleARPScanner();
    void handleDNSEnumerator();
    void handleSNMPEnumerator();
    void handleSMBEnumerator();
    void handleWebEnumerator();
    void handleDatabaseEnumerator();
    void handleWirelessScanner();
    void handleBluetoothScanner();
    void handleEncryption();
    void handleStealthMode();
    void handleAntiDetection();
    void handleConfiguration();

public:
    NetworkScanner();
    ~NetworkScanner();

    // Plugin interface methods
    std::string getName() const;
    std::string getDescription() const;
    std::string getVersion() const;
    bool initialize();
    void execute();
    std::vector<std::string> getOptions() const;
    void setOption(const std::string& option, const std::string& value);

    // Network Scanning Methods
    std::string createPortScanner(const std::string& target, const std::string& ports);
    std::string createServiceDetector(const std::string& target);
    std::string createOSDetector(const std::string& target);
    std::string createVulnerabilityScanner(const std::string& target);
    std::string createNetworkMapper(const std::string& network);
    std::string createPacketSniffer(const std::string& interface);
    std::string createARPScanner(const std::string& network);
    std::string createDNSEnumerator(const std::string& domain);
    std::string createSNMPEnumerator(const std::string& target);
    std::string createSMBEnumerator(const std::string& target);
    std::string createWebEnumerator(const std::string& target);
    std::string createDatabaseEnumerator(const std::string& target);
    std::string createWirelessScanner();
    std::string createBluetoothScanner();
    std::string addEncryption(const std::string& data, const std::string& key);
    std::string addStealthMode(const std::string& code);
    std::string addAntiDetection(const std::string& code);

    // Configuration methods
    void setUsePortScanning(bool use);
    void setUseServiceDetection(bool use);
    void setUseOSDetection(bool use);
    void setUseVulnerabilityScanning(bool use);
    void setUseNetworkMapping(bool use);
    void setUsePacketSniffing(bool use);
    void setUseARPScanning(bool use);
    void setUseDNSEnumeration(bool use);
    void setUseSNMPEnumeration(bool use);
    void setUseSMBEnumeration(bool use);
    void setUseWebEnumeration(bool use);
    void setUseDatabaseEnumeration(bool use);
    void setUseWirelessScanning(bool use);
    void setUseBluetoothScanning(bool use);
    void setUseEncryption(bool use);
    void setUseStealthMode(bool use);
    void setAddAntiDetection(bool add);

    // Menu interface
    void showMenu();
};
