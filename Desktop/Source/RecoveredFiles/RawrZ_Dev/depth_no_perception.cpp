#include <windows.h>

class DepthNoPerception {
private:
    int depthLayers[10] = {0};
    bool perceptionBlocked = true;
    
public:
    void AddDepthLayer(int layer, int value) {
        if (layer >= 0 && layer < 10) {
            depthLayers[layer] = value;
        }
    }
    
    void BlockPerception() {
        perceptionBlocked = true;
        // Zero all perception channels
        for (int i = 0; i < 10; i++) {
            depthLayers[i] = 0;
        }
    }
    
    int GetDepth(int layer) {
        if (perceptionBlocked) return 0;
        return depthLayers[layer];
    }
    
    bool HasDepthWithoutPerception() {
        return perceptionBlocked;
    }
};