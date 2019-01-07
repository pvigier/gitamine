import { join } from 'path';
import { remote } from 'electron';

// Folder input

const folderInput = document.getElementById('folder');

// Name input

const nameInput = document.getElementById('name');
if (nameInput) {
  nameInput.addEventListener('input', () => {
    console.log('change');
    console.log(folderInput);
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

const pathInput = document.getElementById('path');
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
      const path = join(pathInput.value, folderInput.value);
      window.getParentWindow().webContents.send('init-repo', path);
      window.close();
    }
  });
}