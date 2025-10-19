// Test TypeScript builds correctly

use std::path::Path;
use std::fs;

#[test]
fn test_tsconfig_exists() {
    let tsconfig = Path::new("tsconfig.json");
    assert!(tsconfig.exists(), "tsconfig.json must exist");
}

#[test]
fn test_tsconfig_has_lib_output() {
    let content = fs::read_to_string("tsconfig.json")
        .expect("Failed to read tsconfig.json");
    
    assert!(content.contains("\"outDir\": \"./lib\""), 
        "tsconfig must output to ./lib directory");
    assert!(content.contains("\"declaration\": true"), 
        "tsconfig must generate .d.ts files");
}

#[test]
fn test_typescript_source_exists() {
    let index_ts = Path::new("src/index.ts");
    assert!(index_ts.exists(), "src/index.ts must exist");
}

#[test]
fn test_typescript_exports_database_class() {
    let content = fs::read_to_string("src/index.ts")
        .expect("Failed to read src/index.ts");
    
    assert!(content.contains("export class AbsurderDatabase"), 
        "Must export AbsurderDatabase class");
    assert!(content.contains("export async function openDatabase"), 
        "Must export openDatabase function");
}

#[test]
fn test_typescript_exports_interfaces() {
    let content = fs::read_to_string("src/index.ts")
        .expect("Failed to read src/index.ts");
    
    assert!(content.contains("export interface QueryResult"), 
        "Must export QueryResult interface");
    assert!(content.contains("export interface DatabaseConfig"), 
        "Must export DatabaseConfig interface");
}

#[test]
fn test_typescript_has_jsdoc_comments() {
    let content = fs::read_to_string("src/index.ts")
        .expect("Failed to read src/index.ts");
    
    // Check for JSDoc comments on key methods
    assert!(content.contains("/**"), 
        "Must have JSDoc comments");
    
    // Count number of JSDoc blocks (should have several)
    let jsdoc_count = content.matches("/**").count();
    assert!(jsdoc_count >= 5, 
        "Should have at least 5 JSDoc comment blocks, found {}", jsdoc_count);
}

#[test]
fn test_database_class_has_all_methods() {
    let content = fs::read_to_string("src/index.ts")
        .expect("Failed to read src/index.ts");
    
    assert!(content.contains("async open()"), 
        "Database class must have open method");
    assert!(content.contains("async execute("), 
        "Database class must have execute method");
    assert!(content.contains("async close()"), 
        "Database class must have close method");
}

#[test]
fn test_package_json_has_build_script() {
    let content = fs::read_to_string("package.json")
        .expect("Failed to read package.json");
    
    assert!(content.contains("\"build\""), 
        "package.json must have build script");
    assert!(content.contains("tsc"), 
        "build script must use tsc (TypeScript compiler)");
}

#[test]
fn test_package_json_specifies_types() {
    let content = fs::read_to_string("package.json")
        .expect("Failed to read package.json");
    
    assert!(content.contains("\"types\""), 
        "package.json must specify types field");
    assert!(content.contains("lib/index.d.ts"), 
        "types must point to lib/index.d.ts");
}

#[test]
fn test_package_json_specifies_main() {
    let content = fs::read_to_string("package.json")
        .expect("Failed to read package.json");
    
    assert!(content.contains("\"main\": \"lib/index.js\""), 
        "main must point to lib/index.js");
}
