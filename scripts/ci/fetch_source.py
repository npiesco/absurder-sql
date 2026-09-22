#!/usr/bin/env python3
"""Download one exact GitHub revision into a fresh, Gitless source directory."""

import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import tarfile
import urllib.request


def extract(payload, destination):
    destination = Path(destination)
    destination.mkdir(parents=True, exist_ok=False)
    with tarfile.open(fileobj=io.BytesIO(payload), mode="r:gz") as archive:
        members = archive.getmembers()
        roots = {PurePosixPath(member.name).parts[0] for member in members}
        if len(roots) != 1:
            raise ValueError("Source archive must have exactly one root")
        for member in members:
            path = PurePosixPath(member.name)
            if path.is_absolute() or ".." in path.parts or "\\" in member.name:
                raise ValueError("Unsafe source archive path")
            if not (member.isfile() or member.isdir()):
                raise ValueError("Source archive must not contain links or device entries")
            relative = PurePosixPath(*path.parts[1:])
            if ".git" in relative.parts:
                raise ValueError("Git metadata is not admitted on the runner")
            if not relative.parts:
                continue
            output = destination.joinpath(*relative.parts)
            if member.isdir():
                output.mkdir(parents=True, exist_ok=True)
            else:
                output.parent.mkdir(parents=True, exist_ok=True)
                with archive.extractfile(member) as source, output.open("xb") as target:
                    target.write(source.read())
                output.chmod(member.mode & 0o755)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository", required=True)
    parser.add_argument("--sha", required=True)
    parser.add_argument("--destination", type=Path, required=True)
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", args.repository):
        raise ValueError("Invalid repository identity")
    if not re.fullmatch(r"[0-9a-f]{40}", args.sha):
        raise ValueError("An exact commit SHA is required")
    # The repository is public. No workstation or workflow Git credential is sent.
    url = f"https://codeload.github.com/{args.repository}/tar.gz/{args.sha}"
    with urllib.request.urlopen(url, timeout=120) as response:
        payload = response.read()
    extract(payload, args.destination)
    manifest = {
        "repository": args.repository,
        "sha": args.sha,
        "archive_sha256": hashlib.sha256(payload).hexdigest(),
        "gitless": True,
    }
    print(json.dumps(manifest))
    if output := os.environ.get("GITHUB_OUTPUT"):
        with open(output, "a", encoding="utf-8") as stream:
            stream.write(f"source={args.destination.resolve()}\n")


if __name__ == "__main__":
    main()
