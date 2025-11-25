use absurder_sql::types::DatabaseConfig;

/// Test that mobile_optimized() creates a config with WAL mode and optimized settings
#[test]
fn test_mobile_optimized_config_has_wal_mode() {
    let config = DatabaseConfig::mobile_optimized("test_mobile.db");
    
    assert_eq!(config.name, "test_mobile.db");
    assert_eq!(config.journal_mode, Some("WAL".to_string()));
    assert_eq!(config.cache_size, Some(20_000)); // 20K pages for mobile
    assert_eq!(config.page_size, Some(4096));
    assert_eq!(config.auto_vacuum, Some(true));
}

/// Test that mobile_optimized() accepts different string types
#[test]
fn test_mobile_optimized_accepts_string_types() {
    let config1 = DatabaseConfig::mobile_optimized("test1.db");
    let config2 = DatabaseConfig::mobile_optimized(String::from("test2.db"));
    let config3 = DatabaseConfig::mobile_optimized("test3.db".to_string());
    
    assert_eq!(config1.name, "test1.db");
    assert_eq!(config2.name, "test2.db");
    assert_eq!(config3.name, "test3.db");
}

/// Test that default config still uses MEMORY mode (browser optimized)
#[test]
fn test_default_config_uses_memory_mode() {
    let config = DatabaseConfig::default();
    
    assert_eq!(config.journal_mode, Some("MEMORY".to_string()));
    assert_eq!(config.cache_size, Some(10_000));
}

/// Test that mobile config has larger cache than default
#[test]
fn test_mobile_config_has_larger_cache_than_default() {
    let default_config = DatabaseConfig::default();
    let mobile_config = DatabaseConfig::mobile_optimized("mobile.db");
    
    let default_cache = default_config.cache_size.unwrap();
    let mobile_cache = mobile_config.cache_size.unwrap();
    
    assert!(mobile_cache > default_cache, 
        "Mobile cache ({}) should be larger than default cache ({})", 
        mobile_cache, default_cache);
}
