import * as Path from 'path';
import { remote } from 'electron';

// Folder input

const folderInput = document.getElementById('folder') as HTMLInputElement;
folderInput.addEventListener('input', () => {
  updateButton();
});

// Name input

const nameInput = document.getElementById('name') as HTMLInputElement;
nameInput.addEventListener('input', () => {
  folderInput.placeholder = nameInput.value;
  updateButton();
});

// Prefix paragraph

const prefixParagraph = document.getElementById('prefix') as HTMLParagraphElement;
function updatePrefixParagraph() {
  prefixParagraph.textContent = pathInput.value;
}

// Path input

const pathInput = document.getElementById('path') as HTMLInputElement;
pathInput.addEventListener('input', () => {
  updatePrefixParagraph();
  updateButton();
});

// Browse button

const browseButton = document.getElementById('browse') as HTMLButtonElement;
browseButton.addEventListener('click', () => {
  const window = remote.BrowserWindow.getFocusedWindow()!;
  remote.dialog.showOpenDialog(window, {properties: ['openDirectory']}, (paths) => {
    if (paths) {
      pathInput.value = paths[0];
      updatePrefixParagraph();
      updateButton();
    }
  });
});

// Create repository button

function getData() {
  const pathPrefix = pathInput.value;
  const folderName = folderInput.value || folderInput.getAttribute('placeholder');
  return [pathPrefix, folderName];
}

const createButton = document.getElementById('submit-button') as HTMLButtonElement;
function updateButton() {
  let disabled = true;
  const [pathPrefix, folderName] = getData();
  if (pathPrefix && folderName) {
    disabled = false;
  }
  createButton.disabled = disabled;
}
createButton.addEventListener('click', () => {
  const window = remote.getCurrentWindow();
  const [pathPrefix, folderName] = getData();
  if (pathPrefix && folderName) {
    const path = Path.join(pathPrefix, folderName);
    window.getParentWindow().webContents.send('init-repo', path);
    window.close();
  }
});