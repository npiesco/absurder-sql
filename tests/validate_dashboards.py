#!/usr/bin/env python3
"""
Validate Grafana Dashboard JSON files against actual metrics exposed by AbsurderSQL.

This script:
1. Extracts metric names from dashboard JSON files
2. Reads actual metric names from src/telemetry/metrics.rs
3. Validates that all referenced metrics exist
4. Reports any mismatches
"""

import json
import re
import sys
from pathlib import Path
from typing import Set, Dict, List

def extract_metrics_from_dashboards(dashboard_dir: Path) -> Dict[str, Set[str]]:
    """Extract all metric names from Grafana dashboard JSON files."""
    metrics_by_dashboard = {}
    
    for dashboard_file in dashboard_dir.glob("*.json"):
        with open(dashboard_file, 'r') as f:
            data = json.load(f)
        
        metrics = set()
        
        # Recursively find all "expr" fields (PromQL queries)
        def find_expr_fields(obj):
            if isinstance(obj, dict):
                if 'expr' in obj:
                    # Extract metric names from PromQL expressions
                    expr = obj['expr']
                    # Match metric names: absurdersql_<name>
                    found = re.findall(r'absurdersql_[a-z_]+', expr)
                    metrics.update(found)
                for value in obj.values():
                    find_expr_fields(value)
            elif isinstance(obj, list):
                for item in obj:
                    find_expr_fields(item)
        
        find_expr_fields(data)
        metrics_by_dashboard[dashboard_file.name] = metrics
    
    return metrics_by_dashboard

def extract_actual_metrics(metrics_file: Path) -> Set[str]:
    """Extract actual metric names from metrics.rs source code."""
    with open(metrics_file, 'r') as f:
        content = f.read()
    
    # Find all metric definitions
    # Pattern: "absurdersql_<name>"
    metrics = set(re.findall(r'"(absurdersql_[a-z_]+)"', content))
    
    # Prometheus histograms automatically create _bucket, _sum, _count metrics
    histogram_base_names = set()
    for metric in list(metrics):
        if '_ms' in metric or '_seconds' in metric:
            histogram_base_names.add(metric)
    
    # Add histogram-specific metrics
    histogram_metrics = set()
    for base in histogram_base_names:
        # Remove _ms or _seconds suffix if present
        base_clean = base.replace('_ms', '').replace('_seconds', '')
        histogram_metrics.add(f"{base_clean}_bucket")
        histogram_metrics.add(f"{base_clean}_sum")
        histogram_metrics.add(f"{base_clean}_count")
        histogram_metrics.add(base_clean)
    
    return metrics | histogram_metrics

def validate_metrics(dashboard_metrics: Dict[str, Set[str]], actual_metrics: Set[str]) -> bool:
    """Validate that all dashboard metrics exist in actual metrics."""
    all_valid = True
    
    print("=" * 80)
    print("GRAFANA DASHBOARD VALIDATION REPORT")
    print("=" * 80)
    print()
    
    # Check each dashboard
    for dashboard_name, metrics in dashboard_metrics.items():
        print(f"Dashboard: {dashboard_name}")
        print("-" * 80)
        
        missing_metrics = metrics - actual_metrics
        
        if missing_metrics:
            all_valid = False
            print(f"  ❌ MISSING METRICS ({len(missing_metrics)}):")
            for metric in sorted(missing_metrics):
                print(f"     - {metric}")
        else:
            print(f"  ✅ All {len(metrics)} metrics are valid")
        
        print()
    
    # Summary
    print("=" * 80)
    if all_valid:
        print("✅ SUCCESS: All dashboards reference valid metrics")
    else:
        print("❌ FAILURE: Some dashboards reference non-existent metrics")
    print("=" * 80)
    print()
    
    # Print available metrics for reference
    print("Available Metrics:")
    print("-" * 80)
    for metric in sorted(actual_metrics):
        print(f"  - {metric}")
    print()
    
    return all_valid

def main():
    """Main validation function."""
    # Paths
    repo_root = Path(__file__).parent.parent
    dashboard_dir = repo_root / "monitoring" / "grafana" / "dashboards"
    metrics_file = repo_root / "src" / "telemetry" / "metrics.rs"
    
    # Validate paths exist
    if not dashboard_dir.exists():
        print(f"❌ Dashboard directory not found: {dashboard_dir}")
        sys.exit(1)
    
    if not metrics_file.exists():
        print(f"❌ Metrics file not found: {metrics_file}")
        sys.exit(1)
    
    # Extract metrics
    print("Extracting metrics from dashboards...")
    dashboard_metrics = extract_metrics_from_dashboards(dashboard_dir)
    
    print("Extracting actual metrics from source code...")
    actual_metrics = extract_actual_metrics(metrics_file)
    
    # Validate
    valid = validate_metrics(dashboard_metrics, actual_metrics)
    
    sys.exit(0 if valid else 1)

if __name__ == "__main__":
    main()
