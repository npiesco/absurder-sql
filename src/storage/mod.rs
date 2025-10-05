pub mod allocation;
pub mod auto_sync;
pub mod block_storage;
pub mod block_info;
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
pub mod optimistic_updates;
pub mod coordination_metrics;

pub use block_storage::{BlockStorage, BLOCK_SIZE, SyncPolicy, CrashRecoveryAction};
#[cfg(target_arch = "wasm32")]
pub use wasm_vfs_sync::{vfs_sync_database, vfs_sync_database_blocking, register_storage_for_vfs_sync};
pub use metadata::{ChecksumManager, ChecksumAlgorithm, BlockMetadataPersist};
pub use block_info::{BlockInfo, BlockStorageInfo};
