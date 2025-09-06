#include "Agent.h"
#include <windows.h>
#include <string>
#include <vector>

// External Access Layer
enum ExternalCommand {
    EXT_OPEN_FILE,
    EXT_INSERT_TEXT,
    EXT_GET_TEXT,
    EXT_RUN_COMMAND,
    EXT_LIST_FILES
};

void HandleExternalCommand(HWND hwnd, ExternalCommand cmd, const std::wstring& payload) {
    AgentContext ctx{}; ctx.hwnd = hwnd; ctx.mode = 0; // control mode
    switch (cmd) {
        case EXT_OPEN_FILE:
            AgentHandleCommand(&ctx, AGENT_OPEN_FILE, payload);
            break;
        case EXT_INSERT_TEXT:
            AgentHandleCommand(&ctx, AGENT_INSERT_TEXT, payload);
            break;
        case EXT_GET_TEXT:
            AgentHandleCommand(&ctx, AGENT_GET_TEXT, L"");
            // TODO: send back via pipe/socket if needed
            break;
        case EXT_RUN_COMMAND:
            AgentHandleCommand(&ctx, AGENT_RUN_CMD, payload);
            break;
        case EXT_LIST_FILES:
            AgentHandleCommand(&ctx, AGENT_LIST_TABS, L"");
            // TODO: send names back via pipe/socket if needed
            break;
    }
}

// Named Pipe Server for external access
DWORD WINAPI ExternalServerThread(LPVOID lpParam) {
    HWND hwnd = (HWND)lpParam;
    HANDLE hPipe = CreateNamedPipe(
        L"\\.\pipe\ScreenPilotIDE",
        PIPE_ACCESS_DUPLEX,
        PIPE_TYPE_MESSAGE | PIPE_READMODE_MESSAGE | PIPE_WAIT,
        1, 1024, 1024, 0, NULL);

    ConnectNamedPipe(hPipe, NULL);

    wchar_t buffer[510]; // Prevent buffer overrun (was 512, now 510 for null terminator)
    DWORD read;
    while (ReadFile(hPipe, buffer, sizeof(buffer)-sizeof(wchar_t), &read, NULL)) {
        buffer[read/sizeof(wchar_t)] = 0;
        std::wstring msg(buffer);
        if (msg.rfind(L"OPEN:", 0) == 0) {
            HandleExternalCommand(hwnd, EXT_OPEN_FILE, msg.substr(5));
        } else if (msg.rfind(L"INSERT:", 0) == 0) {
            HandleExternalCommand(hwnd, EXT_INSERT_TEXT, msg.substr(7));
        } else if (msg == L"GETTEXT") {
            HandleExternalCommand(hwnd, EXT_GET_TEXT, L"");
        } else if (msg.rfind(L"RUN:", 0) == 0) {
            HandleExternalCommand(hwnd, EXT_RUN_COMMAND, msg.substr(4));
        } else if (msg == L"LISTFILES") {
            HandleExternalCommand(hwnd, EXT_LIST_FILES, L"");
        }
        // Add more mappings as needed
    }
    return 0;
}

// To start the server, call:
// CreateThread(NULL, 0, ExternalServerThread, hwnd, 0, NULL);
// from your main window initialization.

void LoadFileIntoEdit(HWND hEdit, const std::wstring& path);
void AppendEditorText(HWND hwnd, const std::wstring& text);
std::wstring GetEditorText(HWND hwnd);
void WriteToTerminal(const std::wstring& text);
extern std::vector<OpenFileInfo> gOpenFiles;
