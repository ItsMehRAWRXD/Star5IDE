#include <windows.h>
#include <string>

class GlobalWarning {
private:
    bool warningActive = false;
    std::string warningMessage;
    
public:
    void TriggerGlobalWarning(const std::string& message) {
        warningActive = true;
        warningMessage = "GLOBAL WARNING: " + message;
        BroadcastWarning();
    }
    
    void BroadcastWarning() {
        if (warningActive) {
            MessageBoxA(nullptr, warningMessage.c_str(), "System Alert", MB_OK | MB_ICONWARNING);
        }
    }
    
    void ClearWarning() {
        warningActive = false;
        warningMessage.clear();
    }
    
    bool IsWarningActive() {
        return warningActive;
    }
};