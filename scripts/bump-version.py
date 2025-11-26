#!/usr/bin/env python3
"""
Version bumping script for absurder-sql.
Syncs versions across Cargo.toml and package.json.

Usage:
    python scripts/bump-version.py patch    # 0.1.12 -> 0.1.13
    python scripts/bump-version.py minor    # 0.1.12 -> 0.2.0
    python scripts/bump-version.py major    # 0.1.12 -> 1.0.0
    python scripts/bump-version.py 0.2.0    # Set specific version
    python scripts/bump-version.py --check  # Check current versions
"""

import json
import re
import sys
import subprocess
from pathlib import Path


def get_repo_root() -> Path:
    """Get the repository root directory."""
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
        check=True
    )
    return Path(result.stdout.strip())


def parse_version(version: str) -> tuple[int, int, int]:
    """Parse semver string to tuple."""
    match = re.match(r"^(\d+)\.(\d+)\.(\d+)$", version)
    if not match:
        raise ValueError(f"Invalid version format: {version}")
    return int(match.group(1)), int(match.group(2)), int(match.group(3))


def bump_version(current: str, bump_type: str) -> str:
    """Bump version based on type (major, minor, patch)."""
    major, minor, patch = parse_version(current)

    if bump_type == "major":
        return f"{major + 1}.0.0"
    elif bump_type == "minor":
        return f"{major}.{minor + 1}.0"
    elif bump_type == "patch":
        return f"{major}.{minor}.{patch + 1}"
    else:
        # Assume it's a specific version
        parse_version(bump_type)  # Validate format
        return bump_type


def get_cargo_version(cargo_path: Path) -> str:
    """Extract version from Cargo.toml."""
    content = cargo_path.read_text()
    match = re.search(r'^version\s*=\s*"([^"]+)"', content, re.MULTILINE)
    if not match:
        raise ValueError("Could not find version in Cargo.toml")
    return match.group(1)


def set_cargo_version(cargo_path: Path, version: str) -> None:
    """Update version in Cargo.toml."""
    content = cargo_path.read_text()
    new_content = re.sub(
        r'^(version\s*=\s*)"[^"]+"',
        f'\\1"{version}"',
        content,
        count=1,
        flags=re.MULTILINE
    )
    cargo_path.write_text(new_content)


def get_npm_version(package_path: Path) -> str:
    """Extract version from package.json."""
    data = json.loads(package_path.read_text())
    return data.get("version", "0.0.0")


def set_npm_version(package_path: Path, version: str) -> None:
    """Update version in package.json."""
    data = json.loads(package_path.read_text())
    data["version"] = version
    package_path.write_text(json.dumps(data, indent=2) + "\n")


def check_versions(root: Path) -> dict[str, str]:
    """Get all version info."""
    cargo_path = root / "Cargo.toml"
    package_path = root / "package.json"

    versions = {
        "cargo": get_cargo_version(cargo_path),
        "npm": get_npm_version(package_path),
    }

    return versions


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    arg = sys.argv[1]
    root = get_repo_root()

    cargo_path = root / "Cargo.toml"
    package_path = root / "package.json"

    # Check mode
    if arg == "--check":
        versions = check_versions(root)
        print(f"Cargo.toml:   {versions['cargo']}")
        print(f"package.json: {versions['npm']}")

        if versions['cargo'] == versions['npm']:
            print("\n✓ Versions are synchronized")
        else:
            print("\n⚠️  Versions are NOT synchronized!")
            sys.exit(1)
        return

    # Get current version from Cargo.toml (source of truth)
    current = get_cargo_version(cargo_path)
    print(f"Current version: {current}")

    # Calculate new version
    new_version = bump_version(current, arg)
    print(f"New version:     {new_version}")

    # Confirm
    response = input("\nProceed? [y/N] ").strip().lower()
    if response != "y":
        print("Aborted.")
        sys.exit(1)

    # Update both files
    set_cargo_version(cargo_path, new_version)
    print(f"✓ Updated Cargo.toml")

    set_npm_version(package_path, new_version)
    print(f"✓ Updated package.json")

    print(f"\nVersion bumped to {new_version}")
    print("\nNext steps:")
    print(f"  git add Cargo.toml package.json")
    print(f"  git commit -m 'chore: bump version to {new_version}'")
    print(f"  git tag v{new_version}")
    print(f"  git push origin main --tags")


if __name__ == "__main__":
    main()
