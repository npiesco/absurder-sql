#!/usr/bin/env python3
"""
Validate PromQL syntax in Grafana dashboard queries.

This script:
1. Extracts all PromQL expressions from dashboards
2. Validates syntax (basic checks)
3. Checks for common PromQL mistakes
"""

import json
import re
import sys
from pathlib import Path
from typing import List, Tuple, Dict

class PromQLValidator:
    """Basic PromQL syntax validator."""
    
    def __init__(self):
        self.errors = []
        self.warnings = []
    
    def validate_expression(self, expr: str, context: str) -> bool:
        """Validate a single PromQL expression."""
        expr = expr.strip()
        
        if not expr:
            self.errors.append(f"{context}: Empty expression")
            return False
        
        # Check for balanced parentheses
        if not self._check_balanced_parens(expr):
            self.errors.append(f"{context}: Unbalanced parentheses in: {expr}")
            return False
        
        # Check for valid function usage
        if not self._check_functions(expr):
            return False
        
        # Check for valid rate/increase usage
        if not self._check_rate_increase(expr, context):
            return False
        
        # Check histogram_quantile usage
        if not self._check_histogram_quantile(expr, context):
            return False
        
        # Check for label matchers
        if not self._check_label_matchers(expr, context):
            return False
        
        return True
    
    def _check_balanced_parens(self, expr: str) -> bool:
        """Check if parentheses are balanced."""
        stack = []
        pairs = {'(': ')', '[': ']', '{': '}'}
        
        for char in expr:
            if char in pairs:
                stack.append(char)
            elif char in pairs.values():
                if not stack or pairs[stack.pop()] != char:
                    return False
        
        return len(stack) == 0
    
    def _check_functions(self, expr: str) -> bool:
        """Check for valid PromQL function usage."""
        # Common PromQL functions
        valid_functions = {
            'rate', 'irate', 'increase', 'sum', 'avg', 'min', 'max', 'count',
            'stddev', 'stdvar', 'topk', 'bottomk', 'histogram_quantile',
            'abs', 'ceil', 'floor', 'round', 'sqrt', 'exp', 'ln', 'log2', 'log10',
            'deriv', 'predict_linear', 'delta', 'idelta', 'changes',
            'sort', 'sort_desc', 'clamp_max', 'clamp_min', 'time', 'timestamp'
        }
        
        # Find all function calls
        function_pattern = r'\b([a-z_]+)\s*\('
        functions_used = re.findall(function_pattern, expr)
        
        for func in functions_used:
            if func not in valid_functions:
                self.warnings.append(f"Unknown function: {func} (might be valid, please verify)")
        
        return True
    
    def _check_rate_increase(self, expr: str, context: str) -> bool:
        """Check rate/increase usage on counters."""
        # rate() and increase() should have a range vector
        rate_pattern = r'(rate|irate|increase)\s*\(\s*([^)]+)\)'
        matches = re.finditer(rate_pattern, expr)
        
        for match in matches:
            func = match.group(1)
            arg = match.group(2)
            
            # Check if argument has a range selector [...]
            if '[' not in arg:
                self.errors.append(
                    f"{context}: {func}() requires a range vector, found: {func}({arg})"
                )
                return False
            
            # Check if range selector is at the end
            if not re.search(r'\[\w+\]', arg):
                self.errors.append(
                    f"{context}: Invalid range selector in: {func}({arg})"
                )
                return False
        
        return True
    
    def _check_histogram_quantile(self, expr: str, context: str) -> bool:
        """Check histogram_quantile usage."""
        hq_pattern = r'histogram_quantile\s*\(\s*([^,]+),\s*(.+)\)'
        matches = re.finditer(hq_pattern, expr)
        
        for match in matches:
            quantile = match.group(1).strip()
            vector_expr = match.group(2).strip()
            
            # Check quantile is between 0 and 1
            try:
                q = float(quantile)
                if not 0 <= q <= 1:
                    self.errors.append(
                        f"{context}: histogram_quantile quantile must be between 0 and 1, got: {q}"
                    )
                    return False
            except ValueError:
                # Might be a variable, that's okay
                pass
            
            # Check that vector expression includes '_bucket'
            if '_bucket' not in vector_expr:
                self.warnings.append(
                    f"{context}: histogram_quantile should use _bucket metrics, found: {vector_expr}"
                )
        
        return True
    
    def _check_label_matchers(self, expr: str, context: str) -> bool:
        """Check label matcher syntax."""
        # Label matchers like {label="value"}
        matcher_pattern = r'\{([^}]+)\}'
        matches = re.findall(matcher_pattern, expr)
        
        for matcher in matches:
            # Check for valid label matcher syntax
            # Valid: label="value", label!="value", label=~"regex", label!~"regex"
            parts = re.split(r'[=!~]+', matcher)
            
            if len(parts) < 2:
                self.errors.append(
                    f"{context}: Invalid label matcher syntax: {{{matcher}}}"
                )
                return False
        
        return True

def extract_and_validate_queries(dashboard_dir: Path) -> Tuple[bool, List[str], List[str]]:
    """Extract and validate all PromQL queries from dashboards."""
    validator = PromQLValidator()
    all_queries: Dict[str, List[str]] = {}
    
    for dashboard_file in dashboard_dir.glob("*.json"):
        with open(dashboard_file, 'r') as f:
            data = json.load(f)
        
        queries = []
        
        # Recursively find all "expr" fields (PromQL queries)
        def find_queries(obj, path=""):
            if isinstance(obj, dict):
                if 'expr' in obj and 'targets' not in path:
                    expr = obj['expr']
                    context = f"{dashboard_file.name} - {path}"
                    queries.append((expr, context))
                    validator.validate_expression(expr, context)
                
                for key, value in obj.items():
                    find_queries(value, f"{path}.{key}" if path else key)
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    find_queries(item, f"{path}[{i}]")
        
        find_queries(data)
        all_queries[dashboard_file.name] = [q[0] for q in queries]
    
    return len(validator.errors) == 0, validator.errors, validator.warnings

def main():
    """Main validation function."""
    # Paths
    repo_root = Path(__file__).parent.parent
    dashboard_dir = repo_root / "monitoring" / "grafana" / "dashboards"
    
    if not dashboard_dir.exists():
        print(f"[ERROR] Dashboard directory not found: {dashboard_dir}")
        sys.exit(1)
    
    print("=" * 80)
    print("PROMQL SYNTAX VALIDATION REPORT")
    print("=" * 80)
    print()
    
    valid, errors, warnings = extract_and_validate_queries(dashboard_dir)
    
    if errors:
        print("ERRORS:")
        print("-" * 80)
        for error in errors:
            print(f"  [X] {error}")
        print()
    
    if warnings:
        print("WARNINGS:")
        print("-" * 80)
        for warning in warnings:
            print(f"  [!] {warning}")
        print()
    
    print("=" * 80)
    if valid:
        if warnings:
            print(f"[OK] SUCCESS: All PromQL queries are valid ({len(warnings)} warnings)")
        else:
            print("[OK] SUCCESS: All PromQL queries are valid (no warnings)")
    else:
        print(f"[ERROR] FAILURE: Found {len(errors)} PromQL syntax errors")
    print("=" * 80)
    print()
    
    sys.exit(0 if valid else 1)

if __name__ == "__main__":
    main()
