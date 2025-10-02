#!/usr/bin/env node
import { spawn } from 'child_process';
import { exec } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 8080;
const URL = `http://localhost:${PORT}/examples/sql_demo.html`;

console.log('🗄️  SQL Demo Launcher\n');
console.log('Starting server...');

const server = spawn('python3', ['-m', 'http.server', PORT.toString()], {
    cwd: join(__dirname, '..'),
    stdio: 'pipe'
});

setTimeout(() => {
    console.log(`✓ Server running at http://localhost:${PORT}`);
    console.log(`Opening ${URL}...\n`);
    
    const openCmd = process.platform === 'darwin' ? 'open' : 
                    process.platform === 'win32' ? 'start' : 'xdg-open';
    
    exec(`${openCmd} ${URL}`);
    console.log('Press Ctrl+C to stop\n');
}, 1000);

process.on('SIGINT', () => {
    console.log('\nShutting down...');
    server.kill();
    process.exit(0);
});
