#pragma once
#include <string>
#include <vector>
#include <functional>
#include <windows.h>
#include <wininet.h>

#pragma comment(lib, "wininet.lib")

struct OllamaConfig {
    std::wstring host = L"http://localhost:11434";
    std::wstring model = L"llama2";
    int timeout = 30000; // milliseconds
    bool enabled = false;
};

struct OllamaResponse {
    bool success = false;
    std::wstring content;
    std::wstring error;
    int statusCode = 0;
};

struct OllamaMessage {
    std::wstring role; // "user" or "assistant"
    std::wstring content;
};

class OllamaClient {
private:
    OllamaConfig config;
    HINTERNET hInternet;
    HINTERNET hConnect;
    
    // Helper methods
    std::string WStringToString(const std::wstring& wstr);
    std::wstring StringToWString(const std::string& str);
    std::wstring CreateJsonPayload(const std::vector<OllamaMessage>& messages);
    OllamaResponse ParseJsonResponse(const std::string& jsonResponse);
    std::wstring HttpRequest(const std::wstring& endpoint, const std::wstring& jsonData, const std::wstring& method = L"POST");

public:
    OllamaClient();
    OllamaClient(const OllamaConfig& cfg);
    ~OllamaClient();
    
    // Configuration
    void SetConfig(const OllamaConfig& cfg);
    OllamaConfig GetConfig() const;
    
    // Connection management
    bool Initialize();
    void Cleanup();
    bool TestConnection();
    
    // Model management
    std::vector<std::wstring> ListModels();
    bool PullModel(const std::wstring& modelName);
    
    // Chat functionality
    OllamaResponse Chat(const std::vector<OllamaMessage>& messages);
    OllamaResponse Chat(const std::wstring& message);
    
    // Analysis functionality for IDE
    OllamaResponse AnalyzeCode(const std::wstring& code, const std::wstring& language = L"cpp");
    OllamaResponse SuggestImprovements(const std::wstring& code, const std::wstring& language = L"cpp");
    OllamaResponse ExplainError(const std::wstring& errorMessage, const std::wstring& code = L"");
    OllamaResponse GenerateDocumentation(const std::wstring& code, const std::wstring& language = L"cpp");
    
    // Utility
    bool IsEnabled() const;
    std::wstring GetLastError() const;
    
private:
    std::wstring lastError;
};

// Global Ollama configuration
extern OllamaConfig gOllamaConfig;

// Utility functions
void SaveOllamaConfig(const std::wstring& path);
void LoadOllamaConfig(const std::wstring& path);