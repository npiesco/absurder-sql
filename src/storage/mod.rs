pub mod block_storage;
pub mod async_bridge;
pub mod metadata;
pub mod vfs_sync;
pub mod auto_sync;

pub use block_storage::{BlockStorage, BLOCK_SIZE, SyncPolicy};
#[cfg(target_arch = "wasm32")]
pub use vfs_sync::{vfs_sync_database, vfs_sync_database_blocking, register_storage_for_vfs_sync};
pub use async_bridge::AsyncBridge;
pub use metadata::{ChecksumManager, ChecksumAlgorithm, BlockMetadataPersist};
