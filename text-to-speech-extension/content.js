// Create overlay container for the speaker icon
const overlay = document.createElement('div');
overlay.style.cssText = `
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  display: none;
`;

const speakerIcon = document.createElement('div');
speakerIcon.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="play-icon">
    <path d="M12 6L8 10H4V14H8L12 18V6Z"/>
    <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 12C17.0039 13.3308 16.4774 14.6024 15.54 15.54"/>
    <path d="M18.54 5.46C20.4892 7.40919 21.5751 10.1478 21.5751 13C21.5751 15.8522 20.4892 18.5908 18.54 20.54"/>
  </svg>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="stop-icon" style="display: none;">
    <path d="M6 6h12v12H6z"/>
  </svg>
  <span class="tooltip">Click to speak</span>
`;
speakerIcon.className = 'speech-icon';
speakerIcon.style.cssText = `
  background: #007AFF;
  border-radius: 50%;
  padding: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  cursor: pointer;
  pointer-events: auto;
  color: white;
  transition: all 0.2s;
  position: relative;
`;

// Add tooltip styles
const style = document.createElement('style');
style.textContent = `
  .speech-icon .tooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    left: 50%;
    transform: translateX(-50%);
    bottom: -30px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .speech-icon:hover .tooltip {
    opacity: 1;
  }
  
  .highlight-message {
    background-color: rgba(0, 122, 255, 0.1) !important;
    border: 2px solid rgba(0, 122, 255, 0.3) !important;
    border-radius: 8px;
    position: relative;
  }

  .speaking {
    background: #FF3B30 !important;
  }

  .speaking .play-icon {
    display: none;
  }

  .speaking .stop-icon {
    display: inline !important;
  }

  .speaking .tooltip {
    content: 'Click to stop';
  }
`;
document.head.appendChild(style);

speakerIcon.addEventListener('mouseenter', () => {
  speakerIcon.style.transform = 'scale(1.1)';
  if (!speakerIcon.classList.contains('speaking')) {
    speakerIcon.style.background = '#0051FF';
  }
});
speakerIcon.addEventListener('mouseleave', () => {
  speakerIcon.style.transform = 'scale(1)';
  if (!speakerIcon.classList.contains('speaking')) {
    speakerIcon.style.background = '#007AFF';
  }
});

overlay.appendChild(speakerIcon);
document.body.appendChild(overlay);

// Track current hoveredElement and its content
let hoveredElement = null;
let hoveredContent = null;
let isSpeaking = false;

// Function to find the message container
function findMessageContainer(element) {
  // Look for the font-claude-message class which wraps each message
  const messageContainer = element.closest('.font-claude-message');
  if (!messageContainer) return null;

  // Get the text content directly from the message container
  const content = messageContainer.textContent.trim();

  return {
    container: messageContainer,
    content: content
  };
}

// Function to handle speech state changes
function updateSpeechState(speaking) {
  isSpeaking = speaking;
  if (speaking) {
    speakerIcon.classList.add('speaking');
    speakerIcon.querySelector('.tooltip').textContent = 'Click to stop';
  } else {
    speakerIcon.classList.remove('speaking');
    speakerIcon.querySelector('.tooltip').textContent = 'Click to speak';
  }
}

// Function to speak or stop the current message
function toggleSpeech() {
  if (isSpeaking) {
    chrome.runtime.sendMessage({ action: "stop" }, () => {
      updateSpeechState(false);
    });
  } else if (hoveredContent) {
    chrome.runtime.sendMessage({
      action: "speak",
      text: hoveredContent
    }, () => {
      updateSpeechState(true);
    });
  }
}

// Listen for speech ended message from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "speechEnded") {
    updateSpeechState(false);
  }
});

// Function to add hover effect to message containers
function addHoverEffect() {
  document.addEventListener('mouseover', (e) => {
    const result = findMessageContainer(e.target);
    if (result && result.container !== hoveredElement) {
      // Remove highlight from any previously highlighted containers
      document.querySelectorAll('.highlight-message').forEach(el => {
        el.classList.remove('highlight-message');
      });
      
      // Add highlight to current container
      result.container.classList.add('highlight-message');
      hoveredElement = result.container;
      hoveredContent = result.content;
      
      // Position overlay next to the message
      const rect = result.container.getBoundingClientRect();
      overlay.style.display = 'block';
      overlay.style.top = `${rect.top + 20}px`;
      overlay.style.left = `${rect.right - 60}px`;
    }
  });

  document.addEventListener('mouseout', (e) => {
    const result = findMessageContainer(e.target);
    if (result && !e.relatedTarget?.closest('.speech-icon')) {
      result.container.classList.remove('highlight-message');
      if (hoveredElement === result.container) {
        hoveredElement = null;
        hoveredContent = null;
        overlay.style.display = 'none';
      }
    }
  });
}

// Handle click on speaker icon
speakerIcon.addEventListener('click', toggleSpeech);

// Initial call to add hover effect
addHoverEffect();
