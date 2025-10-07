//! Metadata module extracted from block_storage.rs
//! This module contains the ACTUAL checksum and metadata logic moved from BlockStorage

use std::collections::HashMap;
use crate::types::DatabaseError;

#[cfg(target_arch = "wasm32")]
#[allow(unused_imports)]
use js_sys::Date;

#[cfg(not(target_arch = "wasm32"))]
#[allow(unused_imports)]
use std::time::{SystemTime, UNIX_EPOCH};

// MOVED from block_storage.rs lines 38-41
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[allow(dead_code)]
#[cfg_attr(feature = "fs_persist", derive(serde::Serialize, serde::Deserialize))]
pub enum ChecksumAlgorithm {
    FastHash,
    CRC32
}

// MOVED from block_storage.rs lines 43-54
#[cfg(any(target_arch = "wasm32", all(not(target_arch = "wasm32"), any(test, debug_assertions)), feature = "fs_persist"))]
#[derive(Clone, Debug)]
#[cfg_attr(feature = "fs_persist", derive(serde::Serialize, serde::Deserialize))]
pub struct BlockMetadataPersist {
    pub checksum: u64,
    #[allow(dead_code)]
    pub last_modified_ms: u64,
    #[allow(dead_code)]
    pub version: u32,
    #[allow(dead_code)]
    pub algo: ChecksumAlgorithm,
}

/// Metadata manager that encapsulates the checksum logic extracted from BlockStorage
pub struct ChecksumManager {
    /// Per-block checksums (MOVED from BlockStorage.checksums)
    checksums: HashMap<u64, u64>,
    /// Per-block checksum algorithms (MOVED from BlockStorage.checksum_algos)
    checksum_algos: HashMap<u64, ChecksumAlgorithm>,
    /// Default algorithm for new blocks (MOVED from BlockStorage.checksum_algo_default)
    checksum_algo_default: ChecksumAlgorithm,
}

impl ChecksumManager {
    /// Create new checksum manager with default algorithm
    pub fn new(default_algorithm: ChecksumAlgorithm) -> Self {
        Self {
            checksums: HashMap::new(),
            checksum_algos: HashMap::new(),
            checksum_algo_default: default_algorithm,
        }
    }

    /// Initialize with existing data (used during restoration)
    pub fn with_data(
        checksums: HashMap<u64, u64>,
        checksum_algos: HashMap<u64, ChecksumAlgorithm>,
        default_algorithm: ChecksumAlgorithm,
    ) -> Self {
        Self {
            checksums,
            checksum_algos,
            checksum_algo_default: default_algorithm,
        }
    }

    /// MOVED from BlockStorage::compute_checksum_with (lines 1803-1818)
    pub fn compute_checksum_with(data: &[u8], algo: ChecksumAlgorithm) -> u64 {
        match algo {
            ChecksumAlgorithm::FastHash => {
                use std::collections::hash_map::DefaultHasher;
                use std::hash::Hash;
                use std::hash::Hasher;
                let mut hasher = DefaultHasher::new();
                data.hash(&mut hasher);
                hasher.finish()
            }
            ChecksumAlgorithm::CRC32 => {
                let mut hasher = crc32fast::Hasher::new();
                hasher.update(data);
                hasher.finalize() as u64
            }
        }
    }

    /// Store checksum for a block (MOVED from lines 2442-2444)
    pub fn store_checksum(&mut self, block_id: u64, data: &[u8]) {
        let algo = self.checksum_algos
            .get(&block_id)
            .copied()
            .unwrap_or(self.checksum_algo_default);
        let csum = Self::compute_checksum_with(data, algo);
        self.checksums.insert(block_id, csum);
        self.checksum_algos.insert(block_id, algo);
    }

    /// Validate checksum for a block (MOVED from lines 1843-1870)
    pub fn validate_checksum(&self, block_id: u64, data: &[u8]) -> Result<(), DatabaseError> {
        if let Some(expected) = self.checksums.get(&block_id) {
            let algo = self
                .checksum_algos
                .get(&block_id)
                .copied()
                .unwrap_or(self.checksum_algo_default);
            let actual = Self::compute_checksum_with(data, algo);
            if *expected != actual {
                // Try other known algorithms to detect algorithm mismatch (MOVED from lines 1851-1869)
                let known_algos = [ChecksumAlgorithm::FastHash, ChecksumAlgorithm::CRC32];
                for alt in known_algos.iter().copied().filter(|a| *a != algo) {
                    let alt_sum = Self::compute_checksum_with(data, alt);
                    if *expected == alt_sum {
                        return Err(DatabaseError::new(
                            "ALGO_MISMATCH",
                            &format!(
                                "Checksum algorithm mismatch for block {}: stored algo {:?}, but data matches {:?}",
                                block_id, algo, alt
                            ),
                        ));
                    }
                }
                return Err(DatabaseError::new(
                    "CHECKSUM_MISMATCH",
                    &format!(
                        "Checksum mismatch for block {}: expected {}, got {}",
                        block_id, expected, actual
                    ),
                ));
            }
        }
        Ok(())
    }

    /// Remove checksum for a block (MOVED from lines 1709-1710)
    pub fn remove_checksum(&mut self, block_id: u64) {
        self.checksums.remove(&block_id);
        self.checksum_algos.remove(&block_id);
    }

    /// Get checksum for a block
    pub fn get_checksum(&self, block_id: u64) -> Option<u64> {
        self.checksums.get(&block_id).copied()
    }

    /// Get algorithm for a block
    pub fn get_algorithm(&self, block_id: u64) -> ChecksumAlgorithm {
        self.checksum_algos
            .get(&block_id)
            .copied()
            .unwrap_or(self.checksum_algo_default)
    }

    /// Replace all checksums (MOVED from lines 1331-1332, 1500-1501)
    pub fn replace_all(
        &mut self,
        new_checksums: HashMap<u64, u64>,
        new_algos: HashMap<u64, ChecksumAlgorithm>,
    ) {
        self.checksums = new_checksums;
        self.checksum_algos = new_algos;
    }

    /// Get reference to internal checksums map (for compatibility)
    pub fn checksums(&self) -> &HashMap<u64, u64> {
        &self.checksums
    }

    /// Get reference to internal algorithms map (for compatibility)
    pub fn algorithms(&self) -> &HashMap<u64, ChecksumAlgorithm> {
        &self.checksum_algos
    }

    /// Get default algorithm
    pub fn default_algorithm(&self) -> ChecksumAlgorithm {
        self.checksum_algo_default
    }

    /// Set checksum for testing purposes
    #[cfg(any(test, debug_assertions))]
    pub fn set_checksum_for_testing(&mut self, block_id: u64, checksum: u64) {
        self.checksums.insert(block_id, checksum);
    }
}