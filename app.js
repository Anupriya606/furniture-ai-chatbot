const UNSPLASH_KEY = UNSPLASH_ACCESS_KEY;
const API_KEY = GROQ_KEY;
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

const chatHistory = [];
let selectedImageBase64 = null;
let selectedImageType = null;
let selectedImageSrc = null;
let ttsEnabled = false;
let currentLanguage = 'en';
let currentRoom = 'living room';

const languageNames = {
  en: 'English', hi: 'हिंदी', mr: 'मराठी',
  gu: 'ગુજરાતી', ta: 'தமிழ்', te: 'తెలుగు'
};

const roomEmojis = {
  'living room': '🛋', 'bedroom': '🛏', 'kitchen': '🍳',
  'office': '💼', 'dining room': '🍽', 'bathroom': '🚿',
  'kids room': '🧸', 'balcony': '🌿'
};

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('themeIcon').textContent = isDark ? '🌙' : '☀️';
  document.getElementById('themeText').textContent = isDark ? 'Dark Mode' : 'Light Mode';
}

function toggleTTS() {
  ttsEnabled = !ttsEnabled;
  document.getElementById('ttsIcon').textContent = ttsEnabled ? '🔊' : '🔇';
  document.getElementById('ttsText').textContent = ttsEnabled ? 'Voice On' : 'Enable Voice';
  if (!ttsEnabled) window.speechSynthesis.cancel();
}

function speakText(text) {
  if (!ttsEnabled) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/<[^>]*>/g, '').replace(/[*#]/g, '');
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = currentLanguage === 'hi' ? 'hi-IN' :
                   currentLanguage === 'ta' ? 'ta-IN' :
                   currentLanguage === 'te' ? 'te-IN' : 'en-IN';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function changeLanguage(lang) {
  currentLanguage = lang;
  document.getElementById('langBadge').textContent = '🌍 ' + languageNames[lang];
  addMessage(`Language changed to ${languageNames[lang]}. I'll respond in ${languageNames[lang]} from now on!`, 'ai');
}

function changeRoom(room) {
  currentRoom = room;
  const emoji = roomEmojis[room] || '🏠';
  document.getElementById('roomBadge').textContent = emoji + ' ' + room.charAt(0).toUpperCase() + room.slice(1);
  document.getElementById('topbarSub').textContent = `AI Design Consultant · ${room.charAt(0).toUpperCase() + room.slice(1)} Mode`;
  addMessage(`Great! I'm now in ${room} mode. Ask me anything about your ${room} furniture!`, 'ai');
}

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
  return [{ isGoogle: true, query: query }];
}

function showFurnitureImages(images, query) {
  showGoogleImages(query);
}

function showBrandImages(brandImages, furnitureType) {
  const brandsUsed = brandImages.map(b => b.brandName).join(' OR ');
  showGoogleImages(`${brandsUsed} ${furnitureType} India`);
}
function showGoogleImages(query) {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg ai';

  const cleanQuery = encodeURIComponent(query + ' furniture India');
  const googleSearchURL = `https://www.google.com/search?q=${cleanQuery}&tbm=isch&safe=active`;

  div.innerHTML = `
    <div class="avatar ai">F</div>
    <div class="bubble">
      <div class="bubble-inner">
        <p style="color:var(--text-light); font-size:13px; margin-bottom:10px;">
          🖼️ Here's how <strong>${query}</strong> looks — click to see more images:
        </p>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:8px;">
          ${generateImageCards(query)}
        </div>
        <a href="${googleSearchURL}" target="_blank"
           style="display:block; text-align:center; background:var(--gold); color:var(--sidebar-bg);
                  padding:8px; border-radius:8px; font-size:13px; font-weight:bold;
                  text-decoration:none; margin-top:6px;">
          🔍 See More Images on Google
        </a>
      </div>
    </div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function generateImageCards(query) {
  const searches = [
    `${query}`,
    `${query} interior`,
    `${query} room design`
  ];

  return searches.map(q => {
    const encoded = encodeURIComponent(q + ' furniture India');
    const googleURL = `https://www.google.com/search?q=${encoded}&tbm=isch&safe=active`;
    const imageURL = `https://source.unsplash.com/300x200/?${encodeURIComponent(q)}`;

    return `
      <div class="furniture-img-card" onclick="window.open('${googleURL}', '_blank')"
           style="cursor:pointer; position:relative;">
        <img src="${imageURL}"
             alt="${q}"
             style="width:100%; height:100px; object-fit:cover; display:block;"
             onerror="this.src='https://source.unsplash.com/300x200/?furniture,interior'" />
        <div style="position:absolute; bottom:0; left:0; right:0;
                    background:rgba(0,0,0,0.6); color:white;
                    font-size:10px; padding:4px 6px; text-align:center;">
          🔍 ${q}
        </div>
      </div>
    `;
  }).join('');
}
function extractBrandsFromReply(aiReply) {
  const indianBrands = [
    'Wakefit', 'Pepperfry', 'Urban Ladder', 'Nilkamal',
    'Durian', 'Godrej Interio', 'Hometown', 'IKEA',
    'Wooden Street', 'FabIndia', 'HomeTown', 'Damro',
    '@home', 'Zuari', 'Featherlite'
  ];

  const foundBrands = [];
  const replyLower = aiReply.toLowerCase();

  for (const brand of indianBrands) {
    if (replyLower.includes(brand.toLowerCase())) {
      foundBrands.push(brand);
    }
  }

  return foundBrands.slice(0, 3);
}

function extractFurnitureKeyword(userText, aiReply) {
  const furnitureWords = [
    'mirror', 'study table', 'dining table', 'coffee table', 'side table',
    'tv unit', 'dining chair', 'armchair', 'rocking chair',
    'bunk bed', 'king bed', 'queen bed', 'single bed', 'double bed',
    'sofa', 'couch', 'bed', 'chair', 'table', 'wardrobe', 'almirah',
    'shelf', 'desk', 'lamp', 'rug', 'cabinet', 'curtain', 'cushion',
    'bookshelf', 'dresser', 'ottoman', 'sectional', 'console'
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

  const roomColorWords = [
    'black wall', 'white wall', 'grey wall', 'beige wall',
    'dark room', 'light room', 'colorful room'
  ];

  const userLower = userText.toLowerCase();
  const aiLower = aiReply.toLowerCase();

  let foundFurniture = '';
  let foundColor = '';
  let foundStyle = '';
  let foundSize = '';
  let foundRoomContext = '';

  for (const word of furnitureWords) {
    if (userLower.includes(word)) { foundFurniture = word; break; }
  }
  if (!foundFurniture) {
    for (const word of furnitureWords) {
      if (aiLower.includes(word)) { foundFurniture = word; break; }
    }
  }

  for (const word of colorWords) {
    if (userLower.includes(word)) { foundColor = word; break; }
  }

  for (const word of styleWords) {
    if (userLower.includes(word)) { foundStyle = word; break; }
  }

  for (const word of sizeWords) {
    if (userLower.includes(word)) { foundSize = word; break; }
  }

  for (const word of roomColorWords) {
    if (userLower.includes(word)) { foundRoomContext = word; break; }
  }

  if (foundFurniture) {
    const parts = [
      foundColor,
      foundSize,
      foundStyle,
      foundFurniture,
      foundRoomContext ? `in ${foundRoomContext}` : ''
    ].filter(Boolean);
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

  const languageInstruction = currentLanguage !== 'en'
    ? `IMPORTANT: Respond in ${languageNames[currentLanguage]} language only.` : '';
  const roomInstruction = `The user is asking about their ${currentRoom}.`;

  const userMessage = {
    role: "user",
    content: `${languageInstruction} ${roomInstruction} ${userText}`
  };

  chatHistory.push(userMessage);
  removeImage();
  showTyping();

  const fullSystem = SYSTEM_PROMPT + "\n\n" + FURNITURE_KNOWLEDGE;
  const messages = [{ role: "system", content: fullSystem }, ...chatHistory];

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

    if (data.error) {
      removeTyping();
      addMessage("Error: " + data.error.message, 'ai');
      return;
    }

    const reply = data.choices[0].message.content;
    removeTyping();
    addMessage(reply, 'ai');
    speakText(reply);
    chatHistory.push({ role: "assistant", content: reply });

    const furnitureKeyword = extractFurnitureKeyword(userText, reply);

    if (furnitureKeyword) {
      const brands = extractBrandsFromReply(reply);
      const searchQuery = brands.length > 0
        ? `${brands[0]} ${furnitureKeyword}`
        : furnitureKeyword;
      showGoogleImages(searchQuery);
    }

    console.log("Brands found:", brands);
    console.log("Furniture keyword:", furnitureKeyword);

    if (furnitureKeyword) {
      const brandsToUse = brands.length > 0 ? brands : defaultBrands;
      showTyping();

      const brandImagePromises = brandsToUse.map(brand =>
        searchFurnitureImage(`${brand} ${furnitureKeyword}`)
      );
      const brandResults = await Promise.all(brandImagePromises);
      removeTyping();

      const brandImages = [];
      brandResults.forEach((result, index) => {
        if (result && result.length > 0) {
          brandImages.push({
            ...result[0],
            brandName: brandsToUse[index]
          });
        }
      });

      if (brandImages.length > 0) {
        showBrandImages(brandImages, furnitureKeyword);
      } else {
        const fallbackImages = await searchFurnitureImage(`${furnitureKeyword} furniture`);
        if (fallbackImages && fallbackImages.length > 0) {
          showFurnitureImages(fallbackImages, furnitureKeyword);
        }
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
      result += `<li style="padding:4px 0; border-bottom:1px solid var(--bubble-border);">
                  <span style="color:var(--gold); font-weight:bold; margin-right:6px;">›</span>
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
  let speakButton = sender === 'ai' ? `
    <div>
      <button class="speak-btn" onclick="speakText(\`${text.replace(/`/g, "'")}\`)">
        🔊 Listen
      </button>
    </div>` : '';
  div.innerHTML = `
    <div class="avatar ${sender}">${sender === 'ai' ? 'F' : 'M'}</div>
    <div class="bubble">
      <div class="bubble-inner">${content}</div>
      ${speakButton}
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