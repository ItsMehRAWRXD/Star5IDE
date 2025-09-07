#pragma once
#include <iostream>
#include <string>
#include <vector>

// Simple plugin integration for RawrZ
class SimplePluginIntegration {
public:
    static void showPluginMenu();
    static void listAvailablePlugins();
    static void executePlugin(int choice);
    
private:
    static std::vector<std::string> getPluginList();
    static void showExploitGeneratorMenu();
    static void showAVKillerMenu();
    static void showDotNetCrypterMenu();
    static void showBotKillerMenu();
    static void showJavaDriveByMenu();
    static void showFlashExploitMenu();
    static void showWebShellMenu();
    static void showMemoryLoaderMenu();
    static void showStringEncryptorMenu();
    static void showRuntimeObfuscatorMenu();
    static void showFormGrabberMenu();
    static void showIRCBotMenu();
    static void showNetworkScannerMenu();
    static void showPersistenceManagerMenu();
    static void showShellGeneratorMenu();
    static void showPrivilegeEscalationMenu();
    static void showLateralMovementMenu();
};
