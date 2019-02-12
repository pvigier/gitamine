import { remote, ipcRenderer } from 'electron';

// Commit

let sha: string;
ipcRenderer.on('create-branch-data', (event: Electron.Event, s: string) => {
  sha = s;
});

// Name input

const nameInput = document.getElementById('name') as HTMLInputElement;
nameInput.addEventListener('input', () => {
  updateButton();
});

// Checkout input

const checkoutInput = document.getElementById('checkout') as HTMLInputElement;

// Create branch button

const createButton = document.getElementById('create') as HTMLButtonElement;
function updateButton() {
  let disabled = true;
  const name = nameInput.value;
  if (sha && name) {
    disabled = false;
  }
  createButton.disabled = disabled;
}
createButton.addEventListener('click', () => {
  const window = remote.BrowserWindow.getFocusedWindow()!;
  const name = nameInput.value;
  if (sha && name) {
    window.getParentWindow().webContents.send('create-branch', name, sha, checkoutInput.checked);
    window.close();
  }
});