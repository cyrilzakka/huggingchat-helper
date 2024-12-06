const vscode = require('vscode');
const http = require('http');

let server = null;

function startServer() {
    if (server) {
        // vscode.window.showInformationMessage('Hugging is already running');
        return;
    }

    server = http.createServer((req, res) => {
        if (req.method === 'GET') {
            const editor = vscode.window.activeTextEditor;
            const content = editor?.document.getText() || '';
            
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            
            res.end(JSON.stringify({
                content: content,
                language: editor?.document.languageId,
                fileName: editor?.document.fileName
            }));
        }
    });

    server.listen(54321, '127.0.0.1', () => {
        // vscode.window.showInformationMessage('Editor content server started on port 54321');
    });

    server.on('error', (error) => {
        vscode.window.showErrorMessage(`Server error: ${error.message}`);
        server = null;
    });
}

function stopServer() {
    if (!server) {
        vscode.window.showInformationMessage('Server is not running');
        return;
    }

    server.close(() => {
        vscode.window.showInformationMessage('Editor content server stopped');
        server = null;
    });
}
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Activated huggingchat-helper. You should now be able to use the HuggingChat with VSCode.');
	
	// Register commands
    let startCommand = vscode.commands.registerCommand('huggingchat-helper.start', startServer);
    let stopCommand = vscode.commands.registerCommand('huggingchat-helper.stop', stopServer);

    context.subscriptions.push(startCommand);
    context.subscriptions.push(stopCommand);

    // Start server on activation
    startServer();
    vscode.window.showInformationMessage('HuggingChat extension activated.');
}

// This method is called when your extension is deactivated
function deactivate() {
    stopServer();
}

module.exports = {
	activate,
	deactivate
}
