// A preload script contains code that runs before your web page is loaded into the browser window
// It has access to both DOM APIs and Node.js environment, and is often used to expose privileged APIs to the renderer via the contextBridge API.
const { contextBridge, ipcRenderer } = require('electron')

// contextBridge exposes values to renderer.js script
// the versions and 'ping' function are harmless in themselves, but they belong to the node side which the renderer.js normally doesn't have access to which contains OTHER more sensitive data
contextBridge.exposeInMainWorld('versions', { // exposes the 'versions' global object
    node: () => process.versions.node, // function name is node, returns process.versions.node
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    ping: () => ipcRenderer.invoke('ping') // exposes 'ping' function to renderer 
})