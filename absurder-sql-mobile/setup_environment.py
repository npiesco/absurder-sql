#!/usr/bin/env python3
"""
Setup development environment for AbsurderSQL Mobile
Validates Rust targets, NDK, Xcode, and generates environment config
"""

import os
import subprocess
import sys
from pathlib import Path
from typing import Optional, List, Tuple


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'


def run_command(cmd: List[str]) -> Tuple[int, str]:
    """Run command and return (exit_code, output)"""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode, result.stdout.strip()
    except Exception as e:
        return 1, str(e)


def check_rust_targets() -> bool:
    """Check if all required Rust targets are installed"""
    print(f"\n{Colors.BLUE}Checking Rust targets...{Colors.END}")
    
    required_targets = [
        ("iOS Device", "aarch64-apple-ios"),
        ("iOS Simulator (Intel)", "x86_64-apple-ios"),
        ("iOS Simulator (Apple Silicon)", "aarch64-apple-ios-sim"),
        ("Android ARM64", "aarch64-linux-android"),
        ("Android ARMv7", "armv7-linux-androideabi"),
        ("Android x86_64", "x86_64-linux-android"),
        ("Android x86", "i686-linux-android"),
    ]
    
    exit_code, output = run_command(["rustup", "target", "list", "--installed"])
    if exit_code != 0:
        print(f"{Colors.RED}✗ Failed to check Rust targets{Colors.END}")
        return False
    
    installed = output.split('\n')
    all_installed = True
    missing = []
    
    for name, target in required_targets:
        if target in installed:
            print(f"{Colors.GREEN}✓{Colors.END} {name}: {target}")
        else:
            print(f"{Colors.RED}✗{Colors.END} {name}: {target} (missing)")
            missing.append(target)
            all_installed = False
    
    if missing:
        print(f"\n{Colors.YELLOW}To install missing targets:{Colors.END}")
        print(f"  rustup target add {' '.join(missing)}")
    
    return all_installed


def find_android_ndk() -> Optional[Path]:
    """Find Android NDK installation"""
    print(f"\n{Colors.BLUE}Checking Android NDK...{Colors.END}")
    
    # Check environment variable first
    ndk_env = os.environ.get('ANDROID_NDK_HOME') or os.environ.get('NDK_HOME')
    if ndk_env:
        ndk_path = Path(ndk_env)
        if ndk_path.exists():
            print(f"{Colors.GREEN}✓{Colors.END} Found NDK (from env): {ndk_path}")
            return ndk_path
    
    # Search common locations
    search_paths = [
        Path.home() / "Library" / "Android" / "sdk" / "ndk",
        Path("/usr/local/share/android-ndk"),
        Path("/opt/android-ndk"),
    ]
    
    for base_path in search_paths:
        if not base_path.exists():
            continue
        
        # Find latest version
        ndk_versions = sorted(
            [d for d in base_path.iterdir() if d.is_dir() and d.name[0].isdigit()],
            key=lambda x: x.name,
            reverse=True
        )
        
        if ndk_versions:
            ndk_path = ndk_versions[0]
            print(f"{Colors.GREEN}✓{Colors.END} Found NDK: {ndk_path}")
            return ndk_path
    
    print(f"{Colors.RED}✗{Colors.END} Android NDK not found")
    print(f"{Colors.YELLOW}Install via Android Studio > SDK Manager > SDK Tools > NDK{Colors.END}")
    return None


def check_xcode() -> bool:
    """Check if Xcode is installed"""
    print(f"\n{Colors.BLUE}Checking Xcode...{Colors.END}")
    
    exit_code, output = run_command(["xcodebuild", "-version"])
    if exit_code != 0:
        print(f"{Colors.RED}✗{Colors.END} Xcode not found")
        print(f"{Colors.YELLOW}Install from App Store or developer.apple.com{Colors.END}")
        return False
    
    version = output.split('\n')[0]
    print(f"{Colors.GREEN}✓{Colors.END} {version}")
    return True


def check_cocoapods() -> bool:
    """Check if CocoaPods is installed"""
    print(f"\n{Colors.BLUE}Checking CocoaPods...{Colors.END}")
    
    exit_code, output = run_command(["pod", "--version"])
    if exit_code != 0:
        print(f"{Colors.RED}✗{Colors.END} CocoaPods not found")
        print(f"{Colors.YELLOW}Install with: sudo gem install cocoapods{Colors.END}")
        return False
    
    print(f"{Colors.GREEN}✓{Colors.END} CocoaPods {output}")
    return True


def generate_cargo_config(ndk_path: Optional[Path]) -> bool:
    """Generate .cargo/config.toml"""
    print(f"\n{Colors.BLUE}Generating .cargo/config.toml...{Colors.END}")
    
    cargo_dir = Path(__file__).parent / ".cargo"
    cargo_dir.mkdir(exist_ok=True)
    
    config_path = cargo_dir / "config.toml"
    
    config_content = """# Cargo configuration for mobile builds

[target.aarch64-linux-android]
linker = "aarch64-linux-android21-clang"
ar = "llvm-ar"

[target.armv7-linux-androideabi]
linker = "armv7a-linux-androideabi21-clang"
ar = "llvm-ar"

[target.i686-linux-android]
linker = "i686-linux-android21-clang"
ar = "llvm-ar"

[target.x86_64-linux-android]
linker = "x86_64-linux-android21-clang"
ar = "llvm-ar"
"""
    
    config_path.write_text(config_content)
    print(f"{Colors.GREEN}✓{Colors.END} Created {config_path}")
    return True


def generate_env_file(ndk_path: Optional[Path]):
    """Generate .env file with NDK configuration"""
    if not ndk_path:
        return
    
    print(f"\n{Colors.BLUE}Generating .env file...{Colors.END}")
    
    env_file = Path(__file__).parent / ".env"
    env_content = f"""# Android NDK Configuration
ANDROID_NDK_HOME={ndk_path}
NDK_HOME={ndk_path}
PATH=$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/darwin-x86_64/bin:$PATH
"""
    
    env_file.write_text(env_content)
    print(f"{Colors.GREEN}✓{Colors.END} Created {env_file}")
    print(f"\n{Colors.YELLOW}Load with: source .env or use direnv{Colors.END}")


def main():
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}AbsurderSQL Mobile - Environment Setup{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    
    results = {
        "Rust Targets": check_rust_targets(),
        "Xcode": check_xcode(),
        "CocoaPods": check_cocoapods(),
    }
    
    ndk_path = find_android_ndk()
    results["Android NDK"] = ndk_path is not None
    
    generate_cargo_config(ndk_path)
    
    if ndk_path:
        generate_env_file(ndk_path)
    
    # Summary
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}Summary:{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    
    all_ok = True
    for component, status in results.items():
        icon = f"{Colors.GREEN}✓{Colors.END}" if status else f"{Colors.RED}✗{Colors.END}"
        print(f"{icon} {component}")
        if not status:
            all_ok = False
    
    if all_ok:
        print(f"\n{Colors.GREEN}✓ All components ready!{Colors.END}")
        return 0
    else:
        print(f"\n{Colors.YELLOW}⚠ Some components need setup{Colors.END}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
