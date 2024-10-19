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

async function main() {
  try {
    const openaiApiKey = await getOpenAIKey();

    const openai = new OpenAI({
      apiKey: openaiApiKey,
      dangerouslyAllowBrowser: true,
    });

    const myAssistant = await openai.beta.assistants.retrieve(asst);
    console.log('Retrieved Assistant:', myAssistant);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
