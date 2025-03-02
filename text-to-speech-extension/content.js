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
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M12 6L8 10H4V14H8L12 18V6Z"/>
    <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 12C17.0039 13.3308 16.4774 14.6024 15.54 15.54"/>
    <path d="M18.54 5.46C20.4892 7.40919 21.5751 10.1478 21.5751 13C21.5751 15.8522 20.4892 18.5908 18.54 20.54"/>
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
`;
document.head.appendChild(style);

speakerIcon.addEventListener('mouseenter', () => {
  speakerIcon.style.transform = 'scale(1.1)';
  speakerIcon.style.background = '#0051FF';
});
speakerIcon.addEventListener('mouseleave', () => {
  speakerIcon.style.transform = 'scale(1)';
  speakerIcon.style.background = '#007AFF';
});

overlay.appendChild(speakerIcon);
document.body.appendChild(overlay);

// Track current hoveredElement and its content
let hoveredElement = null;
let hoveredContent = null;

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

// Function to speak the current message
function speakMessage() {
  if (!hoveredContent) return;

  // Create a new SpeechSynthesisUtterance
  const utterance = new SpeechSynthesisUtterance(hoveredContent);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Try to use chrome.tts first
  try {
    chrome.runtime.sendMessage({
      action: "speak",
      text: hoveredContent
    });
  } catch (error) {
    // Fallback to Web Speech API if chrome.tts fails
    window.speechSynthesis.speak(utterance);
  }
  
  // Visual feedback when speaking
  if (hoveredElement) {
    hoveredElement.style.transition = 'background-color 0.3s';
    hoveredElement.style.backgroundColor = 'rgba(0, 122, 255, 0.2)';
    setTimeout(() => {
      hoveredElement.style.backgroundColor = 'rgba(0, 122, 255, 0.1)';
    }, 200);
  }
}

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
speakerIcon.addEventListener('click', speakMessage);

// Initial call to add hover effect
addHoverEffect();
