import { printLine } from './modules/print';

console.log('Content bitch script works!');
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

// Example usage:
// highlightText({
//   catagory: 'counterArgument',
//   text: 'new skills and information',
// });

class PageChunker {
  constructor(chunkSize = 125, overlapSize = 25) {
    this.chunkSize = chunkSize;
    this.overlapSize = overlapSize;
  }

  // Function to get page content
  getPageContent() {
    return document.getElementsByTagName('body')[0].textContent || '';
  }

  // Function to chunk content with overlap
  chunkContentWithOverlap(content) {
    const words = content.split(' ');
    const chunks = [];

    let chunkId = 0;
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + this.chunkSize, words.length);
      const chunkText = words.slice(start, end).join(' ');

      chunks.push({ id: chunkId, text: chunkText });

      // Move the start forward by chunkSize, but with overlap
      start += this.chunkSize - this.overlapSize;
      chunkId++;
    }

    return chunks;
  }
}

function checkAndStoreUrlContent(store) {
  const { url, chunks } = store;

  // Check if the storage contains any stored URLs
  chrome.storage.local.get(['urlContent'], (result) => {
    let urlContent = result.urlContent || [];

    // Check if the URL is already stored in the correct format
    const existingEntry = urlContent.find((entry) => entry.url === url);

    if (!existingEntry) {
      // URL not in storage, so store it in the desired format
      urlContent.push({ url: url, chunks: chunks });
      chrome.storage.local.set({ urlContent }, () => {
        console.log(`Stored content for URL: ${url}`);
      });
    } else {
      console.log(`Content already stored for URL: ${url}`);
    }
  });
}

const chunker = new PageChunker();
const content = chunker.getPageContent();
const chunks = chunker.chunkContentWithOverlap(content);
const url = window.location.href;

const store = { url: url, chunks: chunks };
checkAndStoreUrlContent(store);
