#!/usr/bin/env python3
"""
iOS Build Script for AbsurderSQL Mobile
Builds static libraries for all iOS architectures and creates XCFramework
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'


def run_command(cmd: list, cwd: Path = None) -> tuple[int, str]:
    """Run command and return (exit_code, output)"""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=False
        )
        return result.returncode, result.stdout + result.stderr
    except Exception as e:
        return 1, str(e)


def build_ios():
    """Build iOS static libraries and XCFramework"""
    print(f"{Colors.BLUE}🍎 Building AbsurderSQL for iOS...{Colors.END}\n")
    
    # Configuration
    project_dir = Path(__file__).parent.parent
    build_dir = project_dir / "build" / "ios"
    lib_name = "libabsurder_sql_mobile.a"
    
    # Clean build directory
    if build_dir.exists():
        shutil.rmtree(build_dir)
    build_dir.mkdir(parents=True)
    
    # Target architectures
    targets = [
        ("aarch64-apple-ios", "📱 ARM64 device"),
        ("x86_64-apple-ios", "💻 x86_64 simulator"),
        ("aarch64-apple-ios-sim", "🖥️  Apple Silicon simulator"),
    ]
    
    # Build for each architecture
    for target, description in targets:
        print(f"{Colors.YELLOW}{description} ({target})...{Colors.END}")
        
        exit_code, output = run_command(
            ["cargo", "build", "--release", "--features", "fs_persist", f"--target={target}"],
            cwd=project_dir
        )
        
        if exit_code != 0:
            print(f"{Colors.RED}✗ Build failed for {target}{Colors.END}")
            print(output)
            return exit_code
        
        # Copy library to build directory
        target_dir = build_dir / target
        target_dir.mkdir(parents=True, exist_ok=True)
        
        lib_path = project_dir / "target" / target / "release" / lib_name
        shutil.copy(lib_path, target_dir / lib_name)
        
        print(f"{Colors.GREEN}✓ Built {target}{Colors.END}")
    
    # Create universal simulator library
    print(f"\n{Colors.YELLOW}🔨 Creating universal simulator library...{Colors.END}")
    
    universal_dir = build_dir / "universal-sim"
    universal_dir.mkdir(parents=True, exist_ok=True)
    
    exit_code, output = run_command([
        "lipo", "-create",
        str(build_dir / "x86_64-apple-ios" / lib_name),
        str(build_dir / "aarch64-apple-ios-sim" / lib_name),
        "-output", str(universal_dir / lib_name)
    ])
    
    if exit_code != 0:
        print(f"{Colors.RED}✗ Failed to create universal library{Colors.END}")
        print(output)
        return exit_code
    
    print(f"{Colors.GREEN}✓ Created universal simulator library{Colors.END}")
    
    # Create XCFramework
    print(f"\n{Colors.YELLOW}📦 Creating XCFramework...{Colors.END}")
    
    xcframework_path = build_dir / "AbsurderSQL.xcframework"
    
    exit_code, output = run_command([
        "xcodebuild", "-create-xcframework",
        "-library", str(build_dir / "aarch64-apple-ios" / lib_name),
        "-library", str(universal_dir / lib_name),
        "-output", str(xcframework_path)
    ])
    
    if exit_code != 0:
        print(f"{Colors.RED}✗ Failed to create XCFramework{Colors.END}")
        print(output)
        return exit_code
    
    print(f"{Colors.GREEN}✓ Created XCFramework{Colors.END}")
    
    # Success
    print(f"\n{Colors.GREEN}✅ iOS build complete!{Colors.END}")
    print(f"{Colors.BLUE}📍 XCFramework: {xcframework_path}{Colors.END}")
    
    return 0


if __name__ == "__main__":
    sys.exit(build_ios())
