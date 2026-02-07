const API_URL = 'http://127.0.0.1:8000';

let currentMode = 'login'; // login or register

document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  document.getElementById('auth-form').addEventListener('submit', handleAuth);
  lucide.createIcons();
});

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

    // If register success, automatically login
    if (currentMode === 'register') {
      // Login immediately
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

    // Check if admin (simplistic check, ideally check role from API)
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

function showSection(sectionId) {
  // Hide all
  ['dashboard-screen', 'voting-screen', 'leaderboard-screen', 'admin-screen'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(sectionId).classList.remove('hidden');

  if (sectionId === 'voting-screen') loadCategories();
  if (sectionId === 'leaderboard-screen') loadLeaderboard();
  if (sectionId === 'admin-screen') loadAdmin();

  // Refresh icons just in case
  lucide.createIcons();
}

// ---------------- DATA LOADING ----------------

async function loadCategories() {
  const token = localStorage.getItem('token');
  try {
    const [catRes, betRes] = await Promise.all([
      fetch(`${API_URL}/api/categories/`, { headers: { 'Authorization': `Token ${token}` } }),
      fetch(`${API_URL}/api/bets/`, { headers: { 'Authorization': `Token ${token}` } })
    ]);

    const categories = await catRes.json();
    const bets = await betRes.json();
    const userBets = {};
    bets.forEach(b => userBets[b.category] = b.nominee);

    renderCategories(categories, userBets);
    updateProgress(categories.length, Object.keys(userBets).length);
  } catch (err) { console.error(err); }
}

function renderCategories(categories, userBets) {
  const container = document.getElementById('categories-container');
  container.innerHTML = '';

  categories.forEach(cat => {
    const grid = document.createElement('div');
    grid.className = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";

    let nomineesHtml = '';

    // Sort nominees: Winners first? No, alphabet or as is.
    cat.nominees.forEach(nom => {
      const isSelected = userBets[cat.id] === nom.id;
      const borderClass = isSelected ? "border-gold gold-border-glow bg-slate-800" : "border-white/10 hover:border-white/30 bg-slate-900";
      const imageDisplay = nom.display_image || 'https://via.placeholder.com/300x450?text=No+Image'; // Need generic placeholder

      nomineesHtml += `
            <div onclick="placeBet(${cat.id}, ${nom.id}, this)" 
                 class="relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${borderClass}"
                 data-cat-id="${cat.id}">
                 
                <!-- Image Aspect 2:3 -->
                <div class="aspect-[2/3] w-full relative">
                    <img src="${imageDisplay}" class="w-full h-full object-cover transition duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                    
                    ${isSelected ? `
                        <div class="absolute top-2 right-2 bg-gold text-slate-900 rounded-full p-1 shadow-lg">
                            <i data-lucide="check" class="w-4 h-4"></i>
                        </div>
                    ` : ''}
                </div>

                <div class="absolute bottom-0 w-full p-4">
                    <h4 class="font-bold text-white text-sm leading-tight mb-1 text-shadow-sm">${nom.movie ? nom.movie.title : nom.person_name}</h4>
                    ${nom.person_name && nom.movie ? `<p class="text-xs text-gray-400 truncate">${nom.person_name}</p>` : ''}
                    ${nom.secondary_text ? `<p class="text-xs text-gold truncate">${nom.secondary_text}</p>` : ''}
                </div>
            </div>
            `;
    });

    const section = document.createElement('div');
    section.innerHTML = `
            <h3 class="text-xl font-bold text-white mb-4 border-l-4 border-gold pl-3 flex items-center gap-2">
                ${cat.name}
            </h3>
            ${grid.outerHTML}
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">${nomineesHtml}</div>
        `;
    container.appendChild(section);
  });
  lucide.createIcons();
}

function updateProgress(total, voted) {
  document.getElementById('vote-progress').textContent = `${voted}/${total}`;
}

async function placeBet(catId, nomId, element) {
  const token = localStorage.getItem('token');

  // UI Update
  const parent = element.parentElement;
  Array.from(parent.children).forEach(child => {
    child.className = child.className.replace("border-gold gold-border-glow bg-slate-800", "border-white/10 hover:border-white/30 bg-slate-900");
    const check = child.querySelector('.absolute.top-2.right-2');
    if (check) check.remove();
  });

  element.className = element.className.replace("border-white/10 hover:border-white/30 bg-slate-900", "border-gold gold-border-glow bg-slate-800");
  element.querySelector('.aspect-\\[2\\/3\\]').innerHTML += `
        <div class="absolute top-2 right-2 bg-gold text-slate-900 rounded-full p-1 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="w-4 h-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
    `;

  try {
    await fetch(`${API_URL}/api/bets/`, {
      method: 'POST',
      headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: catId, nominee: nomId })
    });

    // Re-fetch to update progress count accurately
    const bets = await (await fetch(`${API_URL}/api/bets/`, { headers: { 'Authorization': `Token ${token}` } })).json();
    const cats = document.getElementById('categories-container').children.length; // Approximate
    updateProgress(cats, bets.length);

  } catch (err) { console.error('Bet failed', err); }
}

async function loadLeaderboard() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/leaderboard/`, { headers: { 'Authorization': `Token ${token}` } });
  const data = await res.json();

  const tbody = document.getElementById('leaderboard-body');
  tbody.innerHTML = '';

  data.forEach((u, i) => {
    let rankDisplay = `#${i + 1}`;
    let rowClass = "hover:bg-white/5 transition";
    let textClass = "text-white";

    if (i === 0) { rankDisplay = '🥇'; textClass = "text-gold font-bold"; rowClass = "bg-gold/10 border-l-2 border-gold"; }
    if (i === 1) { rankDisplay = '🥈'; textClass = "text-gray-300 font-bold"; }
    if (i === 2) { rankDisplay = '🥉'; textClass = "text-amber-700 font-bold"; }

    tbody.innerHTML += `
            <tr class="${rowClass}">
                <td class="p-6 font-mono text-lg ${textClass}">${rankDisplay}</td>
                <td class="p-6 font-medium ${i === 0 ? 'text-gold' : 'text-gray-300'}">${u.username}</td>
                <td class="p-6 text-right font-bold text-white">${u.score} pts</td>
            </tr>
        `;
  });
}
// Admin
async function loadAdmin() {
  const token = localStorage.getItem('token');
  const container = document.getElementById('admin-categories-container');
  container.innerHTML = '<p class="text-white">Carregando...</p>';

  try {
    const catRes = await fetch(`${API_URL}/api/categories/`, { headers: { 'Authorization': `Token ${token}` } });
    const categories = await catRes.json();

    container.innerHTML = '';
    categories.forEach(cat => {
      // Find current winner
      const winner = cat.nominees.find(n => n.is_winner);

      let options = `<option value="">-- Selecione o Vencedor --</option>`;
      cat.nominees.forEach(n => {
        const name = n.movie ? n.movie.title : n.person_name;
        options += `<option value="${n.id}" ${n.is_winner ? 'selected' : ''}>${name}</option>`;
      });

      const div = document.createElement('div');
      div.className = "bg-slate-800 p-4 rounded-lg flex items-center justify-between border border-white/5";
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

  loadAdmin(); // Refresh
}
