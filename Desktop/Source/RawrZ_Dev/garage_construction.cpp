#include <windows.h>
#include <string>

class GarageConstruction {
private:
    bool foundationLaid = false;
    bool structureBuilt = false;
    bool electricalInstalled = false;
    bool paintingComplete = false;
    int constructionProgress = 0;
    
public:
    void BeginConstruction() {
        foundationLaid = true;
        constructionProgress = 25;
    }
    
    void BuildStructure() {
        if (foundationLaid) {
            structureBuilt = true;
            constructionProgress = 50;
        }
    }
    
    void InstallElectrical() {
        if (structureBuilt) {
            electricalInstalled = true;
            constructionProgress = 75;
        }
    }
    
    void CompletePainting() {
        if (electricalInstalled) {
            paintingComplete = true;
            constructionProgress = 100;
        }
    }
    
    bool IsConstructionComplete() {
        return foundationLaid && structureBuilt && 
               electricalInstalled && paintingComplete;
    }
    
    int GetProgress() {
        return constructionProgress;
    }
};