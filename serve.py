import http.server
import socketserver

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.wasm': 'application/wasm',
        '.css': 'text/css',
        '.json': 'application/json',
        '': 'application/octet-stream',
    }

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", 8080), Handler) as httpd:
    print("Serving on port 8080")
    httpd.serve_forever()
