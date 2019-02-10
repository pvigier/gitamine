import * as fs from 'fs';
import * as Path from 'path';
import { Field, Settings } from '../shared/settings';
import { remote } from 'electron';


// Manage tabs

document.body.addEventListener('click', (event) => {
  const element = event.target as HTMLElement;
  if (element.dataset.section) {
    handleSectionTrigger(element);
  }
});

function handleSectionTrigger (element: HTMLElement) {
  hideAllSectionsAndDeselectListItems();

  // Highlight clicked list element
  element.classList.add('selected');

  // Display the current section
  const sectionId = element.dataset.section!;
  document.getElementById(sectionId)!.classList.add('shown');
}

function hideAllSectionsAndDeselectListItems() {
  const listItems = document.querySelectorAll('li.selected');
  Array.prototype.forEach.call(listItems, (listItem: Element) => {
    listItem.classList.remove('selected')
  });

  const sections = document.querySelectorAll('section.shown');
  Array.prototype.forEach.call(sections, (section: Element) => {
    section.classList.remove('shown')
  });
}

// Populate inputs

const settings = Settings.exists() ? Settings.getAll() : {};

function setInputValuesFromStore(ids: string[], keys: string[]) {
  for (let i = 0; i < ids.length; ++i) {
    if (settings[keys[i]]) {
      const element = document.getElementById(ids[i]) as HTMLInputElement;
      element.value = settings[keys[i]];
    }
  }
}

setInputValuesFromStore(['name', 'email'], [Field.Name, Field.Email]);

// Theme's combo box

const themeSelect = document.getElementById('theme') as HTMLSelectElement;

function setThemes() {
  const path = Path.join(__dirname, '../../assets/themes/');
  fs.readdir(path, {withFileTypes: true}, (error, files) => {
    for (let file of files) {
      if (file.endsWith('.json')) {
        const theme = file.substr(0, file.length - 5);
        const child = document.createElement('option');
        child.setAttribute('value', theme);
        if (theme === settings[Field.Theme]) {
          child.setAttribute('selected', 'true');
        }
        child.text = theme;
        themeSelect.appendChild(child);
      }
    }
  });
}

themeSelect.addEventListener('change', () => {
  const parent = remote.getCurrentWindow().getParentWindow();
  parent.webContents.send('update-theme', themeSelect.selectedOptions[0].text);
});

setThemes();

// Save the settings

function saveInputValuesInStore(ids: string[], keys: string[]) {
  const values = {};
  for (let i = 0; i < ids.length; ++i) {
    const element = document.getElementById(ids[i]) as HTMLInputElement;
    values[keys[i]] = element.value;
  }
  Settings.setAll(values);
}

window.onbeforeunload = () => {
  saveInputValuesInStore(['name', 'email'], [Field.Name, Field.Email]);
  Settings.set(Field.Theme, themeSelect.selectedOptions[0].text);
};