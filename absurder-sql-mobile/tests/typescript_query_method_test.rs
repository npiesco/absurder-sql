// Test TypeScript query() convenience method implementation

use std::fs;

#[test]
fn test_typescript_has_query_method() {
    let ts_content = fs::read_to_string("src/index.ts")
        .expect("Failed to read index.ts");
    
    assert!(ts_content.contains("query(") || ts_content.contains("async query("), 
        "TypeScript API must have query method");
}

#[test]
fn test_query_method_returns_array() {
    let ts_content = fs::read_to_string("src/index.ts")
        .expect("Failed to read index.ts");
    
    // Should return Array<Record<string, any>>
    assert!(ts_content.contains("Array<Record<string, any>>") || ts_content.contains("Record<string, any>[]"), 
        "query method must return array of records");
}

#[test]
fn test_query_method_has_jsdoc() {
    let ts_content = fs::read_to_string("src/index.ts")
        .expect("Failed to read index.ts");
    
    // Should have documentation
    assert!(ts_content.contains("/**") && ts_content.contains("query"), 
        "query method must have JSDoc documentation");
}

#[test]
fn test_query_method_calls_execute() {
    let ts_content = fs::read_to_string("src/index.ts")
        .expect("Failed to read index.ts");
    
    // query() should call execute() internally
    let has_query = ts_content.contains("query(");
    let calls_execute = ts_content.contains("this.execute(") || ts_content.contains("await this.execute");
    
    assert!(has_query && calls_execute, 
        "query method must call execute() internally");
}

#[test]
fn test_query_method_returns_rows_only() {
    let ts_content = fs::read_to_string("src/index.ts")
        .expect("Failed to read index.ts");
    
    // Should extract .rows from the result
    assert!(ts_content.contains(".rows") && ts_content.contains("query"), 
        "query method must return only the rows property from QueryResult");
}
