import * as Path from 'path';
import { remote } from 'electron';

// Folder input

const folderInput = document.getElementById('folder') as HTMLInputElement;

// Name input

const nameInput = document.getElementById('name') as HTMLInputElement;
if (nameInput) {
  nameInput.addEventListener('input', () => {
    if (folderInput) {
      folderInput.setAttribute('placeholder', nameInput.value);
    }
  });
}

// Prefix paragraph

const prefixParagraph = document.getElementById('prefix');
function updatePrefixParagraph() {
  if (prefixParagraph && pathInput) {
    prefixParagraph.textContent = pathInput.value;
  }
}

// Path input

const pathInput = document.getElementById('path') as HTMLInputElement;
if (pathInput) {
  pathInput.addEventListener('input', () => {
    updatePrefixParagraph();
  });
}

// Browse button

const browseButton = document.getElementById('browse');
if (browseButton) {
  browseButton.addEventListener('click', () => {
    const window = remote.BrowserWindow.getFocusedWindow()!;
    remote.dialog.showOpenDialog(window, {properties: ['openDirectory']}, (paths) => {
      if (paths && pathInput) {
        pathInput.setAttribute('value', paths[0]);
        updatePrefixParagraph();
      }
    });
  });
}

// Create repository button

const createButton = document.getElementById('create');
if (createButton) {
  createButton.addEventListener('click', () => {
    if (pathInput && folderInput) {
      const window = remote.BrowserWindow.getFocusedWindow()!;
      const pathPrefix = pathInput.value;
      const folderName = folderInput.value || folderInput.getAttribute('placeholder');
      if (pathPrefix && folderName) {
        const path = Path.join(pathPrefix, folderName);
        window.getParentWindow().webContents.send('init-repo', path);
        window.close();
      }
    }
  });
}