#include "OllamaClient.h"
#include <iostream>
#include <sstream>
#include <fstream>
#include <codecvt>
#include <locale>

// Global Ollama configuration
OllamaConfig gOllamaConfig;

OllamaClient::OllamaClient() : hInternet(nullptr), hConnect(nullptr) {
    config = gOllamaConfig;
}

OllamaClient::OllamaClient(const OllamaConfig& cfg) : config(cfg), hInternet(nullptr), hConnect(nullptr) {
}

OllamaClient::~OllamaClient() {
    Cleanup();
}

void OllamaClient::SetConfig(const OllamaConfig& cfg) {
    config = cfg;
}

OllamaConfig OllamaClient::GetConfig() const {
    return config;
}

bool OllamaClient::Initialize() {
    if (!config.enabled) {
        lastError = L"Ollama client is disabled";
        return false;
    }
    
    hInternet = InternetOpen(L"IDEProject-OllamaClient/1.0", 
                            INTERNET_OPEN_TYPE_PRECONFIG, 
                            nullptr, nullptr, 0);
    
    if (!hInternet) {
        lastError = L"Failed to initialize WinINet";
        return false;
    }
    
    // Parse host URL to extract server and port
    std::wstring host = config.host;
    if (host.find(L"http://") == 0) {
        host = host.substr(7); // Remove "http://"
    } else if (host.find(L"https://") == 0) {
        host = host.substr(8); // Remove "https://"
    }
    
    size_t colonPos = host.find(L':');
    std::wstring server = host.substr(0, colonPos);
    INTERNET_PORT port = (colonPos != std::wstring::npos) ? 
                        static_cast<INTERNET_PORT>(_wtoi(host.substr(colonPos + 1).c_str())) : 
                        INTERNET_DEFAULT_HTTP_PORT;
    
    hConnect = InternetConnect(hInternet, server.c_str(), port, 
                              nullptr, nullptr, INTERNET_SERVICE_HTTP, 0, 0);
    
    if (!hConnect) {
        lastError = L"Failed to connect to Ollama server";
        Cleanup();
        return false;
    }
    
    return true;
}

void OllamaClient::Cleanup() {
    if (hConnect) {
        InternetCloseHandle(hConnect);
        hConnect = nullptr;
    }
    if (hInternet) {
        InternetCloseHandle(hInternet);
        hInternet = nullptr;
    }
}

bool OllamaClient::TestConnection() {
    if (!Initialize()) {
        return false;
    }
    
    try {
        std::wstring response = HttpRequest(L"/api/tags", L"", L"GET");
        return !response.empty();
    } catch (...) {
        lastError = L"Connection test failed";
        return false;
    }
}

std::vector<std::wstring> OllamaClient::ListModels() {
    std::vector<std::wstring> models;
    
    if (!Initialize()) {
        return models;
    }
    
    try {
        std::wstring response = HttpRequest(L"/api/tags", L"", L"GET");
        // Parse JSON response to extract model names
        // This is a simplified parser - in production, use a proper JSON library
        size_t pos = 0;
        while ((pos = response.find(L"\"name\":", pos)) != std::wstring::npos) {
            pos += 7; // Move past "name":
            size_t start = response.find(L'"', pos);
            if (start != std::wstring::npos) {
                start++;
                size_t end = response.find(L'"', start);
                if (end != std::wstring::npos) {
                    models.push_back(response.substr(start, end - start));
                }
            }
        }
    } catch (...) {
        lastError = L"Failed to list models";
    }
    
    return models;
}

bool OllamaClient::PullModel(const std::wstring& modelName) {
    if (!Initialize()) {
        return false;
    }
    
    try {
        std::wstring jsonData = L"{\"name\":\"" + modelName + L"\"}";
        std::wstring response = HttpRequest(L"/api/pull", jsonData);
        return !response.empty();
    } catch (...) {
        lastError = L"Failed to pull model: " + modelName;
        return false;
    }
}

OllamaResponse OllamaClient::Chat(const std::vector<OllamaMessage>& messages) {
    OllamaResponse result;
    
    if (!Initialize()) {
        result.error = lastError;
        return result;
    }
    
    try {
        std::wstring jsonData = CreateJsonPayload(messages);
        std::wstring response = HttpRequest(L"/api/chat", jsonData);
        
        if (!response.empty()) {
            result = ParseJsonResponse(WStringToString(response));
        } else {
            result.error = L"Empty response from server";
        }
    } catch (...) {
        result.error = L"Failed to send chat request";
    }
    
    return result;
}

OllamaResponse OllamaClient::Chat(const std::wstring& message) {
    std::vector<OllamaMessage> messages;
    OllamaMessage userMsg;
    userMsg.role = L"user";
    userMsg.content = message;
    messages.push_back(userMsg);
    
    return Chat(messages);
}

OllamaResponse OllamaClient::AnalyzeCode(const std::wstring& code, const std::wstring& language) {
    std::wstring prompt = L"As a code analysis expert, please analyze the following " + language + L" code:\n\n" +
                         code + L"\n\nProvide feedback on:\n" +
                         L"1. Code quality and structure\n" +
                         L"2. Potential issues or bugs\n" +
                         L"3. Performance considerations\n" +
                         L"4. Best practices compliance\n" +
                         L"5. Security concerns (if any)\n\n" +
                         L"Keep your analysis concise but thorough.";
    
    return Chat(prompt);
}

OllamaResponse OllamaClient::SuggestImprovements(const std::wstring& code, const std::wstring& language) {
    std::wstring prompt = L"Please suggest improvements for the following " + language + L" code:\n\n" +
                         code + L"\n\nFocus on:\n" +
                         L"1. Code readability and maintainability\n" +
                         L"2. Performance optimizations\n" +
                         L"3. Modern language features\n" +
                         L"4. Error handling\n" +
                         L"5. Code organization\n\n" +
                         L"Provide specific, actionable suggestions.";
    
    return Chat(prompt);
}

OllamaResponse OllamaClient::ExplainError(const std::wstring& errorMessage, const std::wstring& code) {
    std::wstring prompt = L"Please explain this compilation/runtime error:\n\n" +
                         errorMessage + L"\n\n";
    
    if (!code.empty()) {
        prompt += L"Related code:\n" + code + L"\n\n";
    }
    
    prompt += L"Please provide:\n" +
              L"1. What the error means\n" +
              L"2. Common causes\n" +
              L"3. How to fix it\n" +
              L"4. How to prevent similar errors\n\n" +
              L"Keep the explanation clear and practical.";
    
    return Chat(prompt);
}

OllamaResponse OllamaClient::GenerateDocumentation(const std::wstring& code, const std::wstring& language) {
    std::wstring prompt = L"Generate comprehensive documentation for the following " + language + L" code:\n\n" +
                         code + L"\n\nInclude:\n" +
                         L"1. Function/class descriptions\n" +
                         L"2. Parameter explanations\n" +
                         L"3. Return value descriptions\n" +
                         L"4. Usage examples\n" +
                         L"5. Any important notes or warnings\n\n" +
                         L"Format as standard code documentation comments.";
    
    return Chat(prompt);
}

bool OllamaClient::IsEnabled() const {
    return config.enabled;
}

std::wstring OllamaClient::GetLastError() const {
    return lastError;
}

// Helper methods implementation
std::string OllamaClient::WStringToString(const std::wstring& wstr) {
    if (wstr.empty()) return std::string();
    
    std::wstring_convert<std::codecvt_utf8<wchar_t>> converter;
    return converter.to_bytes(wstr);
}

std::wstring OllamaClient::StringToWString(const std::string& str) {
    if (str.empty()) return std::wstring();
    
    std::wstring_convert<std::codecvt_utf8<wchar_t>> converter;
    return converter.from_bytes(str);
}

std::wstring OllamaClient::CreateJsonPayload(const std::vector<OllamaMessage>& messages) {
    std::wstring json = L"{\"model\":\"" + config.model + L"\",\"messages\":[";
    
    for (size_t i = 0; i < messages.size(); ++i) {
        if (i > 0) json += L",";
        json += L"{\"role\":\"" + messages[i].role + L"\",\"content\":\"";
        
        // Escape quotes in content
        std::wstring escapedContent = messages[i].content;
        size_t pos = 0;
        while ((pos = escapedContent.find(L'"', pos)) != std::wstring::npos) {
            escapedContent.replace(pos, 1, L"\\\"");
            pos += 2;
        }
        
        json += escapedContent + L"\"}";
    }
    
    json += L"],\"stream\":false}";
    return json;
}

OllamaResponse OllamaClient::ParseJsonResponse(const std::string& jsonResponse) {
    OllamaResponse response;
    
    // Simple JSON parsing for Ollama response format
    // In production, use a proper JSON library like nlohmann/json
    
    std::wstring wjson = StringToWString(jsonResponse);
    
    // Look for "message":{"content":"..."}
    size_t messagePos = wjson.find(L"\"message\":");
    if (messagePos != std::wstring::npos) {
        size_t contentPos = wjson.find(L"\"content\":\"", messagePos);
        if (contentPos != std::wstring::npos) {
            contentPos += 11; // Move past "content":"
            size_t endPos = wjson.find(L'\"', contentPos);
            
            // Handle escaped quotes
            while (endPos != std::wstring::npos && endPos > 0 && wjson[endPos - 1] == L'\\') {
                endPos = wjson.find(L'\"', endPos + 1);
            }
            
            if (endPos != std::wstring::npos) {
                response.content = wjson.substr(contentPos, endPos - contentPos);
                response.success = true;
            }
        }
    }
    
    if (!response.success) {
        response.error = L"Failed to parse response";
    }
    
    return response;
}

std::wstring OllamaClient::HttpRequest(const std::wstring& endpoint, const std::wstring& jsonData, const std::wstring& method) {
    if (!hConnect) {
        lastError = L"Not connected to server";
        return L"";
    }
    
    DWORD flags = INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE;
    HINTERNET hRequest = HttpOpenRequest(hConnect, method.c_str(), endpoint.c_str(),
                                        nullptr, nullptr, nullptr, flags, 0);
    
    if (!hRequest) {
        lastError = L"Failed to create HTTP request";
        return L"";
    }
    
    // Set headers
    std::wstring headers = L"Content-Type: application/json\r\n";
    if (!HttpAddRequestHeaders(hRequest, headers.c_str(), static_cast<DWORD>(headers.length()), 
                              HTTP_ADDREQ_FLAG_ADD | HTTP_ADDREQ_FLAG_REPLACE)) {
        lastError = L"Failed to add headers";
        InternetCloseHandle(hRequest);
        return L"";
    }
    
    // Convert JSON data to bytes
    std::string jsonBytes = WStringToString(jsonData);
    
    // Send request
    if (!HttpSendRequest(hRequest, nullptr, 0, 
                        (LPVOID)jsonBytes.c_str(), static_cast<DWORD>(jsonBytes.length()))) {
        lastError = L"Failed to send HTTP request";
        InternetCloseHandle(hRequest);
        return L"";
    }
    
    // Read response
    std::string response;
    char buffer[4096];
    DWORD bytesRead;
    
    while (InternetReadFile(hRequest, buffer, sizeof(buffer), &bytesRead) && bytesRead > 0) {
        response.append(buffer, bytesRead);
    }
    
    InternetCloseHandle(hRequest);
    return StringToWString(response);
}

// Configuration functions
void SaveOllamaConfig(const std::wstring& path) {
    std::wofstream out(path, std::ios::app);
    if (!out.is_open()) return;
    
    out << L"\n# Ollama Configuration\n";
    out << L"ollamaEnabled=" << (gOllamaConfig.enabled ? L"1" : L"0") << L"\n";
    out << L"ollamaHost=" << gOllamaConfig.host << L"\n";
    out << L"ollamaModel=" << gOllamaConfig.model << L"\n";
    out << L"ollamaTimeout=" << gOllamaConfig.timeout << L"\n";
}

void LoadOllamaConfig(const std::wstring& path) {
    std::wifstream in(path);
    if (!in.is_open()) return;
    
    std::wstring line;
    while (std::getline(in, line)) {
        if (line.find(L"ollamaEnabled=") == 0) {
            gOllamaConfig.enabled = (line.substr(14) == L"1");
        } else if (line.find(L"ollamaHost=") == 0) {
            gOllamaConfig.host = line.substr(11);
        } else if (line.find(L"ollamaModel=") == 0) {
            gOllamaConfig.model = line.substr(12);
        } else if (line.find(L"ollamaTimeout=") == 0) {
            gOllamaConfig.timeout = _wtoi(line.substr(14).c_str());
        }
    }
}