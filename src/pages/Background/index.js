console.log('This is the background page.');
console.log('Put the background scripts here.');
import OpenAI from 'openai';

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting panel behavior:', error));

const asst = 'asst_Uz2LyFXaQHYdLLP3NeQDPlio';

// Add a listener for the "prokonSent" message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'prokonSent') {
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
        const openaiApiKey = await getOpenAIKey();
        const openai = new OpenAI({
          apiKey: openaiApiKey,
          dangerouslyAllowBrowser: true,
        });

        const myAssistant = await openai.beta.assistants.retrieve(asst);
        console.log('Retrieved Assistant:', myAssistant);

        // Step 1: Create the thread explicitly
        const thread = await openai.beta.threads.create({
          messages: [
            {
              role: 'user',
              content: content,
            },
          ],
        });
        console.log('Thread created:', thread);

        // Step 2: Run the assistant on the created thread
        // Poll the run status until it is completed
        const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
          assistant_id: asst,
        });

        // Log the run and thread ID
        console.log('Run created:', run);
        console.log('Thread associated with run:', run.thread_id);

        if (run.status === 'completed') {
          const messages = await openai.beta.threads.messages.list(
            run.thread_id
          );
          const messageContent =
            messages.data[0]?.content[0]?.text?.value || '{}';
          const jsonResponse = JSON.parse(messageContent); // Parse the JSON response
          console.log('Parsed Response:', jsonResponse);

          // You can now use jsonResponse as an object
          return jsonResponse;
        } else {
          console.log(`Run ended with status: ${run.status}`);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }

    main(newContent);

    sendResponse({ status: 'success' });
  }
});
