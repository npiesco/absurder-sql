#!/usr/bin/env python3
"""
Brace balance checker for Rust files.
Identifies where opening/closing brace balance breaks.
"""

import sys
from pathlib import Path

def check_brace_balance(filepath):
    """Check brace balance using proper stack tracking."""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Stack to track opening braces: [(line_num, line_text), ...]
    open_stack = []
    # Track extra closing braces
    extra_closes = []
    
    for line_num, line in enumerate(lines, start=1):
        line_text = line.rstrip()
        
        # Process each character
        for char in line:
            if char == '{':
                # Push opening brace onto stack
                open_stack.append((line_num, line_text))
            elif char == '}':
                # Try to match with opening brace
                if open_stack:
                    open_stack.pop()
                else:
                    # Extra closing brace - no matching open
                    extra_closes.append((line_num, line_text))
    
    # Final report
    print(f"\n{'='*80}")
    print(f"File: {filepath}")
    print(f"{'='*80}")
    
    # Check for errors
    has_errors = False
    
    # Report extra closing braces
    if extra_closes:
        has_errors = True
        print(f"\n[ERROR] {len(extra_closes)} EXTRA CLOSING BRACE(S) - NO MATCHING OPEN:")
        for line_num, line_text in extra_closes:
            print(f"  Line {line_num}: {line_text[:80]}")
        if extra_closes[0][0] == 1:
            print(f"\n>>> STRAY CLOSING BRACE AT START OF FILE! <<<")
    
    # Report unclosed opening braces
    if open_stack:
        has_errors = True
        print(f"\n[ERROR] {len(open_stack)} UNCLOSED OPENING BRACE(S):")
        print(f"\nThese opening braces were NEVER closed:")
        for line_num, line_text in open_stack:
            print(f"  Line {line_num}: {line_text[:80]}")
        print(f"\n>>> FIX: Add {len(open_stack)} closing brace(s) }} <<<")
    
    if not has_errors:
        print("[OK] BALANCED: All braces match!")
        return True
    else:
        print(f"\n[FAILED] File has brace mismatch errors!")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 check_braces.py <file>")
        print("\nOr check all storage files:")
        print("  python3 check_braces.py src/storage/*.rs")
        sys.exit(1)
    
    files = sys.argv[1:]
    failed_files = []
    
    for filepath in files:
        filepath = Path(filepath)
        if not filepath.exists():
            print(f"[WARNING] File not found: {filepath}")
            continue
            
        print(f"\n{'='*80}")
        print(f"Checking: {filepath}")
        print(f"{'='*80}\n")
        
        if not check_brace_balance(filepath):
            failed_files.append(filepath)
        
        print()
    
    # Summary
    if len(files) > 1:
        print(f"\n{'='*80}")
        print("SUMMARY")
        print(f"{'='*80}")
        print(f"Total files checked: {len(files)}")
        print(f"Failed files: {len(failed_files)}")
        if failed_files:
            print("\n[FAILED] Files with unbalanced braces:")
            for f in failed_files:
                print(f"  - {f}")
        else:
            print("\n[OK] All files have balanced braces!")
