#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes Next.js build output and reports bundle sizes
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', '.next');
const THRESHOLD_KB = 500; // Warn if any chunk exceeds this

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeDirectory(dir, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      analyzeDirectory(filePath, results);
    } else if (file.endsWith('.js') || file.endsWith('.css')) {
      const size = stat.size;
      results.push({
        path: filePath.replace(BUILD_DIR, ''),
        size,
        formatted: formatBytes(size),
      });
    }
  }
  
  return results;
}

function main() {
  console.log(' Bundle Size Analysis\n');
  console.log('='.repeat(60));
  
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(' Build directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  // Analyze chunks
  const results = analyzeDirectory(path.join(BUILD_DIR, 'static'));
  
  if (results.length === 0) {
    console.error('❌ No build artifacts found.');
    process.exit(1);
  }

  // Sort by size (largest first)
  results.sort((a, b) => b.size - a.size);

  let totalSize = 0;
  let warnings = 0;

  console.log('\n📦 Largest Bundles:\n');
  
  results.slice(0, 10).forEach((file, index) => {
    totalSize += file.size;
    const sizeKB = file.size / 1024;
    const warning = sizeKB > THRESHOLD_KB ? ' ⚠️' : '';
    
    if (warning) warnings++;
    
    console.log(`${index + 1}. ${file.path}`);
    console.log(`   Size: ${file.formatted}${warning}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Total Size (top 10): ${formatBytes(totalSize)}`);
  console.log(`Total Files: ${results.length}`);
  
  if (warnings > 0) {
    console.log(`\n!  ${warnings} file(s) exceed ${THRESHOLD_KB}KB threshold`);
    console.log('Consider code splitting or lazy loading for these files.');
  } else {
    console.log('\n✓ All bundles are within size limits');
  }

  // Check for WASM
  const wasmFiles = results.filter(f => f.path.includes('wasm'));
  if (wasmFiles.length > 0) {
    console.log('\n🔧 WASM Files Found:');
    wasmFiles.forEach(file => {
      console.log(`   ${file.path}: ${file.formatted}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

main();
