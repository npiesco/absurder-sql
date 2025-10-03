pub mod allocation;
pub mod async_bridge;
pub mod auto_sync;
pub mod block_storage;
#[cfg(target_arch = "wasm32")]
pub mod broadcast_notifications;
pub mod constructors;
pub mod fs_persist;
pub mod io_operations;
pub mod leader_election;
pub mod metadata;
pub mod observability;
pub mod recovery;
pub mod sync_operations;
pub mod vfs_sync;
pub mod wasm_indexeddb;
#[cfg(target_arch = "wasm32")]
pub mod wasm_vfs_sync;
#[cfg(target_arch = "wasm32")]
pub mod wasm_auto_sync;
#[cfg(target_arch = "wasm32")]
pub mod write_queue;

pub use block_storage::{BlockStorage, BLOCK_SIZE, SyncPolicy};
#[cfg(target_arch = "wasm32")]
pub use wasm_vfs_sync::{vfs_sync_database, vfs_sync_database_blocking, register_storage_for_vfs_sync};
// pub use async_bridge::AsyncBridge; // Commented out - not available
pub use metadata::{ChecksumManager, ChecksumAlgorithm, BlockMetadataPersist};
