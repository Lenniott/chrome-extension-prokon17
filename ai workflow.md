Based on the code, I'll break down the AI and prompt flow in Prokon:

## General Flow

1. **User Interaction**
- User opens the side panel in Chrome
- Enters a thesis/statement in the input field
- Clicks "Prokon" button to analyze

2. **Background Processing**

```56:73:src/pages/Background/index.js
async function handleProkonRequest(rawProkon) {
  const prokonAsst = 'asst_Uz2LyFXaQHYdLLP3NeQDPlio';
  const stanceAsst = 'asst_3vX0w4ypuiqQn7XTwdMOlP0y';
  const page = await requestContentAndChunk();
  const openaiApiKey = await getOpenAIKey();
  const openai = new OpenAI({
    apiKey: openaiApiKey,
    dangerouslyAllowBrowser: true,
  });

  const thread = await openai.beta.threads.create();
  console.log('thread created');
  let prokonObject = await sendMessageToAssistent(
    openai,
    prokonAsst,
    thread.id,
    rawProkon
  );
```

- Creates OpenAI thread
- Uses two AI assistants:
  - `prokonAsst` (ID: asst_Uz2LyFXaQHYdLLP3NeQDPlio)
  - `stanceAsst` (ID: asst_3vX0w4ypuiqQn7XTwdMOlP0y)

3. **Content Processing**

```18:38:src/pages/Background/functions.js
export function chunkText(text, chunkSize, overlap) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  console.log(`Chunked text into ${chunks.length} chunks.`);
  return chunks;
}

export async function requestContentAndChunk() {
  // Get page content and chunk it
  sendLogToPanel('Getting page content...');
  const pageContent = await getPageContent();
  console.log('content received');
  const chunkSize = 300;
  const overlap = 50;
  const chunks = await chunkText(pageContent.pageContent, chunkSize, overlap);
  console.log('content chunked');
  return { url: pageContent.url, chunks: chunks };
}
```

- Gets current page content
- Chunks text into smaller pieces (300 characters with 50 character overlap)
- Prepares content for analysis

4. **AI Analysis**

```58:83:src/pages/Background/openai.js
export async function sendMessageToAssistent(
  openai,
  asstId,
  threadId,
  message
) {
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: message,
  });
  console.log('message sent');
  const run = await openai.beta.threads.runs.createAndPoll(threadId, {
    assistant_id: asstId,
  });

  if (run.status === 'completed') {
    console.log('run complete');
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    console.log('messages', messages);
    return JSON.parse(
      sanitiseJSON(messages.body.data[0].content[0].text.value)
    );
  } else {
    console.log(run.status);
  }
}
```

- Sends message to OpenAI assistant
- Waits for completion
- Parses response into JSON format

5. **Result Structure**

```29:43:src/pages/Panel/Panel.tsx
type Prokon = {
  id: string;
  title: string;
  argument: ArgumentType;
  counterArgument: ArgumentType;
};

type ArgumentType = {
  argument: string;
  statements: Text[];
};

type Text = {
  text: string;
};
```

The AI returns a structured response containing:
- ID
- Title
- Argument (with supporting statements)
- Counter Argument (with supporting statements)

6. **Visual Presentation**

```1:16:src/pages/Content/content.styles.css
/* content.css */
.argument {
  background-color: lightskyblue;
  font-weight: bold;
  color: black;
  padding: 2px;
  border-radius: 3px;
}

.counterArgument {
  background-color: lightcoral;
  font-weight: bold;
  color: black;
  padding: 2px;
  border-radius: 3px;
}
```

- Arguments are highlighted in light blue
- Counter-arguments are highlighted in light coral

7. **Data Storage**

```29:66:src/pages/Background/supabase.js
export async function storeEmbeddingsInSupabase(table, contentArray) {
  try {
    const supabaseClient = await initSupabase(); // Await the supabase client initialization

    for (const content of contentArray) {
      // Check if the content already exists in the table
      const { data: existingData, error: selectError } = await supabaseClient
        .from(table)
        .select('*')
        .eq('text', content.text);

      if (selectError) {
        console.error('Error checking for existing embedding:', selectError);
        continue;
      }

      // If content already exists, do not insert
      if (existingData && existingData.length > 0) {
        console.log(
          'Embedding already exists in Supabase, skipping insertion for:',
          content.text
        );
        continue;
      }

      // Insert the content if it does not already exist
      const { data, error } = await supabaseClient.from(table).insert(content);

      if (error) {
        console.error('Error storing embedding in Supabase:', error);
      } else {
        console.log('Successfully stored embedding in Supabase:', data);
      }
    }
  } catch (err) {
    console.error('Unexpected error storing embedding:', err);
  }
}
```

- Stores analyzed content in Supabase for future reference
- Checks for existing analysis before processing

## AI Assistant Usage

The extension uses two separate OpenAI assistants:
1. `prokonAsst`: Likely handles the main argument analysis
2. `stanceAsst`: Presumably analyzes opposing viewpoints

The assistants appear to be pre-configured with specific instructions (not visible in the code) to:
- Identify main arguments
- Generate counter-arguments
- Structure responses in a consistent JSON format
- Provide supporting statements for both sides

## Data Flow

1. User Input → Chrome Extension Panel
2. Panel → Background Script
3. Background Script → OpenAI Assistant
4. OpenAI Response → Background Script
5. Background Script → Supabase Storage
6. Background Script → Content Script (for highlighting)
7. Content Script → Visual Display

This architecture allows for:
- Asynchronous processing
- Persistent storage of analyses
- Visual integration with web content
- Reuse of previous analyses for the same content

The system appears designed to promote critical thinking by automatically identifying and presenting opposing viewpoints for any given thesis or argument.
