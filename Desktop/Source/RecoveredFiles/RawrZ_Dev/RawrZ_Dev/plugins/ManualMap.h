#pragma once
#include <string>
#include <vector>
#include <windows.h>

// Manual Mapper Plugin Interface
class ManualMap {
private:
    // Configuration
    bool useStealthMode;
    bool bypassAMSI;
    bool bypassETW;
    bool useAPCExecution;
    bool useThreadHijacking;
    bool useSectionMapping;
    bool useRelocationFix;
    bool useImportResolution;

public:
    ManualMap();
    ~ManualMap();

    // Plugin interface methods
    std::string getName() const;
    std::string getDescription() const;
    std::string getVersion() const;
    bool initialize();
    void execute();
    std::vector<std::string> getOptions() const;
    void setOption(const std::string& option, const std::string& value);

    // Manual mapping methods
    bool mapDLLToProcess(const std::wstring& dllPath, DWORD targetPID);
    bool mapShellcodeToProcess(const std::vector<BYTE>& shellcode, DWORD targetPID);
    bool mapPEFileToProcess(const std::wstring& pePath, DWORD targetPID);
    bool mapWithStealth(const std::wstring& payloadPath, DWORD targetPID);
    
    // Advanced techniques
    bool mapWithAPC(const std::wstring& payloadPath, DWORD targetPID);
    bool mapWithThreadHijacking(const std::wstring& payloadPath, DWORD targetPID);
    bool mapWithSectionMapping(const std::wstring& payloadPath, DWORD targetPID);
    
    // Utility methods
    std::vector<DWORD> enumerateProcesses();
    std::string getProcessInfo(DWORD pid);
    bool isProcessAccessible(DWORD pid);
    
    // Configuration methods
    void setStealthMode(bool enable);
    void setBypassAMSI(bool enable);
    void setBypassETW(bool enable);
    void setUseAPCExecution(bool enable);
    void setUseThreadHijacking(bool enable);
    void setUseSectionMapping(bool enable);
    void setUseRelocationFix(bool enable);
    void setUseImportResolution(bool enable);

    // Menu interface
    void showMenu();
};
