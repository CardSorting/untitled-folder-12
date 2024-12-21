# Text Reader Chrome Extension

A Chrome extension that reads selected text using text-to-speech capabilities.

## Features

- Read selected text on any webpage
- Context menu integration
- Background processing with Web Workers
- Notification support

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select this directory

## Structure

- `manifest.json`: Extension configuration
- `background.js`: Background service worker
- `speechWorker.js`: Web Worker for speech processing
- `dist/`: Contains bundled JavaScript files
  - `background.bundle.js`: Bundled background script
  - `content.bundle.js`: Bundled content script
  - `textProcessorWorker.bundle.js`: Bundled text processor worker

## Development

To modify the extension:

1. Make changes to the source files
2. Rebuild the bundles using webpack
3. Reload the extension in Chrome

## Permissions

The extension requires the following permissions:
- activeTab: To access the current tab's content
- storage: To store extension settings
- scripting: To inject content scripts
- contextMenus: To add right-click menu options
- notifications: To show status notifications

## Browser Support

This extension is built for Chrome using Manifest V3.
