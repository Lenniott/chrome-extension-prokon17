import React from 'react';
import './Panel.css';

const Panel: React.FC = () => {
  const [message, setMessage] = React.useState('');
  const [prokon, setProkon] = React.useState<Prokon | null>(null);
  interface Prokon {
    argument: string;
    counterArgument: string;
  }
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
  };

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'prokonData') {
      console.log('Received prokon data:', message.data);
      setProkon(message.data);
      // Handle the received prokon data as needed in the panel
    }
  });

  return (
    <div className="container large">
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
