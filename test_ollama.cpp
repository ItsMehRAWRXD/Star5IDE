#include <iostream>
#include <windows.h>
#include "OllamaClient.h"
#include "Config.h"

int main() {
    std::wcout << L"Ollama Connection Test\n";
    std::wcout << L"=====================\n\n";
    
    // Initialize configuration with default values
    OllamaConfig config;
    config.enabled = true;
    config.host = L"http://localhost:11434";
    config.model = L"llama2";
    config.timeout = 30000;
    
    std::wcout << L"Testing connection to: " << config.host << L"\n";
    std::wcout << L"Using model: " << config.model << L"\n\n";
    
    OllamaClient client(config);
    
    // Test connection
    std::wcout << L"Testing connection...\n";
    if (client.TestConnection()) {
        std::wcout << L"✓ Successfully connected to Ollama!\n\n";
        
        // List available models
        std::wcout << L"Available models:\n";
        std::vector<std::wstring> models = client.ListModels();
        
        if (models.empty()) {
            std::wcout << L"  (No models found - you may need to pull a model)\n";
        } else {
            for (const auto& model : models) {
                std::wcout << L"  • " << model << L"\n";
            }
        }
        
        // Test a simple chat
        std::wcout << L"\nTesting chat functionality...\n";
        OllamaResponse response = client.Chat(L"Hello! Can you help me with C++ programming?");
        
        if (response.success) {
            std::wcout << L"✓ Chat test successful!\n";
            std::wcout << L"Response: " << response.content.substr(0, 100) << L"...\n";
        } else {
            std::wcout << L"✗ Chat test failed: " << response.error << L"\n";
        }
        
        // Test code analysis
        std::wcout << L"\nTesting code analysis...\n";
        std::wstring sampleCode = L"int main() { int x = 5; return x; }";
        OllamaResponse analysisResponse = client.AnalyzeCode(sampleCode, L"cpp");
        
        if (analysisResponse.success) {
            std::wcout << L"✓ Code analysis test successful!\n";
        } else {
            std::wcout << L"✗ Code analysis failed: " << analysisResponse.error << L"\n";
        }
        
    } else {
        std::wcout << L"✗ Failed to connect to Ollama\n";
        std::wcout << L"Error: " << client.GetLastError() << L"\n\n";
        std::wcout << L"Please check:\n";
        std::wcout << L"  • Ollama is installed and running\n";
        std::wcout << L"  • Host URL is correct\n";
        std::wcout << L"  • Network connectivity\n";
        std::wcout << L"  • Firewall settings\n";
    }
    
    std::wcout << L"\nPress any key to exit...";
    std::cin.get();
    
    return 0;
}