// AbsurderSQL DevTools Panel Logic

class DevToolsPanel {
    constructor() {
        this.spans = [];
        this.exportStats = {
            total_exports: 0,
            successful_exports: 0,
            failed_exports: 0
        };
        this.errors = [];
        this.config = this.loadConfig();
        
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupEventListeners();
        this.setupMessageListener();
        this.loadData();
    }

    // Tab Management
    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                
                // Update active tab button
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update active tab content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${tabName}-tab`).classList.add('active');
            });
        });
    }

    // Event Listeners
    setupEventListeners() {
        // Header actions
        document.getElementById('refreshBtn').addEventListener('click', () => this.refresh());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('flushBtn').addEventListener('click', () => this.handleFlush());

        // Spans tab
        document.getElementById('spanFilter').addEventListener('input', (e) => this.filterSpans(e.target.value));
        document.getElementById('statusFilter').addEventListener('change', (e) => this.filterByStatus(e.target.value));

        // Configuration tab
        document.getElementById('configForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleConfigUpdate();
        });
        document.getElementById('resetConfig').addEventListener('click', () => this.resetConfig());

        // Buffer tab
        document.getElementById('inspectBuffer').addEventListener('click', () => this.inspectBuffer());
        document.getElementById('clearBuffer').addEventListener('click', () => this.clearBuffer());
    }

    // Message Listener - Receives messages from page via background
    setupMessageListener() {
        // Connect to background script to receive telemetry messages
        // Pass the inspected tab ID so background knows which tab we're watching
        const tabId = chrome.devtools.inspectedWindow.tabId;
        console.log('[Panel] Attempting to connect to background for tab:', tabId);
        
        try {
            this.backgroundPort = chrome.runtime.connect({ 
                name: `devtools-panel-${tabId}` 
            });
            console.log('[Panel] Connected to background for tab:', tabId);
        } catch (e) {
            console.error('[Panel] Failed to connect to background:', e);
            return;
        }
        
        this.backgroundPort.onMessage.addListener((message) => {
            console.log('[Panel] Received message:', message);
            
            switch (message.type) {
                case 'span_recorded':
                    this.addSpan(message.data);
                    break;
                case 'export_stats':
                    this.updateExportStats(message.data);
                    break;
                case 'export_error':
                    this.addError(message.data);
                    break;
                case 'buffer_update':
                    this.updateBuffer(message.data);
                    break;
                default:
                    console.warn('[Panel] Unknown message type:', message.type);
            }
        });
        
        this.backgroundPort.onDisconnect.addListener(() => {
            console.log('[Panel] Disconnected from devtools hub');
        });
    }

    // Load initial data from storage
    loadData() {
        chrome.storage.local.get(['spans', 'exportStats', 'errors'], (result) => {
            if (result.spans) {
                this.spans = result.spans;
                this.updateSpanList();
            }
            if (result.exportStats) {
                this.exportStats = result.exportStats;
                this.updateStatsDisplay();
            }
            if (result.errors) {
                this.errors = result.errors;
                this.updateErrorList();
            }
        });
    }

    // Save data to storage
    saveData() {
        chrome.storage.local.set({
            spans: this.spans,
            exportStats: this.exportStats,
            errors: this.errors
        });
    }

    // Span Management
    addSpan(span) {
        this.spans.unshift(span); // Add to beginning
        
        // Limit to 1000 spans
        if (this.spans.length > 1000) {
            this.spans = this.spans.slice(0, 1000);
        }
        
        this.updateSpanList();
        this.saveData();
    }

    updateSpanList(filteredSpans = null) {
        const spanList = document.getElementById('spanList');
        const spansToShow = filteredSpans || this.spans;
        
        // Update count
        document.getElementById('spanCount').textContent = `${spansToShow.length} span${spansToShow.length !== 1 ? 's' : ''}`;
        
        if (spansToShow.length === 0) {
            spanList.innerHTML = `
                <div class="empty-state">
                    <p>No spans found</p>
                    <p class="hint">Try adjusting your filters</p>
                </div>
            `;
            return;
        }
        
        spanList.innerHTML = spansToShow.map(span => this.createSpanElement(span)).join('');
    }

    createSpanElement(span) {
        const duration = span.end_time_ms - span.start_time_ms;
        const statusClass = span.status.code === 'Ok' ? 'ok' : 'error';
        const timestamp = new Date(span.start_time_ms).toLocaleString();
        
        return `
            <div class="span-item" data-span-id="${span.span_id}">
                <div class="span-header">
                    <span class="span-name">${this.escapeHtml(span.name)}</span>
                    <span class="span-status ${statusClass}">${span.status.code}</span>
                </div>
                <div class="span-details">
                    <div class="span-detail">
                        <span>${duration.toFixed(2)}ms</span>
                    </div>
                    <div class="span-detail">
                        <span>${timestamp}</span>
                    </div>
                    <div class="span-detail">
                        <span>ID: ${span.span_id.substring(0, 8)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    filterSpans(query) {
        const filtered = this.spans.filter(span => 
            span.name.toLowerCase().includes(query.toLowerCase())
        );
        this.updateSpanList(filtered);
    }

    filterByStatus(status) {
        if (!status) {
            this.updateSpanList();
            return;
        }
        
        const filtered = this.spans.filter(span => 
            span.status.code.toLowerCase() === status.toLowerCase()
        );
        this.updateSpanList(filtered);
    }

    // Export Stats
    updateExportStats(stats) {
        this.exportStats = stats;
        this.updateStatsDisplay();
        this.saveData();
    }

    updateStatsDisplay() {
        document.getElementById('totalExports').textContent = this.exportStats.total_exports;
        document.getElementById('successfulExports').textContent = this.exportStats.successful_exports;
        document.getElementById('failedExports').textContent = this.exportStats.failed_exports;
        
        const successRate = this.exportStats.total_exports > 0
            ? ((this.exportStats.successful_exports / this.exportStats.total_exports) * 100).toFixed(1)
            : 0;
        document.getElementById('successRate').textContent = `${successRate}%`;
    }

    // Error Management
    addError(error) {
        this.errors.unshift({
            timestamp: Date.now(),
            message: error.message || 'Unknown error',
            details: error.details || ''
        });
        
        // Limit to 100 errors
        if (this.errors.length > 100) {
            this.errors = this.errors.slice(0, 100);
        }
        
        this.updateErrorList();
        this.saveData();
    }

    updateErrorList() {
        const errorList = document.getElementById('errorList');
        
        if (this.errors.length === 0) {
            errorList.innerHTML = '<p class="empty-state">No errors recorded</p>';
            return;
        }
        
        errorList.innerHTML = this.errors.map(error => `
            <div class="error-item">
                <div class="error-time">${new Date(error.timestamp).toLocaleString()}</div>
                <div class="error-message">${this.escapeHtml(error.message)}</div>
            </div>
        `).join('');
    }

    // Configuration
    loadConfig() {
        const defaultConfig = {
            endpoint: 'http://localhost:4318/v1/traces',
            batchSize: 100,
            autoExport: false,
            devtoolsEnabled: true,
            customHeaders: {}
        };
        
        const saved = localStorage.getItem('absurdersql_config');
        return saved ? JSON.parse(saved) : defaultConfig;
    }

    saveConfig() {
        localStorage.setItem('absurdersql_config', JSON.stringify(this.config));
    }

    handleConfigUpdate() {
        // Get form values
        this.config.endpoint = document.getElementById('endpoint').value;
        this.config.batchSize = parseInt(document.getElementById('batchSize').value);
        this.config.autoExport = document.getElementById('autoExport').checked;
        this.config.devtoolsEnabled = document.getElementById('devtoolsEnabled').checked;
        
        // Parse custom headers
        try {
            const headersText = document.getElementById('customHeaders').value;
            if (headersText.trim()) {
                this.config.customHeaders = JSON.parse(headersText);
            } else {
                this.config.customHeaders = {};
            }
        } catch (e) {
            alert('Invalid JSON in custom headers');
            return;
        }
        
        // Save config
        this.saveConfig();
        
        // Send config to page
        this.sendMessageToPage({
            type: 'config_update',
            config: this.config
        });
        
        alert('Configuration saved successfully');
    }

    resetConfig() {
        this.config = {
            endpoint: 'http://localhost:4318/v1/traces',
            batchSize: 100,
            autoExport: false,
            devtoolsEnabled: true,
            customHeaders: {}
        };
        
        this.populateConfigForm();
        this.saveConfig();
        alert('Configuration reset to defaults');
    }

    populateConfigForm() {
        document.getElementById('endpoint').value = this.config.endpoint;
        document.getElementById('batchSize').value = this.config.batchSize;
        document.getElementById('autoExport').checked = this.config.autoExport;
        document.getElementById('devtoolsEnabled').checked = this.config.devtoolsEnabled;
        document.getElementById('customHeaders').value = JSON.stringify(this.config.customHeaders, null, 2);
    }

    // Buffer Management
    updateBuffer(bufferData) {
        document.getElementById('bufferedCount').textContent = bufferData.count || 0;
        document.getElementById('bufferSize').textContent = this.formatBytes(bufferData.size || 0);
        document.getElementById('batchThreshold').textContent = bufferData.threshold || 100;
    }

    inspectBuffer() {
        this.sendMessageToPage({ type: 'get_buffer' }, (response) => {
            if (response && response.buffer) {
                document.getElementById('bufferContents').textContent = 
                    JSON.stringify(response.buffer, null, 2);
            }
        });
    }

    clearBuffer() {
        if (confirm('Are you sure you want to clear the buffer? This cannot be undone.')) {
            this.sendMessageToPage({ type: 'clear_buffer' });
            document.getElementById('bufferContents').textContent = '';
            this.updateBuffer({ count: 0, size: 0, threshold: this.config.batchSize });
        }
    }

    // Actions
    handleFlush() {
        this.sendMessageToPage({ type: 'flush_spans' }, (response) => {
            if (response && response.success) {
                alert('Spans flushed successfully');
            } else {
                alert('Failed to flush spans: ' + (response?.error || 'Unknown error'));
            }
        });
    }

    refresh() {
        this.loadData();
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            this.spans = [];
            this.errors = [];
            this.exportStats = {
                total_exports: 0,
                successful_exports: 0,
                failed_exports: 0
            };
            
            this.updateSpanList();
            this.updateStatsDisplay();
            this.updateErrorList();
            this.saveData();
        }
    }

    // Communication
    sendMessageToPage(message, callback) {
        try {
            // Use chrome.devtools.inspectedWindow.eval to execute code in the page context
            const code = `
                (function() {
                    const message = ${JSON.stringify(message)};
                    if (typeof window.handleDevToolsMessage === 'function') {
                        return window.handleDevToolsMessage(message);
                    } else {
                        return { success: false, error: 'Page not ready. Please initialize the database first.' };
                    }
                })()
            `;
            
            chrome.devtools.inspectedWindow.eval(code, (result, exceptionInfo) => {
                if (exceptionInfo) {
                    console.error('Eval error:', exceptionInfo);
                    if (callback) callback({ success: false, error: exceptionInfo.description || 'Execution failed' });
                } else {
                    if (callback) callback(result);
                }
            });
        } catch (e) {
            console.error('sendMessageToPage error:', e);
            if (callback) callback({ success: false, error: e.message });
        }
    }

    // Utilities
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.devToolsPanel = new DevToolsPanel();
    
    // Populate configuration form
    window.devToolsPanel.populateConfigForm();
});
