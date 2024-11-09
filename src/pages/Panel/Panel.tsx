import React from 'react';
import './Panel.css';

const Panel: React.FC = () => {
  const [message, setMessage] = React.useState('');

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
      // Handle the received prokon data as needed in the panel
    }
  });

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
