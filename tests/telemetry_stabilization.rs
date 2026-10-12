#![cfg(all(target_arch = "wasm32", feature = "telemetry"))]

use absurder_sql::telemetry::{Metrics, SpanRecorder, SpanStatus, WasmSpanExporter};
use absurder_sql::{ColumnValue, Database, QueryResult};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn real_queries_errors_sync_and_http_exports_preserve_telemetry() {
    let mut db = Database::new_wasm(format!("telemetry_stabilization_{}", js_sys::Date::now()))
        .await
        .expect("open real browser database");
    db.allow_non_leader_writes(true)
        .await
        .expect("single owner");
    db.execute("CREATE TABLE records(id INTEGER PRIMARY KEY, value TEXT)")
        .await
        .expect("create schema");
    let metrics = Metrics::new().expect("metrics registry");
    let spans = SpanRecorder::new();
    db.set_metrics(Some(metrics.clone()));
    db.set_span_recorder(Some(spans.clone()));
    let shared_storage = absurder_sql::vfs::indexeddb_vfs::get_storage_with_fallback(&db.name())
        .expect("registered storage");
    let early_handle = shared_storage.metrics().expect("shared metrics handle");
    let params = serde_wasm_bindgen::to_value(&vec![ColumnValue::Text("exact\0value".into())])
        .expect("typed parameters");
    let inserted: QueryResult = serde_wasm_bindgen::from_value(
        db.execute_with_params("INSERT INTO records VALUES(1,?) RETURNING value", params)
            .await
            .expect("parameterized returning"),
    )
    .expect("result");
    assert_eq!(
        inserted.rows[0].values[0],
        ColumnValue::Text("exact\0value".into())
    );
    assert_eq!(metrics.queries_total().get(), 1.0);
    assert_eq!(early_handle.queries_total().get(), 1.0);
    assert_eq!(
        metrics.errors_total().get(),
        0.0,
        "successful DML is not an error"
    );
    db.execute("SELECT * FROM records").await.expect("read");
    assert_eq!(metrics.queries_total().get(), 2.0);
    assert_eq!(metrics.errors_total().get(), 0.0);
    let duplicate = db
        .execute("INSERT INTO records VALUES(1,'duplicate')")
        .await
        .expect_err("actual unique constraint");
    assert!(
        duplicate
            .as_string()
            .expect("error text")
            .contains("UNIQUE constraint failed")
    );
    assert_eq!(metrics.errors_total().get(), 1.0);
    db.execute("SELECT * FROM missing_table")
        .await
        .expect_err("actual prepare error");
    assert_eq!(metrics.queries_total().get(), 4.0);
    assert_eq!(metrics.errors_total().get(), 2.0);
    assert_eq!(early_handle.errors_total().get(), 2.0);
    assert_eq!(early_handle.queries_total().get(), 4.0);
    db.execute("UPDATE records SET value='usable' WHERE id=1")
        .await
        .expect("usable after errors");
    assert_eq!(metrics.errors_total().get(), 2.0);
    assert_eq!(metrics.queries_total().get(), 5.0);
    assert_eq!(metrics.query_duration().get_sample_count(), 5);
    assert!(metrics.query_duration().get_sample_sum().is_finite());
    // WAL-backed SQL can still live outside the block cache. Exercise the offered
    // block-cache gauge through its real allocation/write API, not an assumed flush.
    let mut storage = absurder_sql::storage::BlockStorage::new(&format!(
        "telemetry_blocks_{}",
        js_sys::Date::now()
    ))
    .await
    .expect("real block storage");
    storage.set_metrics(Some(metrics.clone()));
    let block = storage.allocate_block().await.expect("allocate");
    storage
        .write_block(block, vec![7; absurder_sql::storage::BLOCK_SIZE])
        .await
        .expect("actual block write");
    assert!(metrics.storage_bytes().get() > 0.0);
    let syncs = metrics.sync_operations_total().get();
    db.sync().await.expect("real IndexedDB sync");
    assert_eq!(metrics.sync_operations_total().get(), syncs + 1.0);
    let recorded = spans.get_spans();
    let queries: Vec<_> = recorded
        .iter()
        .filter(|span| span.name == "execute_query")
        .collect();
    assert_eq!(queries.len(), 5);
    assert_eq!(
        queries
            .iter()
            .filter(|span| matches!(span.status, SpanStatus::Error(_)))
            .count(),
        2
    );
    assert!(
        recorded
            .iter()
            .all(|span| span.start_time_ms.is_finite()
                && span.end_time_ms.is_some_and(f64::is_finite))
    );
    let mut exporter = WasmSpanExporter::new("http://127.0.0.1:18082/v1/traces".into());
    for span in recorded {
        exporter.buffer_span(span);
    }
    let serialized_text = exporter.serialize_buffer().expect("span JSON");
    let serialized: serde_json::Value =
        serde_json::from_str(&serialized_text).expect("valid serialized spans");
    assert!(!serialized.as_array().expect("spans array").is_empty());
    exporter.flush().await.expect("real loopback HTTP export");
    let stats = serde_json::to_value(exporter.get_export_stats()).expect("serialized stats");
    assert_eq!(stats["total_exports"], 1);
    assert_eq!(stats["successful_exports"], 1);
    assert_eq!(stats["failed_exports"], 0);
    assert!(exporter.get_buffered_spans().is_empty());
    let response = wasm_bindgen_futures::JsFuture::from(
        web_sys::window()
            .expect("browser")
            .fetch_with_str("http://127.0.0.1:18082/received"),
    )
    .await
    .expect("server readback");
    use wasm_bindgen::JsCast;
    let response: web_sys::Response = response.dyn_into().expect("HTTP response");
    let body = wasm_bindgen_futures::JsFuture::from(response.text().expect("response body"))
        .await
        .expect("body text");
    let received_text = body.as_string().expect("JSON string");
    assert_eq!(
        received_text, serialized_text,
        "HTTP collector retained the exact serialized bytes"
    );
    let received: serde_json::Value = serde_json::from_str(&received_text).expect("server JSON");
    assert_eq!(
        received, serialized,
        "server received the actual recorded spans"
    );
    db.close().await.expect("close");
    Database::delete_database(db.name()).await.expect("delete");
}
