// DevTools page - creates the panel and acts as message hub between panel and content script

let portPanel, portContent;
const tabId = chrome.devtools.inspectedWindow.tabId;

// Forward messages between panel and content script
const onPanelMessage = msg => {
    console.log('[DevTools] Panel -> Content:', msg);
    if (portContent) portContent.postMessage(msg);
};

const onContentMessage = msg => {
    console.log('[DevTools] Content -> Panel:', msg);
    if (portPanel) portPanel.postMessage(msg);
};

// Listen for panel connection
chrome.runtime.onConnect.addListener(port => {
    if (port.name !== `devtools-panel-${tabId}`) return;
    
    console.log('[DevTools] Panel connected');
    portPanel = port;
    portPanel.onMessage.addListener(onPanelMessage);
    
    // Connect to content script
    portContent = chrome.tabs.connect(tabId, {name: 'devtools-hub'});
    portContent.onMessage.addListener(onContentMessage);
    
    portContent.onDisconnect.addListener(() => {
        console.log('[DevTools] Content disconnected');
        portContent = null;
    });
});

// Create the panel
chrome.devtools.panels.create(
    'AbsurderSQL',
    'icons/icon-16.png',
    'panel.html',
    (panel) => {
        console.log('[DevTools] Panel UI created');
    }
);
