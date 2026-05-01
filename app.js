const API_KEY = "your-groq-api-key-here";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

const chatHistory = [];
let selectedImageBase64 = null;
let selectedImageType = null;

function handleImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const result = e.target.result;
    selectedImageBase64 = result.split(',')[1];
    selectedImageType = file.type;
    const previewImg = document.getElementById('previewImg');
    const imagePreview = document.getElementById('imagePreview');
    if (previewImg) previewImg.src = result;
    if (imagePreview) imagePreview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  selectedImageBase64 = null;
  selectedImageType = null;
  const preview = document.getElementById('imagePreview');
  const input = document.getElementById('imageInput');
  if (preview) preview.style.display = 'none';
  if (input) input.value = '';
}

async function sendMessage() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text && !selectedImageBase64) return;

  const userText = text || "Please analyze this room and suggest suitable furniture with Indian prices.";

  if (selectedImageBase64) {
    addMessageWithImage(userText, document.getElementById('previewImg').src);
  } else {
    addMessage(userText, 'user');
  }

  input.value = '';

  const userMessage = { role: "user", content: userText };
  chatHistory.push(userMessage);
  removeImage();
  showTyping();

  const fullSystem = SYSTEM_PROMPT + "\n\n" + FURNITURE_KNOWLEDGE;

  const messages = [
    { role: "system", content: fullSystem },
    ...chatHistory
  ];

  const requestBody = {
    model: "llama-3.3-70b-versatile",
    messages: messages,
    temperature: 0.7,
    max_tokens: 1024
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log("Groq Response:", data);

    if (data.error) {
      removeTyping();
      addMessage("Error: " + data.error.message, 'ai');
      return;
    }

    const reply = data.choices[0].message.content;
    removeTyping();
    addMessage(reply, 'ai');
    chatHistory.push({ role: "assistant", content: reply });

  } catch (error) {
    removeTyping();
    addMessage("Connection failed: " + error.message, 'ai');
    console.error(error);
  }
}

function sendChip(text) {
  document.getElementById('userInput').value = text;
  sendMessage();
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

function addMessageWithImage(text, imageSrc) {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg user';
  div.innerHTML = `
    <div class="avatar user">M</div>
    <div class="bubble">
      <div class="bubble-inner">
        <img src="${imageSrc}" class="room-photo" />
        ${text}
      </div>
    </div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg ai typing';
  div.id = 'typing';
  div.innerHTML = `
    <div class="avatar ai">F</div>
    <div class="bubble">
      <div class="bubble-inner">Thinking...</div>
    </div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById('typing');
  if (typing) typing.remove();
}

function clearChat() {
  const messages = document.getElementById('messages');
  chatHistory.length = 0;
  messages.innerHTML = '';
  addMessage("Hello again! Ask me anything about furniture!", 'ai');
}