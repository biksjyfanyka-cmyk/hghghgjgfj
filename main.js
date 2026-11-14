import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    autoHideMenuBar: true
  });
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));
});

app.on('window-all-closed', () => app.quit());
