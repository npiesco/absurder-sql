//! Checksum utilities for block integrity verification.
//!
//! Ported from absurder-sql's ChecksumManager in storage/metadata.rs.
//! Two algorithms: CRC32 (default, hardware-accelerated via crc32fast)
//! and a fast non-cryptographic hash (FNV-1a).

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ChecksumAlgo {
    Crc32,
    FastHash,
}

impl Default for ChecksumAlgo {
    fn default() -> Self {
        Self::Crc32
    }
}

/// Compute a checksum for `data` using the given algorithm.
pub fn checksum(data: &[u8], algo: ChecksumAlgo) -> u64 {
    match algo {
        ChecksumAlgo::Crc32 => u64::from(crc32fast::hash(data)),
        ChecksumAlgo::FastHash => fnv1a(data),
    }
}

/// Verify that `data` matches the expected checksum.
pub fn verify(data: &[u8], expected: u64, algo: ChecksumAlgo) -> bool {
    checksum(data, algo) == expected
}

/// FNV-1a 64-bit hash — fast, non-cryptographic.
/// Same approach as absurder-sql's FastHash variant in metadata.rs.
fn fnv1a(data: &[u8]) -> u64 {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325; // FNV offset basis
    for &b in data {
        h ^= u64::from(b);
        h = h.wrapping_mul(0x0100_0000_01b3); // FNV prime
    }
    h
}
