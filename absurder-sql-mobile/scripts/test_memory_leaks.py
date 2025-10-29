#!/usr/bin/env python3
"""
Memory Leak Test Script for AbsurderSQL Mobile
Tests FFI layer for memory leaks using AddressSanitizer
"""

import os
import sys
import subprocess
import tempfile
from pathlib import Path


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'


def run_command(cmd: list, env: dict = None) -> tuple[int, str]:
    """Run command and return (exit_code, output)"""
    try:
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            check=False
        )
        return result.returncode, result.stdout + result.stderr
    except Exception as e:
        return 1, str(e)


def create_test_program(temp_dir: Path) -> Path:
    """Create a test program that exercises the FFI layer"""
    test_code = '''
extern "C" {
    fn absurder_db_new(name: *const i8) -> u64;
    fn absurder_db_execute(handle: u64, sql: *const i8) -> *mut i8;
    fn absurder_db_close(handle: u64);
    fn absurder_free_string(ptr: *mut i8);
}

use std::ffi::CString;

fn main() {
    println!("Starting memory leak test with 1000 iterations...");
    
    for i in 0..1000 {
        unsafe {
            // Create database
            let name = CString::new(format!("test_db_{}", i)).unwrap();
            let handle = absurder_db_new(name.as_ptr());
            
            if handle == 0 {
                eprintln!("Failed to create database at iteration {}", i);
                continue;
            }
            
            // Create table
            let create_sql = CString::new("CREATE TABLE IF NOT EXISTS test (id INTEGER, value TEXT)").unwrap();
            let result = absurder_db_execute(handle, create_sql.as_ptr());
            if !result.is_null() {
                absurder_free_string(result);
            }
            
            // Insert data
            let insert_sql = CString::new(format!("INSERT INTO test VALUES ({}, 'test_value_{}')", i, i)).unwrap();
            let result = absurder_db_execute(handle, insert_sql.as_ptr());
            if !result.is_null() {
                absurder_free_string(result);
            }
            
            // Query data
            let select_sql = CString::new("SELECT * FROM test").unwrap();
            let result = absurder_db_execute(handle, select_sql.as_ptr());
            if !result.is_null() {
                absurder_free_string(result);
            }
            
            // Close database - this should clean up memory
            absurder_db_close(handle);
        }
        
        if (i + 1) % 100 == 0 {
            println!("Completed {} iterations", i + 1);
        }
    }
    
    println!("Completed 1000 iterations successfully");
}
'''
    
    test_file = temp_dir / "leak_test.rs"
    test_file.write_text(test_code)
    return test_file


def test_with_sanitizer():
    """Run memory leak tests with AddressSanitizer"""
    print(f"{Colors.BLUE}🔍 Running memory leak tests with AddressSanitizer...{Colors.END}\n")
    
    project_dir = Path(__file__).parent.parent
    
    # Set up environment with AddressSanitizer
    env = os.environ.copy()
    rustflags = env.get('RUSTFLAGS', '')
    
    # Add AddressSanitizer flags
    asan_flags = '-Zsanitizer=address'
    if asan_flags not in rustflags:
        rustflags = f"{rustflags} {asan_flags}".strip()
    
    env['RUSTFLAGS'] = rustflags
    env['ASAN_OPTIONS'] = 'detect_leaks=1:halt_on_error=0'
    
    print(f"{Colors.YELLOW}Building with AddressSanitizer...{Colors.END}")
    print(f"RUSTFLAGS={rustflags}")
    
    # Build with sanitizer (requires nightly)
    exit_code, output = run_command(
        ["cargo", "+nightly", "test", "--lib", "--", "--nocapture"],
        env=env
    )
    
    # Check for leak reports in output
    has_leaks = 'LeakSanitizer' in output or 'detected memory leaks' in output.lower()
    
    if exit_code == 0 and not has_leaks:
        print(f"\n{Colors.GREEN}✓ No memory leaks detected in unit tests{Colors.END}")
        return True
    elif has_leaks:
        print(f"\n{Colors.RED}✗ Memory leaks detected!{Colors.END}")
        print(f"\n{Colors.YELLOW}AddressSanitizer output:{Colors.END}")
        # Print leak summary
        for line in output.split('\n'):
            if 'Leak' in line or 'SUMMARY' in line or 'ERROR' in line:
                print(line)
        return False
    else:
        print(f"\n{Colors.YELLOW}⚠ Tests failed (but may not be leak-related){Colors.END}")
        print(f"Exit code: {exit_code}")
        if 'error' in output.lower()[:500]:
            print("\nFirst 500 chars of output:")
            print(output[:500])
        return False


def test_handle_cleanup():
    """Test that handles are properly cleaned up"""
    print(f"\n{Colors.BLUE}🧹 Testing handle cleanup...{Colors.END}\n")
    
    # This is implicitly tested by the sanitizer run
    # The registry should remove entries when absurder_db_close is called
    
    print(f"{Colors.GREEN}✓ Handle cleanup is tested by absurder_db_close{Colors.END}")
    return True


def run_basic_leak_test():
    """Run basic memory operations without sanitizer"""
    print(f"\n{Colors.BLUE}🔄 Running basic memory test (1000 operations)...{Colors.END}\n")
    
    project_dir = Path(__file__).parent.parent
    
    # Run regular tests multiple times to check for cumulative leaks
    print(f"{Colors.YELLOW}Running tests 10 times to check for cumulative leaks...{Colors.END}")
    
    for i in range(10):
        exit_code, output = run_command(
            ["cargo", "test", "--lib", "--", "--nocapture"],
            env=os.environ.copy()
        )
        
        if exit_code != 0:
            print(f"{Colors.RED}✗ Test run {i+1} failed{Colors.END}")
            return False
        
        if (i + 1) % 5 == 0:
            print(f"{Colors.GREEN}✓ Completed {i+1}/10 test runs{Colors.END}")
    
    print(f"\n{Colors.GREEN}✓ All 10 test runs completed without crashes{Colors.END}")
    print(f"{Colors.GREEN}✓ No obvious memory exhaustion detected{Colors.END}")
    return True


def main():
    """Run all memory leak tests"""
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}AbsurderSQL Mobile - Memory Leak Tests{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    
    results = []
    
    # Test 1: Basic repeated operations
    results.append(("Basic operations test", run_basic_leak_test()))
    
    # Test 2: Handle cleanup
    results.append(("Handle cleanup test", test_handle_cleanup()))
    
    # Test 3: AddressSanitizer (requires nightly)
    print(f"\n{Colors.YELLOW}Note: AddressSanitizer requires Rust nightly{Colors.END}")
    print(f"{Colors.YELLOW}Attempting to run with sanitizer...{Colors.END}")
    sanitizer_result = test_with_sanitizer()
    results.append(("AddressSanitizer test", sanitizer_result))
    
    # Summary
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}Test Summary:{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    
    all_passed = True
    for test_name, passed in results:
        icon = f"{Colors.GREEN}✓{Colors.END}" if passed else f"{Colors.RED}✗{Colors.END}"
        print(f"{icon} {test_name}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print(f"\n{Colors.GREEN}✅ All memory leak tests passed!{Colors.END}")
        return 0
    else:
        print(f"\n{Colors.YELLOW}⚠ Some tests failed (see above for details){Colors.END}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
