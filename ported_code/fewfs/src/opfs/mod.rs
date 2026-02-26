//! OPFS (Origin Private File System) block store backend.
//!
//! Worker-only: `SyncAccessHandle` requires a dedicated Worker context.
//! All async work (opening the handle) happens in `open()`.
//! All trait methods are synchronous after init.

pub mod bridge;
pub mod hybrid;
pub mod opfs_store;

pub use hybrid::HybridBlockStore;
pub use opfs_store::OpfsBlockStore;
