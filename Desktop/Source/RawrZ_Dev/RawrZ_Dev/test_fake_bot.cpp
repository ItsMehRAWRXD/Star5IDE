#include <iostream>
#include <windows.h>
#include <tlhelp32.h>
#include <string>
#include <thread>
#include <chrono>
#include <fstream>

class FakeBot {
private:
    bool running;
    std::string botName;
    std::thread botThread;
    
public:
    FakeBot(const std::string& name) : running(false), botName(name) {}
    
    ~FakeBot() {
        stop();
    }
    
    void start() {
        if (running) return;
        
        running = true;
        botThread = std::thread(&FakeBot::botLoop, this);
        
        std::cout << "[FAKE BOT] " << botName << " started!" << std::endl;
        std::cout << "[FAKE BOT] PID: " << GetCurrentProcessId() << std::endl;
        std::cout << "[FAKE BOT] Simulating malicious behavior..." << std::endl;
    }
    
    void stop() {
        if (!running) return;
        
        running = false;
        if (botThread.joinable()) {
            botThread.join();
        }
        
        std::cout << "[FAKE BOT] " << botName << " stopped!" << std::endl;
    }
    
    bool isRunning() const {
        return running;
    }
    
    std::string getName() const {
        return botName;
    }
    
private:
    void botLoop() {
        int counter = 0;
        
        while (running) {
            // Simulate malicious activities
            if (counter % 10 == 0) {
                std::cout << "[FAKE BOT] " << botName << " - Scanning for targets..." << std::endl;
            }
            
            if (counter % 15 == 0) {
                std::cout << "[FAKE BOT] " << botName << " - Attempting network connections..." << std::endl;
            }
            
            if (counter % 20 == 0) {
                std::cout << "[FAKE BOT] " << botName << " - Collecting system information..." << std::endl;
            }
            
            if (counter % 25 == 0) {
                std::cout << "[FAKE BOT] " << botName << " - Attempting privilege escalation..." << std::endl;
            }
            
            // Create suspicious files
            if (counter % 30 == 0) {
                createSuspiciousFile();
            }
            
            // Simulate keylogging
            if (counter % 35 == 0) {
                simulateKeylogging();
            }
            
            // Simulate process injection attempts
            if (counter % 40 == 0) {
                simulateProcessInjection();
            }
            
            counter++;
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
    }
    
    void createSuspiciousFile() {
        std::string filename = "suspicious_" + botName + "_" + std::to_string(GetCurrentProcessId()) + ".tmp";
        std::ofstream file(filename);
        if (file) {
            file << "This is a suspicious file created by " << botName << std::endl;
            file << "PID: " << GetCurrentProcessId() << std::endl;
            file << "Timestamp: " << std::chrono::system_clock::now().time_since_epoch().count() << std::endl;
            file.close();
            std::cout << "[FAKE BOT] " << botName << " - Created suspicious file: " << filename << std::endl;
        }
    }
    
    void simulateKeylogging() {
        std::cout << "[FAKE BOT] " << botName << " - Simulating keylogging activity..." << std::endl;
        // Simulate key capture
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
    
    void simulateProcessInjection() {
        std::cout << "[FAKE BOT] " << botName << " - Simulating process injection attempts..." << std::endl;
        
        // Try to open other processes (this will fail without proper privileges, but simulates the attempt)
        HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if (hSnapshot != INVALID_HANDLE_VALUE) {
            PROCESSENTRY32 pe32;
            pe32.dwSize = sizeof(PROCESSENTRY32);
            
            if (Process32First(hSnapshot, &pe32)) {
                do {
                    if (pe32.th32ProcessID != GetCurrentProcessId()) {
                        // Simulate injection attempt
                        std::cout << "[FAKE BOT] " << botName << " - Attempting to inject into PID: " << pe32.th32ProcessID << std::endl;
                        break; // Just simulate one attempt
                    }
                } while (Process32Next(hSnapshot, &pe32));
            }
            CloseHandle(hSnapshot);
        }
    }
};

int main() {
    std::cout << "=== Fake Bot Test Process ===" << std::endl;
    std::cout << "This process simulates malicious bot behavior" << std::endl;
    std::cout << "Use it to test the BotKiller plugin" << std::endl;
    std::cout << "Press Enter to start the fake bot..." << std::endl;
    std::cin.get();
    
    FakeBot bot("TestBot_v1.0");
    bot.start();
    
    std::cout << "\nFake bot is now running!" << std::endl;
    std::cout << "Use the BotKiller plugin to terminate it" << std::endl;
    std::cout << "Press Enter to stop the bot..." << std::endl;
    std::cin.get();
    
    bot.stop();
    
    std::cout << "Fake bot test completed!" << std::endl;
    return 0;
}
