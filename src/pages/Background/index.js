console.log('This is the background page.');
console.log('Put the background scripts here.');
import OpenAI from 'openai';

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting panel behavior:', error));

const asst = 'asst_Uz2LyFXaQHYdLLP3NeQDPlio';
const stanceAsst = 'asst_3vX0w4ypuiqQn7XTwdMOlP0y';

function sanitiseJSON(jsonString) {
  // Ensure jsonString is defined and is a string
  if (typeof jsonString !== 'string') {
    console.error('Invalid input: jsonString is not a string.');
    return null;
  }

  try {
    // Escape single quotes in string values to prevent parsing errors
    jsonString = jsonString.replace(/\\'/g, "'"); // handle pre-escaped single quotes
    jsonString = jsonString.replace(/(?<!\\)'/g, "\\'"); // escape unescaped single quotes

    // Trim whitespace
    jsonString = jsonString.trim();

    // Attempt to parse to validate JSON format
    JSON.parse(jsonString);

    return jsonString; // Return sanitised JSON string if valid
  } catch (error) {
    console.error('Failed to sanitise JSON:', error);
    return null; // Return null if sanitisation fails
  }
}

// Add a listener for the "prokonSent" message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'prokonSent') {
    const newContent = request.message; // Get the message from the request
    let prokon;
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
          const message = messages.data[0];

          const text =
            message.content[0]?.text?.value || 'No content available';

          try {
            const sanitiseText = sanitiseJSON(text);
            const jsonObject = JSON.parse(sanitiseText);
            prokon = jsonObject;
            // Send the prokon data back to the panel
            chrome.runtime.sendMessage({
              action: 'prokonData',
              data: prokon,
            });
          } catch (error) {
            console.error('Failed to parse JSON:', error);
          }
        } else {
          console.log(`Run ended with status: ${run.status}`);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    main(newContent);
    console.log('prokon: ', prokon);
    sendResponse({ status: 'success', response: prokon });
  }
});
