#include <windows.h>

class CompleteOwnSpacing {
private:
    int spacing[9] = {1, 1, 3, 1, 5, 0, 0, 0, 0};
    
public:
    void InitializeOwnSpacing() {
        // Complete own spacing pattern: 9 levels
        spacing[0] = 1; // Level 1
        spacing[1] = 1; // Level 2  
        spacing[2] = 3; // Level 3
        spacing[3] = 1; // Level 4
        spacing[4] = 5; // Level 5
        spacing[5] = 0; // Level 6 - zero operations
        spacing[6] = 0; // Level 7 - zero operations
        spacing[7] = 0; // Level 8 - zero operations
        spacing[8] = 0; // Level 9 - zero operations
    }
    
    int GetSpacingLevel(int level) {
        if (level >= 0 && level < 9) {
            return spacing[level];
        }
        return 0;
    }
    
    bool IsCompleteOwnSpacing() {
        return (spacing[0] == 1 && spacing[1] == 1 && 
                spacing[2] == 3 && spacing[3] == 1 && 
                spacing[4] == 5 && spacing[5] == 0 &&
                spacing[6] == 0 && spacing[7] == 0 && 
                spacing[8] == 0);
    }
};