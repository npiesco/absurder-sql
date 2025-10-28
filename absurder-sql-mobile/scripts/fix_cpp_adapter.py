#!/usr/bin/env python3
"""
Pre-build script to fix cpp-adapter.cpp for React Native 0.82 compatibility.
Replaces the uniffi-generated (broken) adapter with our RN 0.82-compatible version.
"""

import os
import shutil
from pathlib import Path

def main():
    # Get project root directory
    script_dir = Path(__file__).parent
    project_dir = script_dir.parent
    
    generated_adapter = project_dir / "android" / "cpp-adapter.cpp"
    custom_adapter = project_dir / "android" / "src" / "main" / "cpp" / "rn082-adapter.cpp"
    
    generated_initializer = project_dir / "android" / "cpp-initializer.cpp"
    custom_initializer = project_dir / "android" / "src" / "main" / "cpp" / "cpp-initializer.cpp"
    
    print(" Fixing cpp-adapter.cpp for React Native 0.82 compatibility...")
    
    # Check if custom adapter exists
    if not custom_adapter.exists():
        print(f" Error: Custom adapter not found at {custom_adapter}")
        return 1
    
    # Remove generated adapter if it exists
    if generated_adapter.exists():
        print(f"   Removing generated cpp-adapter.cpp...")
        generated_adapter.unlink()
    
    # Copy our RN 0.82-compatible adapter
    print(f"   Copying RN 0.82-compatible adapter...")
    shutil.copy2(custom_adapter, generated_adapter)
    
    print(" cpp-adapter.cpp fixed successfully")
    
    # Fix cpp-initializer.cpp
    print(" Adding cpp-initializer.cpp for Android path initialization...")
    
    # Check if custom initializer exists
    if not custom_initializer.exists():
        print(f" Error: Custom initializer not found at {custom_initializer}")
        return 1
    
    # Remove generated initializer if it exists
    if generated_initializer.exists():
        print(f"   Removing existing cpp-initializer.cpp...")
        generated_initializer.unlink()
    
    # Copy our custom initializer
    print(f"   Copying custom initializer...")
    shutil.copy2(custom_initializer, generated_initializer)
    
    print("cpp-initializer.cpp added successfully")
    
    # Patch CMakeLists.txt to include cpp-initializer.cpp
    print(" Patching CMakeLists.txt to include cpp-initializer.cpp...")
    cmake_file = project_dir / "android" / "CMakeLists.txt"
    
    if not cmake_file.exists():
        print(f" Error: CMakeLists.txt not found at {cmake_file}")
        return 1
    
    cmake_content = cmake_file.read_text()
    
    # Check if already patched
    if "cpp-initializer.cpp" in cmake_content:
        print("   CMakeLists.txt already includes cpp-initializer.cpp")
    else:
        # Add cpp-initializer.cpp after cpp-adapter.cpp
        cmake_content = cmake_content.replace(
            "    cpp-adapter.cpp\n)",
            "    cpp-adapter.cpp\n    cpp-initializer.cpp\n)"
        )
        cmake_file.write_text(cmake_content)
        print("   Added cpp-initializer.cpp to CMakeLists.txt")
    
    print(" CMakeLists.txt patched successfully")
    return 0

if __name__ == "__main__":
    exit(main())
