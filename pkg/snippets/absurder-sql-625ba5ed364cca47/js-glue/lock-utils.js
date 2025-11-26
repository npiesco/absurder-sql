// Web Locks API wrapper for WASM
// This ensures the event loop properly handles lock acquisition/release

export async function requestLockAndCallRust(lockName, rust_callback_fn) {
    // Acquire an exclusive lock (default mode)
    await navigator.locks.request(lockName, async (lock) => {
        // The lock is acquired. Call the Rust function.
        // The lock is held until this async function finishes.
        await rust_callback_fn();
    });
}
