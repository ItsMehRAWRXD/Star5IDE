#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include <sstream>
#include <cstdlib>
#include <chrono>
#include <iomanip>
#include <windows.h>
#include <direct.h>
#include <cstdio>
#include <cerrno>

// Debug levels
enum DebugLevel {
    DEBUG_NONE = 0,
    DEBUG_BASIC = 1,
    DEBUG_VERBOSE = 2,
    DEBUG_EXTREME = 3
};

// Build configuration structure
struct BuildConfig {
    std::string name;
    std::string compiler;
    std::string flags;
    std::string defines;
    bool useOpenSSL;
    bool useAntiAnalysis;
    bool useStubGeneration;
    std::string expectedOutput;
};

// Test result structure
struct TestResult {
    std::string configName;
    bool buildSuccess;
    bool executionSuccess;
    std::string errorMessage;
    std::chrono::milliseconds buildTime;
    std::chrono::milliseconds executionTime;
    int exitCode;
    std::vector<std::string> debugLog;
    std::string buildOutput;
    std::string executionOutput;
};

class AutomatedBuildTester {
private:
    std::vector<BuildConfig> buildConfigs;
    std::vector<TestResult> testResults;
    std::string sourceDir;
    std::string buildDir;
    DebugLevel debugLevel;
    std::ofstream debugLogFile;
    bool enableFileLogging;
    
public:
    AutomatedBuildTester(DebugLevel level = DEBUG_BASIC, bool fileLogging = true) 
        : debugLevel(level), enableFileLogging(fileLogging) {
        sourceDir = "..";
        buildDir = "builds";
        initializeBuildConfigs();
        initializeDebugLogging();
    }
    
    ~AutomatedBuildTester() {
        if (debugLogFile.is_open()) {
            debugLogFile.close();
        }
    }
    
    void initializeDebugLogging() {
        if (enableFileLogging) {
            debugLogFile.open("debug_build_test.log");
            if (debugLogFile.is_open()) {
                debugLogFile << "=== RawrZ Build Test Debug Log ===" << std::endl;
                debugLogFile << "Started: " << getCurrentTimestamp() << std::endl;
                debugLogFile << "Debug Level: " << debugLevel << std::endl;
                debugLogFile << std::string(50, '=') << std::endl << std::endl;
            }
        }
    }
    
    std::string getCurrentTimestamp() {
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        std::stringstream ss;
        ss << std::put_time(std::localtime(&time_t), "%a %b %d %H:%M:%S %Y");
        return ss.str();
    }
    
    void debugLog(const std::string& message, DebugLevel level = DEBUG_BASIC) {
        if (level <= debugLevel) {
            std::string timestamp = getCurrentTimestamp();
            std::string logMessage = "[" + timestamp + "] " + message;
            
            if (level == DEBUG_EXTREME) {
                std::cout << "🔍 " << logMessage << std::endl;
            } else if (level == DEBUG_VERBOSE) {
                std::cout << "📝 " << logMessage << std::endl;
            } else {
                std::cout << "ℹ️  " << logMessage << std::endl;
            }
            
            if (debugLogFile.is_open()) {
                debugLogFile << logMessage << std::endl;
            }
        }
    }
    
    void initializeBuildConfigs() {
        debugLog("Initializing build configurations...", DEBUG_VERBOSE);
        
        // FIXED build configurations - no broken plugin dependencies
        buildConfigs = {
            {
                "Basic Build - MinGW",
                "g++",
                "-std=c++17 -O2",
                "",
                false, false, false,
                "RawrZ_Basic_MinGW.exe"
            },
            {
                "Basic Build - MSVC",
                "cl",
                "/std:c++17 /O2 /EHsc",
                "",
                false, false, false,
                "RawrZ_Basic_MSVC.exe"
            },
            {
                "OpenSSL Build - MinGW",
                "g++",
                "-std=c++17 -O2",
                "-DUSE_OPENSSL",
                true, false, false,
                "RawrZ_OpenSSL_MinGW.exe"
            },
            {
                "Anti-Analysis Build - MinGW",
                "g++",
                "-std=c++17 -O2",
                "-DUSE_ANTI_ANALYSIS",
                false, true, false,
                "RawrZ_AntiAnalysis_MinGW.exe"
            },
            {
                "Stub Generation Build - MinGW",
                "g++",
                "-std=c++17 -O2",
                "-DUSE_STUB_GENERATION",
                false, false, true,
                "RawrZ_StubGen_MinGW.exe"
            },
            {
                "Full Feature Build - MinGW",
                "g++",
                "-std=c++17 -O2",
                "-DUSE_OPENSSL -DUSE_ANTI_ANALYSIS -DUSE_STUB_GENERATION",
                true, true, true,
                "RawrZ_Full_MinGW.exe"
            },
            {
                "Debug Build - MinGW",
                "g++",
                "-std=c++17 -g -O0",
                "-DDEBUG",
                false, false, false,
                "RawrZ_Debug_MinGW.exe"
            },
            {
                "Release Build - MinGW",
                "g++",
                "-std=c++17 -O3 -DNDEBUG",
                "-DRELEASE",
                false, false, false,
                "RawrZ_Release_MinGW.exe"
            }
        };
        
        debugLog("Initialized " + std::to_string(buildConfigs.size()) + " build configurations", DEBUG_BASIC);
    }
    
    bool checkCompilerAvailability(const std::string& compiler) {
        debugLog("Checking compiler availability: " + compiler, DEBUG_VERBOSE);
        std::string checkCmd = "where " + compiler + " >nul 2>&1";
        int result = system(checkCmd.c_str());
        bool available = (result == 0);
        debugLog("Compiler " + compiler + " is " + (available ? "available" : "NOT available"), DEBUG_BASIC);
        return available;
    }
    
    bool createBuildDirectory() {
        debugLog("Creating build directory: " + buildDir, DEBUG_VERBOSE);
        if (_mkdir(buildDir.c_str()) == 0 || errno == EEXIST) {
            debugLog("Build directory created/verified successfully", DEBUG_BASIC);
            return true;
        } else {
            debugLog("Failed to create build directory. Error: " + std::to_string(errno), DEBUG_BASIC);
            return false;
        }
    }
    
    bool checkSourceFiles(const BuildConfig& config) {
        debugLog("Checking source files for configuration: " + config.name, DEBUG_VERBOSE);
        std::vector<std::string> requiredFiles = {sourceDir + "/RawrZ_Simple.cpp"};
        
        for (const auto& file : requiredFiles) {
            std::ifstream testFile(file);
            if (!testFile.good()) {
                debugLog("Missing required source file: " + file, DEBUG_BASIC);
                return false;
            }
            testFile.close();
        }
        debugLog("All required source files found", DEBUG_VERBOSE);
        return true;
    }
    
    std::string generateBuildCommand(const BuildConfig& config) {
        debugLog("Generating build command for: " + config.name, DEBUG_VERBOSE);
        std::stringstream cmd;
        
        cmd << config.compiler << " " << config.flags;
        if (!config.defines.empty()) {
            cmd << " " << config.defines;
        }
        
        // Add source files
        cmd << " " << sourceDir << "/RawrZ_Simple.cpp";
        
        // Add OpenSSL if needed
        if (config.useOpenSSL) {
            if (config.compiler == "g++") {
                cmd << " -I\"C:\\Program Files\\OpenSSL-Win64\\include\"";
                cmd << " -L\"C:\\Program Files\\OpenSSL-Win64\\lib\"";
                cmd << " -llibcrypto -llibssl";
            } else if (config.compiler == "cl") {
                cmd << " /I\"C:\\Program Files\\OpenSSL-Win64\\include\"";
                cmd << " /LIBPATH:\"C:\\Program Files\\OpenSSL-Win64\\lib\"";
                cmd << " libcrypto.lib libssl.lib";
            }
        }
        
        // Add Windows libraries based on compiler
        if (config.compiler == "g++") {
            cmd << " -lws2_32 -lwininet -ladvapi32 -lshell32";
        } else if (config.compiler == "cl") {
            cmd << " ws2_32.lib wininet.lib advapi32.lib shell32.lib";
        }
        
        // Output file
        if (config.compiler == "g++") {
            cmd << " -o " << buildDir << "/" << config.expectedOutput;
        } else if (config.compiler == "cl") {
            cmd << " /Fe:" << buildDir << "/" << config.expectedOutput;
        }
        
        std::string buildCmd = cmd.str();
        debugLog("Generated build command: " + buildCmd, DEBUG_EXTREME);
        return buildCmd;
    }
    
    std::string captureCommandOutput(const std::string& command) {
        debugLog("Capturing output from command: " + command, DEBUG_EXTREME);
        std::string output;
        FILE* pipe = _popen(command.c_str(), "r");
        if (pipe) {
            char buffer[128];
            while (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
                output += buffer;
            }
            _pclose(pipe);
        }
        debugLog("Command output captured: " + std::to_string(output.length()) + " characters", DEBUG_VERBOSE);
        return output;
    }
    
    TestResult runBuildTest(const BuildConfig& config) {
        TestResult result;
        result.configName = config.name;
        result.buildSuccess = false;
        result.executionSuccess = false;
        result.errorMessage = "";
        
        debugLog("Starting build test for: " + config.name, DEBUG_BASIC);
        std::cout << "\n=== Testing: " << config.name << " ===" << std::endl;
        
        if (!checkCompilerAvailability(config.compiler)) {
            result.errorMessage = "Compiler not available: " + config.compiler;
            debugLog(result.errorMessage, DEBUG_BASIC);
            return result;
        }
        
        if (!checkSourceFiles(config)) {
            result.errorMessage = "Required source files missing";
            debugLog(result.errorMessage, DEBUG_BASIC);
            return result;
        }
        
        std::string buildCmd = generateBuildCommand(config);
        std::cout << "Build Command: " << buildCmd << std::endl;
        
        debugLog("Executing build command...", DEBUG_VERBOSE);
        auto buildStart = std::chrono::high_resolution_clock::now();
        std::string buildOutput = captureCommandOutput(buildCmd);
        result.buildOutput = buildOutput;
        int buildResult = system(buildCmd.c_str());
        auto buildEnd = std::chrono::high_resolution_clock::now();
        
        result.buildTime = std::chrono::duration_cast<std::chrono::milliseconds>(buildEnd - buildStart);
        debugLog("Build completed with exit code: " + std::to_string(buildResult), DEBUG_BASIC);
        debugLog("Build output: " + buildOutput, DEBUG_EXTREME);
        
        if (buildResult == 0) {
            result.buildSuccess = true;
            std::cout << "✓ Build successful in " << result.buildTime.count() << "ms" << std::endl;
            debugLog("Build successful, proceeding to execution test", DEBUG_VERBOSE);
            
            std::string exePath = buildDir + "/" + config.expectedOutput;
            if (std::ifstream(exePath)) {
                debugLog("Executable found: " + exePath, DEBUG_VERBOSE);
                auto execStart = std::chrono::high_resolution_clock::now();
                
                // FIXED: Use proper Windows timeout syntax
                std::string execCmd = "timeout /t 5 /nobreak cmd /c \"" + exePath + " --test-mode\"";
                debugLog("Executing: " + execCmd, DEBUG_VERBOSE);
                std::string execOutput = captureCommandOutput(execCmd);
                result.executionOutput = execOutput;
                int execResult = system(execCmd.c_str());
                auto execEnd = std::chrono::high_resolution_clock::now();
                result.executionTime = std::chrono::duration_cast<std::chrono::milliseconds>(execEnd - execStart);
                result.exitCode = execResult;
                
                debugLog("Execution completed with exit code: " + std::to_string(execResult), DEBUG_BASIC);
                debugLog("Execution output: " + execOutput, DEBUG_EXTREME);
                
                if (execResult == 0 || execResult == 1) {
                    result.executionSuccess = true;
                    std::cout << "✓ Execution successful in " << result.executionTime.count() << "ms" << std::endl;
                    debugLog("Execution test passed", DEBUG_BASIC);
                } else {
                    result.errorMessage = "Execution failed with exit code: " + std::to_string(execResult);
                    std::cout << "✗ " << result.errorMessage << std::endl;
                    debugLog("Execution test failed: " + result.errorMessage, DEBUG_BASIC);
                }
            } else {
                result.errorMessage = "Executable not found after build: " + exePath;
                std::cout << "✗ " << result.errorMessage << std::endl;
                debugLog("Executable not found: " + exePath, DEBUG_BASIC);
            }
        } else {
            result.buildSuccess = false;
            result.errorMessage = "Build failed with exit code: " + std::to_string(buildResult);
            std::cout << "✗ " << result.errorMessage << std::endl;
            debugLog("Build failed: " + result.errorMessage, DEBUG_BASIC);
        }
        
        result.debugLog.push_back("Build command: " + buildCmd);
        result.debugLog.push_back("Build exit code: " + std::to_string(buildResult));
        result.debugLog.push_back("Build time: " + std::to_string(result.buildTime.count()) + "ms");
        return result;
    }
    
    void runAllTests() {
        debugLog("Starting automated build testing", DEBUG_BASIC);
        std::cout << "RawrZ Framework - Automated Build Testing" << std::endl;
        std::cout << "==========================================" << std::endl;
        std::cout << "Testing " << buildConfigs.size() << " build configurations..." << std::endl;
        std::cout << "Debug Level: " << debugLevel << std::endl;
        
        if (!createBuildDirectory()) {
            std::cerr << "Error: Cannot create build directory!" << std::endl;
            debugLog("Failed to create build directory", DEBUG_BASIC);
            return;
        }
        
        int totalTests = buildConfigs.size();
        int successfulBuilds = 0;
        int successfulExecutions = 0;
        debugLog("Running " + std::to_string(totalTests) + " build tests", DEBUG_BASIC);
        
        for (const auto& config : buildConfigs) {
            TestResult result = runBuildTest(config);
            testResults.push_back(result);
            if (result.buildSuccess) successfulBuilds++;
            if (result.executionSuccess) successfulExecutions++;
            if (debugLevel >= DEBUG_VERBOSE) { Sleep(1000); }
        }
        
        debugLog("All tests completed. Successful builds: " + std::to_string(successfulBuilds) + 
                "/" + std::to_string(totalTests), DEBUG_BASIC);
        generateSummaryReport(totalTests, successfulBuilds, successfulExecutions);
    }
    
    void generateSummaryReport(int totalTests, int successfulBuilds, int successfulExecutions) {
        debugLog("Generating summary report", DEBUG_VERBOSE);
        std::cout << "\n" << std::string(60, '=') << std::endl;
        std::cout << "BUILD TESTING SUMMARY REPORT" << std::endl;
        std::cout << std::string(60, '=') << std::endl;
        
        std::cout << "Total Tests: " << totalTests << std::endl;
        std::cout << "Successful Builds: " << successfulBuilds << "/" << totalTests << std::endl;
        std::cout << "Successful Executions: " << successfulExecutions << "/" << totalTests << std::endl;
        std::cout << "Build Success Rate: " << (successfulBuilds * 100 / totalTests) << "%" << std::endl;
        std::cout << "Execution Success Rate: " << (successfulExecutions * 100 / totalTests) << "%" << std::endl;
        
        std::cout << "\nDetailed Results:" << std::endl;
        std::cout << std::string(60, '-') << std::endl;
        
        for (const auto& result : testResults) {
            std::cout << result.configName << ":" << std::endl;
            std::cout << "  Build: " << (result.buildSuccess ? "✓" : "✗") << std::endl;
            std::cout << "  Execution: " << (result.executionSuccess ? "✓" : "✗") << std::endl;
            if (!result.errorMessage.empty()) {
                std::cout << "  Error: " << result.errorMessage << std::endl;
            }
            std::cout << "  Build Time: " << result.buildTime.count() << "ms" << std::endl;
            if (result.executionSuccess) {
                std::cout << "  Execution Time: " << result.executionTime.count() << "ms" << std::endl;
            }
            std::cout << std::endl;
        }
        
        saveDetailedReport();
    }
    
    void saveDetailedReport() {
        debugLog("Saving detailed report", DEBUG_VERBOSE);
        std::string reportFile = buildDir + "/build_test_report.txt";
        std::ofstream report(reportFile);
        if (report.is_open()) {
            report << "RawrZ Framework - Build Test Report" << std::endl;
            report << "Generated: " << getCurrentTimestamp() << std::endl;
            report << "Debug Level: " << debugLevel << std::endl;
            report << std::string(60, '=') << std::endl << std::endl;
            
            for (const auto& result : testResults) {
                report << "Configuration: " << result.configName << std::endl;
                report << "Build Success: " << (result.buildSuccess ? "Yes" : "No") << std::endl;
                report << "Execution Success: " << (result.executionSuccess ? "Yes" : "No") << std::endl;
                report << "Build Time: " << result.buildTime.count() << "ms" << std::endl;
                if (result.executionSuccess) {
                    report << "Execution Time: " << result.executionTime.count() << "ms" << std::endl;
                }
                if (!result.errorMessage.empty()) {
                    report << "Error: " << result.errorMessage << std::endl;
                }
                if (!result.buildOutput.empty()) {
                    report << "Build Output: " << result.buildOutput << std::endl;
                }
                if (!result.executionOutput.empty()) {
                    report << "Execution Output: " << result.executionOutput << std::endl;
                }
                report << std::string(40, '-') << std::endl;
            }
            
            report.close();
            std::cout << "Detailed report saved to: " << reportFile << std::endl;
            debugLog("Detailed report saved to: " + reportFile, DEBUG_BASIC);
        } else {
            debugLog("Failed to save detailed report", DEBUG_BASIC);
        }
    }
};

int main(int argc, char* argv[]) {
    DebugLevel debugLevel = DEBUG_BASIC;
    bool fileLogging = true;
    
    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "--verbose" || arg == "-v") {
            debugLevel = DEBUG_VERBOSE;
        } else if (arg == "--extreme" || arg == "-e") {
            debugLevel = DEBUG_EXTREME;
        } else if (arg == "--no-log" || arg == "-n") {
            fileLogging = false;
        } else if (arg == "--help" || arg == "-h") {
            std::cout << "RawrZ Automated Build Tester" << std::endl;
            std::cout << "Usage: " << argv[0] << " [options]" << std::endl;
            std::cout << "Options:" << std::endl;
            std::cout << "  --verbose, -v    Enable verbose debugging" << std::endl;
            std::cout << "  --extreme, -e    Enable extreme debugging" << std::endl;
            std::cout << "  --no-log, -n     Disable file logging" << std::endl;
            std::cout << "  --help, -h       Show this help message" << std::endl;
            return 0;
        }
    }
    
    try {
        std::cout << "RawrZ Framework - Automated Build Testing" << std::endl;
        std::cout << "Debug Level: " << debugLevel << std::endl;
        std::cout << "File Logging: " << (fileLogging ? "Enabled" : "Disabled") << std::endl;
        
        AutomatedBuildTester tester(debugLevel, fileLogging);
        tester.runAllTests();
        
        std::cout << "\nBuild testing completed!" << std::endl;
        std::cout << "Check the 'builds' folder for executables and reports." << std::endl;
        if (fileLogging) {
            std::cout << "Debug log saved to: debug_build_test.log" << std::endl;
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}
