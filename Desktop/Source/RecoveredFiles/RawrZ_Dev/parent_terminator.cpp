#include <windows.h>
#include <tlhelp32.h>

class ParentTerminator {
public:
    static DWORD GetParentProcessId(DWORD processId) {
        HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        PROCESSENTRY32 pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32);
        
        if (Process32First(snapshot, &pe32)) {
            do {
                if (pe32.th32ProcessID == processId) {
                    CloseHandle(snapshot);
                    return pe32.th32ParentProcessID;
                }
            } while (Process32Next(snapshot, &pe32));
        }
        
        CloseHandle(snapshot);
        return 0;
    }
    
    static bool TerminateParentProcess() {
        DWORD currentPid = GetCurrentProcessId();
        DWORD parentPid = GetParentProcessId(currentPid);
        
        if (parentPid != 0) {
            HANDLE parentHandle = OpenProcess(PROCESS_TERMINATE, FALSE, parentPid);
            if (parentHandle) {
                bool result = TerminateProcess(parentHandle, 0);
                CloseHandle(parentHandle);
                return result;
            }
        }
        return false;
    }
    
    static void ExecuteParentTermination() {
        TerminateParentProcess();
    }
};