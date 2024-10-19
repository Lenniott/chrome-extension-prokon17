import React from 'react';
import './Panel.css';

const Panel: React.FC = () => {
  const [message, setMessage] = React.useState('');

  const handleSend = () => {
    // Send the message "prokonSent"
    chrome.runtime.sendMessage({ action: 'prokonSent', message });
    setMessage(''); // Clear the text area after sending
  };

  return (
    <div className="container">
      <h1>Prokon</h1>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message here"
      />
      <button onClick={handleSend}>Prokon</button>
    </div>
  );
};

export default Panel;
