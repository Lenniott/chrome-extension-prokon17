import OpenAI from 'openai';

console.log('This is the background page.');
console.log('Put the background scripts here.');

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting panel behavior:', error));

const asst = 'asst_Uz2LyFXaQHYdLLP3NeQDPlio';
const stanceAsst = 'asst_3vX0w4ypuiqQn7XTwdMOlP0y';

function sanitiseJSON(jsonString) {
  if (typeof jsonString !== 'string') {
    console.error('Invalid input: jsonString is not a string.');
    return null;
  }
  try {
    jsonString = jsonString.replace(/\\'/g, "'");
    jsonString = jsonString.replace(/(?<!\\)'/g, "\\'");
    jsonString = jsonString.trim();
    JSON.parse(jsonString);
    return jsonString;
  } catch (error) {
    console.error('Failed to sanitise JSON:', error);
    return null;
  }
}

function chunkText(text, chunkSize, overlap) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  console.log(`Chunked text into ${chunks.length} chunks.`);
  return chunks;
}

async function getOpenAIKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          'Error retrieving OpenAI API key:',
          chrome.runtime.lastError
        );
        reject(chrome.runtime.lastError);
      } else if (result.openaiApiKey) {
        console.log('Successfully retrieved OpenAI API key.');
        resolve(result.openaiApiKey);
      } else {
        console.error('No API key found in Chrome storage.');
        reject('No API key found');
      }
    });
  });
}

async function getPageContent() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error('No active tabs found to retrieve page content.');
        reject('No active tabs found');
        return;
      }

      // Send a message to the content script to retrieve the content
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'getPageContent' },
        (response) => {
          if (chrome.runtime.lastError || !response) {
            console.error(
              'Failed to get page content:',
              chrome.runtime.lastError?.message
            );
            reject(
              'Failed to get page content: ' + chrome.runtime.lastError?.message
            );
          } else {
            console.log('Successfully retrieved page content.');
            resolve(response.content);
          }
        }
      );
    });
  });
}

async function getEmbeddings(openai, chunks) {
  const embeddings = [];
  for (const chunk of chunks) {
    try {
      console.log('Getting embedding for chunk:', chunk.slice(0, 50), '...');
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: chunk,
      });
      embeddings.push(response.data[0].embedding);
      console.log('Successfully retrieved embedding.');
    } catch (error) {
      console.error('Error getting embedding for chunk:', error);
    }
  }
  console.log(`Retrieved ${embeddings.length} embeddings.`);
  return embeddings;
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magnitudeA === 0 || magnitudeB === 0) {
    console.warn(
      'One of the vectors has zero magnitude, returning similarity of 0.'
    );
    return 0; // Avoid division by zero
  }
  return dotProduct / (magnitudeA * magnitudeB);
}

async function semanticSearch(embeddings, queryEmbedding) {
  console.log('Performing semantic search for the given query embedding.');
  const similarities = embeddings.map((embedding) => {
    return cosineSimilarity(embedding, queryEmbedding);
  });

  // Sort the similarities in descending order and return the top results
  const topResults = similarities
    .map((similarity, index) => ({ similarity, index }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10)
    .map((result) => result.index);

  console.log(
    `Semantic search completed. Top ${topResults.length} results selected.`
  );
  return topResults.map((index) => embeddings[index]);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'prokonSent') {
    const newContent = request.message;
    let prokon;

    async function main(content) {
      try {
        console.log('Starting main function for processing prokonSent action.');
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
        const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
          assistant_id: asst,
        });

        if (run.status === 'completed') {
          console.log('Assistant run completed successfully.');
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

            console.log('Parsed prokon object:', prokon);

            // Get the content of the current page
            const pageContent = await getPageContent();

            // Chunk the content
            const chunkSize = 500;
            const overlap = 50;
            const chunks = chunkText(pageContent, chunkSize, overlap);

            // Get embeddings for the chunks
            const embeddings = await getEmbeddings(openai, chunks);

            // Perform similarity search for argument and counterArgument
            console.log('Performing similarity search for argument.');
            const argumentEmbedding = await openai.embeddings.create({
              model: 'text-embedding-ada-002',
              input: prokon.argument,
            });
            const argumentResultsIndices = await semanticSearch(
              embeddings,
              argumentEmbedding.data[0].embedding
            );
            const argumentResults = argumentResultsIndices.map(
              (index) => chunks[index]
            );

            console.log('Performing similarity search for counterArgument.');
            const counterArgumentEmbedding = await openai.embeddings.create({
              model: 'text-embedding-ada-002',
              input: prokon.counterArgument,
            });
            const counterArgumentResultsIndices = await semanticSearch(
              embeddings,
              counterArgumentEmbedding.data[0].embedding
            );
            const counterArgumentResults = counterArgumentResultsIndices.map(
              (index) => chunks[index]
            );

            // Send argument and counterArgument results to stance assistant
            console.log('Sending argument results to stance assistant.');
            const stanceArgumentThread = await openai.beta.threads.create({
              messages: [
                {
                  role: 'user',
                  content: JSON.stringify({
                    argument: prokon.argument,
                    results: argumentResults,
                  }),
                },
              ],
            });
            console.log(
              'Stance argument thread created:',
              stanceArgumentThread
            );
            const stanceArgumentRun =
              await openai.beta.threads.runs.createAndPoll(
                stanceArgumentThread.id,
                {
                  assistant_id: stanceAsst,
                }
              );
            console.log('Stance argument run completed successfully.');
            const stanceArgumentMessages =
              await openai.beta.threads.messages.list(stanceArgumentThread.id);

            console.log('Sending counterArgument results to stance assistant.');
            const stanceCounterArgumentThread =
              await openai.beta.threads.create({
                messages: [
                  {
                    role: 'user',
                    content: JSON.stringify({
                      argument: prokon.counterArgument,
                      results: counterArgumentResults,
                    }),
                  },
                ],
              });
            console.log(
              'Stance counterArgument thread created:',
              stanceCounterArgumentThread
            );
            const stanceCounterArgumentRun =
              await openai.beta.threads.runs.createAndPoll(
                stanceCounterArgumentThread.id,
                {
                  assistant_id: stanceAsst,
                }
              );
            console.log('Stance counterArgument run completed successfully.');
            const stanceCounterArgumentMessages =
              await openai.beta.threads.messages.list(
                stanceCounterArgumentThread.id
              );

            // Add the stance results to the prokon object
            console.log('Adding stance results to the prokon object.');
            prokon.argument = {
              text: prokon.argument,
              results: stanceArgumentMessages.data.map((msg) => ({
                text: msg.content,
              })),
            };
            prokon.counterArgument = {
              text: prokon.counterArgument,
              results: stanceCounterArgumentMessages.data.map((msg) => ({
                text: msg.content,
              })),
            };

            // Send the prokon data back to the panel
            console.log('Sending prokon data back to the panel.');
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
  }
});
