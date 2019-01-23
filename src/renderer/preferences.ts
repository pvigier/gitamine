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
