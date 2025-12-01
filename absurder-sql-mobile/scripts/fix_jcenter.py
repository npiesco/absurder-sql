#!/usr/bin/env python3
"""
Post-install script to fix jcenter() deprecation in react-native-sqlite-storage.
Replaces jcenter() with mavenCentral() in the build.gradle file.
"""

import os
from pathlib import Path

def main():
    script_dir = Path(__file__).parent
    project_dir = script_dir.parent

    build_gradle = project_dir / "react-native" / "node_modules" / "react-native-sqlite-storage" / "platforms" / "android" / "build.gradle"

    print(" Fixing jcenter() deprecation in react-native-sqlite-storage...")

    if not build_gradle.exists():
        print(f"   Skipping: {build_gradle} not found")
        return 0

    content = build_gradle.read_text()

    if "jcenter()" not in content:
        print("   Already patched or jcenter() not present")
        return 0

    content = content.replace("jcenter()", "mavenCentral()")
    build_gradle.write_text(content)

    print(" jcenter() replaced with mavenCentral()")
    return 0

if __name__ == "__main__":
    exit(main())
