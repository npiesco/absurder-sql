/**
 * SQLite IndexedDB Demo Application
 * Demonstrates the usage of the SQLite IndexedDB library
 */

class SQLiteDemo {
    constructor() {
        this.db = null;
        this.isConnected = false;
        this.stats = {
            queriesExecuted: 0,
            tablesCreated: 0,
            rowsAffected: 0,
            totalExecutionTime: 0
        };
        
        this.initializeEventListeners();
        this.logToConsole('Demo application initialized', 'info');
    }

    initializeEventListeners() {
        // Database connection
        document.getElementById('connectBtn').addEventListener('click', () => this.connectDatabase());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnectDatabase());
        
        // Query execution
        document.getElementById('executeBtn').addEventListener('click', () => this.executeQuery());
        document.getElementById('clearResultsBtn').addEventListener('click', () => this.clearResults());
        document.getElementById('clearConsoleBtn').addEventListener('click', () => this.clearConsole());
        
        // Quick queries
        document.querySelectorAll('.quick-query').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.target.getAttribute('data-query');
                document.getElementById('sqlQuery').value = query;
            });
        });

        // Enter key in query textarea
        document.getElementById('sqlQuery').addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.executeQuery();
            }
        });
    }

    async connectDatabase() {
        try {
            this.setLoading('connectBtn', true);
            this.logToConsole('Attempting to connect to database...', 'info');

            // Get configuration
            const dbName = document.getElementById('dbName').value || 'demo.db';
            const cacheSize = parseInt(document.getElementById('cacheSize').value) || 10000;

            // Import and initialize the WASM module
            this.logToConsole(`Connecting to database: ${dbName}`, 'info');
            this.logToConsole(`Cache size: ${cacheSize} pages`, 'info');

            this.logToConsole('Loading WASM module...', 'info');
            const module = await import('/pkg/sqlite_indexeddb_rs.js');
            
            this.logToConsole('Initializing WASM...', 'info');
            await module.default();
            
            this.logToConsole('Creating database...', 'info');
            this.db = await module.Database.newDatabase(dbName);
            
            this.isConnected = true;
            this.updateConnectionState();
            this.logToConsole('✓ Successfully connected to database!', 'success');
            
        } catch (error) {
            console.error('Connection error:', error);
            this.logToConsole(`✗ Failed to connect: ${error.message}`, 'error');
            this.logToConsole(`Error details: ${error.stack}`, 'error');
        } finally {
            this.setLoading('connectBtn', false);
        }
    }

    async disconnectDatabase() {
        try {
            this.logToConsole('Disconnecting from database...', 'info');
            
            if (this.db) {
                await this.db.close();
                this.db = null;
            }
            
            this.isConnected = false;
            this.updateConnectionState();
            this.logToConsole('✓ Disconnected from database', 'success');
            
        } catch (error) {
            this.logToConsole(`✗ Error during disconnect: ${error.message}`, 'error');
        }
    }

    async executeQuery() {
        if (!this.isConnected) {
            this.logToConsole('✗ No database connection', 'error');
            return;
        }

        try {
            this.setLoading('executeBtn', true);
            const query = document.getElementById('sqlQuery').value.trim();
            
            if (!query) {
                this.logToConsole('✗ Please enter a SQL query', 'error');
                return;
            }

            this.logToConsole(`Executing: ${query}`, 'info');
            const startTime = performance.now();

            // Execute real query
            const result = await this.db.execute(query);
            const executionTime = performance.now() - startTime;

            this.displayQueryResult(result, executionTime);
            this.updateStats(result, executionTime);
            this.logToConsole(`✓ Query executed in ${executionTime.toFixed(2)}ms`, 'success');

        } catch (error) {
            this.logToConsole(`✗ Query failed: ${error.message}`, 'error');
            this.displayError(error.message);
        } finally {
            this.setLoading('executeBtn', false);
        }
    }

    displayQueryResult(result, executionTime) {
        const resultsDiv = document.getElementById('queryResults');
        const statsSpan = document.getElementById('queryStats');
        
        statsSpan.textContent = `${result.rows.length} rows, ${executionTime.toFixed(2)}ms`;
        
        if (result.rows.length === 0) {
            resultsDiv.innerHTML = `
                <div class="alert alert-info">
                    Query executed successfully. ${result.affected_rows} row(s) affected.
                    ${result.last_insert_id ? `Last insert ID: ${result.last_insert_id}` : ''}
                </div>
            `;
            return;
        }

        // Build table
        let html = '<div class="table-responsive"><table class="table table-striped table-sm">';
        
        // Header
        html += '<thead class="table-dark"><tr>';
        result.columns.forEach(col => {
            html += `<th>${this.escapeHtml(col)}</th>`;
        });
        html += '</tr></thead>';
        
        // Body
        html += '<tbody>';
        result.rows.forEach(row => {
            html += '<tr>';
            row.values.forEach(value => {
                const displayValue = this.formatColumnValue(value);
                html += `<td>${this.escapeHtml(displayValue)}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table></div>';
        
        resultsDiv.innerHTML = html;
    }

    displayError(message) {
        const resultsDiv = document.getElementById('queryResults');
        resultsDiv.innerHTML = `
            <div class="alert alert-danger">
                <strong>Error:</strong> ${this.escapeHtml(message)}
            </div>
        `;
    }

    formatColumnValue(value) {
        switch (value.type) {
            case 'Null':
                return '<em>NULL</em>';
            case 'Integer':
                return value.value.toString();
            case 'Real':
                return value.value.toFixed(2);
            case 'Text':
                return value.value;
            case 'Blob':
                return `<em>BLOB (${value.value.length} bytes)</em>`;
            default:
                return String(value.value || '');
        }
    }

    updateStats(result, executionTime) {
        this.stats.queriesExecuted++;
        this.stats.rowsAffected += result.affected_rows;
        this.stats.totalExecutionTime += executionTime;
        
        // Count table creations
        const query = document.getElementById('sqlQuery').value.toLowerCase();
        if (query.includes('create table')) {
            this.stats.tablesCreated++;
        }
        
        // Update display
        document.getElementById('statQueries').textContent = this.stats.queriesExecuted;
        document.getElementById('statTables').textContent = this.stats.tablesCreated;
        document.getElementById('statRows').textContent = this.stats.rowsAffected;
        
        const avgTime = this.stats.totalExecutionTime / this.stats.queriesExecuted;
        document.getElementById('statAvgTime').textContent = `${avgTime.toFixed(1)}ms`;
    }

    updateConnectionState() {
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const executeBtn = document.getElementById('executeBtn');
        
        connectBtn.disabled = this.isConnected;
        disconnectBtn.disabled = !this.isConnected;
        executeBtn.disabled = !this.isConnected;
        
        const statusText = this.isConnected ? 'Connected' : 'Disconnected';
        const statusClass = this.isConnected ? 'text-success' : 'text-danger';
        
        // Update button text
        connectBtn.innerHTML = this.isConnected ? 
            '✓ Connected' : 
            '<span class="loading spinner-border spinner-border-sm" role="status"></span> Connect to Database';
    }

    setLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        const spinner = button.querySelector('.loading');
        
        if (loading) {
            button.disabled = true;
            if (spinner) spinner.style.display = 'inline-block';
        } else {
            button.disabled = false;
            if (spinner) spinner.style.display = 'none';
        }
    }

    logToConsole(message, type = 'info') {
        const console = document.getElementById('consoleOutput');
        const timestamp = new Date().toLocaleTimeString();
        const typeClass = type === 'error' ? 'error' : type === 'success' ? 'success' : '';
        
        const logEntry = document.createElement('div');
        logEntry.className = typeClass;
        logEntry.innerHTML = `<span class="text-muted">[${timestamp}]</span> ${this.escapeHtml(message)}`;
        
        console.appendChild(logEntry);
        console.scrollTop = console.scrollHeight;
    }

    clearResults() {
        document.getElementById('queryResults').innerHTML = 
            '<div class="text-muted">Execute a query to see results here...</div>';
        document.getElementById('queryStats').textContent = '';
    }

    clearConsole() {
        document.getElementById('consoleOutput').innerHTML = 
            '<div class="text-muted">Console output will appear here...</div>';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.sqliteDemo = new SQLiteDemo();
});

// Add some helpful information to the console
console.log('SQLite IndexedDB Demo Application');
console.log('Features:');
console.log('- SQLite database running in the browser');
console.log('- IndexedDB persistence for data storage');
console.log('- Full SQL support with WebAssembly');
console.log('- TypeScript integration for type safety');
