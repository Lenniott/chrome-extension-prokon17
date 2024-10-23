import React, { useState, useEffect } from 'react';
import './Options.css';

interface Props {
  title: string;
}

const Options: React.FC<Props> = ({ title }: Props) => {
  const [apiKey, setApiKey] = useState('');
  const toggleApiKeyInput = (isApiKeyPresent: boolean) => {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKey = document.getElementById('saveApiKey');
    const removeApiKey = document.getElementById('removeApiKey');

    if (apiKeyInput) {
      apiKeyInput.style.display = isApiKeyPresent ? 'none' : 'block';
    }
    if (saveApiKey) {
      saveApiKey.style.display = isApiKeyPresent ? 'none' : 'block';
    }
    if (removeApiKey) {
      removeApiKey.style.display = isApiKeyPresent ? 'block' : 'none';
    }
  };

  async function logKey() {
    try {
      const { openaiApiKey } = await new Promise<{ openaiApiKey?: string }>(
        (resolve) => {
          chrome.storage.local.get(['openaiApiKey'], (result) =>
            resolve(result)
          );
        }
      );

      if (!openaiApiKey) {
        setApiKey('Please set your OpenAI API key.');
      } else {
        setApiKey(openaiApiKey);
      }
    } catch (error) {
      console.error('Error:', error);
      return 'Error communicating with the API.';
    }
  }

  const saveApiKey = async () => {
    const apiKeyInput = document.getElementById(
      'apiKeyInput'
    ) as HTMLInputElement;
    const apiKey = apiKeyInput.value;
    const responseElement = document.getElementById('response') as HTMLElement;

    if (!apiKey.trim()) {
      responseElement.innerText = 'Please enter a valid API key.';
      return;
    }
    chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
      responseElement.innerText = 'API key saved successfully!';
      toggleApiKeyInput(true);
    });
  };

  const removeApiKey = async () => {
    chrome.storage.local.remove('openaiApiKey', () => {
      const responseElement = document.getElementById(
        'response'
      ) as HTMLElement;
      responseElement.innerText = 'API key removed successfully!';
      toggleApiKeyInput(false);
    });
  };

  useEffect(() => {
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      toggleApiKeyInput(!!result.openaiApiKey);
    });

    const saveButton = document.getElementById('saveApiKey');
    const removeButton = document.getElementById('removeApiKey');

    if (saveButton) {
      saveButton.addEventListener('click', saveApiKey);
    }

    if (removeButton) {
      removeButton.addEventListener('click', removeApiKey);
    }
  }, []);

  function clearStorage() {
    chrome.storage.local.remove('urlContent', () => {
      if (chrome.runtime.lastError) {
        console.error('Error clearing URL content:', chrome.runtime.lastError);
      } else {
        console.log('URL content cleared from storage.');
      }
    });
  }

  return (
    <div className="OptionsContainer">
      <main>
        <h1>{title} Page</h1>
        <div className="mainInputs">
          <input
            type="text"
            id="apiKeyInput"
            placeholder="Enter your OpenAI API Key"
          />
          <button id="saveApiKey">Save API Key</button>
          <button id="removeApiKey">Remove API Key</button>
        </div>

        <button id="logKey" onClick={logKey}>
          Log Key
        </button>
        <div id="response">{apiKey}</div>

        <button id="clearStorage" onClick={clearStorage}>
          Clear Url Storage
        </button>
      </main>
    </div>
  );
};

export default Options;
