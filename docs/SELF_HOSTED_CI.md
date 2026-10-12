# Repository-isolated CI

**Workflow reference, reviewed 2026-09-21.** The earlier Linux runner replay
below is preserved with its original 32-case stabilization count and artifact
identities. The later repaired runtime has 35 stabilization cases and complete
original-Apple / isolated-Windows qualification in
[Native qualification](NATIVE_QUALIFICATION.md) and
[SQLite/browser stabilization](SQLITE_STABILIZATION.md). Those later results
are not retroactively assigned to the Linux replay's older packages.

The build and test workload runs on the existing Linux x64 runner
`absurder-sql-tnb-linux-x64`, selected by
`[self-hosted, Linux, X64, absurder-sql, trusted]`. No new VM is required.

## Admission and host boundaries

This is a public repository with a persistent runner, not a general-purpose
untrusted pull-request executor. Both workflow admission and the root-owned
job-start hook require the repository owner. Fork pull requests are rejected
even when their GitHub approval requirement has been satisfied. Same-repository
owner pull requests, default-branch pushes, version-tag pushes, and explicit
owner dispatches are admitted. Other actors/events are refused.

The repository's external-contributor approval policy is
`all_external_contributors`. Approval does not bypass the runner policy.

The service runs as `absurder-ci`, without sudo, capabilities, or container
socket access. Its writable project root is
`/mnt/build/absurder-sql-runner`; other homes and the system filesystem are
protected. Private temporary storage, an eight-core CPU quota, 32 GiB memory
limit with no swap, 4,096-task limit, and four Cargo build jobs bound the
workload. Azure IMDS traffic is denied by the service's IP policy.

Root-owned administration files live under
`/usr/local/lib/absurder-sql-runner`:

- `runner_job_started.sh` is the supported Bash job hook.
- `runner_job_guard.py` checks the actual event and repository identity.
- `runner-policy.json` binds this runner to `npiesco/absurder-sql`.
- `fetch_source.py` downloads an exact public commit archive.

The service definition is `/etc/systemd/system/absurder-sql-runner.service`.
Updating a hook requires an administrator; repository jobs cannot replace the
installed policy. Runner registration credentials are distinct from source
credentials: no workstation PAT, deploy key, Git credential cache, or project
Git history is transferred.

This does not make arbitrary dependency code untrusted-safe. The account and
caches are persistent; only owner-admitted code may run here. Administration
must preserve unrelated VM workloads and governance-managed network controls.
The existing subnet has NAT egress but still reports default outbound access
enabled; this setup is not evidence of the stricter fresh-VM private-network
contract.

## Workflows

`ci.yml` calls `qualify.yml` for owner-admitted main-branch pushes,
same-repository pull requests targeting main, or explicit dispatch.
`release.yml` is triggered only by an owner `v*` tag push; it validates the tag
and calls the same qualification workflow before either registry publication.
The hosted npm OIDC job is not part of ordinary CI or pull-request qualification.

Each qualification downloads `github.sha` from public GitHub codeload into a
new runner-temporary directory. Extraction rejects traversal, multiple archive
roots, links/device entries, and `.git`. It prints the archive SHA-256. There is
no checkout, clone, fetch, or project Git credential on the VM.

`scripts/ci/bootstrap_tools.sh` installs tools into the dedicated account and
tool cache: Rust 1.98.0, wasm-pack 0.14.0, the wasm-bindgen CLI version resolved
from `Cargo.lock`, and checksum-verified Binaryen 132. Node 24 is selected by
the workflow. Browser OS dependencies must be installed by an administrator
using Playwright's `install-deps chromium`; jobs do not obtain sudo.

`prepare_browser.py` matches ChromeDriver to the installed Chromium version for
Rust/WASM tests. Playwright retains its normal headless-browser selection; the
script must not globally override `PLAYWRIGHT_EXECUTABLE_PATH`.

`qualify.sh` preserves the native format/lint/test, complete default WASM,
Hybrid/benchmark, and production PWA gates. It also exercises the qualified
enabled-telemetry test targets and the deletion/stabilization browser suites.
The telemetry collector uses a real loopback HTTP server and is stopped by its
own PID. Playwright retries are explicitly zero. No test timeout, resource
limit, feature setting, or library implementation is relaxed to obtain a pass.

The telemetry command uses Cargo's explicit `--test` selectors, not
`wasm-pack test --test`: wasm-pack adds `--tests` to its build and therefore
builds additional targets beyond the selected qualification boundary.

Build caches belong only to this account. One registered runner executes one
job at a time; workflow concurrency does not cancel an in-flight run. A
10 GiB available-space check fails before qualification instead of silently
deleting caches or changing resource limits.

## Publication boundary

The VM uploads qualified npm/crate archives and their SHA-256 manifest.
The post-regression WASM rebuild must match every non-hidden package file
captured before testing; a mismatch fails before packing. That runtime
fingerprint is retained with the archives.
Crates publication consumes the qualified crate with no source Git checkout.
The one remaining GitHub-hosted job publishes the npm archive with
`--ignore-scripts`, then creates the GitHub release. It never rebuilds WASM.
Only that hosted job receives source-repository write permission.

The hosted boundary is necessary because
[npm trusted publishing does not support self-hosted runners](https://docs.npmjs.com/trusted-publishers/).
The existing `npm-publish` environment, `release.yml` identity, and OIDC
permission are preserved. Publication errors fail rather than being converted
to success merely because some version already exists.

Runner installation and local workflow edits do not activate these workflows.
Activation requires an authorized commit/push. Commits retain the owner's
`[skip ci]` convention; an actual CI run can then be explicitly dispatched.
Installing the runner does not authorize a tag, registry publication, release,
or hosted workflow run.

The current commit/push/PR request does not request a version bump, release tag,
registry publication, or CI dispatch. Do not infer any of these from completed
qualification.

## Historical Linux qualification evidence (2026-09-21)

The setup is exercised through ARM Run Command using a separate foreground
oneshot service copied from the installed runner's security/resource policy.
This proves real account, filesystem, network, toolchain, browser, and workload
behavior; it is **not** a GitHub-scheduled workflow execution.

The live isolation proof checks an actual disk roundtrip, refused writes
outside the project, an inaccessible unrelated home, and failed IMDS access
against a successful outside-sandbox compute-name request. It executes the
installed Bash hook against real event files, admitting the owner and refusing
an external actor and a fork.

Failed setup attempts are retained: the first registration completed but its
JSON observer failed on a UTF-8 BOM; direct Python-hook invocation exposed CRLF
and unsupported hook-language handling; missing browser libraries were
installed; and forcing full Linux x64 Chromium crashed during restarted-profile
downloads. The unchanged failing resource contract passes with Playwright's
normal real headless browser. None of those corrections modifies the frozen
SQLite implementation or package candidates.

The final Linux replay in that 2026-09-21 evidence set passed 3 CI-helper tests, 214 native tests
(plus one existing ignored documentation example), 298 default WASM tests,
16 enabled-telemetry tests across four binaries, 79 browser/benchmark tests,
13 deletion tests, 32 stabilization tests, and 3 production PWA tests. Browser
retries were zero. Formatting, all three Clippy commands, native release,
optimized WASM rebuild, and equality of all 13 non-hidden package files passed.

`SELF_HOSTED_CI_QUALIFICATION.json` binds those results to the executed script,
new VM-generated artifacts, and complete retained log. Those new artifacts do
not replace the immutable stabilization candidates. The GitHub runner was
online and idle at handoff, but no GitHub-scheduled run or publication was
performed.
