console.log('This is the background page.');
console.log('Put the background scripts here.');
import OpenAI from 'openai';

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting panel behavior:', error));

const asst = 'asst_Uz2LyFXaQHYdLLP3NeQDPlio';

function sendStatusToPanel(statusMessage) {
  chrome.runtime.sendMessage({ action: 'statusUpdate', status: statusMessage });
}

function sendProkonToOpenAi(content) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['prokons'], (result) => {
      let prokons = result.prokons || [];
      console.log(prokons);
      const existingEntry = prokons.find((entry) => entry.original === content);

      if (existingEntry) {
        resolve({ exist: true, entry: existingEntry });
      } else {
        resolve({ exist: false });
      }
    });
  });
}

function checkAndStoreUrlContent(store) {
  // Check if the storage contains any stored URLs
  chrome.storage.local.get(['prokons'], (result) => {
    let prokons = result.prokons || [];

    // Check if the URL is already stored in the correct format
    const existingEntry = prokons.find(
      (entry) => entry.original === store.original
    );

    if (!existingEntry) {
      // URL not in storage, so store it in the desired format
      prokons.push({
        store,
      });
      chrome.storage.local.set({ prokons }, () => {
        console.log(`Prokon content: ${store.title}`);
      });
      return false;
    } else {
      console.log(`Prokon Content already stored: ${existingEntry.title}`);
      return true;
    }
  });
}
// Add a listener for the "addNewProkon" message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addNewProkon') {
    const newContent = request.message; // Get the message from the request

    async function getOpenAIKey() {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(['openaiApiKey'], (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (result.openaiApiKey) {
            resolve(result.openaiApiKey);
          } else {
            reject('No API key found');
          }
        });
      });
    }

    async function main(content) {
      try {
        const response = await sendProkonToOpenAi(content); // Await the Prokon check

        if (response.exist) {
          console.log('Prokon already exists:', response.entry);
          return; // Exit if Prokon exists
        }

        sendStatusToPanel('Starting OpenAI API call...'); // Send starting status

        const openaiApiKey = await getOpenAIKey();
        const openai = new OpenAI({
          apiKey: openaiApiKey,
          dangerouslyAllowBrowser: true,
        });

        const myAssistant = await openai.beta.assistants.retrieve(asst);
        sendStatusToPanel('Retrieved Assistant'); // Update status after assistant retrieval
        const thread = await openai.beta.threads.create({
          messages: [
            {
              role: 'user',
              content: content,
            },
          ],
        });
        sendStatusToPanel('Thread created'); // Status after thread creation
        const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
          assistant_id: asst,
        });
        sendStatusToPanel('Run created and polling completed'); // Status after polling

        if (run.status === 'completed') {
          const messages = await openai.beta.threads.messages.list(
            run.thread_id
          );
          const messageContent =
            messages.data[0]?.content[0]?.text?.value || '{}';
          const jsonResponse = JSON.parse(messageContent);

          sendStatusToPanel('Run completed and response received'); // Final status
          checkAndStoreUrlContent(jsonResponse);
          return jsonResponse;
        } else {
          sendStatusToPanel(`Run ended with status: ${run.status}`);
        }
      } catch (error) {
        sendStatusToPanel('Error occurred');
        console.error('Error:', error);
      }
    }

    main(newContent);

    sendResponse({ status: 'success' });
  }
});
