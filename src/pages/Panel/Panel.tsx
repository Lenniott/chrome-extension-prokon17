import React, { useState, useEffect } from 'react';

import './Panel.css';

// Props for the Accordion component
interface AccordionProps {
  id: string;
  key: string;
  title: string; // The title of the accordion section
  children: React.ReactNode; // Content inside the accordion
}

const Accordion: React.FC<AccordionProps> = ({ title, id, children, key }) => {
  const [isOpen, setIsOpen] = useState(false); // Manage the accordion's state

  // Toggle accordion open/close
  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="accordion" key={id} id={id}>
      {/* Accordion header */}
      <h2 className="accordion-header">
        {/* Button with appropriate ARIA attributes */}
        <button
          onClick={toggleAccordion}
          aria-expanded={isOpen}
          aria-controls="accordion-content"
          className="accordion-button"
        >
          {title}
          <span className="accordion-icon">{isOpen ? '−' : '+'}</span>{' '}
          {/* Toggle button */}
        </button>
      </h2>

      {/* Accordion content with ARIA and role attributes */}
      <div
        id="accordion-content"
        className={`accordion-content ${isOpen ? 'open' : 'closed'}`}
        role="region"
        aria-hidden={!isOpen}
      >
        {isOpen && <div>{children}</div>}
      </div>
    </div>
  );
};

const Panel: React.FC = () => {
  const [message, setMessage] = useState('');
  const [backgroundStatus, setBackgroundStatus] = useState(null);
  const [prokons, setProkons] = useState<Prokon[]>([]);

  type Prokon = {
    id: string;
    title: string;
    original: {
      type: string;
      description: string;
    };
    argument: {
      type: string;
      description: string;
    };
    counterArgument: {
      type: string;
      description: string;
    };
  };

  useEffect(() => {
    // On load, get the list of Prokons from storage
    chrome.storage.local.get(['prokons'], (result) => {
      let prokonsList = result.prokons || [];

      // Remove any empty entries
      prokonsList = prokonsList.filter(
        (prokon: Prokon) => prokon && prokon.title
      );

      // Update the state
      setProkons(prokonsList);
    });
  }, []);

  const handleSend = () => {
    // Send the message "prokonSent"
    chrome.runtime.sendMessage({ action: 'prokonSent', message });
    setMessage(''); // Clear the text area after sending
  };

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'statusUpdate') {
      // Update the UI based on the status message
      setBackgroundStatus(request.status);
    }
  });

  return (
    <div className="container">
      <h1>Prokon</h1>
      <span className="helpText">
        "Prokon lets you compare ideas. You provide an argument, it will then
        refine and create a counter argument. You can then search content for
        things that align with those arguments."
      </span>
      <div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here"
        />
        <button onClick={handleSend}>Add prokon</button>
      </div>
      <span className="openAiStatus">{backgroundStatus}</span>
      <ul className="prokon-list">
        {prokons &&
          prokons.map((prokon, index) => (
            <Accordion
              title={prokon.title}
              key={`prokon-${index}`}
              id={prokon.title.replace(' ', '-').toLowerCase()}
            >
              <div className="pro">{prokon.argument.description}</div>
              <div className="kon">{prokon.counterArgument.description}</div>
            </Accordion>
          ))}
      </ul>
    </div>
  );
};

export default Panel;
