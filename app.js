const UNSPLASH_KEY = UNSPLASH_ACCESS_KEY;
const API_KEY = GROQ_KEY;
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

const chatHistory = [];
let selectedImageBase64 = null;
let selectedImageType = null;
let selectedImageSrc = null;

function handleImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const result = e.target.result;
    selectedImageBase64 = result.split(',')[1];
    selectedImageType = file.type;
    selectedImageSrc = result;
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
  selectedImageSrc = null;
  const preview = document.getElementById('imagePreview');
  const input = document.getElementById('imageInput');
  if (preview) preview.style.display = 'none';
  if (input) input.value = '';
}

async function searchFurnitureImage(query) {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      {
        headers: {
          "Authorization": `Client-ID ${UNSPLASH_KEY}`
        }
      }
    );
    const data = await response.json();
    console.log("Unsplash query:", query);
    console.log("Unsplash data:", data);
    if (data.results && data.results.length > 0) {
      return data.results.map(img => ({
        url: img.urls.regular,
        thumb: img.urls.small,
        alt: img.alt_description || query,
        photographer: img.user.name,
        link: img.links.html
      }));
    }
    return null;
  } catch (error) {
    console.error("Image search failed:", error);
    return null;
  }
}

function showFurnitureImages(images, query) {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg ai';

  let imagesHTML = images.slice(0, 3).map(img => `
    <div class="furniture-img-card">
      <img src="${img.thumb}" alt="${img.alt}"
           onclick="window.open('${img.link}', '_blank')"
           title="Click to view full size" />
      <div class="furniture-img-label">📷 ${img.photographer}</div>
    </div>
  `).join('');

  div.innerHTML = `
    <div class="avatar ai">F</div>
    <div class="bubble">
      <div class="bubble-inner">
        <p style="color:#9C7A4A; font-size:13px; margin-bottom:8px;">
          🖼️ Here's how <strong>${query}</strong> looks:
        </p>
        <div class="furniture-images-grid">
          ${imagesHTML}
        </div>
        <p style="font-size:11px; color:#9C7A4A; margin-top:6px;">
          Click any image to view full size
        </p>
      </div>
    </div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function extractFurnitureKeyword(userText, aiReply) {
  const furnitureWords = [
    'study table', 'dining table', 'coffee table', 'side table',
    'tv unit', 'dining chair', 'armchair', 'rocking chair',
    'bunk bed', 'king bed', 'queen bed', 'single bed', 'double bed',
    'sofa', 'couch', 'bed', 'chair', 'table', 'wardrobe',
    'shelf', 'desk', 'lamp', 'rug', 'cabinet',
    'bookshelf', 'dresser', 'ottoman', 'sectional'
  ];

  const colorWords = [
    'red', 'pink', 'blue', 'green', 'yellow', 'black', 'white',
    'grey', 'gray', 'brown', 'beige', 'orange', 'purple',
    'navy', 'cream', 'golden', 'wooden', 'oak', 'walnut', 'teak'
  ];

  const styleWords = [
    'elegant', 'minimal', 'modern', 'classic', 'bohemian',
    'scandinavian', 'industrial', 'luxury', 'vintage', 'rustic'
  ];

  const sizeWords = [
    'large', 'big', 'small', 'compact', 'queen', 'king', 'single'
  ];

  const userLower = userText.toLowerCase();
  const aiLower = aiReply.toLowerCase();

  let foundFurniture = '';
  let foundColor = '';
  let foundStyle = '';
  let foundSize = '';

  for (const word of furnitureWords) {
    if (userLower.includes(word)) {
      foundFurniture = word;
      break;
    }
  }

  if (!foundFurniture) {
    for (const word of furnitureWords) {
      if (aiLower.includes(word)) {
        foundFurniture = word;
        break;
      }
    }
  }

  for (const word of colorWords) {
    if (userLower.includes(word)) {
      foundColor = word;
      break;
    }
  }

  if (!foundColor) {
    for (const word of colorWords) {
      if (aiLower.includes(word)) {
        foundColor = word;
        break;
      }
    }
  }

  for (const word of styleWords) {
    if (userLower.includes(word)) {
      foundStyle = word;
      break;
    }
  }

  for (const word of sizeWords) {
    if (userLower.includes(word)) {
      foundSize = word;
      break;
    }
  }

  if (foundFurniture) {
    const parts = [foundColor, foundSize, foundStyle, foundFurniture].filter(Boolean);
    return parts.join(' ');
  }

  return null;
}

async function sendMessage() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text && !selectedImageBase64) return;

  const userText = text || "Please analyze this room and suggest suitable furniture with Indian prices.";

  if (selectedImageBase64) {
    addMessageWithImage(userText, selectedImageSrc);
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

    const furnitureKeywords = extractFurnitureKeyword(userText, reply);
    console.log("Keywords found:", furnitureKeywords);
    if (furnitureKeywords) {
      const images = await searchFurnitureImage(furnitureKeywords);
      console.log("Images found:", images);
      if (images && images.length > 0) {
        showFurnitureImages(images, furnitureKeywords);
      }
    }

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

function formatAIMessage(text) {
  let formatted = text;
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(
    /Pro [Tt]ip:(.*?)(?=\n|$)/g,
    '<div class="pro-tip">💡 <strong>Pro Tip:</strong>$1</div>'
  );

  const lines = formatted.split('\n');
  let result = '';
  let inList = false;

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      if (inList) { result += '</ul>'; inList = false; }
      result += '<br>';
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      if (!inList) { result += '<ul style="list-style:none;padding:0;">'; inList = true; }
      const content = line.replace(/^\d+\.\s/, '');
      result += `<li style="padding:4px 0; border-bottom:1px solid #F0E6D3;">
                  <span style="color:#D4A96A; font-weight:bold; margin-right:6px;">›</span>
                  ${content}
                 </li>`;
    } else {
      if (inList) { result += '</ul>'; inList = false; }
      result += `<p>${line}</p>`;
    }
  }
  if (inList) result += '</ul>';
  return result;
}

function addMessage(text, sender) {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `msg ${sender}`;
  const content = sender === 'ai' ? formatAIMessage(text) : text;
  div.innerHTML = `
    <div class="avatar ${sender}">${sender === 'ai' ? 'F' : 'M'}</div>
    <div class="bubble">
      <div class="bubble-inner">${content}</div>
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
        <p>${text}</p>
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