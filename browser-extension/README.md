# AbsurderSQL Telemetry DevTools Extension

A browser extension for inspecting and debugging AbsurderSQL telemetry data directly in Chrome/Firefox DevTools.

## Features

- **Real-time Span Visualization** - View all recorded spans with filtering and search
- **Export Statistics Dashboard** - Track export success/failure rates
- **Configuration UI** - Configure OTLP endpoint, batch size, and headers
- **Buffer Inspection** - View and manage the span buffer
- **Manual Flush** - Trigger span export on demand
- **Error Tracking** - Monitor export errors and debugging info

## Installation

### Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `browser-extension` directory
5. Open DevTools (F12) and find the "AbsurderSQL" tab

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `manifest.json` from the `browser-extension` directory
4. Open DevTools (F12) and find the "AbsurderSQL" tab

## Requirements

- AbsurderSQL with `--features telemetry` enabled
- WasmSpanExporter with DevTools integration enabled:

```rust
use absurder_sql::telemetry::WasmSpanExporter;

let exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string())
    .with_devtools(true)  // Enable DevTools integration
    .with_batch_size(100);
```

## Usage

### Viewing Spans

1. Open DevTools (F12)
2. Navigate to the "AbsurderSQL" tab
3. Click on the "Spans" tab
4. Use the search bar to filter spans by name
5. Use the status dropdown to filter by OK/Error

### Monitoring Export Statistics

1. Navigate to the "Export Stats" tab
2. View real-time export metrics:
   - Total exports
   - Successful exports
   - Failed exports
   - Success rate percentage
3. Check the "Recent Errors" section for troubleshooting

### Configuration

1. Navigate to the "Configuration" tab
2. Configure:
   - **OTLP Endpoint** - Where to send spans
   - **Batch Size** - Number of spans per batch
   - **Auto-Export** - Enable/disable automatic export
   - **DevTools Integration** - Toggle DevTools messages
   - **Custom Headers** - Add authentication headers (JSON format)
3. Click "Save Configuration"

Example custom headers:
```json
{
  "Authorization": "Bearer YOUR_API_KEY",
  "X-Custom-Header": "value"
}
```

### Buffer Management

1. Navigate to the "Buffer" tab
2. View buffer statistics:
   - Buffered span count
   - Buffer size in bytes
   - Batch threshold
3. Click "Inspect Buffer" to view raw buffer contents
4. Click "Clear Buffer" to remove all buffered spans

### Manual Flush

Click the "⚡ Flush" button in the header to manually trigger span export at any time.

## Message Protocol

The extension uses a three-tier architecture for Manifest V3 compatibility:

**Page → Content Script → DevTools Hub → Panel**

### From Page to DevTools

Pages send telemetry using `window.postMessage`:

```javascript
window.postMessage({
    source: 'absurdersql-telemetry',
    message: {
        type: 'span_recorded',
        data: {
            span_id: '...',
            name: 'query_execution',
            start_time_ms: 1234567890,
            end_time_ms: 1234567900,
            status: { code: 'Ok' },
            attributes: {}
        }
    }
}, '*');
```

### Architecture Flow

1. **Page** sends telemetry via `window.postMessage` with `source: 'absurdersql-telemetry'`
2. **Content Script** (`content.js`) listens for window messages and forwards to DevTools hub via port
3. **DevTools Hub** (`devtools.js`) connects content script to panel and forwards messages
4. **Panel** (`panel.js`) receives telemetry and updates UI

This architecture works around Manifest V3 service worker limitations by making the devtools page (which stays alive while DevTools is open) the message hub instead of a background worker.

### Message Types

- `span_recorded` - New span was recorded
- `export_stats` - Export statistics update
- `export_error` - Export failed
- `buffer_update` - Buffer status changed
- `config_update` - Configuration changed (from DevTools to page)
- `flush_spans` - Manual flush requested
- `get_buffer` - Request buffer contents
- `clear_buffer` - Clear the buffer

## Development

### File Structure

```
browser-extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── devtools.html          # DevTools entry point
├── devtools.js            # Message hub between panel and content script
├── panel.html             # Main panel UI
├── panel.css              # Panel styling
├── panel.js               # Panel logic and telemetry display
├── content.js             # Content script to bridge page and extension
├── icons/                 # Extension icons
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── README.md              # This file
└── INSTALLATION.md        # Installation guide
```

### Building Icons

Icons should be PNG files with transparent backgrounds:
- `icon-16.png` - 16x16px (toolbar)
- `icon-48.png` - 48x48px (extension management)
- `icon-128.png` - 128x128px (Chrome Web Store)

You can create these from SVG using tools like ImageMagick:
```bash
convert icon.svg -resize 16x16 icon-16.png
convert icon.svg -resize 48x48 icon-48.png
convert icon.svg -resize 128x128 icon-128.png
```

### Testing

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the AbsurderSQL extension
4. Reload DevTools to see changes

## Troubleshooting

### Extension Not Appearing in DevTools

- Ensure the extension is enabled in `chrome://extensions/`
- Check that you've opened DevTools after enabling the extension
- Try closing and reopening DevTools

### No Spans Showing

- Verify AbsurderSQL is built with `--features telemetry`
- Ensure `with_devtools(true)` is called on WasmSpanExporter
- Check browser console for errors
- Verify DevTools integration is enabled in Configuration tab

### Export Failures

- Check the "Recent Errors" section in Export Stats tab
- Verify OTLP endpoint is correct and accessible
- Check custom headers for authentication issues
- Ensure CORS is configured on the OTLP endpoint

## Security Considerations

- **Custom Headers**: Be cautious with sensitive authentication tokens
- **Host Permissions**: Extension requires `<all_urls>` to communicate with any OTLP endpoint
- **Local Storage**: Configuration is stored in browser's local storage

## License

This extension is part of the AbsurderSQL project and uses the same license.

## Support

For issues, questions, or contributions, visit:
https://github.com/npiesco/absurder-sql