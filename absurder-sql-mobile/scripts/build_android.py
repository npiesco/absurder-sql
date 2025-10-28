#!/usr/bin/env python3
"""
Android Build Script for AbsurderSQL Mobile
Builds shared libraries for all Android architectures
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


def check_ndk():
    """Check if Android NDK is available"""
    ndk_home = os.environ.get('ANDROID_NDK_HOME') or os.environ.get('NDK_HOME')
    
    if not ndk_home:
        print(f"{Colors.RED}✗ ANDROID_NDK_HOME or NDK_HOME not set{Colors.END}")
        print(f"{Colors.YELLOW}Run: python3 setup_environment.py{Colors.END}")
        print(f"{Colors.YELLOW}Then: source .env{Colors.END}")
        return False
    
    ndk_path = Path(ndk_home)
    if not ndk_path.exists():
        print(f"{Colors.RED}✗ NDK path does not exist: {ndk_path}{Colors.END}")
        return False
    
    print(f"{Colors.GREEN}✓ Found Android NDK: {ndk_path}{Colors.END}")
    return True


def build_android():
    """Build Android shared libraries"""
    print(f"{Colors.BLUE}🤖 Building AbsurderSQL for Android...{Colors.END}\n")
    
    # Check NDK
    if not check_ndk():
        return 1
    
    # Configuration
    project_dir = Path(__file__).parent.parent
    lib_name = "libabsurder_sql_mobile.a"
    jnilibs_dir = project_dir / "android" / "src" / "main" / "jniLibs"
    
    # Target architectures mapping: Rust target -> Android ABI
    targets = [
        ("aarch64-linux-android", "arm64-v8a", "📱 ARM64"),
        ("x86_64-linux-android", "x86_64", "💻 x86_64 emulator"),
        # Note: armv7 and x86 disabled due to OpenSSL build issues
        # ("armv7-linux-androideabi", "armeabi-v7a", "📱 ARMv7"),
        # ("i686-linux-android", "x86", "💻 x86 emulator"),
    ]
    
    # Clean jniLibs directory
    if jnilibs_dir.exists():
        shutil.rmtree(jnilibs_dir)
    jnilibs_dir.mkdir(parents=True)
    
    # Build for each architecture
    for rust_target, android_abi, description in targets:
        print(f"{Colors.YELLOW}{description} ({rust_target} -> {android_abi})...{Colors.END}")
        
        exit_code, output = run_command(
            ["cargo", "build", "--release", "--no-default-features", "--features", "uniffi-bindings", f"--target={rust_target}"],
            cwd=project_dir
        )
        
        if exit_code != 0:
            print(f"{Colors.RED}✗ Build failed for {rust_target}{Colors.END}")
            print(output)
            return exit_code
        
        # Copy library to jniLibs directory
        abi_dir = jnilibs_dir / android_abi
        abi_dir.mkdir(parents=True, exist_ok=True)
        
        lib_path = project_dir / "target" / rust_target / "release" / lib_name
        dest_path = abi_dir / lib_name
        
        shutil.copy(lib_path, dest_path)
        
        # Print file size
        size_mb = dest_path.stat().st_size / (1024 * 1024)
        print(f"{Colors.GREEN}✓ Built {rust_target} ({size_mb:.2f} MB){Colors.END}")
    
    # Success
    print(f"\n{Colors.GREEN}✅ Android build complete!{Colors.END}")
    print(f"{Colors.BLUE}📍 Libraries: {jnilibs_dir}{Colors.END}")
    
    # Show directory structure
    print(f"\n{Colors.BLUE}Directory structure:{Colors.END}")
    for abi_dir in sorted(jnilibs_dir.iterdir()):
        if abi_dir.is_dir():
            lib_file = abi_dir / lib_name
            if lib_file.exists():
                size_mb = lib_file.stat().st_size / (1024 * 1024)
                print(f"  {abi_dir.name}/")
                print(f"    └── {lib_name} ({size_mb:.2f} MB)")
    
    return 0


if __name__ == "__main__":
    sys.exit(build_android())
