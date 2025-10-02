// Filesystem Persistence Demo
// Compile with: cargo run --example persist_demo --features fs_persist

#[cfg(not(target_arch = "wasm32"))]
use sqlite_indexeddb_rs::storage::BlockStorage;

#[cfg(not(target_arch = "wasm32"))]
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("📁 Filesystem Persistence Demo\n");

    // Create database with filesystem persistence
    let mut storage = BlockStorage::new("my_database").await?;
    println!("✓ Created database (data stored in ./datasync_storage/my_database/)\n");

    // Allocate and write blocks
    println!("Writing data...");
    let block1 = storage.allocate_block().await?;
    let block2 = storage.allocate_block().await?;
    
    storage.write_block(block1, vec![1u8; 4096]).await?;
    storage.write_block(block2, vec![2u8; 4096]).await?;
    println!("✓ Wrote 2 blocks (block {} and {})", block1, block2);

    // Sync to disk
    println!("\nSyncing to filesystem...");
    storage.sync().await?;
    println!("✓ Data persisted to disk");
    println!("  Files created:");
    println!("    - ./datasync_storage/my_database/blocks/block_{}.bin", block1);
    println!("    - ./datasync_storage/my_database/blocks/block_{}.bin", block2);
    println!("    - ./datasync_storage/my_database/metadata.json");
    println!("    - ./datasync_storage/my_database/allocations.json");

    // Close and reopen
    drop(storage);
    println!("\n🔄 Reopening database from disk...");
    
    let mut storage2 = BlockStorage::new("my_database").await?;
    println!("✓ Database reopened");

    // Read persisted data
    let data1 = storage2.read_block(block1).await?;
    let data2 = storage2.read_block(block2).await?;
    
    println!("\n✓ Read persisted data:");
    println!("  Block {}: first byte = {}", block1, data1[0]);
    println!("  Block {}: first byte = {}", block2, data2[0]);

    println!("\n✅ Filesystem persistence working!");
    println!("\n💡 Check ./datasync_storage/my_database/ to see the .bin files");

    Ok(())
}

#[cfg(target_arch = "wasm32")]
fn main() {
    // This example is not supported on WASM
    panic!("persist_demo is only supported on native targets with fs_persist feature");
}
