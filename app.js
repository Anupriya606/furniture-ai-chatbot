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
// ============================================
// ROOM VISUALIZER
// ============================================

let currentFloorColor = '#C8A882';

function openVisualizer() {
  const modal = document.getElementById('visualizerModal');
  modal.style.display = 'flex';
  setTimeout(() => drawRoom(), 100);
}

function closeVisualizer() {
  document.getElementById('visualizerModal').style.display = 'none';
}

function setFloor(color) {
  currentFloorColor = color;
  drawRoom();
}

function drawRoom() {
  const canvas = document.getElementById('roomCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const wallColor = document.getElementById('wallColor').value;
  const furnitureType = document.getElementById('furnitureType').value;
  const furnitureColor = document.getElementById('furnitureColor').value;

  ctx.clearRect(0, 0, W, H);

  // BACKGROUND WALL
  ctx.fillStyle = wallColor;
  ctx.fillRect(0, 0, W, H);

  // 3D PERSPECTIVE LINES
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;

  // Floor
  ctx.fillStyle = currentFloorColor;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.62);
  ctx.lineTo(W, H * 0.62);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Floor lines for texture
  ctx.strokeStyle = 'rgba(0,0,0,0.07)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const y = H * 0.62 + (H * 0.38 / 8) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let i = 0; i < 12; i++) {
    const x = (W / 12) * i;
    ctx.beginPath();
    ctx.moveTo(x, H * 0.62);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  // Wall corner lines
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.62);
  ctx.lineTo(W, H * 0.62);
  ctx.stroke();

  // Left wall shadow
  const leftGrad = ctx.createLinearGradient(0, 0, 80, 0);
  leftGrad.addColorStop(0, 'rgba(0,0,0,0.1)');
  leftGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, 0, 80, H * 0.62);

  // Ceiling line
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.lineTo(W, 30);
  ctx.stroke();

  // WINDOW on wall
  drawWindow(ctx, W * 0.65, 60, 140, 110, wallColor);

  // DRAW FURNITURE
  drawFurniture(ctx, furnitureType, furnitureColor, W, H);

  // BASEBOARD
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(0, H * 0.62 - 8, W, 8);

  // AMBIENT LIGHT from window
  const lightGrad = ctx.createRadialGradient(W * 0.72, 60, 10, W * 0.72, 200, 280);
  lightGrad.addColorStop(0, 'rgba(255,255,220,0.15)');
  lightGrad.addColorStop(1, 'rgba(255,255,220,0)');
  ctx.fillStyle = lightGrad;
  ctx.fillRect(0, 0, W, H);
}

function drawWindow(ctx, x, y, w, h, wallColor) {
  // Window frame
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(x - 5, y - 5, w + 10, h + 10);

  // Window glass - sky gradient
  const skyGrad = ctx.createLinearGradient(x, y, x, y + h);
  skyGrad.addColorStop(0, '#87CEEB');
  skyGrad.addColorStop(0.6, '#B0D9F0');
  skyGrad.addColorStop(1, '#D4EEF7');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(x, y, w, h);

  // Window dividers
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w/2, y);
  ctx.lineTo(x + w/2, y + h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + h/2);
  ctx.lineTo(x + w, y + h/2);
  ctx.stroke();

  // Window frame border
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, w, h);

  // Curtains
  const curtainColor = wallColor === '#2C2C2C' ? '#8B7355' : '#D4B896';
  ctx.fillStyle = curtainColor;
  // Left curtain
  ctx.beginPath();
  ctx.moveTo(x - 20, y - 10);
  ctx.lineTo(x + 25, y - 10);
  ctx.lineTo(x + 15, y + h + 10);
  ctx.lineTo(x - 20, y + h + 10);
  ctx.closePath();
  ctx.fill();
  // Right curtain
  ctx.beginPath();
  ctx.moveTo(x + w + 20, y - 10);
  ctx.lineTo(x + w - 25, y - 10);
  ctx.lineTo(x + w - 15, y + h + 10);
  ctx.lineTo(x + w + 20, y + h + 10);
  ctx.closePath();
  ctx.fill();

  // Curtain rod
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 25, y - 10);
  ctx.lineTo(x + w + 25, y - 10);
  ctx.stroke();
}

function drawFurniture(ctx, type, color, W, H) {
  const floorY = H * 0.62;

  // Shadow under furniture
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(W * 0.3, floorY - 2, 160, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  if (type === 'sofa') drawSofa(ctx, color, W, floorY);
  else if (type === 'bed') drawBed(ctx, color, W, floorY);
  else if (type === 'dining') drawDining(ctx, color, W, floorY);
  else if (type === 'desk') drawDesk(ctx, color, W, floorY);
  else if (type === 'wardrobe') drawWardrobe(ctx, color, W, floorY);
  else if (type === 'tv') drawTVUnit(ctx, color, W, floorY);
}

function getDark(color) {
  const r = parseInt(color.slice(1,3),16);
  const g = parseInt(color.slice(3,5),16);
  const b = parseInt(color.slice(5,7),16);
  return `rgb(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)})`;
}

function getLight(color) {
  const r = parseInt(color.slice(1,3),16);
  const g = parseInt(color.slice(3,5),16);
  const b = parseInt(color.slice(5,7),16);
  return `rgb(${Math.min(255,r+40)},${Math.min(255,g+40)},${Math.min(255,b+40)})`;
}

function drawSofa(ctx, color, W, floorY) {
  const x = W * 0.08;
  const y = floorY - 115;
  const w = W * 0.5;

  // Back rest
  ctx.fillStyle = getDark(color);
  ctx.beginPath();
  ctx.roundRect(x, y, w, 75, 8);
  ctx.fill();

  // Seat
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y + 65, w, 45, [0,0,8,8]);
  ctx.fill();

  // Seat cushions
  ctx.fillStyle = getLight(color);
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 68, w/2 - 14, 36, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x + w/2 + 6, y + 68, w/2 - 14, 36, 6);
  ctx.fill();

  // Back cushions
  ctx.fillStyle = getLight(color);
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 8, w/3 - 10, 52, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x + w/3 + 4, y + 8, w/3 - 8, 52, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x + 2*w/3 + 2, y + 8, w/3 - 10, 52, 6);
  ctx.fill();

  // Armrests
  ctx.fillStyle = getDark(color);
  ctx.beginPath();
  ctx.roundRect(x - 18, y + 20, 22, 90, [8,0,0,8]);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x + w - 4, y + 20, 22, 90, [0,8,8,0]);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#5C3A1E';
  [[x+10, floorY-12], [x+w-10, floorY-12], [x+30, floorY-12], [x+w-30, floorY-12]].forEach(([lx,ly]) => {
    ctx.fillRect(lx, ly, 12, 12);
  });

  // Decorative pillow
  ctx.fillStyle = '#D4A96A';
  ctx.beginPath();
  ctx.roundRect(x + w - 55, y + 12, 38, 48, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w - 36, y + 12);
  ctx.lineTo(x + w - 36, y + 60);
  ctx.stroke();
}

function drawBed(ctx, color, W, floorY) {
  const x = W * 0.06;
  const y = floorY - 130;
  const w = W * 0.52;

  // Bed frame
  ctx.fillStyle = getDark(color);
  ctx.beginPath();
  ctx.roundRect(x, y + 30, w, 100, 6);
  ctx.fill();

  // Headboard
  ctx.fillStyle = getDark(color);
  ctx.beginPath();
  ctx.roundRect(x, y, w, 50, [10,10,0,0]);
  ctx.fill();
  ctx.fillStyle = getLight(color);
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 8, w - 20, 32, 6);
  ctx.fill();

  // Mattress
  ctx.fillStyle = '#F5F0EB';
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 35, w - 16, 85, 4);
  ctx.fill();

  // Pillow 1
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(x + 15, y + 40, 80, 40, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 15, y + 40, 80, 40);

  // Pillow 2
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(x + w/2 + 5, y + 40, 80, 40, 8);
  ctx.fill();
  ctx.strokeRect(x + w/2 + 5, y + 40, 80, 40);

  // Blanket
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 85, w - 16, 35, [0,0,4,4]);
  ctx.fill();
  ctx.fillStyle = getDark(color);
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 85, w - 16, 10, 0);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#5C3A1E';
  [[x+15, floorY-14],[x+w-25, floorY-14]].forEach(([lx,ly]) => {
    ctx.fillRect(lx, ly, 14, 14);
  });

  // Side table
  ctx.fillStyle = getDark(color);
  ctx.beginPath();
  ctx.roundRect(x + w + 12, y + 60, 50, 60, 4);
  ctx.fill();
  ctx.fillStyle = getLight(color);
  ctx.fillRect(x + w + 12, y + 60, 50, 6);
  // Lamp on table
  ctx.fillStyle = '#D4A96A';
  ctx.beginPath();
  ctx.moveTo(x + w + 28, y + 30);
  ctx.lineTo(x + w + 46, y + 60);
  ctx.lineTo(x + w + 18, y + 60);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(x + w + 35, y + 60, 4, 15);
}

function drawDining(ctx, color, W, floorY) {
  const cx = W * 0.3;
  const tableY = floorY - 90;
  const tw = 200;
  const th = 14;

  // Table top
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(cx - tw/2, tableY, tw, th, 4);
  ctx.fill();
  ctx.fillStyle = getLight(color);
  ctx.beginPath();
  ctx.roundRect(cx - tw/2 + 4, tableY + 2, tw - 8, 4, 2);
  ctx.fill();

  // Table legs
  ctx.fillStyle = getDark(color);
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  [[cx-tw/2+20, tableY+th, cx-tw/2+15, floorY],
   [cx+tw/2-20, tableY+th, cx+tw/2-15, floorY],
   [cx-tw/2+20, tableY+th, cx-tw/2+25, floorY-10],
   [cx+tw/2-20, tableY+th, cx+tw/2-25, floorY-10]
  ].forEach(([x1,y1,x2,y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
  });

  // Chairs
  [[cx - tw/2 - 45, tableY - 10], [cx + tw/2 + 20, tableY - 10],
   [cx - 60, tableY - 10], [cx + 15, tableY - 10]].forEach(([cx2, cy2], i) => {
    ctx.fillStyle = getDark(color);
    ctx.beginPath();
    ctx.roundRect(cx2, cy2, 40, 55, 4);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(cx2 + 2, cy2 + 20, 36, 22, 4);
    ctx.fill();
  });

  // Items on table
  ctx.fillStyle = '#E8D5B0';
  ctx.beginPath();
  ctx.arc(cx, tableY - 4, 25, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#D4A96A';
  ctx.beginPath();
  ctx.arc(cx, tableY - 4, 18, 0, Math.PI*2);
  ctx.fill();
}

function drawDesk(ctx, color, W, floorY) {
  const x = W * 0.07;
  const y = floorY - 100;
  const w = W * 0.42;

  // Desk surface
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 16, 4);
  ctx.fill();
  ctx.fillStyle = getLight(color);
  ctx.fillRect(x + 6, y + 2, w - 12, 5);

  // Drawer unit
  ctx.fillStyle = getDark(color);
  ctx.beginPath();
  ctx.roundRect(x + w - 70, y + 16, 65, 75, 4);
  ctx.fill();
  [0,1,2].forEach(i => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + w - 66, y + 20 + i * 22, 57, 18, 3);
    ctx.fill();
    ctx.fillStyle = '#D4A96A';
    ctx.beginPath();
    ctx.arc(x + w - 37, y + 29 + i * 22, 4, 0, Math.PI*2);
    ctx.fill();
  });

  // Legs
  ctx.fillStyle = getDark(color);
  [[x + 10, y + 16], [x + w - 80, y + 16]].forEach(([lx, ly]) => {
    ctx.fillRect(lx, ly, 12, floorY - ly);
  });

  // Monitor
  ctx.fillStyle = '#1A1A1A';
  ctx.beginPath();
  ctx.roundRect(x + 30, y - 85, 120, 80, 6);
  ctx.fill();
  ctx.fillStyle = '#2196F3';
  ctx.beginPath();
  ctx.roundRect(x + 34, y - 81, 112, 72, 4);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillRect(x + 82, y - 5, 16, 18);
  ctx.fillRect(x + 62, y + 13, 56, 5);

  // Chair
  ctx.fillStyle = getDark(color);
  ctx.beginPath();
  ctx.roundRect(x + 60, y + 16, 80, 55, 6);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + 63, y + 19, 74, 35, 4);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillRect(x + 92, y + 71, 14, 20);
  ctx.beginPath();
  ctx.arc(x + 99, y + 91, 18, 0, Math.PI*2);
  ctx.fillStyle = '#444';
  ctx.fill();
}

function drawWardrobe(ctx, color, W, floorY) {
  const x = W * 0.08;
  const y = floorY - 220;
  const w = W * 0.38;
  const h = 220;

  // Main body
  ctx.fillStyle = getDark(color);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();

  // Doors
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + 6, y + 6, w/2 - 10, h - 12, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x + w/2 + 4, y + 6, w/2 - 10, h - 12, 3);
  ctx.fill();

  // Door panels
  ctx.fillStyle = getLight(color);
  ctx.beginPath();
  ctx.roundRect(x + 12, y + 12, w/2 - 22, (h-24)/2 - 6, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x + 12, y + (h-24)/2 + 18, w/2 - 22, (h-24)/2 - 6, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x + w/2 + 10, y + 12, w/2 - 22, (h-24)/2 - 6, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x + w/2 + 10, y + (h-24)/2 + 18, w/2 - 22, (h-24)/2 - 6, 3);
  ctx.fill();

  // Handles
  ctx.fillStyle = '#D4A96A';
  ctx.beginPath();
  ctx.roundRect(x + w/2 - 18, y + h/2 - 20, 10, 40, 5);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x + w/2 + 8, y + h/2 - 20, 10, 40, 5);
  ctx.fill();

  // Top cornice
  ctx.fillStyle = getDark(color);
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 10, w + 8, 14, [4,4,0,0]);
  ctx.fill();
}

function drawTVUnit(ctx, color, W, floorY) {
  const x = W * 0.05;
  const y = floorY - 70;
  const w = W * 0.52;

  // Main unit
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 65, 6);
  ctx.fill();

  // Compartments
  ctx.fillStyle = getDark(color);
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 8, 80, 50, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x + w - 88, y + 8, 80, 50, 4);
  ctx.fill();

  // Middle open shelf
  ctx.fillStyle = getLight(color);
  ctx.beginPath();
  ctx.roundRect(x + 96, y + 8, w - 200, 50, 4);
  ctx.fill();

  // Legs
  ctx.fillStyle = getDark(color);
  [[x+20, y+65],[x+w-32, y+65],[x+w/2-10, y+65]].forEach(([lx,ly]) => {
    ctx.fillRect(lx, ly, 12, 14);
  });

  // TV
  const tvX = x + w/2 - 120;
  const tvY = y - 155;
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.roundRect(tvX, tvY, 240, 148, 8);
  ctx.fill();
  const screenGrad = ctx.createLinearGradient(tvX+6, tvY+6, tvX+6, tvY+136);
  screenGrad.addColorStop(0, '#1a1a2e');
  screenGrad.addColorStop(0.5, '#16213e');
  screenGrad.addColorStop(1, '#0f3460');
  ctx.fillStyle = screenGrad;
  ctx.beginPath();
  ctx.roundRect(tvX+6, tvY+6, 228, 134, 4);
  ctx.fill();

  // Screen content
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(tvX+10, tvY+10, 80, 50);
  ctx.fillRect(tvX+100, tvY+10, 130, 50);
  ctx.fillRect(tvX+10, tvY+70, 210, 65);

  // TV stand
  ctx.fillStyle = '#333';
  ctx.fillRect(tvX+108, tvY+148, 24, 14);
  ctx.fillRect(tvX+88, tvY+160, 64, 6);

  // Decorative items on unit
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.arc(x + 48, y - 15, 15, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#388E3C';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(x + 48, y - 20 + i*8, 12 - i*1.5, 6, 0, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(x + 45, y - 2, 6, 20);
}

function downloadRoom() {
  const canvas = document.getElementById('roomCanvas');
  const link = document.createElement('a');
  link.download = 'FurniAI-Room-Design.png';
  link.href = canvas.toDataURL();
  link.click();
}

function askAIAboutRoom() {
  const wallColor = document.getElementById('wallColor').options[document.getElementById('wallColor').selectedIndex].text;
  const furnitureType = document.getElementById('furnitureType').value;
  const furnitureColor = document.getElementById('furnitureColor').options[document.getElementById('furnitureColor').selectedIndex].text;

  closeVisualizer();

  const question = `I have a room with ${wallColor} walls and I'm planning to add a ${furnitureColor} ${furnitureType}. Does this combination look good? What other furniture or decor would complement this setup?`;

  document.getElementById('userInput').value = question;
  sendMessage();
}