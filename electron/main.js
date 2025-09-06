const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const { spawn } = require('child_process'); // lets you run shell/system commands separately from your app
let nodeServer, pythonServer;
const waitOn = require('wait-on');
const kill = require('tree-kill');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js') // preload is a predefined property in the webPreferences object. It loads the specified script before loading the webpage so you can expose APIs
    }
  })

  win.loadURL('http://localhost:3000');
}

app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong') // defines 'ping' handler function, how to handle 'ping' sent from renderer via ipcRenderer.invoke()
  
  // Start Next.js production server
  nodeServer = spawn('pnpm', ['run dev'], {
    cwd: path.join(__dirname, "..", "frontend-nextjs"), // we will check this
    shell: true
  });

  nodeServer.stdout.on('data', (data) => {
    const message = data.toString();
    if (!message.startsWith(' HEAD / ')) {
      console.log(`[frontend] ${data}`);
    }
  });

  nodeServer.stderr.on('data', (data) => {
    console.error(`[frontend-error] ${data}`);
  });

  // Start Python backend
  const pythonPath = path.join(__dirname, "..", 'backend-python', 'venv', 'Scripts', 'python.exe')
  pythonServer = spawn(pythonPath, ['main.py'], {
    cwd: path.join(__dirname, "..", 'backend-python'), // points to folder where main.py script is located
    shell: true
  });

  pythonServer.stdout.on('data', (data) => {
    console.log(`[backend] ${data}`);
  });
  pythonServer.stderr.on('data', (data) => {
    console.error(`[backend-error] ${data}`);
  });

  waitOn({ resources: ['http://localhost:3000'] }, (err) => {
    if (err) return console.error('Frontend did not start:', err);
      createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow() // for MacOS
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit() // for Windows and Linux
})

app.on('before-quit', () => {
  nodeServer?.on('exit', () => console.log('Node server exited.'));
  pythonServer?.on('exit', () => console.log('Python server exited.'));
  // nodeServer?.kill('SIGKILL');
  if (nodeServer?.pid) {
    kill(nodeServer.pid, 'SIGKILL', (err) => {
      if (err) {
        console.log('Failed to kill Node server tree.')
      } else {
        console.log("Node server killed.")
      }
    });
  } else {
    console.log('No Node process to kill.')
  }
  // pythonServer?.kill('SIGKILL');
  if (pythonServer?.pid) {
    kill(pythonServer.pid, 'SIGKILL', (err) => {
      if (err) {
        console.log('Failed to kill Python server tree.')
      } else {
        console.log('Python server killed.')
      }
    });
  } else {
    console.log("No Python process to kill.")
  }
});

