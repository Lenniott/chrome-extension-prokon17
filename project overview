# Prokon - Chrome Extension Project Overview

## Purpose
Prokon is a Chrome extension designed to help users analyze and critically evaluate content they read online by identifying and examining arguments and counter-arguments within articles.

## Target Audience
- Critical thinkers
- Students and academics
- Researchers
- Anyone interested in understanding different perspectives on topics

## Problem Statement
When reading online content, it can be challenging to:
1. Identify key arguments and their counter-arguments
2. Maintain objectivity while consuming information
3. Understand multiple perspectives on complex topics
4. Remember important points and their supporting evidence

## Core Features
1. **Side Panel Integration**: Uses Chrome's side panel feature for a non-intrusive user interface

```7:9:src/manifest.json
  "side_panel": {
    "default_path": "panel.html"
  },
```


2. **AI-Powered Analysis**: Leverages OpenAI's API to analyze content and identify arguments

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


3. **Visual Highlighting**: Marks arguments and counter-arguments directly in the webpage with different colors

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


4. **Data Persistence**: Uses Supabase to store and retrieve analyzed content, allowing users to revisit previous analyses

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


## Technical Implementation
- Built using React 18 and TypeScript
- Uses Manifest V3 for Chrome Extensions
- Implements modern web development practices with Webpack 5
- Utilizes OpenAI's API for content analysis
- Stores data in Supabase database

## Value Proposition
Prokon helps users:
- Develop better critical thinking skills
- Understand complex arguments more thoroughly
- Save and revisit important discussions
- Identify potential biases in content
- Make more informed decisions based on comprehensive understanding of different viewpoints

##Current Status
- inactive
I got to a good point in the project where I understood what needed to be done but technically I havent found the time to get my head around the technical implementation of it. Writing the acutal code in sequence. I got destracted by click through project :/
