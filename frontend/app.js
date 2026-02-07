const API_URL = 'https://oscarbetting.onrender.com';

let currentMode = 'login'; // login or register
// State
let globalCategories = [];
let globalUserBets = {};
let activeCategoryIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  document.getElementById('auth-form').addEventListener('submit', handleAuth);
  lucide.createIcons();
});

// ---------------- AUTH ----------------

function toggleAuth(mode) {
  currentMode = mode;
  const btnLogin = document.getElementById('tab-login');
  const btnRegister = document.getElementById('tab-register');
  const emailGroup = document.getElementById('email-group');
  const submitBtn = document.getElementById('submit-btn');

  if (mode === 'login') {
    btnLogin.className = "flex-1 py-2 text-sm font-medium rounded-md bg-gold text-slate-900 shadow-lg transition-all";
    btnRegister.className = "flex-1 py-2 text-sm font-medium rounded-md text-gray-400 hover:text-white transition-all";
    emailGroup.classList.add('hidden');
    submitBtn.textContent = "ENTRAR";
  } else {
    btnRegister.className = "flex-1 py-2 text-sm font-medium rounded-md bg-gold text-slate-900 shadow-lg transition-all";
    btnLogin.className = "flex-1 py-2 text-sm font-medium rounded-md text-gray-400 hover:text-white transition-all";
    emailGroup.classList.remove('hidden');
    submitBtn.textContent = "CADASTRAR";
  }
}

async function handleAuth(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const email = document.getElementById('email').value;
  const errorMsg = document.getElementById('auth-error');
  errorMsg.classList.add('hidden');

  try {
    let endpoint = currentMode === 'login' ? '/api-token-auth/' : '/api/register/';
    let body = { username, password };
    if (currentMode === 'register') body.email = email;

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(JSON.stringify(errData));
    }

    if (currentMode === 'register') {
      const loginResp = await fetch(`${API_URL}/api-token-auth/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!loginResp.ok) throw new Error("Falha no login automático");
      const data = await loginResp.json();
      loginSuccess(data.token, username);
    } else {
      const data = await response.json();
      loginSuccess(data.token, username);
    }

  } catch (err) {
    console.error(err);
    errorMsg.textContent = "Erro na autenticação. Verifique os dados.";
    errorMsg.classList.remove('hidden');
  }
}

function loginSuccess(token, username) {
  localStorage.setItem('token', token);
  localStorage.setItem('username', username);
  checkLogin();
}

function checkLogin() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  if (token) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('navbar').classList.remove('hidden');
    document.getElementById('nav-username').textContent = username;
    showSection('dashboard-screen');

    if (username === 'admin') {
      document.getElementById('admin-link').classList.remove('hidden');
    }
  } else {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('navbar').classList.add('hidden');
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  location.reload();
}

// ---------------- NAVIGATION ----------------

function showSection(sectionId) {
  // Hide all
  ['dashboard-screen', 'voting-screen', 'leaderboard-screen', 'admin-screen'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });

  // Reset Nav Active States
  highlightNav('');

  document.getElementById(sectionId).classList.remove('hidden');

  if (sectionId === 'voting-screen') {
    loadCategories();
    highlightNav('Apostar');
  }
  if (sectionId === 'leaderboard-screen') {
    loadLeaderboard();
    highlightNav('Ranking');
  }
  if (sectionId === 'dashboard-screen') {
    highlightNav('Dashboard');
  }
  if (sectionId === 'admin-screen') loadAdmin();

  lucide.createIcons();
}

function highlightNav(text) {
  const navLinks = document.querySelectorAll('#navbar a');
  navLinks.forEach(link => {
    if (link.textContent.trim() === text) {
      link.classList.add('text-gold', 'font-bold');
      link.classList.remove('text-gray-300');
    } else if (text !== '') {
      link.classList.remove('text-gold', 'font-bold');
      link.classList.add('text-gray-300');
    }
  });
}

// ---------------- DATA & VOTING (NEW UI) ----------------

async function loadCategories() {
  const token = localStorage.getItem('token');
  try {
    const [catRes, betRes] = await Promise.all([
      fetch(`${API_URL}/api/categories/`, { headers: { 'Authorization': `Token ${token}` } }),
      fetch(`${API_URL}/api/bets/`, { headers: { 'Authorization': `Token ${token}` } })
    ]);

    if (!catRes.ok) throw new Error(`Categories error: ${catRes.status}`);

    globalCategories = await catRes.json();

    if (betRes.ok) {
      const bets = await betRes.json();
      globalUserBets = {};
      bets.forEach(b => globalUserBets[b.category] = b.nominee);
    }

    renderCategoryTabs();
    renderActiveCategory();
    updateProgress(globalCategories.length, Object.keys(globalUserBets).length);

  } catch (err) {
    console.error(err);
    const container = document.getElementById('active-category-container');
    if (container) {
      container.innerHTML =
        `<div class="text-red-400 text-center p-8 bg-red-900/20 rounded-lg border border-red-900/50">
                Erro ao carregar dados: ${err.message}
            </div>`;
    }
  }
}

function renderCategoryTabs() {
  const container = document.getElementById('category-tabs');
  if (!container) return;
  container.innerHTML = '';

  globalCategories.forEach((cat, index) => {
    const isVoted = globalUserBets[cat.id];
    const isActive = index === activeCategoryIndex;

    const btn = document.createElement('button');
    let classes = "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 border cursor-pointer ";

    if (isActive) {
      classes += "bg-gold text-slate-900 border-gold shadow-lg shadow-yellow-500/20 scale-105";
    } else if (isVoted) {
      classes += "bg-slate-800 text-green-400 border-green-500/30 hover:bg-slate-700";
    } else {
      classes += "bg-slate-900 text-gray-400 border-white/10 hover:border-white/30 hover:text-white";
    }

    btn.className = classes;
    btn.innerHTML = `
            ${isVoted ? '<i data-lucide="check" class="w-3 h-3"></i>' : ''}
            ${cat.name}
        `;
    btn.onclick = () => {
      activeCategoryIndex = index;
      renderCategoryTabs();
      renderActiveCategory();
    };

    container.appendChild(btn);
  });
  lucide.createIcons();

  const activeBtn = container.children[activeCategoryIndex];
  if (activeBtn) {
    activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

function renderActiveCategory() {
  if (globalCategories.length === 0) return;
  const cat = globalCategories[activeCategoryIndex];
  const container = document.getElementById('active-category-container');
  const votedId = globalUserBets[cat.id];

  let html = `
        <div class="mb-8 text-center animate-fade-in">
            <h2 class="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-200 mb-2 drop-shadow-sm tracking-tight">
                ${cat.name}
            </h2>
            <p class="text-gray-400 text-xs uppercase tracking-widest font-semibold">Selecione o vencedor</p>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-1">
    `;

  cat.nominees.forEach(nom => {
    const isSelected = votedId === nom.id;
    const borderClass = isSelected ? "ring-2 ring-gold ring-offset-2 ring-offset-slate-950 grayscale-0 shadow-xl shadow-yellow-500/10" : "grayscale-[30%] hover:grayscale-0 ring-1 ring-white/10 hover:ring-white/30";
    const bgClass = isSelected ? "bg-slate-800" : "bg-slate-900";
    const imageDisplay = nom.display_image || 'https://via.placeholder.com/300x450?text=No+Image';

    html += `
            <div onclick="placeBet(${cat.id}, ${nom.id}, this)" 
                 class="group cursor-pointer relative rounded-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 ${borderClass} ${bgClass}"
            >
                <div class="aspect-[2/3] w-full relative overflow-hidden">
                    <img src="${imageDisplay}" class="w-full h-full object-cover transition duration-700 group-hover:scale-110">
                    <div class="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
                    
                    ${isSelected ? `
                        <div class="absolute top-2 right-2 bg-gold text-slate-900 rounded-full p-1 shadow-lg z-10 animate-bounce-short">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div class="absolute bottom-0 w-full bg-gold text-slate-900 text-center text-[10px] font-bold py-1 uppercase tracking-wider">
                            Selecionado
                        </div>
                    ` : ''}
                </div>

                <div class="p-4 relative mt-auto">
                    <h4 class="font-bold text-white text-sm leading-snug mb-1 group-hover:text-gold transition-colors text-shadow-sm">${nom.movie ? nom.movie.title : nom.person_name}</h4>
                    ${nom.person_name && nom.movie ? `<p class="text-xs text-gray-400 truncate">${nom.person_name}</p>` : ''}
                    ${nom.secondary_text ? `<p class="text-xs text-yellow-500/80 mt-1 font-medium truncate">${nom.secondary_text}</p>` : ''}
                </div>
            </div>
        `;
  });

  html += `</div>`;
  container.innerHTML = html;

  // Update Navigation Buttons States
  const prevBtn = document.getElementById('btn-prev-cat');
  const nextBtn = document.getElementById('btn-next-cat');
  const counter = document.getElementById('category-counter');

  if (prevBtn) prevBtn.disabled = activeCategoryIndex === 0;
  if (nextBtn) nextBtn.disabled = activeCategoryIndex === globalCategories.length - 1;
  if (counter) counter.textContent = `${activeCategoryIndex + 1} / ${globalCategories.length}`;
}

function prevCategory() {
  if (activeCategoryIndex > 0) {
    activeCategoryIndex--;
    renderCategoryTabs();
    renderActiveCategory();
  }
}

function nextCategory() {
  if (activeCategoryIndex < globalCategories.length - 1) {
    activeCategoryIndex++;
    renderCategoryTabs();
    renderActiveCategory();
  }
}

async function placeBet(catId, nomId, element) {
  const token = localStorage.getItem('token');

  // Optimistic UI update
  globalUserBets[catId] = nomId;
  renderActiveCategory();
  renderCategoryTabs();
  updateProgress(globalCategories.length, Object.keys(globalUserBets).length);

  try {
    await fetch(`${API_URL}/api/bets/`, {
      method: 'POST',
      headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: catId, nominee: nomId })
    });
  } catch (err) { console.error('Bet failed', err); }
}

function updateProgress(total, voted) {
  const el = document.getElementById('vote-progress');
  if (el) el.textContent = `${voted}/${total}`;
}

// ---------------- LEADERBOARD (PODIUM) ----------------

async function loadLeaderboard() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/leaderboard/`, { headers: { 'Authorization': `Token ${token}` } });
  const data = await res.json();

  const tbody = document.getElementById('leaderboard-body');
  const podiumContainer = document.getElementById('podium-container');

  tbody.innerHTML = '';

  if (data.length > 0) {
    podiumContainer.classList.remove('hidden');
    if (data[0]) updatePodium(1, data[0]);
    if (data[1]) updatePodium(2, data[1]);
    if (data[2]) updatePodium(3, data[2]);
  } else {
    podiumContainer.classList.add('hidden');
  }

  const listData = data.slice(3);

  listData.forEach((u, i) => {
    const rank = i + 4;
    tbody.innerHTML += `
            <tr class="hover:bg-white/5 transition group">
                <td class="p-4 pl-6 font-mono text-gray-500 group-hover:text-white transition">#${rank}</td>
                <td class="p-4 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-gray-300 border border-white/10">
                        ${u.username.substring(0, 2).toUpperCase()}
                    </div>
                    <span class="text-gray-300 font-medium group-hover:text-white transition">${u.username}</span>
                </td>
                <td class="p-4 pr-6 text-right font-bold text-gray-400 group-hover:text-gold transition">${u.score} pts</td>
            </tr>
        `;
  });
}

function updatePodium(rank, user) {
  const nameEl = document.getElementById(`podium-${rank}-name`);
  const scoreEl = document.getElementById(`podium-${rank}-score`);
  const avatarEl = document.getElementById(`podium-${rank}-avatar`);

  if (nameEl) nameEl.textContent = user.username;
  if (scoreEl) scoreEl.textContent = `${user.score} pts`;
  if (avatarEl) avatarEl.textContent = user.username.substring(0, 1).toUpperCase();
}

// ---------------- ADMIN ----------------

async function loadAdmin() {
  const token = localStorage.getItem('token');
  const container = document.getElementById('admin-categories-container');
  container.innerHTML = '<p class="text-white">Carregando...</p>';

  try {
    const catRes = await fetch(`${API_URL}/api/categories/`, { headers: { 'Authorization': `Token ${token}` } });
    const categories = await catRes.json();

    container.innerHTML = '';
    categories.forEach(cat => {
      const winner = cat.nominees.find(n => n.is_winner);
      let options = `<option value="">-- Selecione o Vencedor --</option>`;
      cat.nominees.forEach(n => {
        const name = n.movie ? n.movie.title : n.person_name;
        options += `<option value="${n.id}" ${n.is_winner ? 'selected' : ''}>${name}</option>`;
      });

      const div = document.createElement('div');
      div.className = "bg-slate-800 p-4 rounded-lg flex items-center justify-between border border-white/5 shadow-sm";
      div.innerHTML = `
                <div class="flex items-center gap-3">
                    ${winner ? '<i data-lucide="check-circle" class="text-green-500 w-5 h-5"></i>' : '<i data-lucide="circle" class="text-gray-600 w-5 h-5"></i>'}
                    <span class="font-bold text-white">${cat.name}</span>
                </div>
                <div class="flex gap-2">
                    <select id="admin-cat-${cat.id}" class="bg-slate-900 text-white text-sm p-2 rounded border border-white/10 focus:border-gold outline-none w-64">
                        ${options}
                    </select>
                    <button onclick="setWinner(${cat.id})" class="bg-gold text-slate-900 px-4 py-2 rounded text-sm font-bold hover:bg-yellow-400 transition">Salvar</button>
                </div>
            `;
      container.appendChild(div);
    });
    lucide.createIcons();
  } catch (e) {
    container.innerHTML = '<p class="text-red-500">Erro ao carregar (você é admin?)</p>';
  }
}

async function setWinner(catId) {
  const token = localStorage.getItem('token');
  const nomId = document.getElementById(`admin-cat-${catId}`).value;
  if (!nomId) return;

  await fetch(`${API_URL}/api/admin/winner/`, {
    method: 'POST',
    headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ category_id: catId, nominee_id: nomId })
  });
  loadAdmin();
}
