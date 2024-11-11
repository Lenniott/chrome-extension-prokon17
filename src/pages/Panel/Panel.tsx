import React, { useEffect, useState } from 'react';
import './Panel.css';

type Prokon = {
  argument: string;
  counterArgument: string;
};

type StatusLogsProps = {
  logs: string[];
};

const LoadingWheel: React.FC = () => (
  <div className="loading-wheel">
    <div className="spinner"></div>
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
        setProkon(message.data);
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

      {loading && <LoadingWheel />}
      <StatusLogs logs={logs} />

      {prokon && (
        <div id="prokon" className="container medium">
          <div className="container small">
            <label>Argument</label>
            <div id="pro">{prokon.argument}</div>
          </div>
          <div className="container small">
            <label>Counter Argument</label>
            <div id="pro">{prokon.counterArgument}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Panel;
