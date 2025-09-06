#include "Agent.h"
#include <windows.h>
#include <string>
#include <vector>
#include <fstream>

// Why: Add agent support for automating self-contained builds and interactive Ask mode.
// What: Add AGENT_AUTOMATE_SELF_CONTAINED_BUILD command and AgentMode to AgentContext.
// Outcome: Agent can automate build settings and prompt user for confirmation.

enum AgentMode {
    AGENT_MODE_CONTROL,
    AGENT_MODE_ASK
};

// --- Scintilla interop (minimal, consistent with main.cpp usage) ---
#ifndef SCI_SETTEXT
#define SCI_SETTEXT 2181
#endif
#ifndef SCI_GETTEXT
#define SCI_GETTEXT 2182
#endif
#ifndef SCI_GETTEXTLENGTH
#define SCI_GETTEXTLENGTH 2183
#endif
#ifndef SCI_APPENDTEXT
#define SCI_APPENDTEXT 2282
#endif

static HWND FindVisibleScintilla(HWND hwndParent) {
    HWND child = NULL;
    while ((child = FindWindowExW(hwndParent, child, L"Scintilla", NULL)) != NULL) {
        if (IsWindowVisible(child)) return child;
    }
    return NULL;
}

// Dummy implementations for IDE API
void LoadFileIntoEdit(HWND hEdit, const std::wstring& path) {
    // Load file content into the currently visible Scintilla editor if available,
    // otherwise, fallback to provided handle.
    HWND hTarget = FindVisibleScintilla(GetParent(hEdit) ? GetParent(hEdit) : hEdit);
    if (!hTarget) hTarget = hEdit;
    std::wifstream in(path);
    if (!in.is_open()) {
        MessageBoxW(GetParent(hTarget) ? GetParent(hTarget) : hTarget,
                    (L"Could not open file: " + path).c_str(),
                    L"Agent Open File", MB_OK | MB_ICONWARNING);
        return;
    }
    std::wstring content, line;
    while (std::getline(in, line)) content += line + L"\r\n";
    SendMessageW(hTarget, SCI_SETTEXT, 0, (LPARAM)content.c_str());
}
void AppendEditorText(HWND hwnd, const std::wstring& text) {
    HWND hSci = FindVisibleScintilla(hwnd);
    if (!hSci) hSci = hwnd;
    int len = GetWindowTextLengthW(hSci);
    std::wstring buf(len + 1, L'\0');
    GetWindowTextW(hSci, &buf[0], len + 1);
    if (!buf.empty() && buf.back() == L'\0') buf.pop_back();
    buf += text;
    SendMessageW(hSci, SCI_SETTEXT, 0, (LPARAM)buf.c_str());
}
std::wstring GetEditorText(HWND hwnd) {
    HWND hSci = FindVisibleScintilla(hwnd);
    if (!hSci) hSci = hwnd;
    int len = GetWindowTextLengthW(hSci);
    if (len <= 0) return L"";
    std::wstring buf(len + 1, L'\0');
    GetWindowTextW(hSci, &buf[0], len + 1);
    if (!buf.empty() && buf.back() == L'\0') buf.pop_back();
    return buf;
}
void SetEditorText(HWND hwnd, const std::wstring& text) {
    HWND hSci = FindVisibleScintilla(hwnd);
    if (!hSci) hSci = hwnd;
    SendMessageW(hSci, SCI_SETTEXT, 0, (LPARAM)text.c_str());
}
void WriteToTerminal(const std::wstring& text) {
    // TODO: Implement terminal output logic
}
void SaveFile(HWND hwnd, const std::wstring& path) {
    HWND hSci = FindVisibleScintilla(hwnd);
    if (!hSci) hSci = hwnd;
    int len = GetWindowTextLengthW(hSci);
    std::wstring buf(len + 1, L'\0');
    GetWindowTextW(hSci, &buf[0], len + 1);
    std::wofstream out(path);
    if (!out.is_open()) {
        MessageBoxW(hwnd, (L"Could not write file: " + path).c_str(), L"Agent Save File", MB_OK | MB_ICONERROR);
        return;
    }
    out << buf.c_str();
    MessageBoxW(hwnd, (L"Saved to: " + path).c_str(), L"Agent Save File", MB_OK | MB_ICONINFORMATION);
}
void ChangeLayout(const std::wstring& layoutName) {
    // Stub: record layout name. Real implementation would change dock layout.
    static std::wstring currentLayout;
    currentLayout = layoutName;
}
void ShowDialog(HWND hwnd, int dialogId) {
    std::wstring msg = L"Dialog requested: " + std::to_wstring(dialogId);
    MessageBoxW(hwnd, msg.c_str(), L"Agent Show Dialog (stub)", MB_OK | MB_ICONINFORMATION);
}
void SelectTab(HWND hwnd, int tabIndex) {
    // Stub: inform user. Wiring tabs requires access to the tab control.
    std::wstring msg = L"Select Tab index: " + std::to_wstring(tabIndex);
    MessageBoxW(hwnd, msg.c_str(), L"Agent Select Tab (stub)", MB_OK | MB_ICONINFORMATION);
}
std::wstring GetCurrentLayout() {
    static std::wstring currentLayout = L"Default";
    return currentLayout;
}
void SetCurrentLayout(const std::wstring& layoutName) {
    ChangeLayout(layoutName);
}

std::vector<OpenFileInfo> gOpenFiles;

void AutomateSelfContainedBuild(HWND hwnd) {
    // Why: Automate static linking for self-contained EXE builds.
    // What: Would update project settings to use /MT (stub here).
    // Outcome: Future builds will produce portable executables.
    MessageBox(hwnd, L"Automated self-contained build: Runtime Library set to /MT (stub)", L"Agent Build Automation", MB_OK);
}

void AgentHandleCommand(AgentContext* ctx, AgentCommand cmd, const std::wstring& payload) {
    if (ctx->mode == AGENT_MODE_ASK) {
        int res = MessageBox(ctx->hwnd, L"Agent asks: Perform this action?", L"Agent Ask", MB_YESNO);
        if (res != IDYES) return;
    }
    switch (cmd) {
        case AGENT_OPEN_FILE:
            LoadFileIntoEdit(GetDlgItem(ctx->hwnd, 0 /*IDC_MAIN_EDIT*/), payload);
            break;
        case AGENT_CLOSE_FILE:
            MessageBox(ctx->hwnd, L"Close File not implemented in this build.", L"Agent", MB_OK | MB_ICONWARNING);
            break;
        case AGENT_INSERT_TEXT:
            AppendEditorText(ctx->hwnd, payload);
            break;
        case AGENT_GET_TEXT: {
            std::wstring txt = GetEditorText(ctx->hwnd);
            MessageBox(ctx->hwnd, txt.c_str(), L"Agent ? Editor Text", MB_OK);
            break;
        }
        case AGENT_SET_TEXT:
            SetEditorText(ctx->hwnd, payload);
            break;
        case AGENT_RUN_CMD:
            WriteToTerminal(payload + L"\n");
            break;
        case AGENT_LIST_TABS: {
            std::wstring files;
            for (auto& f : gOpenFiles) files += f.path + L"\n";
            MessageBox(ctx->hwnd, files.c_str(), L"Agent ? Open Tabs", MB_OK);
            break;
        }
        case AGENT_SAVE_FILE:
            SaveFile(ctx->hwnd, payload);
            break;
        case AGENT_CHANGE_LAYOUT:
            ChangeLayout(payload);
            MessageBox(ctx->hwnd, (L"Layout changed to: " + payload).c_str(), L"Agent", MB_OK);
            break;
        case AGENT_SHOW_DIALOG: {
            int id = 0;
            try { id = std::stoi(payload); } catch (...) { id = 0; }
            ShowDialog(ctx->hwnd, id);
            break;
        }
        case AGENT_SELECT_TAB: {
            int idx = 0;
            try { idx = std::stoi(payload); } catch (...) { idx = 0; }
            SelectTab(ctx->hwnd, idx);
            break;
        }
        case AGENT_GET_LAYOUT: {
            auto layout = GetCurrentLayout();
            MessageBox(ctx->hwnd, layout.c_str(), L"Agent ? Current Layout", MB_OK);
            break;
        }
        case AGENT_SET_LAYOUT:
            SetCurrentLayout(payload);
            MessageBox(ctx->hwnd, (L"Layout set: " + payload).c_str(), L"Agent", MB_OK);
            break;
        case AGENT_AUTOMATE_SELF_CONTAINED_BUILD:
            AutomateSelfContainedBuild(ctx->hwnd);
            break;
        // ...repeat for other commands as needed...
    }
}

void RunAgent(AgentContext* ctx) {
    // Example: open a file, inject code, run a command, automate build
    AgentHandleCommand(ctx, AGENT_OPEN_FILE, L"C:\\temp\\demo.cpp");
    AgentHandleCommand(ctx, AGENT_INSERT_TEXT, L"\n// Added by Agent\n");
    AgentHandleCommand(ctx, AGENT_RUN_CMD, L"dir");
    AgentHandleCommand(ctx, AGENT_AUTOMATE_SELF_CONTAINED_BUILD, L"");
}
