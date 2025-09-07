Write-Host "Building FileSystemGenerator..." -ForegroundColor Green

# Try to build with C++17 filesystem support
try {
    Write-Host "Attempting C++17 build..." -ForegroundColor Yellow
    & g++ -std=c++17 -c FileSystemGenerator.cpp -o FileSystemGenerator.o
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Compilation successful!" -ForegroundColor Green
        Write-Host "Creating executable..." -ForegroundColor Yellow
        
        & g++ -std=c++17 FileSystemGenerator.o -o FileSystemGenerator.exe -lstdc++fs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Build completed successfully!" -ForegroundColor Green
            Write-Host "Executable: FileSystemGenerator.exe" -ForegroundColor Cyan
        } else {
            Write-Host "Failed to create executable" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "C++17 build failed, trying alternative approach..." -ForegroundColor Yellow
    
    # Try with experimental filesystem
    try {
        & g++ -std=c++17 -c FileSystemGenerator.cpp -o FileSystemGenerator.o -D_GLIBCXX_USE_CXX11_ABI=0
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Compilation with experimental filesystem successful!" -ForegroundColor Green
            Write-Host "Creating executable..." -ForegroundColor Yellow
            
            & g++ -std=c++17 FileSystemGenerator.o -o FileSystemGenerator.exe -lstdc++fs
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Build completed successfully!" -ForegroundColor Green
                Write-Host "Executable: FileSystemGenerator.exe" -ForegroundColor Cyan
                Write-Host "Executable: FileSystemGenerator.exe" -ForegroundColor Cyan
            } else {
                Write-Host "Failed to create executable" -ForegroundColor Red
            }
        } else {
            Write-Host "All compilation attempts failed!" -ForegroundColor Red
        }
    } catch {
        Write-Host "All compilation attempts failed!" -ForegroundColor Red
    }
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
