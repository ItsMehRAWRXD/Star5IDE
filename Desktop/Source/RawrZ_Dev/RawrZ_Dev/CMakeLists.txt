cmake_minimum_required(VERSION 3.16)
project(FileSystemGenerator)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(PkgConfig REQUIRED)

# Set compiler flags
if(MSVC)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /W4")
else()
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -Wpedantic")
endif()

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR})

# Source files
set(SOURCES
    FileSystemGenerator.cpp
)

# Create executable
add_executable(FileSystemGenerator ${SOURCES})

# Link libraries
if(WIN32)
    target_link_libraries(FileSystemGenerator 
        crypt32
        shell32
        advapi32
    )
endif()

# Set output directory
set_target_properties(FileSystemGenerator PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
)

# Install target
install(TARGETS FileSystemGenerator
    RUNTIME DESTINATION bin
)
