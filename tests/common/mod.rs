#![cfg(not(target_arch = "wasm32"))]
use std::ffi::OsStr;
use std::sync::Mutex;
use once_cell::sync::Lazy;

// Serialize process-global environment mutations to avoid UB in concurrent runtimes.
pub static ENV_LOCK: Lazy<Mutex<()>> = Lazy::new(|| Mutex::new(()));

pub fn set_var<K: AsRef<OsStr>, V: AsRef<OsStr>>(key: K, val: V) {
    let _g = ENV_LOCK.lock().expect("env lock poisoned");
    unsafe { std::env::set_var(key, val) }
}
