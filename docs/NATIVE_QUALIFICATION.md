# Native Windows and macOS qualification

**The repaired library is qualified on the original Apple runtime and the
authorized, isolated Windows x64 VM.** The complete Windows command passed all
21 stages, both packaged variants, and byte-identical rebuild verification.
Earlier failed attempts remain part of the evidence, not passing results.

The original lanes run on the owner's existing Windows ARM64 workstation and
Molly's physical M2 Mac, without GitHub Actions dispatches or hosted minutes.
The later, separately authorized disposable Windows VM attempt is recorded below.
The local isolated worktree is the sole Git authority. Molly receives a
hash-verified Gitless source snapshot; no project Git directory or workstation
credential cache is transferred.

## Host and tool identities

| Lane | Observed host | Native tools |
| --- | --- | --- |
| Windows | Windows 11 Enterprise, build 26200, ARM64 | Rust 1.98.0 `aarch64-pc-windows-msvc`, Node 24.13.0, Python 3.14.2, native ARM64 Chrome 153.0.8010.48 |
| Molly | Mac14,7 / Apple M2 / 16 GiB, macOS 26.6.2 / Darwin 25.6.0 | Rust 1.98.0 `aarch64-apple-darwin`, Node 24.21.0, original Apple Command Line Tools Python 3.9.6 / SQLite 3.51.0, Chromium 153.0.8010.12 ARM64 |
| Isolated Windows VM | Windows Server 2025 Datacenter, build 26100, AMD64, `NT AUTHORITY\SYSTEM` | Rust 1.98.0 `x86_64-pc-windows-msvc`, Node 24.21.0, Python 3.14.2, Chromium and ChromeDriver 153.0.8010.12 |

These lanes use wasm-pack 0.14.0, wasm-bindgen 0.2.126, and Binaryen 132.
Toolchain selection is process-local. Mac tools and caches live under the
dedicated `remote-builds/absurder-sql-e708-native-v1` directory; unrelated
workloads and the user's normal browser profiles are not used.

The original 472-file Gitless archive is
`.local/native-ci-v1/gitless-source.tar.gz`, SHA-256
`d6ad19db1e4d3035a04dafd1f9e84cafcd70445177f7808e50abafcd5a315f2e`.
Subsequent explicitly recorded portability deltas are separate artifacts,
not replacements for the original snapshot.

## Standalone SQLite export repair

The original Mac run failed nine stabilization cases: Apple SQLite could not
open an exported, standalone WAL-format file with `mode=ro`. The same failure
was reproduced using a file created and checkpointed entirely by native
SQLite. An alternate Python/SQLite runtime could read it, but changing the
interpreter did not close the original failure and is not the final gate.

`Database::export_to_file` now reuses the existing export lock, storage reload,
sync, and one-block-at-a-time export path. Before exporting it calls SQLite's
`sqlite3_wal_checkpoint_v2` for `main`, checks the return code and complete WAL
frame counts, and rejects an incomplete checkpoint. Only the returned owned
snapshot's file-format version bytes are normalized to rollback-journal
format. The live database retains WAL mode.

The three new real browser cases exercise IndexedDB, Hybrid, and OPFS:
checkpoint refusal while a read transaction is active; recovery after explicit
rollback; exact embedded-NUL content read by native SQLite using `mode=ro`
without `immutable=1`; unchanged live WAL mode; and a successful subsequent
write. All three failed on the original Apple path before the repair and pass
afterward.

The coupled raw-storage assertion compares actual persisted keys and bytes
before and after repeated same-WASM `VersionError` refusals. It does not compare
a normalized export to the live WAL file. Import/reopen tests still compare
the whole exported file: they require exactly one increment in SQLite's two
change-counter fields when the portable rollback snapshot is reopened in WAL
mode, with every other byte and the total length unchanged.

Relevant SQLite contracts:
[checkpoint completion](https://sqlite.org/c3ref/wal_checkpoint_v2.html) and
[file-format version numbers](https://sqlite.org/fileformat2.html#vnums).
The repair was independently reviewed with no significant issues found.
Previously frozen default/telemetry packages remain immutable and do not
contain this later repair.

## Real gate matrix

The common lane commands include:

```text
python -m unittest discover -s tests/ci -p test_*.py -v
cargo fmt --all -- --check
cargo clippy --all-targets --features telemetry,fs_persist -- -D warnings
cargo clippy --target wasm32-unknown-unknown --lib -- -D warnings
cargo clippy --target wasm32-unknown-unknown --lib --features telemetry -- -D warnings
cargo test --locked -- --test-threads=1
wasm-pack build --target web --out-dir pkg --release --no-opt
wasm-opt -Oz pkg/absurder_sql_bg.wasm -o pkg/absurder_sql_bg.wasm
wasm-pack test --headless --chrome --release
npx --no-install playwright test --retries=0 --reporter=line
npm run test:deletion -- --retries=0 --reporter=line
npm run test:stabilization -- --retries=0 --reporter=line
npm --prefix pwa run test:pwa -- --retries=0 --reporter=line
cargo build --locked --release
```

Telemetry uses the four explicitly selected Cargo integration-test targets,
the real wasm-bindgen browser runner, and a real loopback HTTP collector.
Both package variants separately run all deletion and stabilization cases.
Post-regression rebuilt package files must equal the tested runtime bytes.
Browser retries are zero and the formal benchmark sweep is enabled.

Molly's repaired-code, original-Apple-runtime results are 214 native tests
(plus one existing ignored documentation example), 298 default WASM tests,
16 enabled-telemetry tests, 79 browser/benchmark tests, 13 deletion tests,
35 stabilization tests, and 3 production PWA tests. Formatting, all three
Clippy commands, native ARM64 release, and rebuilt runtime identity pass.
Default and telemetry packaged runs each pass 13 deletion and 35
stabilization cases. The retrieved, independently verified evidence archive
has SHA-256
`b0f1512d43ec3afc4f21766160a3a90b0da67fb19dece166dec719149c16a07c`.

The complete Windows VM run independently matched all of those counts:
214 native tests plus the existing ignored documentation example, 298 WASM,
16 telemetry, 79 browser/benchmark, 13 deletion, 35 stabilization, and 3 PWA.
Both packaged variants also passed 13 deletion and 35 stabilization cases.
All 21 stages returned zero, including strict lint, native release, and the
unchanged package-fingerprint comparison. No required browser case was skipped
or retried. Execution as SYSTEM is explicit; this is not a claim of a completed
ARM64 laptop or non-elevated-user lane.

The earlier laptop failure is retained explicitly. An independent empty
native Chrome probe observed exit code 0 at 20.860 seconds, but the real
Windows process handle did not become signalled until 37.757 seconds.
A separate force-termination probe reported exit code 1 but did not observe
process-handle completion or the browser-owner close acknowledgement within
110 seconds. Those probes do not run AbsurderSQL. They establish a process
lifetime/admission problem on this host, not a passing Windows gate or a
diagnosis of a particular Windows component.

The laptop's repaired-code native Rust tests, strict lint lanes, and native
release passed; its complete browser run did not. The owner identified
concurrent Playwright automations on that workstation as the contention source
and authorized the isolated VM instead. No laptop reboot, shared-process
termination, or relaxed timeout was used to obtain the VM result. Test-body
success followed by browser cleanup failure was never counted as a passing run.

The working-tree `pkg` and PWA runtime contain the repaired default candidate.
All runtime members and active PWA snippets match its qualified bytes. Before
the documentation refresh, a real local `npm pack --ignore-scripts` reproduced
the entire qualified 727,917-byte archive exactly:
`ea561585e1c146698501ea3c431eabc51b4b11cc64b25d09d6a0b73f9717a31d`.
Its WASM is
`c6e60c83dcbb46bb51e30955f71041e51586916464ec44c09f508f814edca821`.
The telemetry candidate remains separately preserved under
`.local/native-ci-v1/portable-candidates-v1`. Earlier frozen packages and their
provenance were not overwritten. No publication, commit, or push is implied.

The subsequent README refresh changes only `README.md` and `pkg/README.md`
inside the npm archive. The current 723,944-byte documentation-updated archive
has SHA-256
`245ca331325ef61d51b86a14c3d8074efa630fba3b0bb3fce5ab9508a3037d2e`.
All 16 archive paths were compared against the qualified artifact; the other
14 members are byte-identical. The original qualified archive remains the test
artifact. This metadata-only repack is not presented as a new browser-test run.

## Final Windows VM evidence and preparation correction

The final v2 admission used resource group `asqlvm55b4d6fd-rg`, the same
unchanged qualification command, and the same runtime and test sources. Its
controller receipt reports `status: verified`, `guest_status_verified: true`,
and verified payload and NAT egress. The fully retrieved compressed summary is
31,509 bytes, SHA-256
`2f834e0d568b9f0f9a0ddc8c3c6f4122df7215ed9b82fb6d02d14f20b372fbb0`;
the decompressed 124,629-byte result has SHA-256
`9a1795624aa75879749bc59a7b102afb8724cbca3eb7592cc0fb79cf74890c94`.
It was independently checked against the Mac counts and both immutable
package archive/WASM identities.

The final preparation correction retained the repository's static
`pkg/LICENSE.md`, which the original session input preparer had incorrectly
excluded with generated `pkg` output. This is not a runtime-code change or a
weaker reproducibility check. On the real VM, four fresh-output experiments
reproduced the failure: the first build's 595-byte `package.json` omitted the
license from `files`, while the second build's 613-byte manifest included it.
The other nine package members, including WASM, were identical. Running the
existing PWA sync script between builds did not change that result.

The existing wasm-pack 0.14.0 implementation explains the dependence:
`src/manifest/mod.rs::npm_data` (function at line 659) enumerates existing
`LICENSE*` files in the output directory at lines 697-707 when constructing
`files`. The v2 admission restored the omitted static input from the verified
exact-SHA public source archive. It added one declared file to the original
455-file set and preserved all 453 manifest entries, both manifest/index
extras, the harness, assertions, and bound command. The full run then passed
the same byte-for-byte comparison; no JSON normalization or ignored member
was introduced.

Failed runs remain distinct: A lacked root Playwright dependencies; B aborted
inside the WASM runner after 273 passing tests; C passed all workload gates but
failed because the evidence disk was uninitialized; D1 rejected a BOM-bearing
operator environment file; D2 passed the tests but failed package metadata
reproducibility. The B abort passed in isolation under both drivers, and no
root-cause claim is made for it. The final run used the declared pinned driver
on PATH, real initialized evidence storage, and a clean verified admission.
The earlier measurement run's modified `sw-assets.js` and subsequent clean
admissions are also retained, rather than being silently restored or relabelled.

The final evidence-disk export includes the passing run, raw logs, artifacts,
build fingerprints, corrected-source provenance, packaging reproducer, and
prior failures. Its complete 4,294,967,808 bytes were independently rehashed:
`2025119fc53be866cf516a9daab1c819103fcfb4c7966cd1b935df5ef48d4082`.
The controller verified export integrity and SAS revocation. The older custody
export was retained separately, not overwritten. Destruction completed at
2026-09-22 01:28:51 UTC; the 01:31:13 UTC proof records an absent resource
group, zero survivors, and no remaining state artifacts. The first destruction
attempt failed on an OpenTofu provider-registry timeout; the unchanged retry
succeeded after registry connectivity was verified. That failure is retained.
Cleanup finished before the unchanged 02:37:51 UTC expiry.

VM receipts and the VHD are under session
`cf7c331c-0e16-4c7e-b83f-d2d875cfd2cf/files/windows-vm-55b4d6fd`.
Independent acceptance, VHD verification, and local package-alignment records
are under session `e708f47d-fbc5-41f2-9676-cc89c4442bda/files`.

## Native runner corrections and retained failures

The Windows source mirror initially lacked root browser dependencies, producing
real HTTP 404 responses. Dependencies were installed in that mirror, without
changing the root manifest. The DevTools suite's private fixed port 8765
collided with another local service; it now reuses Playwright's already-ready
static server and configured native browser. The Vite example explicitly
declares no favicon rather than generating a console-visible missing request.
All 19 affected Windows fixture cases and the complete 79-case Mac browser
suite passed after these corrections, without weaker assertions or retries.

The upstream wasm-bindgen 0.2.126 runner closes only a window in its client
destructor. Real Windows ChromeDriver traces exposed lengthy or incomplete
browser teardown after successful assertions. An isolated, checksum-verified
copy of that exact tool version was repaired to use its existing W3C session
request format and acknowledged session deletion. No shared installed tool
was replaced, and no test or storage path is mocked. Its patch, original and
patched source hashes, binary identity, independent real-driver diagnostic,
and complete test logs are retained under
`.local/native-ci-v1/tool-repair` and the corresponding run directories.

The task-local repair reuses upstream
`src/wasm_bindgen_test_runner/headless.rs::run`,
`Client::new_session`, `Client::delete`, and `Client::drop`; it does not
replace test execution or synthesize successful responses. The runner still
uses a 60-second test timeout and a 110-second bound around each exact
compiled artifact and session cleanup. An empty WebDriver session list is
verified, and the owned driver is shut down and reaped. Failed and interrupted
runs remain labelled as such.

Windows also encountered an explicit disk-full compiler failure. Cleanup was
restricted to task-owned regenerable compiler intermediates and
independently hash-verified duplicate artifacts. Source, Git state, candidate
packages, runtime/test binaries, evidence, and all 135 queued WASM artifacts
were preserved. The cleanup receipt records 4,291,360,863 logical bytes
removed, separately from any unrelated machine-wide disk changes.

## First disposable Windows VM attempt: not qualified, cleanup verified

The later authorized Windows Server 2025 x64 VM ran as
`NT AUTHORITY\SYSTEM`; it was not an ARM64 or non-elevated laptop lane.
Source staging through ARM Run Command did not finish, and no workload build,
test, package contract, or rebuild-equality gate ran on this VM. The transfer
was interrupted rather than changing the bound source, extending its expiry,
or reducing qualification scope.

The VM repository session could not reload for two immediate handoff attempts.
Bounded cleanup therefore used the installed controller from the existing VM
repository worktree. All 30 installed controller source entries independently
matched the bound manifest, and the context remained byte-identical.

An additional cleanup precheck incorrectly called the pre-apply saved-plan
guard after `Tofu.apply` had consumed and removed that plan. This caused the
overall cleanup command to exit 1 and prevented the planned interrupted-append
terminal-marker check and extra guest-log capture. Those actions are not claimed
as completed. The `finally` path nevertheless completed controller custody,
destruction, and the independent `prove-empty` phase.

For resource group `asqlvmc982fc4b-rg`, the final receipt at
2026-09-21 18:05:11 UTC reports `resource_group_exists: false`,
`survivor_count: 0`, `state_empty: true`, and no captured-resource or state-file
survivors. The evidence-disk export is 4,294,967,808 bytes, SHA-256
`064a7aa44b37797319bab1f4d8fb1cb94dcc5e1eaf180905880a0fa8ea75ea4f`;
the controller verified the complete export and SAS revocation. This preserves
the evidence disk, not the uncaptured staging files on the OS disk.

The local evidence directory is the session's
`files/windows-vm-c982fc4b`, containing `custody-receipt.json`,
`destroy-receipt.json`, `prove-empty-receipt.json`,
`cleanup-installed-controller-identity.json`, and
`interrupted-stage-cleanup-status.json`. No replacement VM was created during
this cleanup. That abandoned transfer did not establish qualification; the
later passing v2 run is recorded above. Cleanup is not qualification.
