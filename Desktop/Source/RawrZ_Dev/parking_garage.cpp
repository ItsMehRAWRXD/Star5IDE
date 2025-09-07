#include <windows.h>
#include <vector>

struct ParkingSpot {
    int id;
    bool occupied;
    bool handicapped;
    bool lounge;
    int floor;
};

class ParkingGarage {
private:
    std::vector<ParkingSpot> spots;
    int totalFloors = 5;
    int spotsPerFloor = 50;
    
public:
    void InitializeGarage() {
        for (int floor = 1; floor <= totalFloors; floor++) {
            for (int spot = 1; spot <= spotsPerFloor; spot++) {
                ParkingSpot ps;
                ps.id = (floor * 100) + spot;
                ps.occupied = false;
                ps.handicapped = (spot <= 5);
                ps.lounge = (spot >= 46);
                ps.floor = floor;
                spots.push_back(ps);
            }
        }
    }
    
    int FindAvailableSpot(bool needHandicapped = false, bool preferLounge = false) {
        for (auto& spot : spots) {
            if (!spot.occupied) {
                if (needHandicapped && spot.handicapped) return spot.id;
                if (preferLounge && spot.lounge) return spot.id;
                if (!needHandicapped && !preferLounge) return spot.id;
            }
        }
        return -1;
    }
    
    bool ParkVehicle(int spotId) {
        for (auto& spot : spots) {
            if (spot.id == spotId && !spot.occupied) {
                spot.occupied = true;
                return true;
            }
        }
        return false;
    }
    
    void LeaveSpot(int spotId) {
        for (auto& spot : spots) {
            if (spot.id == spotId) {
                spot.occupied = false;
                break;
            }
        }
    }
    
    int GetAvailableSpots() {
        int count = 0;
        for (const auto& spot : spots) {
            if (!spot.occupied) count++;
        }
        return count;
    }
};