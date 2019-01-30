import { Field, Settings } from './settings';


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

function setInputValuesFromStore(ids: string[], keys: string[]) {
  if (Settings.exists())
  {
    const values = Settings.getAll();
    for (let i = 0; i < ids.length; ++i) {
      if (values[keys[i]]) {
        const element = document.getElementById(ids[i]) as HTMLInputElement;
        element.value = values[keys[i]];
      }
    }
  }
}

setInputValuesFromStore(['name', 'email'], [Field.Name, Field.Email]);

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
};