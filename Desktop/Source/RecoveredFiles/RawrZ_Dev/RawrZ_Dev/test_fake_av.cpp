#include <iostream>
#include <windows.h>
#include <tlhelp32.h>
#include <string>
#include <thread>
#include <chrono>
#include <fstream>
#include <vector>

class FakeAV {
private:
    bool running;
    std::string avName;
    std::thread avThread;
    std::vector<std::string> detectedThreats;
    
public:
    FakeAV(const std::string& name) : running(false), avName(name) {}
    
    ~FakeAV() {
        stop();
    }
    
    void start() {
        if (running) return;
        
        running = true;
        avThread = std::thread(&FakeAV::avLoop, this);
        
        std::cout << "[FAKE AV] " << avName << " started!" << std::endl;
        std::cout << "[FAKE AV] PID: " << GetCurrentProcessId() << std::endl;
        std::cout << "[FAKE AV] Starting real-time protection..." << std::endl;
    }
    
    void stop() {
        if (!running) return;
        
        running = false;
        if (avThread.joinable()) {
            avThread.join();
        }
        
        std::cout << "[FAKE AV] " << avName << " stopped!" << std::endl;
    }
    
    bool isRunning() const {
        return running;
    }
    
    std::string getName() const {
        return avName;
    }
    
    void simulateThreatDetection(const std::string& threat) {
        detectedThreats.push_back(threat);
        std::cout << "[FAKE AV] " << avName << " - THREAT DETECTED: " << threat << std::endl;
    }
    
private:
    void avLoop() {
        int counter = 0;
        
        while (running) {
            // Simulate AV activities
            if (counter % 5 == 0) {
                std::cout << "[FAKE AV] " << avName << " - Scanning system files..." << std::endl;
            }
            
            if (counter % 8 == 0) {
                std::cout << "[FAKE AV] " << avName << " - Checking for suspicious processes..." << std::endl;
                scanForSuspiciousProcesses();
            }
            
            if (counter % 12 == 0) {
                std::cout << "[FAKE AV] " << avName << " - Updating threat definitions..." << std::endl;
            }
            
            if (counter % 15 == 0) {
                std::cout << "[FAKE AV] " << avName << " - Performing memory scan..." << std::endl;
            }
            
            if (counter % 18 == 0) {
                std::cout << "[FAKE AV] " << avName << " - Checking network connections..." << std::endl;
            }
            
            if (counter % 20 == 0) {
                std::cout << "[FAKE AV] " << avName << " - Scanning registry..." << std::endl;
            }
            
            if (counter % 25 == 0) {
                std::cout << "[FAKE AV] " << avName << " - Running heuristic analysis..." << std::endl;
            }
            
            // Simulate random threat detections
            if (counter % 30 == 0) {
                simulateRandomThreat();
            }
            
            // Create AV log files
            if (counter % 35 == 0) {
                createAVLog();
            }
            
            counter++;
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
    }
    
    void scanForSuspiciousProcesses() {
        HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if (hSnapshot != INVALID_HANDLE_VALUE) {
            PROCESSENTRY32 pe32;
            pe32.dwSize = sizeof(PROCESSENTRY32);
            
            if (Process32First(hSnapshot, &pe32)) {
                do {
                    std::string processName = pe32.szExeFile;
                    
                    // Simulate detection of suspicious processes
                    if (processName.find("suspicious") != std::string::npos ||
                        processName.find("malware") != std::string::npos ||
                        processName.find("bot") != std::string::npos) {
                        
                        std::cout << "[FAKE AV] " << avName << " - Suspicious process detected: " << processName << " (PID: " << pe32.th32ProcessID << ")" << std::endl;
                        simulateThreatDetection("Suspicious process: " + processName);
                    }
                } while (Process32Next(hSnapshot, &pe32));
            }
            CloseHandle(hSnapshot);
        }
    }
    
    void simulateRandomThreat() {
        std::vector<std::string> threats = {
            "Trojan.Generic",
            "Malware.Heuristic",
            "Spyware.Keylogger",
            "Ransomware.Crypto",
            "Backdoor.Remote",
            "Rootkit.System",
            "Adware.Popup",
            "PUP.Optional"
        };
        
        int randomIndex = rand() % threats.size();
        std::string threat = threats[randomIndex];
        
        // Randomly decide if we "detect" a threat
        if (rand() % 100 < 20) { // 20% chance
            simulateThreatDetection(threat);
        }
    }
    
    void createAVLog() {
        std::string logFilename = "av_log_" + avName + "_" + std::to_string(GetCurrentProcessId()) + ".log";
        std::ofstream logFile(logFilename);
        if (logFile) {
            logFile << "=== " << avName << " Activity Log ===" << std::endl;
            logFile << "Timestamp: " << std::chrono::system_clock::now().time_since_epoch().count() << std::endl;
            logFile << "PID: " << GetCurrentProcessId() << std::endl;
            logFile << "Status: Running" << std::endl;
            logFile << "Threats Detected: " << detectedThreats.size() << std::endl;
            
            if (!detectedThreats.empty()) {
                logFile << "Threat List:" << std::endl;
                for (const auto& threat : detectedThreats) {
                    logFile << "  - " << threat << std::endl;
                }
            }
            
            logFile.close();
            std::cout << "[FAKE AV] " << avName << " - Created log file: " << logFilename << std::endl;
        }
    }
};

int main() {
    std::cout << "=== Fake AV Test Process ===" << std::endl;
    std::cout << "This process simulates antivirus behavior" << std::endl;
    std::cout << "Use it to test the AVKiller plugin" << std::endl;
    std::cout << "Press Enter to start the fake AV..." << std::endl;
    std::cin.get();
    
    FakeAV av("TestAV_Pro_v2.1");
    av.start();
    
    std::cout << "\nFake AV is now running!" << std::endl;
    std::cout << "Use the AVKiller plugin to terminate it" << std::endl;
    std::cout << "Press Enter to stop the AV..." << std::endl;
    std::cin.get();
    
    av.stop();
    
    std::cout << "Fake AV test completed!" << std::endl;
    return 0;
}
