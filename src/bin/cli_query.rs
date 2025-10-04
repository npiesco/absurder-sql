// CLI SQL Query Tool
// Compile and run: cargo run --bin cli_query --features fs_persist -- "SELECT * FROM users"

#[cfg(not(target_arch = "wasm32"))]
use sqlite_indexeddb_rs::{database::SqliteIndexedDB, types::ColumnValue};
#[cfg(not(target_arch = "wasm32"))]
use std::env;

#[cfg(not(target_arch = "wasm32"))]
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 2 {
        eprintln!("Usage: cargo run --bin cli_query --features fs_persist -- \"SQL QUERY\"");
        eprintln!("\nExamples:");
        eprintln!("  cargo run --bin cli_query --features fs_persist -- \"SELECT * FROM users\"");
        eprintln!("  cargo run --bin cli_query --features fs_persist -- \"INSERT INTO users (name) VALUES ('Alice')\"");
        eprintln!("  cargo run --bin cli_query --features fs_persist -- \".tables\"");
        std::process::exit(1);
    }
    
    let query = &args[1];
    
    println!("🗄️  DataSync CLI Query Tool");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!();
    
    // Open or create database with filesystem persistence
    let db_name = env::var("DATASYNC_DB").unwrap_or_else(|_| "cli_demo.db".to_string());
    println!("📂 Database: {}", db_name);
    println!("💾 Storage: ./datasync_storage/{}/", db_name.replace(".db", ""));
    println!();
    
    let config = sqlite_indexeddb_rs::types::DatabaseConfig {
        name: db_name.clone(),
        cache_size: Some(2000),
        page_size: None,
        journal_mode: None,
        auto_vacuum: None,
        version: Some(1),
    };
    let mut db = SqliteIndexedDB::new(config).await?;
    
    // Handle special commands
    if query.starts_with('.') {
        match query.as_str() {
            ".tables" => {
                println!("📋 Listing tables...");
                let result = db.execute("SELECT name FROM sqlite_master WHERE type='table'").await?;
                
                if result.rows.is_empty() {
                    println!("   No tables found");
                } else {
                    for row in result.rows {
                        if let Some(first_val) = row.values.get(0) {
                            if let ColumnValue::Text(name) = first_val {
                                println!("   • {}", name);
                            }
                        }
                    }
                }
            }
            ".schema" => {
                println!("📋 Database schema...");
                let result = db.execute("SELECT sql FROM sqlite_master WHERE type='table'").await?;
                
                for row in result.rows {
                    if let Some(first_val) = row.values.get(0) {
                        if let ColumnValue::Text(sql) = first_val {
                            println!("{}\n", sql);
                        }
                    }
                }
            }
            _ => {
                eprintln!("Unknown command: {}", query);
                eprintln!("Available commands: .tables, .schema");
            }
        }
        return Ok(());
    }
    
    // Execute SQL query
    println!("🔍 Executing: {}", query);
    println!();
    
    let start = std::time::Instant::now();
    let result = db.execute(query).await?;
    let duration = start.elapsed();
    
    // Display results
    if !result.columns.is_empty() {
        // SELECT query - display table
        println!("┌{:─<80}┐", "");
        
        // Header
        print!("│");
        for col in &result.columns {
            print!(" {:<18} │", col);
        }
        println!();
        println!("├{:─<80}┤", "");
        
        // Rows
        if result.rows.is_empty() {
            println!("│ No results                                                                     │");
        } else {
            for row in &result.rows {
                print!("│");
                for val in &row.values {
                    let display = match val {
                        ColumnValue::Null => "NULL".to_string(),
                        ColumnValue::Integer(i) => i.to_string(),
                        ColumnValue::Real(f) => format!("{:.2}", f),
                        ColumnValue::Text(s) => s.clone(),
                        ColumnValue::Blob(b) => format!("<blob {} bytes>", b.len()),
                        ColumnValue::BigInt(b) => b.to_string(),
                        ColumnValue::Date(d) => format!("{:.0}", d),
                    };
                    print!(" {:<18} │", display);
                }
                println!();
            }
        }
        
        println!("└{:─<80}┘", "");
        println!();
        println!("📊 {} row(s) returned", result.rows.len());
    } else {
        // INSERT/UPDATE/DELETE - show affected rows
        println!("✓ Query executed successfully");
        println!("📊 {} row(s) affected", result.affected_rows);
        
        // Sync to disk
        db.sync().await?;
        println!("💾 Changes persisted to disk");
    }
    
    println!("⏱️  Execution time: {:.2}ms", duration.as_secs_f64() * 1000.0);
    println!();
    
    db.close().await?;
    
    Ok(())
}

#[cfg(target_arch = "wasm32")]
fn main() {
    panic!("This example is for native/CLI use only. Use --features fs_persist");
}
