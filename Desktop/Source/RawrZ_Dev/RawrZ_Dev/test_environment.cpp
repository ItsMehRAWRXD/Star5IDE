#include "test_environment.h"
#include <sstream>
#include <iomanip>

TestConfig g_testConfig;
std::vector<TestResult> testResults;

void logTest(const std::string& message, const std::string& level) {
    if (g_testConfig.verbose) {
        std::cout << "[" << level << "] " << message << std::endl;
    }
    
    std::ofstream logFile(g_testConfig.logFile, std::ios::app);
    if (logFile) {
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        logFile << "[" << std::ctime(&time_t) << "] [" << level << "] " << message << std::endl;
        logFile.close();
    }
}

bool runTest(const std::string& testName, std::function<bool()> testFunc) {
    logTest("Starting test: " + testName);
    
    auto start = std::chrono::high_resolution_clock::now();
    bool result = false;
    std::string message;
    
    try {
        result = testFunc();
        message = result ? "PASSED" : "FAILED";
    } catch (const std::exception& e) {
        result = false;
        message = "ERROR: " + std::string(e.what());
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
    
    TestResult testResult{testName, result, message, duration};
    testResults.push_back(testResult);
    
    logTest("Test " + testName + ": " + message + " (" + std::to_string(duration.count()) + "ms)");
    
    if (!result && g_testConfig.stopOnError) {
        logTest("Stopping on first failure", "ERROR");
        return false;
    }
    
    return result;
}

void generateTestReport() {
    logTest("=== Test Results Summary ===", "INFO");
    
    int passedTests = 0;
    int totalTests = testResults.size();
    
    for (const auto& result : testResults) {
        if (result.passed) passedTests++;
        
        std::string status = result.passed ? "PASS" : "FAIL";
        logTest(status + " - " + result.testName + ": " + result.message);
    }
    
    logTest("=== Final Results ===", "INFO");
    logTest("Total Tests: " + std::to_string(totalTests));
    logTest("Passed: " + std::to_string(passedTests));
    logTest("Failed: " + std::to_string(totalTests - passedTests));
    
    if (totalTests > 0) {
        logTest("Success Rate: " + std::to_string((passedTests * 100) / totalTests) + "%");
    }
}
