import React, { useState, useEffect } from 'react';
import './Options.css';

interface Props {
  title: string;
}

const Options: React.FC<Props> = ({ title }: Props) => {
  const [apiKey, setApiKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [localStorageData, setLocalStorageData] = useState<{
    [key: string]: any;
  }>({});

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

  const toggleSupabaseInput = (isSupabasePresent: boolean) => {
    const supabaseUrlInput = document.getElementById('supabaseUrlInput');
    const supabaseKeyInput = document.getElementById('supabaseKeyInput');
    const saveSupabaseKey = document.getElementById('saveSupabaseKey');
    const removeSupabaseKey = document.getElementById('removeSupabaseKey');

    if (supabaseUrlInput && supabaseKeyInput) {
      supabaseUrlInput.style.display = isSupabasePresent ? 'none' : 'block';
      supabaseKeyInput.style.display = isSupabasePresent ? 'none' : 'block';
    }
    if (saveSupabaseKey) {
      saveSupabaseKey.style.display = isSupabasePresent ? 'none' : 'block';
    }
    if (removeSupabaseKey) {
      removeSupabaseKey.style.display = isSupabasePresent ? 'block' : 'none';
    }
  };

  async function logKey() {
    try {
      const { openaiApiKey, supabaseUrl, supabaseKey } = await new Promise<{
        openaiApiKey?: string;
        supabaseUrl?: string;
        supabaseKey?: string;
      }>((resolve) => {
        chrome.storage.local.get(
          ['openaiApiKey', 'supabaseUrl', 'supabaseKey'],
          (result) => resolve(result)
        );
      });

      if (!openaiApiKey) {
        setApiKey('Please set your OpenAI API key.');
      } else {
        setApiKey(openaiApiKey);
      }

      if (!supabaseUrl || !supabaseKey) {
        setSupabaseUrl('Please set your Supabase URL and Key.');
        setSupabaseKey('');
      } else {
        setSupabaseUrl(supabaseUrl);
        setSupabaseKey(supabaseKey);
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

  const saveSupabaseCredentials = async () => {
    const supabaseUrlInput = document.getElementById(
      'supabaseUrlInput'
    ) as HTMLInputElement;
    const supabaseKeyInput = document.getElementById(
      'supabaseKeyInput'
    ) as HTMLInputElement;
    const supabaseUrl = supabaseUrlInput.value;
    const supabaseKey = supabaseKeyInput.value;
    const responseElement = document.getElementById('response') as HTMLElement;

    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      responseElement.innerText = 'Please enter a valid Supabase URL and Key.';
      return;
    }
    chrome.storage.local.set({ supabaseUrl, supabaseKey }, () => {
      responseElement.innerText = 'Supabase URL and Key saved successfully!';
      toggleSupabaseInput(true);
    });
  };

  const removeSupabaseCredentials = async () => {
    chrome.storage.local.remove(['supabaseUrl', 'supabaseKey'], () => {
      const responseElement = document.getElementById(
        'response'
      ) as HTMLElement;
      responseElement.innerText = 'Supabase credentials removed successfully!';
      toggleSupabaseInput(false);
    });
  };

  const viewLocalStorage = async () => {
    chrome.storage.local.get(null, (result) => {
      setLocalStorageData(result);
    });
  };

  const removeLocalStorageItem = async (key: string) => {
    chrome.storage.local.remove(key, () => {
      viewLocalStorage();
    });
  };

  useEffect(() => {
    chrome.storage.local.get(
      ['openaiApiKey', 'supabaseUrl', 'supabaseKey'],
      (result) => {
        toggleApiKeyInput(!!result.openaiApiKey);
        toggleSupabaseInput(!!result.supabaseUrl && !!result.supabaseKey);
        setSupabaseUrl(result.supabaseUrl || '');
        setSupabaseKey(result.supabaseKey || '');
      }
    );

    const saveButton = document.getElementById('saveApiKey');
    const removeButton = document.getElementById('removeApiKey');
    const saveSupabaseButton = document.getElementById('saveSupabaseKey');
    const removeSupabaseButton = document.getElementById('removeSupabaseKey');

    if (saveButton) {
      saveButton.addEventListener('click', saveApiKey);
    }

    if (removeButton) {
      removeButton.addEventListener('click', removeApiKey);
    }

    if (saveSupabaseButton) {
      saveSupabaseButton.addEventListener('click', saveSupabaseCredentials);
    }

    if (removeSupabaseButton) {
      removeSupabaseButton.addEventListener('click', removeSupabaseCredentials);
    }
  }, []);

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

          <input
            type="text"
            id="supabaseUrlInput"
            placeholder="Enter your Supabase URL"
          />
          <input
            type="text"
            id="supabaseKeyInput"
            placeholder="Enter your Supabase Key"
          />
          <button id="saveSupabaseKey">Save Supabase Credentials</button>
          <button id="removeSupabaseKey">Remove Supabase Credentials</button>
        </div>

        <button id="logKey" onClick={logKey}>
          Log Key
        </button>
        <button id="viewLocalStorage" onClick={viewLocalStorage}>
          View Local Storage
        </button>
        <div id="response">
          {apiKey}
          <br />
          {supabaseUrl}
        </div>
        <div className="localStorageView">
          <h2>Local Storage Data:</h2>
          <div className="container">
            {Object.keys(localStorageData).map((key) => (
              <div key={key} className="container row">
                <button onClick={() => removeLocalStorageItem(key)}>
                  Remove
                </button>
                <div className="container">
                  {`${key}: ~ ${
                    JSON.stringify(localStorageData[key]).length
                  } kb`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Options;
