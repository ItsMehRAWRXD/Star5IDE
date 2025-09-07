#pragma once
#include <string>
#include <vector>

// Configuration structure for web shell generation
struct WebShellGeneratorConfig {
    bool usePHPWebShells;
    bool useASPWebShells;
    bool useJSPWebShells;
    bool useNodeJSWebShells;
    bool usePythonWebShells;
    bool useRubyWebShells;
    bool useGoWebShells;
    bool useJavaScriptWebShells;
    bool useHTMLWebShells;
    bool useCSSWebShells;
    bool useSVGWebShells;
    bool usePDFWebShells;
    bool useImageWebShells;
    bool useAudioWebShells;
    bool useVideoWebShells;
    bool useDocumentWebShells;
    bool useSocialEngineering;
    bool useObfuscation;
    bool useEncryption;
    bool useAntiAnalysis;
    bool useEvasion;
    bool usePersistence;
};

// Web Shell Generator Plugin Interface
class WebShellGenerator {
private:
    WebShellGeneratorConfig config;

    // Utility functions
    std::string generatePHPWebShell();
    std::string generateASPWebShell();
    std::string generateJSPWebShell();
    std::string generateNodeJSWebShell();
    std::string generatePythonWebShell();
    std::string generateRubyWebShell();
    std::string generateGoWebShell();
    std::string generateJavaScriptWebShell();
    std::string generateHTMLWebShell();
    std::string generateCSSWebShell();
    std::string generateSVGWebShell();
    std::string generatePDFWebShell();
    std::string generateImageWebShell();
    std::string generateAudioWebShell();
    std::string generateVideoWebShell();
    std::string generateDocumentWebShell();
    std::string generateSocialEngineering();
    std::string generateObfuscation();
    std::string generateEncryption();
    std::string generateAntiAnalysis();
    std::string generateEvasion();
    std::string generatePersistence();

    // Menu handlers
    void handlePHPWebShell();
    void handleASPWebShell();
    void handleJSPWebShell();
    void handleNodeJSWebShell();
    void handlePythonWebShell();
    void handleRubyWebShell();
    void handleGoWebShell();
    void handleJavaScriptWebShell();
    void handleHTMLWebShell();
    void handleCSSWebShell();
    void handleSVGWebShell();
    void handlePDFWebShell();
    void handleImageWebShell();
    void handleAudioWebShell();
    void handleVideoWebShell();
    void handleDocumentWebShell();
    void handleSocialEngineering();
    void handleObfuscation();
    void handleEncryption();
    void handleAntiAnalysis();
    void handleEvasion();
    void handlePersistence();
    void handleConfiguration();

public:
    WebShellGenerator();
    ~WebShellGenerator();

    // Plugin interface methods
    std::string getName() const;
    std::string getDescription() const;
    std::string getVersion() const;
    bool initialize();
    void execute();
    std::vector<std::string> getOptions() const;
    void setOption(const std::string& option, const std::string& value);

    // Web Shell Generation Methods
    std::string createPHPWebShell(const std::string& type, const std::string& features);
    std::string createASPWebShell(const std::string& type, const std::string& features);
    std::string createJSPWebShell(const std::string& type, const std::string& features);
    std::string createNodeJSWebShell(const std::string& type, const std::string& features);
    std::string createPythonWebShell(const std::string& type, const std::string& features);
    std::string createRubyWebShell(const std::string& type, const std::string& features);
    std::string createGoWebShell(const std::string& type, const std::string& features);
    std::string createJavaScriptWebShell(const std::string& type, const std::string& features);
    std::string createHTMLWebShell(const std::string& type, const std::string& features);
    std::string createCSSWebShell(const std::string& type, const std::string& features);
    std::string createSVGWebShell(const std::string& type, const std::string& features);
    std::string createPDFWebShell(const std::string& type, const std::string& features);
    std::string createImageWebShell(const std::string& type, const std::string& features);
    std::string createAudioWebShell(const std::string& type, const std::string& features);
    std::string createVideoWebShell(const std::string& type, const std::string& features);
    std::string createDocumentWebShell(const std::string& type, const std::string& features);
    std::string createSocialEngineering(const std::string& technique, const std::string& target);
    std::string addObfuscation(const std::string& shell);
    std::string addEncryption(const std::string& shell, const std::string& key);
    std::string addAntiAnalysis(const std::string& shell);
    std::string addEvasion(const std::string& shell);
    std::string addPersistence(const std::string& shell);

    // Configuration methods
    void setUsePHPWebShells(bool use);
    void setUseASPWebShells(bool use);
    void setUseJSPWebShells(bool use);
    void setUseNodeJSWebShells(bool use);
    void setUsePythonWebShells(bool use);
    void setUseRubyWebShells(bool use);
    void setUseGoWebShells(bool use);
    void setUseJavaScriptWebShells(bool use);
    void setUseHTMLWebShells(bool use);
    void setUseCSSWebShells(bool use);
    void setUseSVGWebShells(bool use);
    void setUsePDFWebShells(bool use);
    void setUseImageWebShells(bool use);
    void setUseAudioWebShells(bool use);
    void setUseVideoWebShells(bool use);
    void setUseDocumentWebShells(bool use);
    void setUseSocialEngineering(bool use);
    void setUseObfuscation(bool use);
    void setUseEncryption(bool use);
    void setUseAntiAnalysis(bool use);
    void setUseEvasion(bool use);
    void setUsePersistence(bool use);

    // Menu interface
    void showMenu();
};
