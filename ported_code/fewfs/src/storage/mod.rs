pub mod cache;
pub mod cached;
pub mod checksum;
pub mod error;
pub mod buffered;
pub mod fenced;
pub mod mem;
pub mod recovery;
pub mod retry;
pub mod types;

#[cfg(not(target_arch = "wasm32"))]
pub mod fs;

pub use cache::{BlockCache, CacheKey};
pub use cached::CachedBlockStore;
pub use buffered::BufferedBlockStore;
pub use checksum::{ChecksumAlgo, checksum, verify};
pub use error::{Result, StorageError, is_retriable};
pub use mem::MemBlockStore;
pub use retry::{with_retry, compute_retry_delay};
pub use types::*;
