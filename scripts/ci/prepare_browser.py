#!/usr/bin/env python3
"""Bind wasm-bindgen tests to the actual installed Playwright Chromium."""

import io
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import urllib.request
import zipfile

browser = subprocess.check_output(
    ["node", "--input-type=module", "-e",
     "import {chromium} from '@playwright/test'; console.log(chromium.executablePath())"],
    text=True,
).strip()
version_text = subprocess.check_output([browser, "--version"], text=True)
version = re.search(r"\d+\.\d+\.\d+\.\d+", version_text).group()
architecture = platform.machine()
target = "linux64" if architecture == "x86_64" else "linux-arm64" if architecture == "aarch64" else None
if target is None:
    raise RuntimeError(f"Unsupported browser driver architecture: {architecture}")
with urllib.request.urlopen(f"https://googlechromelabs.github.io/chrome-for-testing/{version}.json", timeout=30) as response:
    manifest = json.load(response)
download = next(item for item in manifest["downloads"]["chromedriver"] if item["platform"] == target)
destination = Path(os.environ["RUNNER_TOOL_CACHE"]) / "chromedriver" / version
driver = destination / f"chromedriver-{target}" / "chromedriver"
if not driver.is_file():
    with urllib.request.urlopen(download["url"], timeout=120) as response:
        payload = response.read()
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        for member in archive.namelist():
            if member.startswith("/") or ".." in Path(member).parts:
                raise ValueError("Invalid browser driver archive path")
        archive.extractall(destination)
    driver.chmod(0o755)
capabilities = Path(os.environ.get("RUNNER_TEMP", ".local")) / "absurder-webdriver.json"
capabilities.parent.mkdir(parents=True, exist_ok=True)
capabilities.write_text(json.dumps({"goog:chromeOptions": {"binary": browser}}))
bindings = {
    "CHROMEDRIVER": str(driver.resolve()),
    "WASM_BINDGEN_TEST_WEBDRIVER_JSON": str(capabilities.resolve()),
    "WASM_BINDGEN_USE_BROWSER": "1",
    "WASM_BINDGEN_TEST_TIMEOUT": "60",
    "PYTHON": "python3",
}
if output := os.environ.get("GITHUB_ENV"):
    with open(output, "a", encoding="utf-8") as stream:
        for key, value in bindings.items():
            stream.write(f"{key}={value}\n")
else:
    print(json.dumps(bindings))
