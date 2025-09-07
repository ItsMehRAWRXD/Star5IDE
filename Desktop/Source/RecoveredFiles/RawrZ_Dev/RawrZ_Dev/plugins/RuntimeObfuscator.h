#pragma once
#include <string>
#include <vector>

// Configuration structure for runtime obfuscation
struct RuntimeObfuscatorConfig {
    bool useControlFlowObfuscation;
    bool useStringEncryption;
    bool useImportObfuscation;
    bool useAntiDebugging;
    bool useAntiVM;
    bool useCodeVirtualization;
    bool useJunkCodeInjection;
    bool useInstructionSubstitution;
    bool useDeadCodeInsertion;
    bool useRegisterReallocation;
};

// Runtime Obfuscator Plugin Interface
class RuntimeObfuscator {
private:
    RuntimeObfuscatorConfig config;

    // Utility functions
    std::string generateControlFlowObfuscation();
    std::string generateStringEncryption();
    std::string generateImportObfuscation();
    std::string generateAntiDebugging();
    std::string generateAntiVM();
    std::string generateCodeVirtualization();
    std::string generateJunkCodeInjection();
    std::string generateInstructionSubstitution();
    std::string generateDeadCodeInsertion();
    std::string generateRegisterReallocation();

    // Menu handlers
    void handleControlFlowObfuscation();
    void handleStringEncryption();
    void handleImportObfuscation();
    void handleAntiDebugging();
    void handleAntiVM();
    void handleCodeVirtualization();
    void handleJunkCodeInjection();
    void handleInstructionSubstitution();
    void handleDeadCodeInsertion();
    void handleRegisterReallocation();
    void handleConfiguration();

public:
    RuntimeObfuscator();
    ~RuntimeObfuscator();

    // Plugin interface methods
    std::string getName() const;
    std::string getDescription() const;
    std::string getVersion() const;
    bool initialize();
    void execute();
    std::vector<std::string> getOptions() const;
    void setOption(const std::string& option, const std::string& value);

    // Runtime Obfuscation Methods
    std::string obfuscateControlFlow(const std::string& code);
    std::string obfuscateStrings(const std::string& code);
    std::string obfuscateImports(const std::string& code);
    std::string addAntiDebugging(const std::string& code);
    std::string addAntiVM(const std::string& code);
    std::string virtualizeCode(const std::string& code);
    std::string injectJunkCode(const std::string& code);
    std::string substituteInstructions(const std::string& code);
    std::string insertDeadCode(const std::string& code);
    std::string reallocateRegisters(const std::string& code);

    // Configuration methods
    void setUseControlFlowObfuscation(bool use);
    void setUseStringEncryption(bool use);
    void setUseImportObfuscation(bool use);
    void setUseAntiDebugging(bool use);
    void setUseAntiVM(bool use);
    void setUseCodeVirtualization(bool use);
    void setUseJunkCodeInjection(bool use);
    void setUseInstructionSubstitution(bool use);
    void setUseDeadCodeInsertion(bool use);
    void setUseRegisterReallocation(bool use);

    // Menu interface
    void showMenu();
};
