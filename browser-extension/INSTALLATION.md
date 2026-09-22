# Installing the AbsurderSQL DevTools Extension

## Quick Start (5 minutes)

### Step 1: Generate Icons

1. Open `browser-extension/generate_icons.html` in your browser
2. The icons will auto-generate
3. Click "Download All Icons" or download each individually:
   - `icon-16.png`
   - `icon-48.png`
   - `icon-128.png`
4. Save them in the `browser-extension/icons/` directory

### Step 2: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `browser-extension` directory from this repository
5. You should see "AbsurderSQL Telemetry DevTools" in your extensions list

### Step 3: Test the Extension

1. Run `npm run serve` from the repository root and open
   `http://localhost:8080/examples/devtools_demo.html` in Chrome
2. Open DevTools (F12 or Cmd+Option+I on Mac)
3. Click on the **"AbsurderSQL"** tab (should appear at the top or in the >> menu)
4. Back in the demo page, click:
   - "1. Initialize Database"
   - "2. Run Sample Queries"
5. Watch the DevTools panel update with the demo's sample messages.

The demo exercises the extension protocol with generated spans, not real
SQLite queries. For the runtime's current browser and optional-telemetry
results, see [Native qualification](../docs/NATIVE_QUALIFICATION.md).

## What You'll See

### Spans Tab
- Real-time list of all recorded spans
- Filter by name or status
- Click spans to see details
- Duration, timestamp, and span ID

### Export Stats Tab
- Total exports count
- Success/failure rates
- Success rate percentage
- Recent export errors

### Configuration Tab
- OTLP endpoint URL
- Batch size settings
- Auto-export toggle
- Custom headers (for authentication)

### Buffer Tab
- Number of buffered spans
- Buffer size in bytes
- Batch threshold
- Inspect/clear buffer controls

## Using with Real AbsurderSQL

The checked-in `pkg` is the qualified default build, with telemetry disabled.
A separate telemetry-enabled build is required for Rust instrumentation.
The JavaScript database constructor is:

```javascript
import init, { Database } from '@npiesco/absurder-sql';

await init();

const db = await Database.newDatabase('my_database.db');
await db.execute('SELECT 1');
await db.close();
```

This public npm import uses the version you installed; the current source
qualification does not imply a newer npm release. Creating a database does
not automatically attach a DevTools exporter.

In Rust compiled for `wasm32` with `--features telemetry`:

```rust
use absurder_sql::telemetry::WasmSpanExporter;

let exporter = WasmSpanExporter::new("http://localhost:4318/v1/traces".to_string())
    .with_devtools(true)  // Enable DevTools integration
    .with_batch_size(100);
```

`WasmSpanExporter` currently calls `chrome.runtime.sendMessage()`, while the
content script receives the `window.postMessage` protocol documented in
[README](README.md#message-protocol). Ordinary pages need an application bridge
and handlers for panel commands; the demo provides its own bridge. The
exporter's HTTP body is a JSON array of recorded spans, so the receiver must
accept that format. Buffering and flushing remain explicit application work.

## Troubleshooting

### Extension Not Appearing in DevTools

**Problem:** Can't find "AbsurderSQL" tab in DevTools

**Solutions:**
1. Make sure the extension is enabled in `chrome://extensions/`
2. Refresh the extension by clicking the refresh icon
3. Close and reopen DevTools
4. Try reloading the page

### No Spans Showing

**Problem:** DevTools panel is empty, no spans appear

**Solutions:**
1. Verify AbsurderSQL is built with `--features telemetry`
2. Check that `.with_devtools(true)` is called on `WasmSpanExporter`
3. Open browser console (Console tab in DevTools) and look for errors
4. Verify the demo page is working: `examples/devtools_demo.html`

### Icons Not Loading

**Problem:** Extension icon appears broken or missing

**Solutions:**
1. Make sure you generated and saved the icons in `browser-extension/icons/`
2. Verify all three files exist:
   - `icon-16.png`
   - `icon-48.png`
   - `icon-128.png`
3. Reload the extension from `chrome://extensions/`

### Messages Not Received

**Problem:** DevTools not receiving telemetry messages

**Solutions:**
1. Check browser console for `chrome.runtime` errors
2. Verify `manifest.json` has correct `host_permissions`
3. Make sure `content.js` is loaded (check browser console for "[Content] AbsurderSQL DevTools content script loaded")
4. Test with the demo page first: `examples/devtools_demo.html`

## Firefox Installation

To check the extension manually in Firefox:

1. Open `about:debugging#/runtime/this-firefox`
2. Click **"Load Temporary Add-on"**
3. Select `manifest.json` from the `browser-extension` directory
4. Open DevTools (F12) and find the "AbsurderSQL" tab

**Note:** Firefox extensions are temporary and will be removed when you close
Firefox. The current qualified browser lane is Chromium, not Firefox.

## Development

To modify the extension:

1. Edit files in `browser-extension/`
2. Go to `chrome://extensions/`
3. Click the refresh icon on the AbsurderSQL extension
4. Reload DevTools to see changes

### Key Files

- `manifest.json` - Extension configuration (Manifest V3)
- `devtools.js` - Message hub between panel and content script
- `panel.html` - Main UI structure
- `panel.css` - Styling
- `panel.js` - Logic and message handling
- `content.js` - Content script to bridge page messages to extension

## Security Note

The extension's `<all_urls>` match lets its content script bridge inspected
page messages. It does not bypass the page's CORS policy for exporter requests.
Be cautious when entering authentication tokens in the Custom Headers field.

## Next Steps

1. **[✓]** Install the extension
2. **[✓]** Test with the demo page
3. **[✓]** Configure your OTLP endpoint
4. **[✓]** Enable DevTools in your AbsurderSQL code
5. **[✓]** Start monitoring your application!

## Support

For issues or questions:
- GitHub: https://github.com/npiesco/absurder-sql
- Check `browser-extension/README.md` for more details
