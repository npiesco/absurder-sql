#!/usr/bin/env python3
"""Reject untrusted jobs before repository code runs on the persistent runner."""

import json
import os
from pathlib import Path


def authorize(environment, event, repository):
    owner = repository.split("/", 1)[0]
    if environment.get("GITHUB_REPOSITORY", "").casefold() != repository.casefold():
        raise ValueError("Runner is restricted to its registered repository")
    if environment.get("GITHUB_ACTOR", "").casefold() != owner.casefold():
        raise ValueError("Only the repository owner may admit jobs to this runner")
    event_name = environment.get("GITHUB_EVENT_NAME")
    if event_name == "pull_request":
        pull = event.get("pull_request", {})
        if pull.get("head", {}).get("repo", {}).get("full_name", "").casefold() != repository.casefold():
            raise ValueError("Fork pull requests cannot execute on this runner")
        if pull.get("base", {}).get("repo", {}).get("full_name", "").casefold() != repository.casefold():
            raise ValueError("Pull request base is outside the registered repository")
    elif event_name == "push":
        ref = environment.get("GITHUB_REF", "")
        default = event.get("repository", {}).get("default_branch")
        if ref != f"refs/heads/{default}" and not ref.startswith("refs/tags/v"):
            raise ValueError("Only the default branch or version tags may run automatically")
    elif event_name != "workflow_dispatch":
        raise ValueError(f"Unsupported persistent-runner event: {event_name}")


def main():
    configuration = Path(__file__).with_name("runner-policy.json")
    repository = json.loads(configuration.read_text())["repository"]
    event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
    authorize(os.environ, event, repository)
    print("Repository and owner admission verified")


if __name__ == "__main__":
    main()
