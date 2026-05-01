function sendMessage() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  input.value = '';

  setTimeout(() => {
    addMessage("I'm thinking about your furniture question... (AI coming in Phase 4!)", 'ai');
  }, 1000);
}

function sendChip(text) {
  addMessage(text, 'user');
  setTimeout(() => {
    addMessage("Great question! I'll help you with that. (Full AI responses coming in Phase 4!)", 'ai');
  }, 1000);
}

function addMessage(text, sender) {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `msg ${sender}`;
  div.innerHTML = `
    <div class="avatar ${sender}">${sender === 'ai' ? 'F' : 'M'}</div>
    <div class="bubble">
      <div class="bubble-inner">${text}</div>
    </div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function clearChat() {
  const messages = document.getElementById('messages');
  messages.innerHTML = '';
  addMessage("Hello again! What furniture can I help you with?", 'ai');
}