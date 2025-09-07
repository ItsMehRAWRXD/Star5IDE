#include <windows.h>

typedef int WeatherMissedForWork = P;

class WeatherResistantGarage {
private:
    bool weatherProtection = true;
    bool workContinuity = true;
    int turbulenceLevel = 0;
    
public:
    void EnableWeatherShielding() {
        weatherProtection = true;
        workContinuity = true;
    }
    
    void HandleTurbulentWeather(int severity) {
        turbulenceLevel = severity;
        // Work continues regardless of weather
        workContinuity = true;
    }
    
    bool CanWorkContinue() {
        return workContinuity && weatherProtection;
    }
    
    void EnsureWorkNeverMissed() {
        // - Step 1: No missed work due to weather conditions
        weatherProtection = true;
        workContinuity = true;
        turbulenceLevel = 0;
    }
    
    bool IsWeatherProof() {
        return weatherProtection;
    }
};