import { printLine } from './modules/print';

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

function highlightText(searchObject) {
  if (!searchObject) return;

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

  let firstHighlight = null; // To track the first highlighted element

  textNodes.forEach((textNode) => {
    const nodeValue = textNode.nodeValue || '';
    const parentElement = textNode.parentElement;

    // Check if the text node contains the search string
    if (nodeValue.includes(searchObject.text) && parentElement) {
      // Split the text node around the search string
      const parts = nodeValue.split(searchObject.text);

      // Create a span element to wrap the search string and apply highlighting
      const highlight = document.createElement('span');
      highlight.className = searchObject.catagory; // Apply the class "highlighted"
      highlight.textContent = searchObject.text;

      // Add an aria-label for screen readers
      highlight.setAttribute(
        'aria-label',
        `This text is categorised as a ${searchObject.catagory}`
      );
      // Store the first occurrence of the highlight for scrolling
      if (!firstHighlight) {
        firstHighlight = highlight;
      }

      // Create a fragment to insert the new nodes
      const fragment = document.createDocumentFragment();
      fragment.append(document.createTextNode(parts[0]));
      fragment.append(highlight);
      fragment.append(document.createTextNode(parts[1]));

      // Replace the old text node with the new fragment
      parentElement.replaceChild(fragment, textNode);
    }
  });

  // Scroll to the first highlighted element, if it exists
  if (firstHighlight) {
    firstHighlight.scrollIntoView({
      behavior: 'smooth', // Makes the scrolling smooth
      block: 'center', // Centers the element in the viewport
    });
  }
}

// // Example usage:
// highlightText({
//   catagory: 'counterArgument',
//   text: 'new skills and information',
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageContent') {
    // Extract page content and send it back to the background script
    const pageContent = document.body.innerText;
    sendResponse({ content: pageContent });
  }
});
