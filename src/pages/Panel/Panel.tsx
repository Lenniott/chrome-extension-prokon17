import React, { useEffect, useState } from 'react';
import './Panel.css';

class Prokon {
  id: string;
  title: string;
  argument: ArgumentWithResults;
  counterArgument: ArgumentWithResults;

  constructor(
    id: string,
    title: string,
    argument: ArgumentWithResults,
    counterArgument: ArgumentWithResults
  ) {
    this.id = id;
    this.title = title;
    this.argument = argument;
    this.counterArgument = counterArgument;
  }
}

class ArgumentWithResults {
  text: string;
  results: Statement[];

  constructor(text: string, results: any) {
    this.text = text;
    this.results = results.map((result: any) => {
      // Parse the text data from JSON structure
      if (Array.isArray(result.text) && result.text.length > 0) {
        const parsed = JSON.parse(result.text[0].text.value || '{}');
        return new Statement(parsed.argument || '');
      }
      return new Statement(result.text || '');
    });
  }
}

class Statement {
  text: string;

  constructor(text: string) {
    this.text = text;
  }
}

type StatusLogsProps = {
  logs: string[];
};

const LoadingWheel: React.FC<StatusLogsProps> = ({ logs }) => (
  <div className="loading-wheel">
    <div className="spinner"></div>
    <p>{`${logs.length + (1 / 11) * 100}%`}</p>
  </div>
);

const StatusLogs: React.FC<StatusLogsProps> = ({ logs }) => (
  <div className="status-logs">
    {logs.map((log, index) => (
      <div key={index} className="log-entry">
        {log}
      </div>
    ))}
  </div>
);

const Panel: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [prokon, setProkon] = useState<Prokon | null>(null);

  useEffect(() => {
    // Listener for messages from the background script
    const handleMessage = (message: any) => {
      if (message.action === 'logUpdate') {
        setLogs((prevLogs) => [...prevLogs, message.data.message]);
      } else if (message.action === 'loadingComplete') {
        setLoading(false);
      } else if (message.action === 'prokonData') {
        console.log('Received prokon data:', message.data);

        // Parse prokon data into Prokon class
        const parsedProkon = new Prokon(
          message.data.id,
          message.data.title,
          new ArgumentWithResults(
            message.data.argument.text,
            message.data.argument.results
          ),
          new ArgumentWithResults(
            message.data.counterArgument.text,
            message.data.counterArgument.results
          )
        );

        setProkon(parsedProkon);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    // Clean up listener on component unmount
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleSend = () => {
    // Send the message "prokonSent"
    chrome.runtime.sendMessage(
      { action: 'prokonSent', message },
      (response) => {
        if (response && response.status === 'success') {
          alert('Message sent successfully!');
        } else {
          alert('Failed to send message.');
        }
      }
    );
    // Clear the text area after sending
    setLoading(true);
  };

  return (
    <div className="panel-container">
      <h1>Prokon</h1>
      <div className="container medium">
        <div className="container small">
          <label>Enter thesis</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here"
          />
        </div>
        <button onClick={handleSend}>Prokon</button>
      </div>

      {loading && <LoadingWheel logs={logs} />}
      <StatusLogs logs={logs} />

      {prokon && (
        <div id="prokon" className="container medium">
          <div className="container small">
            <label>Argument</label>
            <div id="pro">{prokon.argument.text}</div>
            <ul>
              {prokon.argument.results.map((result, index) => (
                <li key={`argument-result-${index}`}>{result.text}</li>
              ))}
            </ul>
          </div>
          <div className="container small">
            <label>Counter Argument</label>
            <div id="pro">{prokon.counterArgument.text}</div>
            <ul>
              {prokon.counterArgument.results.map((result, index) => (
                <li key={`counterArgument-result-${index}`}>{result.text}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Panel;
