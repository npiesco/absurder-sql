import importlib.util
import io
from pathlib import Path
import tarfile
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]


def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / "ci" / f"{name}.py")
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


fetch = module("fetch_source")
guard = module("runner_job_guard")


def archive(name="repo-commit/src/value.txt", kind=tarfile.REGTYPE):
    output = io.BytesIO()
    with tarfile.open(fileobj=output, mode="w:gz") as tar:
        member = tarfile.TarInfo(name)
        member.type = kind
        data = b"actual source bytes\n"
        member.size = len(data) if kind == tarfile.REGTYPE else 0
        member.linkname = "/outside"
        tar.addfile(member, io.BytesIO(data) if member.size else None)
    return output.getvalue()


class SourceTests(unittest.TestCase):
    def test_real_archive_extracts_without_history(self):
        with tempfile.TemporaryDirectory() as folder:
            destination = Path(folder) / "source"
            fetch.extract(archive(), destination)
            self.assertEqual((destination / "src" / "value.txt").read_bytes(), b"actual source bytes\n")
            self.assertFalse((destination / ".git").exists())
            with self.assertRaises(FileExistsError):
                fetch.extract(archive(), destination)

    def test_rejects_traversal_git_metadata_and_links(self):
        for name, kind in (
            ("repo-commit/../outside", tarfile.REGTYPE),
            ("repo-commit/.git/config", tarfile.REGTYPE),
            ("repo-commit/link", tarfile.SYMTYPE),
        ):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as folder:
                with self.assertRaises(ValueError):
                    fetch.extract(archive(name, kind), Path(folder) / "source")

    def test_guard_admits_only_owner_and_exact_repository(self):
        env = {"GITHUB_REPOSITORY": "owner/repo", "GITHUB_ACTOR": "owner",
               "GITHUB_EVENT_NAME": "push", "GITHUB_REF": "refs/heads/main"}
        event = {"repository": {"default_branch": "main"}}
        guard.authorize(env, event, "owner/repo")
        with self.assertRaises(ValueError):
            guard.authorize(env | {"GITHUB_ACTOR": "external"}, event, "owner/repo")
        with self.assertRaises(ValueError):
            guard.authorize(env | {"GITHUB_REF": "refs/heads/unreviewed"}, event, "owner/repo")
        pull = {"pull_request": {"head": {"repo": {"full_name": "fork/repo"}},
                                 "base": {"repo": {"full_name": "owner/repo"}}}}
        with self.assertRaises(ValueError):
            guard.authorize(env | {"GITHUB_EVENT_NAME": "pull_request"}, pull, "owner/repo")


if __name__ == "__main__":
    unittest.main()
