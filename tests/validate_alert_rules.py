#!/usr/bin/env python3
"""
Validate Prometheus Alert Rules YAML files.

This script:
1. Validates YAML syntax
2. Validates alert rule structure
3. Validates PromQL expressions in alerts
4. Validates alert metadata (severity, annotations, etc.)
5. Cross-references with actual metrics
"""

import yaml
import sys
import re
from pathlib import Path
from typing import Dict, List, Tuple, Set

class AlertRuleValidator:
    """Validator for Prometheus alert rules."""
    
    def __init__(self, metrics_file: Path):
        self.errors = []
        self.warnings = []
        self.metrics_file = metrics_file
        self.actual_metrics = self._extract_actual_metrics()
    
    def _extract_actual_metrics(self) -> Set[str]:
        """Extract actual metric names from metrics.rs."""
        with open(self.metrics_file, 'r') as f:
            content = f.read()
        
        # Find all metric definitions
        metrics = set(re.findall(r'"(absurdersql_[a-z_]+)"', content))
        
        # Add histogram-specific metrics
        histogram_metrics = set()
        for metric in list(metrics):
            if '_ms' in metric or '_seconds' in metric:
                base_clean = metric.replace('_ms', '').replace('_seconds', '')
                histogram_metrics.add(f"{base_clean}_bucket")
                histogram_metrics.add(f"{base_clean}_sum")
                histogram_metrics.add(f"{base_clean}_count")
                histogram_metrics.add(base_clean)
        
        return metrics | histogram_metrics
    
    def validate_yaml_file(self, yaml_path: Path) -> Tuple[bool, dict]:
        """Validate YAML file can be parsed."""
        try:
            with open(yaml_path, 'r') as f:
                data = yaml.safe_load(f)
            return True, data
        except yaml.YAMLError as e:
            self.errors.append(f"{yaml_path.name}: Invalid YAML - {e}")
            return False, {}
        except FileNotFoundError:
            self.errors.append(f"{yaml_path.name}: File not found")
            return False, {}
    
    def validate_alert_groups(self, data: dict, filename: str) -> bool:
        """Validate alert groups structure."""
        if 'groups' not in data:
            self.errors.append(f"{filename}: Missing 'groups' key")
            return False
        
        if not isinstance(data['groups'], list):
            self.errors.append(f"{filename}: 'groups' must be a list")
            return False
        
        return True
    
    def validate_alert_rule(self, rule: dict, group_name: str, filename: str) -> bool:
        """Validate individual alert rule."""
        valid = True
        
        # Required fields
        required_fields = ['alert', 'expr', 'labels', 'annotations']
        for field in required_fields:
            if field not in rule:
                self.errors.append(
                    f"{filename} - {group_name}: Alert missing required field '{field}'"
                )
                valid = False
        
        if not valid:
            return False
        
        # Validate alert name
        if not re.match(r'^[A-Za-z][A-Za-z0-9_]*$', rule['alert']):
            self.errors.append(
                f"{filename} - {group_name}: Invalid alert name '{rule['alert']}'"
            )
            valid = False
        
        # Validate PromQL expression
        expr = rule['expr']
        if not self._validate_promql_expr(expr, rule['alert'], filename):
            valid = False
        
        # Validate severity label exists
        if 'severity' not in rule['labels']:
            self.errors.append(
                f"{filename} - {rule['alert']}: Missing 'severity' label"
            )
            valid = False
        else:
            severity = rule['labels']['severity']
            if severity not in ['critical', 'warning', 'info']:
                self.warnings.append(
                    f"{filename} - {rule['alert']}: Unusual severity '{severity}' "
                    "(expected critical/warning/info)"
                )
        
        # Validate annotations
        required_annotations = ['summary', 'description']
        for annotation in required_annotations:
            if annotation not in rule['annotations']:
                self.warnings.append(
                    f"{filename} - {rule['alert']}: Missing recommended annotation '{annotation}'"
                )
        
        return valid
    
    def _validate_promql_expr(self, expr: str, alert_name: str, filename: str) -> bool:
        """Validate PromQL expression in alert rule."""
        valid = True
        
        # Extract metric names from expression
        metric_pattern = r'\b(absurdersql_[a-z_]+(?:_bucket|_sum|_count)?)\b'
        metrics_used = set(re.findall(metric_pattern, expr))
        
        # Check if metrics exist
        for metric in metrics_used:
            # Normalize metric name (remove suffixes for checking)
            base_metric = metric.replace('_bucket', '').replace('_sum', '').replace('_count', '')
            
            if metric not in self.actual_metrics and base_metric not in self.actual_metrics:
                self.errors.append(
                    f"{filename} - {alert_name}: References non-existent metric '{metric}'"
                )
                valid = False
        
        # Check for balanced parentheses
        if not self._check_balanced_parens(expr):
            self.errors.append(
                f"{filename} - {alert_name}: Unbalanced parentheses in expression"
            )
            valid = False
        
        return valid
    
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
    
    def validate_recording_rules(self, rules: List[dict], group_name: str, filename: str) -> bool:
        """Validate recording rules."""
        valid = True
        
        for rule in rules:
            if 'record' not in rule:
                continue  # This is an alerting rule
            
            if 'expr' not in rule:
                self.errors.append(
                    f"{filename} - {group_name}: Recording rule missing 'expr'"
                )
                valid = False
                continue
            
            # Validate recording rule naming convention
            if not re.match(r'^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*:[a-z0-9]+$', rule['record']):
                self.warnings.append(
                    f"{filename} - {group_name}: Recording rule '{rule['record']}' "
                    "doesn't follow naming convention (level:metric:operation)"
                )
        
        return valid

def validate_alert_files(alert_dir: Path, metrics_file: Path) -> Tuple[bool, List[str], List[str]]:
    """Validate all alert rule files in directory."""
    validator = AlertRuleValidator(metrics_file)
    
    # Only validate alert and recording rule files, skip alertmanager.yml
    alert_files = [
        f for f in (list(alert_dir.glob("*.yml")) + list(alert_dir.glob("*.yaml")))
        if f.name not in ['alertmanager.yml', 'alertmanager.yaml']
    ]
    
    if not alert_files:
        validator.errors.append(f"No alert rule files found in {alert_dir}")
        return False, validator.errors, validator.warnings
    
    for alert_file in alert_files:
        valid, data = validator.validate_yaml_file(alert_file)
        if not valid:
            continue
        
        if not validator.validate_alert_groups(data, alert_file.name):
            continue
        
        for group in data['groups']:
            group_name = group.get('name', 'unnamed')
            
            if 'rules' not in group:
                validator.errors.append(
                    f"{alert_file.name} - {group_name}: Missing 'rules' key"
                )
                continue
            
            for rule in group['rules']:
                if 'alert' in rule:
                    validator.validate_alert_rule(rule, group_name, alert_file.name)
                elif 'record' in rule:
                    validator.validate_recording_rules([rule], group_name, alert_file.name)
    
    return len(validator.errors) == 0, validator.errors, validator.warnings

def main():
    """Main validation function."""
    repo_root = Path(__file__).parent.parent
    alert_dir = repo_root / "monitoring" / "prometheus"
    metrics_file = repo_root / "src" / "telemetry" / "metrics.rs"
    
    if not alert_dir.exists():
        print(f"[ERROR] Alert directory not found: {alert_dir}")
        sys.exit(1)
    
    if not metrics_file.exists():
        print(f"[ERROR] Metrics file not found: {metrics_file}")
        sys.exit(1)
    
    print("=" * 80)
    print("PROMETHEUS ALERT RULES VALIDATION REPORT")
    print("=" * 80)
    print()
    
    valid, errors, warnings = validate_alert_files(alert_dir, metrics_file)
    
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
            print(f"[OK] SUCCESS: All alert rules are valid ({len(warnings)} warnings)")
        else:
            print("[OK] SUCCESS: All alert rules are valid (no warnings)")
    else:
        print(f"[ERROR] FAILURE: Found {len(errors)} validation errors")
    print("=" * 80)
    print()
    
    sys.exit(0 if valid else 1)

if __name__ == "__main__":
    main()
