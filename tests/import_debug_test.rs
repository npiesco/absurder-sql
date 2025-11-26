#![cfg(target_arch = "wasm32")]

use absurder_sql::DatabaseConfig;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_import_simple() {
    web_sys::console::log_1(&"=== Testing simple import ===".into());

    // Create database and insert data
    let config1 = DatabaseConfig {
        name: "test_import_source.db".to_string(),
        ..Default::default()
    };

    let mut db1 = absurder_sql::Database::new(config1)
        .await
        .expect("Should create source database");

    db1.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)")
        .await
        .expect("Should create table");

    db1.execute("INSERT INTO test (data) VALUES ('hello')")
        .await
        .expect("Should insert data");

    // Export
    let exported = db1.export_to_file().await.expect("Should export");

    web_sys::console::log_1(&format!("Exported {} bytes", exported.length()).into());

    // Import to new database
    let config2 = DatabaseConfig {
        name: "test_import_dest.db".to_string(),
        ..Default::default()
    };

    let mut db2 = absurder_sql::Database::new(config2)
        .await
        .expect("Should create dest database");

    db2.import_from_file(exported).await.expect("Should import");

    web_sys::console::log_1(&"Import complete, reopening...".into());

    // Reopen and query
    let config3 = DatabaseConfig {
        name: "test_import_dest.db".to_string(),
        ..Default::default()
    };

    let mut db3 = absurder_sql::Database::new(config3)
        .await
        .expect("Should reopen imported database");

    web_sys::console::log_1(&"Querying imported data...".into());

    let _result = db3
        .execute("SELECT * FROM test")
        .await
        .expect("Should query imported data");

    web_sys::console::log_1(&"Import test passed".into());
}
