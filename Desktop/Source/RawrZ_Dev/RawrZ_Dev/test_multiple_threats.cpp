#include <iostream>
#include <windows.h>
#include <tlhelp32.h>
#include <string>
#include <thread>
#include <chrono>
#include <fstream>
#include <vector>
#include <map>

class ThreatSimulator {
private:
    std::map<std::string, bool> runningThreats;
    std::vector<std::thread> threatThreads;
    
public:
    ThreatSimulator() {}
    
    ~ThreatSimulator() {
        stopAllThreats();
    }
    
    void startThreat(const std::string& threatType, const std::string& name) {
        if (runningThreats[name]) return;
        
        runningThreats[name] = true;
        
        if (threatType == "bot") {
            threatThreads.emplace_back(&ThreatSimulator::botBehavior, this, name);
        } else if (threatType == "av") {
            threatThreads.emplace_back(&ThreatSimulator::avBehavior, this, name);
        } else if (threatType == "keylogger") {
            threatThreads.emplace_back(&ThreatSimulator::keyloggerBehavior, this, name);
        } else if (threatType == "ransomware") {
            threatThreads.emplace_back(&ThreatSimulator::ransomwareBehavior, this, name);
        }
        
        std::cout << "[THREAT] Started " << threatType << ": " << name << " (PID: " << GetCurrentProcessId() << ")" << std::endl;
    }
    
    void stopAllThreats() {
        for (auto& [name, running] : runningThreats) {
            running = false;
        }
        
        for (auto& thread : threatThreads) {
            if (thread.joinable()) {
                thread.join();
            }
        }
        
        threatThreads.clear();
        runningThreats.clear();
        std::cout << "[THREAT] All threats stopped!" << std::endl;
    }
    
    bool isThreatRunning(const std::string& name) const {
        auto it = runningThreats.find(name);
        return it != runningThreats.end() && it->second;
    }
    
    std::vector<std::string> getRunningThreats() const {
        std::vector<std::string> threats;
        for (const auto& [name, running] : runningThreats) {
            if (running) threats.push_back(name);
        }
        return threats;
    }
    
private:
    void botBehavior(const std::string& name) {
        int counter = 0;
        while (runningThreats[name]) {
            if (counter % 10 == 0) {
                std::cout << "[BOT] " << name << " - Scanning network..." << std::endl;
            }
            if (counter % 15 == 0) {
                std::cout << "[BOT] " << name << " - Attempting C&C connection..." << std::endl;
            }
            if (counter % 20 == 0) {
                createSuspiciousFile(name, "bot_activity");
            }
            counter++;
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
    }
    
    void avBehavior(const std::string& name) {
        int counter = 0;
        while (runningThreats[name]) {
            if (counter % 5 == 0) {
                std::cout << "[AV] " << name << " - Scanning system..." << std::endl;
            }
            if (counter % 8 == 0) {
                std::cout << "[AV] " << name << " - Checking processes..." << std::endl;
            }
            if (counter % 12 == 0) {
                createSuspiciousFile(name, "av_scan");
            }
            counter++;
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
    }
    
    void keyloggerBehavior(const std::string& name) {
        int counter = 0;
        while (runningThreats[name]) {
            if (counter % 8 == 0) {
                std::cout << "[KEYLOGGER] " << name << " - Monitoring keystrokes..." << std::endl;
            }
            if (counter % 15 == 0) {
                std::cout << "[KEYLOGGER] " << name << " - Capturing clipboard..." << std::endl;
            }
            if (counter % 20 == 0) {
                createSuspiciousFile(name, "captured_data");
            }
            counter++;
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
    }
    
    void ransomwareBehavior(const std::string& name) {
        int counter = 0;
        while (runningThreats[name]) {
            if (counter % 12 == 0) {
                std::cout << "[RANSOMWARE] " << name << " - Scanning for files..." << std::endl;
            }
            if (counter % 18 == 0) {
                std::cout << "[RANSOMWARE] " << name << " - Attempting encryption..." << std::endl;
            }
            if (counter % 25 == 0) {
                createSuspiciousFile(name, "ransom_note");
            }
            counter++;
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
    }
    
    void createSuspiciousFile(const std::string& threatName, const std::string& activity) {
        std::string filename = "suspicious_" + threatName + "_" + activity + "_" + std::to_string(GetCurrentProcessId()) + ".tmp";
        std::ofstream file(filename);
        if (file) {
            file << "Threat: " << threatName << std::endl;
            file << "Activity: " << activity << std::endl;
            file << "PID: " << GetCurrentProcessId() << std::endl;
            file << "Timestamp: " << std::chrono::system_clock::now().time_since_epoch().count() << std::endl;
            file.close();
        }
    }
};

int main() {
    std::cout << "=== Multiple Threats Simulator ===" << std::endl;
    std::cout << "This program creates multiple fake threats to test RawrZ plugins" << std::endl;
    std::cout << std::endl;
    
    ThreatSimulator simulator;
    
    std::cout << "Starting multiple threats..." << std::endl;
    
    // Start various types of threats
    simulator.startThreat("bot", "NetworkBot_v1.0");
    simulator.startThreat("bot", "DataHarvester_v2.1");
    simulator.startThreat("av", "SecuritySuite_Pro");
    simulator.startThreat("av", "DefenderPlus_Ultra");
    simulator.startThreat("keylogger", "KeyCapture_Stealth");
    simulator.startThreat("ransomware", "CryptoLocker_2024");
    
    std::cout << std::endl;
    std::cout << "=== All Threats Started ===" << std::endl;
    std::cout << "Now test the RawrZ plugins:" << std::endl;
    std::cout << "1. Use BotKiller to kill the bot processes" << std::endl;
    std::cout << "2. Use AVKiller to kill the AV processes" << std::endl;
    std::cout << "3. Use other plugins as needed" << std::endl;
    std::cout << std::endl;
    
    std::cout << "Press Enter to check threat status..." << std::endl;
    std::cin.get();
    
    // Check status
    auto runningThreats = simulator.getRunningThreats();
    std::cout << "Currently running threats: " << runningThreats.size() << std::endl;
    for (const auto& threat : runningThreats) {
        std::cout << "  - " << threat << std::endl;
    }
    
    std::cout << std::endl;
    std::cout << "Press Enter to stop all threats..." << std::endl;
    std::cin.get();
    
    simulator.stopAllThreats();
    
    std::cout << "All threats stopped. Test complete!" << std::endl;
    return 0;
}
