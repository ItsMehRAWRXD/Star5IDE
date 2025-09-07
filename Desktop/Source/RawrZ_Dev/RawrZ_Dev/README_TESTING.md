# RawrZ Plugin Testing Suite

This directory contains comprehensive testing tools to verify that RawrZ plugins are working correctly.

## Test Programs

### 1. `test_fake_bot.cpp`
- **Purpose**: Simulates a malicious bot process
- **Behavior**: 
  - Scans for targets
  - Attempts network connections
  - Collects system information
  - Attempts privilege escalation
  - Creates suspicious files
  - Simulates keylogging
  - Attempts process injection
- **Use Case**: Test the **BotKiller** plugin

### 2. `test_fake_av.cpp`
- **Purpose**: Simulates an antivirus process
- **Behavior**:
  - Scans system files
  - Checks for suspicious processes
  - Updates threat definitions
  - Performs memory scans
  - Monitors network connections
  - Scans registry
  - Runs heuristic analysis
  - Simulates threat detections
- **Use Case**: Test the **AVKiller** plugin

### 3. `test_multiple_threats.cpp`
- **Purpose**: Simulates multiple threat types simultaneously
- **Threats Created**:
  - 2 bot processes (NetworkBot_v1.0, DataHarvester_v2.1)
  - 2 AV processes (SecuritySuite_Pro, DefenderPlus_Ultra)
  - 1 keylogger process (KeyCapture_Stealth)
  - 1 ransomware process (CryptoLocker_2024)
- **Use Case**: Test multiple plugins at once

### 4. `test_suite.cpp`
- **Purpose**: Comprehensive testing of all plugins
- **Tests**: All 13 RawrZ plugins + core functionality
- **Output**: Detailed test results and logs

## Quick Start

### Option 1: Use the Comprehensive Test Runner
1. Run `run_comprehensive_tests.bat`
2. Choose option 1 to compile all programs
3. Choose option 2-4 to test specific scenarios
4. Use RawrZ plugins to kill the fake processes
5. Return to check if processes were terminated

### Option 2: Manual Testing
1. Compile the test programs:
   ```bash
   g++ -std=c++17 -o fake_bot.exe test_fake_bot.cpp -lws2_32
   g++ -std=c++17 -o fake_av.exe test_fake_av.cpp -lws2_32
   g++ -std=c++17 -o multiple_threats.exe test_multiple_threats.cpp -lws2_32
   ```

2. Run fake processes:
   ```bash
   start fake_bot.exe
   start fake_av.exe
   ```

3. Test RawrZ plugins:
   - Open RawrZ
   - Use BotKiller plugin to kill fake bot processes
   - Use AVKiller plugin to kill fake AV processes

4. Verify results:
   ```bash
   tasklist | findstr "fake_bot"
   tasklist | findstr "fake_av"
   ```

## Testing Scenarios

### Scenario 1: Individual Bot Testing
1. Start `fake_bot.exe`
2. Note the process ID (PID)
3. Use RawrZ BotKiller plugin
4. Verify the process is terminated

### Scenario 2: Individual AV Testing
1. Start `fake_av.exe`
2. Note the process ID (PID)
3. Use RawrZ AVKiller plugin
4. Verify the process is terminated

### Scenario 3: Multiple Threats Testing
1. Start `multiple_threats.exe`
2. This creates 6 different threat processes
3. Test various RawrZ plugins:
   - BotKiller for bot processes
   - AVKiller for AV processes
   - Other plugins as needed
4. Monitor the console window for status updates

### Scenario 4: Comprehensive Testing
1. Run `test_suite.exe`
2. This tests all plugins systematically
3. Check `test_results.log` for detailed results

## Expected Results

### Successful Plugin Operation
- Fake processes are terminated
- Process list shows no matching processes
- RawrZ reports successful termination
- No error messages in RawrZ

### Failed Plugin Operation
- Fake processes continue running
- Process list still shows the processes
- RawrZ may show error messages
- Check plugin configuration and permissions

## Troubleshooting

### Common Issues

1. **Process Not Found**
   - Ensure the fake process is running
   - Check process name in Task Manager
   - Verify PID is correct

2. **Permission Denied**
   - Run RawrZ as Administrator
   - Check Windows Defender settings
   - Verify plugin permissions

3. **Process Not Terminated**
   - Check plugin configuration
   - Verify target process selection
   - Review plugin error messages

4. **Compilation Errors**
   - Ensure MinGW/GCC is installed
   - Check C++17 support
   - Verify Windows SDK installation

### Debug Information

- Check `test_results.log` for detailed test results
- Monitor console output from fake processes
- Use Task Manager to verify process status
- Check RawrZ plugin output and error messages

## File Structure

```
RawrZ_Dev/
├── test_fake_bot.cpp          # Fake bot simulator
├── test_fake_av.cpp           # Fake AV simulator
├── test_multiple_threats.cpp  # Multiple threats simulator
├── test_suite.cpp             # Comprehensive test suite
├── run_comprehensive_tests.bat # Test runner script
├── test_plugins_live.bat      # Simple test script
└── README_TESTING.md          # This file
```

## Safety Notes

⚠️ **IMPORTANT**: These are TEST programs only!
- They simulate malicious behavior but are harmless
- They create temporary files that are automatically cleaned up
- They do not perform actual malicious activities
- They are designed for testing RawrZ plugins in a safe environment

## Next Steps

After successful testing:
1. Verify all plugins work correctly
2. Test with real RawrZ functionality
3. Document any issues found
4. Refine plugin configurations as needed

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review plugin configuration in RawrZ
3. Check Windows Event Viewer for system errors
4. Verify all dependencies are installed

---

**Happy Testing!** 🧪🔬
