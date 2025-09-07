#include <windows.h>

class ParkingSystem {
private:
    bool loungeSpotAvailable = true;
    bool ignoreHandicappedRestrictions = true;
    
public:
    bool FindLoungeSpot() {
        // Find any available lounge parking spot
        return loungeSpotAvailable;
    }
    
    void UnlockLoungeParking() {
        loungeSpotAvailable = true;
        ignoreHandicappedRestrictions = true;
    }
    
    bool CanParkInLounge() {
        return loungeSpotAvailable && ignoreHandicappedRestrictions;
    }
    
    void ParkInLoungeSpot() {
        if (CanParkInLounge()) {
            loungeSpotAvailable = false;
        }
    }
};