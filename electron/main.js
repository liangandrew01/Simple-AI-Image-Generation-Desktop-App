// console.log() in Electron writes to Node terminal running the app

const { app } = require('electron')
if (require('electron-squirrel-startup')) {
  app.quit();
  process.exit(0); // ← THIS is required
}

const { BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const { spawn } = require('child_process'); // lets you run shell/system commands separately from your app
let nodeServer, pythonServer;
const waitOn = require('wait-on');
const kill = require('tree-kill');
const fs = require('fs');
const net = require('net');
const log = require('electron-log');

// const logFile = path.join(__dirname, 'backend1.log'); // ENOENT, can't write to path
// const logFile = path.join(app.getPath("userData"),"backend1.log");
log.transports.file.resolvePath = () =>
  path.join(app.getPath("userData"), "app.log");

log.info("Electron starting...");
log.info(`BOOT PID=${process.pid}`);
log.info(`BOOT ARGV=${JSON.stringify(process.argv)}`);
log.info(`BOOT isPackaged=${app.isPackaged}`);

let mainWindow = null;

const createWindow = () => {
  if (mainWindow) return; // starts as null, so first time of launching if logic would be skipped.
  mainWindow = new BrowserWindow({  // after first launch, mainWindow is assigned and not null anymore, so any further launches would trigger return and prevent duplicate windows
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // preload is a predefined property in the webPreferences object. It loads the specified script before loading the webpage so you can expose APIs
      webSecurity: false,
    }
  })

  // mainWindow.loadURL('http://localhost:3000')
  // mainWindow.loadFile(path.join(__dirname, '../frontend-nextjs/out/index.html')); // "dev" production __dirname means the directory of the current JS file, so would be electron in this case
  mainWindow.loadFile(path.join(process.resourcesPath, 'out', 'index.html')); // true Electron forge production
  console.log("process.resourcesPath=");
  console.log(process.resourcesPath);
  log.info("process.resourcesPath=");
  log.info(process.resourcesPath);

  mainWindow.on('closed', () => { mainWindow = null; });
}

const isPortOpen = (port) => {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', (err) => {
      if (err.code === 'EADDREINUSE') resolve(true);
      else resolve(false);
    });
    tester.once('listening', () => {
      tester.close();
      resolve(false);
    });
    tester.listen(port, '127.0.0.1');
  });
}

let hasSpawnedBackend = false;

const gotTheLock = app.requestSingleInstanceLock();
log.info(`requestSingleInstanceLock result=${gotTheLock} PID=${process.pid}`);
if (!gotTheLock) {
  console.log("Second instance detected → quitting early");
  log.info("Second instance detected → quitting early");
  log.info(`SECOND INSTANCE QUIT PID=${process.pid} ARGV=${JSON.stringify(process.argv)}`);
  app.quit(); // second instance → quit
} else {
  app.on('second-instance', (event, argv, cwd) => {
    // Someone tried to run a second instance → focus window
    console.log("Second instance launched → focusing existing window");
    log.info("Second instance launched → focusing existing window");

    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    // ipcMain.handle('ping', () => 'pong') // defines 'ping' handler function, how to handle 'ping' sent from renderer via ipcRenderer.invoke()
    console.log("app.whenReady starting");
    log.info("app.whenReady starting");
    
    if (hasSpawnedBackend) {
      console.warn("⚠️ Preventing duplicate backend spawn");
      log.info("⚠️ Preventing duplicate backend spawn");
      return;
    }
    hasSpawnedBackend = true;    // Now safe to spawn backend
    console.log(`[ELECTRON] Proceeding to spawning backend from renderer process PID: ${process.pid} - first and only time`);
    log.info(`[ELECTRON] Proceeding to spawning backend from renderer process PID: ${process.pid} - first and only time`);

    
    
    try {
      // ✅ 1. Check if backend is *already running* (e.g., left over from crash)
      const alreadyRunning = await isPortOpen(8000);
      if (alreadyRunning) {
        console.log('Backend already running on :8000 - skipping spawn');
        log.info('Backend already running on :8000 - skipping spawn');
      } else {
      // ✅ 2. Spawn backend
      // const pythonPath = path.join(__dirname, '..', 'backend-python', 'dist', 'main.exe'); // "dev production" path before bundling with E forge
      const pythonPath = path.join(process.resourcesPath, 'dist', 'main.exe'); // production path

      console.log("[ELECTRON] Spawning backend:", pythonPath);
      log.info("[ELECTRON] Spawning backend:", pythonPath);
      pythonServer = spawn(pythonPath, { shell: true });

      pythonServer.stdout.on('data', (data) => {
          // console.log(`[backend] ${data}`);
          // fs.appendFileSync(logFile, `[stdout] ${data}`);
          log.info(`[backend] ${data.toString().trim()}`);
      });
      pythonServer.stderr.on('data', (data) => {
          // console.error(`[backend-error] ${data}`);
          // fs.appendFileSync(logFile, `[stderr] ${data}`);
          log.error(`[backend] ${data.toString().trim()}`);
      });
      pythonServer.on('exit', (code, signal) => {
          // console.error(`Python backend exited with code ${code}`);
          // fs.appendFileSync(logFile, `Python backend exited with code ${code}\n`);
          log.error(`[backend-exit] code=${code} signal=${signal}`);
      });
      }

      // ✅ 3. Wait for health *after* deciding whether to spawn
      console.log("[ELECTRON] Waiting for backend health...");
      log.info("[ELECTRON] Waiting for backend health...");
      await new Promise((resolve, reject) => {
        waitOn({ resources: ['http://127.0.0.1:8000/health']}, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log("Backend /health route active and listening - creating window now");
      log.info("Backend /health route active and listening - creating window now");
      if (!mainWindow) createWindow();
    } catch (err) {
        console.error('Backend did not start:', err);
        log.error('Backend did not start:', err);
        app.quit();
    }
  });

    // // Development
    // // Start Python backend
    // const pythonPath = path.join(__dirname, "..", 'backend-python', 'venv', 'Scripts', 'python.exe')
    // pythonServer = spawn(pythonPath, ['main.py'], {
    //   cwd: path.join(__dirname, "..", 'backend-python'), // points to folder where main.py script is located
    //   shell: true
    // });

    // pythonServer.stdout.on('data', (data) => {
    //   console.log(`[backend] ${data}`);
    // });
    // pythonServer.stderr.on('data', (data) => {
    //   console.error(`[backend-error] ${data}`);
    // });

    // waitOn({ resources: ['http://localhost:3000'] }, (err) => {
    //   if (err) return console.error('Frontend did not start:', err);
    //     createWindow();
    // });



    // // Development
    // // Start Next.js development server
    // nodeServer = spawn('pnpm', ['run dev'], {
    //   cwd: path.join(__dirname, "..", "frontend-nextjs"), // we will check this
    //   shell: true
    // });

    // nodeServer.stdout.on('data', (data) => {
    //   const message = data.toString();
    //   if (!message.startsWith(' HEAD / ')) {
    //     console.log(`[frontend] ${data}`);
    //   }
    // });

    // nodeServer.stderr.on('data', (data) => {
    //   console.error(`[frontend-error] ${data}`);
    // });

    // waitOn({ resources: ['http://127.0.0.1:8000/health'] }, (err) => {
    //   if (err) return console.error('Backend did not start:', err);
    //     createWindow();
    // });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow() // for MacOS
    })
  };


// closing window is different from quitting the app
// closing window stops the renderer, destroys the BrowserWindow object, but app may continue running in the background
// like with mac os

// order is 
// 1) click "X": window-all-closed
// 2) request quit: app.on('before-quit')
// 3) final termination: app.on('quit')
app.on('window-all-closed', async () => {
  console.log(`clicked "X" - app.on('window-all-closed') - running cleanup()`); // 1
  log.info(`clicked "X" - app.on('window-all-closed') - running cleanup()`); // 1
  await cleanup();
  if (process.platform !== 'darwin') { // checks if current OS is not macOS
    console.log(`app.quit() initiated`);
    log.info(`app.quit() initiated`);
    app.quit(); // for Windows and Linux
    // app.exit(0); // immediately terminates app, Node process.on('exit') fires
  }
});

function killProcess(child, name) {
  return new Promise((resolve) => {
    if (!child?.pid) return resolve(); // if child process doesn't exist, then resolve

    // child.kill('SIGTERM'); // attempt graceful exit with SIGTERM
    
    // set timeout to use force tree-kill if child not killed with resolve()
    const childKillTimeout = setTimeout(() => {
      if (!child.killed) {
        kill(child.pid, 'SIGKILL', () => {
          console.log(`Force kill ${name}`); // 3
          resolve();
        });
      }
    }, 10000)

    child.once('exit', (code, signal) => { // set exit listener ('signal', callback) with resolve()
      console.log(`${name} exited gracefully. Code: ${code}, Signal: ${signal}`); // 2
      log.info(`${name} exited gracefully. Code: ${code}, Signal: ${signal}`);
      clearTimeout(childKillTimeout);
      resolve();
    });
  })
}

async function cleanup() {
  await Promise.all([
    killProcess(pythonServer, "pythonServer"), 
    // killProcess(nodeServer, "nodeServer"), 
  ]);
}

// process refers to the Node runtime process
// termination commands come from OS level (SIGINT, SIGTERM)
// like the building itself - electricity, fire alarms, shutdown signals

// SIGTERM is a graceful shutdown request compared to SIGKILL
// ex: kill <pid>
process.on('SIGTERM', async () => {
  console.log('Caught SIGTERM - running cleanup()');
  log.info('Caught SIGTERM - running cleanup()');
  await cleanup();
});

// SIGINT = graceful-ish, more abrupt than SIGTERM
// when user closes or hits ctrl + C in terminal
// gives program a chance to stop itself and cleanup but if program ignores it, OS may eventually force-kill
process.on('SIGINT', async () => { 
  console.log('Caught SIGINT (Ctrl+C)  - running cleanup()');
  log.info('Caught SIGINT (Ctrl+C)  - running cleanup()');
  await cleanup();
});

// on exit, Node has already shut down and you can only log stuff
process.on('exit', () => {
  console.log(`process.on('exit') - Process exiting`); //5
  log.info(`process.on('exit') - Process exiting`);
});

// app refers to the Electron application instance
// app lifecycle events (launch, quit, activate, windows closed)
// "the business running inside the building - open store, close store, reopn"
app.on('before-quit', async () => { // when user clicks "X" on Electron window. But if you close terminal, hit ctrl + C, app crashes, before-quit won't always run, leaving orphaned backend processes 
  console.log(`app.on('before-quit') - Electron exiting`); // 4
  log.info(`app.on('before-quit') - Electron exiting`);
  // await cleanup();
});

app.on('quit', async () => {
  console.log("app.on('quit')");
  log.info("app.on('quit')");
  // await cleanup()
});

