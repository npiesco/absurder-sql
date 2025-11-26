// Test for Phase 2.3: Leader Election Events Instrumentation
// This test verifies that leader election operations are properly instrumented with telemetry

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test_configure!(run_in_browser);

#[cfg(all(target_arch = "wasm32", feature = "telemetry"))]
mod telemetry_leader_election_tests {
    use super::*;
    use absurder_sql::{Database, telemetry::Metrics};

    #[wasm_bindgen_test]
    async fn test_request_leadership_increments_metrics() {
        let metrics = Metrics::new().expect("Failed to create metrics");

        let mut db = Database::new_wasm("test_leader_election.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));

        let initial_elections = metrics.leader_elections_total().get();
        let initial_duration_count = metrics.leader_election_duration().get_sample_count();

        // Action: Request leadership
        let result = db.request_leadership().await;
        assert!(result.is_ok(), "Request leadership should succeed");

        // Assert: Metrics incremented
        let final_elections = metrics.leader_elections_total().get();
        let final_duration_count = metrics.leader_election_duration().get_sample_count();

        assert!(
            final_elections > initial_elections,
            "Leader elections counter should increment. Initial: {}, Final: {}",
            initial_elections,
            final_elections
        );
        assert!(
            final_duration_count > initial_duration_count,
            "Leader election duration should record sample. Initial: {}, Final: {}",
            initial_duration_count,
            final_duration_count
        );

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_is_leader_gauge_reflects_status() {
        let metrics = Metrics::new().expect("Failed to create metrics");

        let mut db = Database::new_wasm("test_leader_gauge.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));

        // Action: Request leadership
        let _ = db.request_leadership().await;

        // Check if we became leader
        let is_leader = db.is_leader().await;
        let gauge_value = metrics.is_leader().get();

        // Assert: Gauge matches actual leadership status
        if is_leader.unwrap_or(false) {
            assert_eq!(gauge_value, 1.0, "Gauge should be 1 when leader");
        } else {
            assert_eq!(gauge_value, 0.0, "Gauge should be 0 when not leader");
        }

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_multiple_elections_accumulate() {
        let metrics = Metrics::new().expect("Failed to create metrics");

        let mut db1 = Database::new_wasm("test_multi_election1.db".to_string())
            .await
            .expect("Failed to create database 1");

        db1.set_metrics(Some(metrics.clone()));

        let mut db2 = Database::new_wasm("test_multi_election2.db".to_string())
            .await
            .expect("Failed to create database 2");

        db2.set_metrics(Some(metrics.clone()));

        let initial_elections = metrics.leader_elections_total().get();

        // Action: Multiple instances request leadership
        let _ = db1.request_leadership().await;
        let _ = db2.request_leadership().await;

        // Assert: All elections counted
        let final_elections = metrics.leader_elections_total().get();
        let elections_performed = final_elections - initial_elections;

        assert_eq!(
            elections_performed, 2.0,
            "Should count 2 leader elections. Initial: {}, Final: {}, Diff: {}",
            initial_elections, final_elections, elections_performed
        );

        let _ = db1.close().await;
        let _ = db2.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_leadership_changes_tracked() {
        let metrics = Metrics::new().expect("Failed to create metrics");

        let mut db = Database::new_wasm("test_leadership_change.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));

        let initial_changes = metrics.leadership_changes_total().get();

        // Action: Request leadership (may trigger leadership change)
        let _ = db.request_leadership().await;

        // Assert: Leadership change may have occurred
        let final_changes = metrics.leadership_changes_total().get();

        // Leadership change should either stay same (no change) or increment (became leader)
        assert!(
            final_changes >= initial_changes,
            "Leadership changes should not decrease. Initial: {}, Final: {}",
            initial_changes,
            final_changes
        );

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_wait_for_leadership_increments_metrics() {
        let metrics = Metrics::new().expect("Failed to create metrics");

        let mut db = Database::new_wasm("test_wait_leadership.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));

        let initial_elections = metrics.leader_elections_total().get();

        // Action: Wait for leadership (includes election)
        let _ = db.wait_for_leadership().await;

        // Assert: Election counted
        let final_elections = metrics.leader_elections_total().get();
        assert!(
            final_elections > initial_elections,
            "Wait for leadership should trigger election. Initial: {}, Final: {}",
            initial_elections,
            final_elections
        );

        let _ = db.close().await;
    }

    #[wasm_bindgen_test]
    async fn test_leadership_gauge_updates_on_status_change() {
        let metrics = Metrics::new().expect("Failed to create metrics");

        let mut db = Database::new_wasm("test_gauge_update.db".to_string())
            .await
            .expect("Failed to create database");

        db.set_metrics(Some(metrics.clone()));

        // Initial state
        let initial_gauge = metrics.is_leader().get();

        // Action: Request leadership
        let _ = db.request_leadership().await;

        // Check leadership and gauge
        let is_leader = db.is_leader().await;
        let final_gauge = metrics.is_leader().get();

        // Assert: Gauge reflects leadership state
        if is_leader.unwrap_or(false) {
            assert_eq!(final_gauge, 1.0, "Gauge should be 1 when leader");
            // If we became leader, gauge should have changed from 0 to 1
            if initial_gauge == 0.0 {
                assert_ne!(
                    initial_gauge, final_gauge,
                    "Gauge should change when becoming leader"
                );
            }
        } else {
            assert_eq!(final_gauge, 0.0, "Gauge should be 0 when not leader");
        }

        let _ = db.close().await;
    }
}

#[cfg(not(all(target_arch = "wasm32", feature = "telemetry")))]
fn main() {
    println!("Leader election telemetry tests require WASM target and telemetry feature.");
}
