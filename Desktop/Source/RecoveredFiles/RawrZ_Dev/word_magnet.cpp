#include <windows.h>
#include <string>
#include <vector>
#include <map>

class WordMagnet {
private:
    std::map<std::string, int> magnetWords = {
        {"flag", 10},
        {"target", 8},
        {"enemy", 9},
        {"weapon", 7},
        {"health", 6},
        {"ammo", 5},
        {"bomb", 10},
        {"defuse", 9},
        {"plant", 8},
        {"rush", 7}
    };
    
public:
    bool CheckWordMagnet(const std::string& text) {
        for (const auto& word : magnetWords) {
            if (text.find(word.first) != std::string::npos) {
                return true;
            }
        }
        return false;
    }
    
    int GetMagnetStrength(const std::string& text) {
        int strength = 0;
        for (const auto& word : magnetWords) {
            if (text.find(word.first) != std::string::npos) {
                strength += word.second;
            }
        }
        return strength;
    }
    
    std::vector<std::string> ExtractMagnetWords(const std::string& text) {
        std::vector<std::string> found;
        for (const auto& word : magnetWords) {
            if (text.find(word.first) != std::string::npos) {
                found.push_back(word.first);
            }
        }
        return found;
    }
};