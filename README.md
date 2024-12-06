# Editor Content Server
A simple VSCode extension that exposes the active editor content via a local HTTP server. For use with the HuggingChat macOS app.

## Features
- Creates a local server on port 54321 to expose editor content
- Returns the current open file's content, language, and name
- Useful for external applications that need to access VSCode content

## Installation
1. Copy the extension to your VSCode extensions folder (`~/.vscode/extensions/`)
2. Restart VSCode

## Usage
The extension automatically starts a server when VSCode launches. You can control the server using:
- `Start HuggingChat Helper`: Start the server manually
- `Stop HuggingChat Helper`: Stop the server manually

## API
Send a GET request to `http://127.0.0.1:54321` to receive:
```json
{
    "content": "Current file content",
    "language": "File language (e.g., javascript)",
    "fileName": "Current file name"
}
```

## Note
This extension is intended for local development use only. The server only accepts connections from localhost.