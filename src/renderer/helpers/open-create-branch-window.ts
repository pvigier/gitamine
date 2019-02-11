import { BrowserWindow, remote } from 'electron';

export function openCreateBranchWindow(commitSha: string) {
  let window: BrowserWindow | null = new remote.BrowserWindow({
    show: false,
    width: 400,
    height: 320,
    parent: remote.getCurrentWindow(),
    modal: true
  });

  window.loadURL(`file://${__dirname}/../../../assets/html/create-branch.html`);

  window.once('ready-to-show', () => {
    window!.show();
    window!.webContents.send('create-branch-data', commitSha);
  });
  window.on('close', () => { 
    window = null
  });
}
