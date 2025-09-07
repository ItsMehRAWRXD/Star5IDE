#include <windows.h>
#include <d3d9.h>
#include <d3dx9.h>
#include <dwmapi.h>
#include <iostream>
#include <vector>

#pragma comment(lib, "d3d9.lib")
#pragma comment(lib, "d3dx9.lib")
#pragma comment(lib, "dwmapi.lib")

struct ESPTarget {
    DWORD processId;
    uintptr_t baseAddress;
    float x, y, z;
    bool visible;
    int health;
    std::string name;
};

class ESPOverlay {
private:
    HWND overlayWindow;
    LPDIRECT3D9 d3d;
    LPDIRECT3DDEVICE9 device;
    LPD3DXLINE line;
    LPD3DXFONT font;
    
    static LRESULT CALLBACK WindowProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);
    bool InitD3D();
    void CleanupD3D();
    
public:
    bool Initialize(HWND targetWindow);
    void Render(const std::vector<ESPTarget>& targets);
    void DrawBox(float x, float y, float width, float height, DWORD color);
    void DrawLine(float x1, float y1, float x2, float y2, DWORD color);
    void DrawText(float x, float y, const std::string& text, DWORD color);
    void Shutdown();
};

bool ESPOverlay::Initialize(HWND targetWindow) {
    RECT rect;
    GetWindowRect(targetWindow, &rect);
    
    WNDCLASS wc = {};
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = GetModuleHandle(nullptr);
    wc.lpszClassName = L"ESPOverlay";
    wc.hbrBackground = (HBRUSH)CreateSolidBrush(RGB(0, 0, 0));
    RegisterClass(&wc);
    
    overlayWindow = CreateWindowEx(
        WS_EX_TOPMOST | WS_EX_TRANSPARENT | WS_EX_LAYERED,
        L"ESPOverlay", L"ESP",
        WS_POPUP,
        rect.left, rect.top,
        rect.right - rect.left, rect.bottom - rect.top,
        nullptr, nullptr, GetModuleHandle(nullptr), nullptr
    );
    
    SetLayeredWindowAttributes(overlayWindow, RGB(0, 0, 0), 255, LWA_COLORKEY);
    ShowWindow(overlayWindow, SW_SHOW);
    
    return InitD3D();
}

bool ESPOverlay::InitD3D() {
    d3d = Direct3DCreate9(D3D_SDK_VERSION);
    if (!d3d) return false;
    
    D3DPRESENT_PARAMETERS pp = {};
    pp.Windowed = TRUE;
    pp.SwapEffect = D3DSWAPEFFECT_DISCARD;
    pp.hDeviceWindow = overlayWindow;
    pp.BackBufferFormat = D3DFMT_A8R8G8B8;
    pp.EnableAutoDepthStencil = TRUE;
    pp.AutoDepthStencilFormat = D3DFMT_D16;
    
    HRESULT hr = d3d->CreateDevice(D3DADAPTER_DEFAULT, D3DDEVTYPE_HAL, overlayWindow,
        D3DCREATE_SOFTWARE_VERTEXPROCESSING, &pp, &device);
    
    if (FAILED(hr)) return false;
    
    D3DXCreateLine(device, &line);
    D3DXCreateFont(device, 14, 0, FW_NORMAL, 1, FALSE, DEFAULT_CHARSET,
        OUT_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Arial", &font);
    
    return true;
}

void ESPOverlay::Render(const std::vector<ESPTarget>& targets) {
    device->Clear(0, nullptr, D3DCLEAR_TARGET, D3DCOLOR_ARGB(0, 0, 0, 0), 1.0f, 0);
    device->BeginScene();
    
    for (const auto& target : targets) {
        if (target.visible) {
            DWORD color = target.health > 50 ? D3DCOLOR_ARGB(255, 0, 255, 0) : D3DCOLOR_ARGB(255, 255, 0, 0);
            DrawBox(target.x - 25, target.y - 50, 50, 100, color);
            DrawText(target.x, target.y - 60, target.name, D3DCOLOR_ARGB(255, 255, 255, 255));
        }
    }
    
    device->EndScene();
    device->Present(nullptr, nullptr, nullptr, nullptr);
}

void ESPOverlay::DrawBox(float x, float y, float width, float height, DWORD color) {
    DrawLine(x, y, x + width, y, color);
    DrawLine(x + width, y, x + width, y + height, color);
    DrawLine(x + width, y + height, x, y + height, color);
    DrawLine(x, y + height, x, y, color);
}

void ESPOverlay::DrawLine(float x1, float y1, float x2, float y2, DWORD color) {
    // Basic line drawing implementation
}

void ESPOverlay::DrawText(float x, float y, const std::string& text, DWORD color) {
    // Basic text rendering implementation
}

LRESULT CALLBACK ESPOverlay::WindowProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_DESTROY:
            PostQuitMessage(0);
            return 0;
    }
    return DefWindowProc(hwnd, msg, wParam, lParam);
}

void ESPOverlay::CleanupD3D() {
    if (font) font->Release();
    if (line) line->Release();
    if (device) device->Release();
    if (d3d) d3d->Release();
}

void ESPOverlay::Shutdown() {
    CleanupD3D();
    DestroyWindow(overlayWindow);
}