import { printLine } from './modules/print';

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

function highlightText(searchString) {
  if (!searchString) return;

  // Get all the text nodes in the document
  const textNodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  textNodes.forEach((textNode) => {
    const nodeValue = textNode.nodeValue || '';
    const parentElement = textNode.parentElement;

    // Check if the text node contains the search string
    if (nodeValue.includes(searchString) && parentElement) {
      // Split the text node around the search string
      const parts = nodeValue.split(searchString);

      // Create a span element to wrap the search string and apply highlighting
      const highlight = document.createElement('span');
      highlight.className = 'highlighted'; // Apply the class "highlighted"
      highlight.textContent = searchString;

      // Create a fragment to insert the new nodes
      const fragment = document.createDocumentFragment();
      fragment.append(document.createTextNode(parts[0]));
      fragment.append(highlight);
      fragment.append(document.createTextNode(parts[1]));

      // Replace the old text node with the new fragment
      parentElement.replaceChild(fragment, textNode);
    }
  });
}

// Example usage in console:
highlightText('new skills and information');
