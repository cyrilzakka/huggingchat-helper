const vscode = require('vscode');
const http = require('http');
const crypto = require('crypto');

// Generate a unique ID for this window
const windowId = crypto.randomBytes(16).toString('hex');

// Keep track of when this window was last focused
let lastFocusTime = 0;
let activeEditor = null;
let server = null;
let serverPort = null;

function updateActiveEditor() {
    activeEditor = vscode.window.activeTextEditor;
    if (vscode.window.state.focused) {
        lastFocusTime = Date.now();
    }
}

async function startServer() {
    if (server) {
        return;
    }

    // Try ports in range 54321-54330
    for (let port = 54321; port <= 54330; port++) {
        try {
            server = http.createServer((req, res) => {
                if (req.method === 'GET') {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Content-Type', 'application/json');
                    
                    // Only return content if this window/server is still active
                    if (!server) {
                        res.statusCode = 404;
                        res.end(JSON.stringify({ error: 'Window closed' }));
                        return;
                    }
                    
                    res.end(JSON.stringify({
                        windowId: windowId,
                        lastFocusTime: lastFocusTime,
                        content: activeEditor?.document.getText() || '',
                        language: activeEditor?.document.languageId,
                        fileName: activeEditor?.document.fileName,
                        selectedText: activeEditor?.selection ? activeEditor.document.getText(activeEditor.selection) : '',
                        timestamp: new Date().toISOString(),
                        isFocused: vscode.window.state.focused,
                        port: serverPort  // Include port for debugging
                    }));
                }
            });

            await new Promise((resolve, reject) => {
                server.listen(port, '127.0.0.1', () => {
                    serverPort = port;
                    resolve();
                });
                server.on('error', reject);
            });

            console.log(`Editor content server started on port ${port} for window ${windowId}`);
            
            // Set up error handling
            server.on('error', (error) => {
                console.error(`Server error on port ${serverPort}: ${error}`);
                stopServer();
            });
            
            return;

        } catch (error) {
            console.log(`Port ${port} in use, trying next port...`);
            continue;
        }
    }

    vscode.window.showErrorMessage('Failed to start server: all ports in use');
}

function stopServer() {
    if (!server) {
        return;
    }

    const port = serverPort;
    server.close(() => {
        console.log(`Editor content server stopped on port ${port} for window ${windowId}`);
    });
    
    server = null;
    serverPort = null;
}

function activate(context) {
    console.log(`Activating extension for window ${windowId}`);
    
    updateActiveEditor();
    
    // Track window focus and editor changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            updateActiveEditor();
        })
    );

    context.subscriptions.push(
        vscode.window.onDidChangeWindowState(e => {
            if (e.focused) {
                updateActiveEditor();
            }
        })
    );

    startServer();

    // Ensure server is stopped when this specific window is closed
    context.subscriptions.push({ 
        dispose: () => {
            console.log(`Disposing extension for window ${windowId}`);
            stopServer();
        } 
    });

    // Additional cleanup for window close events
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(() => {
            // If there are no more editors in this window, stop the server
            if (!vscode.window.visibleTextEditors.length) {
                console.log(`No more editors in window ${windowId}, stopping server`);
                stopServer();
            }
        })
    );
}

function deactivate() {
    console.log(`Deactivating extension for window ${windowId}`);
    stopServer();
}

module.exports = {
    activate,
    deactivate
}