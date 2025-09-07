#include <windows.h>
#include <vector>
#include <map>

struct Flag {
    float x, y, z;
    int priority;
    bool visible;
    DWORD color;
    std::string label;
};

class FlagSystem {
private:
    std::vector<Flag> flags;
    std::map<int, bool> priorityLevels;
    
public:
    void AddFlag(float x, float y, float z, int priority, const std::string& label) {
        Flag flag = {x, y, z, priority, true, GetColorByPriority(priority), label};
        flags.push_back(flag);
    }
    
    void UpdateFlags() {
        for (auto& flag : flags) {
            flag.visible = priorityLevels[flag.priority];
        }
    }
    
    void SetPriorityVisible(int priority, bool visible) {
        priorityLevels[priority] = visible;
    }
    
    DWORD GetColorByPriority(int priority) {
        switch(priority) {
            case 1: return 0xFFFF0000; // Red - Critical
            case 2: return 0xFFFF8000; // Orange - High  
            case 3: return 0xFFFFFF00; // Yellow - Medium
            case 4: return 0xFF00FF00; // Green - Low
            default: return 0xFFFFFFFF; // White - Default
        }
    }
    
    std::vector<Flag> GetVisibleFlags() {
        std::vector<Flag> visible;
        for (const auto& flag : flags) {
            if (flag.visible) visible.push_back(flag);
        }
        return visible;
    }
};