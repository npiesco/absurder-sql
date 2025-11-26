pub mod allocation;
pub mod auto_sync;
pub mod block_info;
pub mod block_storage;
#[cfg(target_arch = "wasm32")]
pub mod broadcast_notifications;
pub mod constructors;
pub mod coordination_metrics;
pub mod export;
pub mod export_import_lock;
pub mod fs_persist;
pub mod import;
#[cfg(target_arch = "wasm32")]
pub mod indexeddb_queue;
pub mod io_operations;
pub mod leader_election;
pub mod metadata;
#[cfg(target_arch = "wasm32")]
pub mod mvcc_queue;
pub mod observability;
pub mod optimistic_updates;
pub mod recovery;
#[cfg(target_arch = "wasm32")]
pub mod reentrancy_handler;
pub mod retry_logic;
pub mod sync_operations;
pub mod vfs_sync;
#[cfg(target_arch = "wasm32")]
pub mod wasm_auto_sync;
pub mod wasm_indexeddb;
#[cfg(target_arch = "wasm32")]
pub mod wasm_vfs_sync;
#[cfg(target_arch = "wasm32")]
pub mod write_queue;

pub use block_info::{BlockInfo, BlockStorageInfo};
pub use block_storage::{BLOCK_SIZE, BlockStorage, CrashRecoveryAction, SyncPolicy};
#[cfg(any(
    target_arch = "wasm32",
    all(not(target_arch = "wasm32"), any(test, debug_assertions)),
    feature = "fs_persist"
))]
pub use metadata::BlockMetadataPersist;
pub use metadata::{ChecksumAlgorithm, ChecksumManager};
#[cfg(target_arch = "wasm32")]
pub use wasm_vfs_sync::{
    register_storage_for_vfs_sync, vfs_sync_database, vfs_sync_database_blocking,
};
