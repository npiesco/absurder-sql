#![cfg(all(target_arch = "wasm32", feature = "telemetry"))]

use wasm_bindgen_test::*;
use absurder_sql::Database;
use absurder_sql::telemetry::Metrics;

wasm_bindgen_test_configure!(run_in_browser);

#[cfg(all(target_arch = "wasm32", feature = "telemetry"))]
mod telemetry_sampling_tests {
    use super::*;

    #[wasm_bindgen_test]
    async fn test_sampler_creation() {
        use absurder_sql::telemetry::Sampler;
        
        // Always sample
        let always = Sampler::always_on();
        assert!(always.should_sample("test_span", &std::collections::HashMap::new()));
        
        // Never sample
        let never = Sampler::always_off();
        assert!(!never.should_sample("test_span", &std::collections::HashMap::new()));
        
        // 100% sample rate
        let full = Sampler::probability(1.0);
        assert!(full.should_sample("test_span", &std::collections::HashMap::new()));
    }

    #[wasm_bindgen_test]
    async fn test_probability_sampler() {
        use absurder_sql::telemetry::Sampler;
        
        // 0% sample rate
        let zero = Sampler::probability(0.0);
        assert!(!zero.should_sample("test_span", &std::collections::HashMap::new()));
        
        // 50% sample rate - test determinism
        let half = Sampler::probability(0.5);
        
        // Same input should give same result (deterministic)
        let result1 = half.should_sample("span_123", &std::collections::HashMap::new());
        let result2 = half.should_sample("span_123", &std::collections::HashMap::new());
        assert_eq!(result1, result2, "Sampling should be deterministic");
    }

    #[wasm_bindgen_test]
    async fn test_error_always_sampled() {
        use absurder_sql::telemetry::Sampler;
        
        // Even with 0% rate, errors should be sampled
        let sampler = Sampler::probability(0.0).with_error_sampling(true);
        
        let mut attributes = std::collections::HashMap::new();
        attributes.insert("error".to_string(), "true".to_string());
        
        assert!(sampler.should_sample("error_span", &attributes), 
                "Errors should always be sampled");
    }

    #[wasm_bindgen_test]
    async fn test_sampler_integration_with_recorder() {
        use absurder_sql::telemetry::{SpanRecorder, Sampler};
        
        let sampler = Sampler::probability(0.0); // Never sample
        let recorder = SpanRecorder::new().with_sampler(sampler);
        
        // Create span
        let span = absurder_sql::telemetry::SpanBuilder::new("test".to_string()).build();
        
        // Record it
        recorder.record_span(span);
        
        // Should not be recorded due to sampling
        let recorded_spans = recorder.get_spans();
        assert_eq!(recorded_spans.len(), 0, "Span should be sampled out");
    }

    #[wasm_bindgen_test]
    async fn test_sampler_allows_sampled_spans() {
        use absurder_sql::telemetry::{SpanRecorder, Sampler};
        
        let sampler = Sampler::always_on(); // Always sample
        let recorder = SpanRecorder::new().with_sampler(sampler);
        
        // Create span
        let span = absurder_sql::telemetry::SpanBuilder::new("test".to_string()).build();
        
        // Record it
        recorder.record_span(span);
        
        // Should be recorded
        let recorded_spans = recorder.get_spans();
        assert_eq!(recorded_spans.len(), 1, "Span should be recorded");
    }

    #[wasm_bindgen_test]
    async fn test_sampling_in_database_operations() {
        use absurder_sql::telemetry::{SpanRecorder, Sampler};
        
        let metrics = Metrics::new().expect("Failed to create metrics");
        
        // Create recorder with 0% sampling
        let sampler = Sampler::probability(0.0);
        let recorder = SpanRecorder::new().with_sampler(sampler);
        
        let mut db = Database::new_wasm("test_sampling_db.db".to_string())
            .await
            .expect("Failed to create database");
        
        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));
        
        // Execute query
        let _ = db.execute_internal("CREATE TABLE test (id INTEGER)").await;
        
        // Spans should be sampled out
        let recorded_spans = recorder.get_spans();
        assert_eq!(recorded_spans.len(), 0, "Spans should be sampled out");
        
        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_error_spans_always_recorded() {
        use absurder_sql::telemetry::{SpanRecorder, Sampler};
        
        let metrics = Metrics::new().expect("Failed to create metrics");
        
        // Create recorder with 0% sampling but error sampling enabled
        let sampler = Sampler::probability(0.0).with_error_sampling(true);
        let recorder = SpanRecorder::new().with_sampler(sampler);
        
        let mut db = Database::new_wasm("test_error_sampling.db".to_string())
            .await
            .expect("Failed to create database");
        
        db.set_metrics(Some(metrics.clone()));
        db.set_span_recorder(Some(recorder.clone()));
        
        // Execute invalid SQL to trigger error (syntax error)
        let result = db.execute_internal("SELECT * FROM nonexistent_table_xyz").await;
        
        // Verify it failed
        assert!(result.is_err(), "Query should have failed");
        
        // Error span should be recorded despite 0% sampling
        let recorded_spans = recorder.get_spans();
        
        web_sys::console::log_1(&format!("Recorded {} spans", recorded_spans.len()).into());
        if !recorded_spans.is_empty() {
            web_sys::console::log_1(&format!("First span status: {:?}", recorded_spans[0].status).into());
        }
        
        assert!(recorded_spans.len() > 0, "Error spans should always be recorded");
        
        // Verify it's an error span
        let span = &recorded_spans[0];
        match &span.status {
            absurder_sql::telemetry::SpanStatus::Error(_) => {
                // Good, it's an error
            },
            _ => panic!("Expected error span, got {:?}", span.status),
        }
        
        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_sampling_statistics() {
        use absurder_sql::telemetry::{SpanRecorder, Sampler};
        
        let sampler = Sampler::probability(0.5); // 50% sampling
        let recorder = SpanRecorder::new().with_sampler(sampler);
        
        // Record many spans with deterministic IDs
        for i in 0..100 {
            let span = absurder_sql::telemetry::SpanBuilder::new(format!("span_{}", i)).build();
            recorder.record_span(span);
        }
        
        let recorded = recorder.get_spans().len();
        
        // With deterministic sampling and 50% rate, we should get roughly 50% (allow some variance)
        // But deterministic means same spans always get same decision
        assert!(recorded > 0, "Should record some spans");
        assert!(recorded < 100, "Should not record all spans");
        
        // Verify determinism - recording same spans again should give same count
        recorder.clear();
        for i in 0..100 {
            let span = absurder_sql::telemetry::SpanBuilder::new(format!("span_{}", i)).build();
            recorder.record_span(span);
        }
        
        let recorded_again = recorder.get_spans().len();
        assert_eq!(recorded, recorded_again, "Sampling should be deterministic");
    }
}

#[cfg(not(all(target_arch = "wasm32", feature = "telemetry")))]
fn main() {
    println!("Sampling telemetry tests require WASM target and telemetry feature.");
}
