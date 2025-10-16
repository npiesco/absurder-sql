// Content script to bridge page and devtools extension
console.log('[Content] AbsurderSQL DevTools content script loaded');

let portDevTools;

// Listen for connection from devtools hub
chrome.runtime.onConnect.addListener(port => {
    if (port.name !== 'devtools-hub') return;
    
    console.log('[Content] DevTools connected');
    portDevTools = port;
    
    portDevTools.onDisconnect.addListener(() => {
        console.log('[Content] DevTools disconnected');
        portDevTools = null;
    });
});

// Listen for messages from the page
window.addEventListener('message', (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;
    
    // Check if it's an AbsurderSQL telemetry message
    if (event.data && event.data.source === 'absurdersql-telemetry') {
        console.log('[Content] Received telemetry from page:', event.data.message);
        
        // Forward to devtools via port
        if (portDevTools) {
            portDevTools.postMessage(event.data.message);
        } else {
            console.warn('[Content] DevTools not connected, dropping message');
        }
    }
});

console.log('[Content] Ready to forward telemetry messages');
