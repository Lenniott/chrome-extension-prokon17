console.log('This is the background page.');
console.log('Put the background scripts here.');
import OpenAI from 'openai';

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting panel behavior:', error));

const asst = 'asst_Uz2LyFXaQHYdLLP3NeQDPlio';

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

async function pollRunStatus(openai, runId) {
  let run;
  let retryCount = 0;
  const maxRetries = 5; // Retry a few times before failing

  do {
    retryCount += 1;
    console.log('Polling for run status, attempt:', retryCount);
    try {
      run = await openai.beta.threads.runs.retrieve(runId);
      if (run.status === 'completed') {
        console.log('Run completed');
        return run;
      } else if (run.status === 'failed') {
        throw new Error('Run failed');
      }
    } catch (err) {
      if (retryCount >= maxRetries) {
        throw new Error(
          `Failed to retrieve run status after ${retryCount} attempts: ${err.message}`
        );
      }
      console.warn(`Error polling run status: ${err.message}. Retrying...`);
    }

    // Wait for 2 seconds before polling again
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } while (retryCount < maxRetries);

  throw new Error('Max retries exceeded for polling run status.');
}

async function main() {
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
          content:
            'The United States spends more money on its military budget than all the industrialized nations combined.',
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
      const messages = await openai.beta.threads.messages.list(run.thread_id);
      for (const message of messages.data.reverse()) {
        // Add a fallback for the content structure
        const text = message.content[0]?.text?.value || 'No content available';
        console.log(`${message.role} > ${text}`);
      }
    } else {
      console.log(`Run ended with status: ${run.status}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
