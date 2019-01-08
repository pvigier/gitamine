import * as Path from 'path';
import { remote } from 'electron';

// Folder input

const folderInput = document.getElementById('folder') as HTMLInputElement;
folderInput.addEventListener('input', () => {
  updateButton();
});

// URL input

const urlInput = document.getElementById('url') as HTMLInputElement;
urlInput.addEventListener('input', () => {
  folderInput.placeholder = Path.parse(urlInput.value).name;
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

// Clone repository button

function getData() {
  const pathPrefix = pathInput.value;
  const folderName = folderInput.value || folderInput.getAttribute('placeholder');
  const url = urlInput.value;
  return [pathPrefix, folderName, url];
}

const cloneButton = document.getElementById('clone') as HTMLButtonElement;
function updateButton() {
  let disabled = true;
  const [pathPrefix, folderName, url] = getData();
  if (pathPrefix && folderName && url) {
    disabled = false;
  }
  cloneButton.disabled = disabled;
}
cloneButton.addEventListener('click', () => {
  const window = remote.BrowserWindow.getFocusedWindow()!;
  const [pathPrefix, folderName, url] = getData();
  if (pathPrefix && folderName && url) {
    const path = Path.join(pathPrefix, folderName);
    window.getParentWindow().webContents.send('clone-repo', [path, url]);
    window.close();
  }
});