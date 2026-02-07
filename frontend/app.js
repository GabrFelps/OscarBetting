const API_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  document.getElementById('login-form').addEventListener('submit', handleLogin);
});

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('login-error');

  try {
    const response = await fetch(`${API_URL}/api-token-auth/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) throw new Error('Login failed');

    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', username);
    checkLogin();
  } catch (err) {
    errorMsg.classList.remove('hidden');
  }
}

function checkLogin() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  if (token) {
    document.getElementById('login-section').classList.add('hidden');
    showSection('voting-section');
    document.getElementById('user-info').classList.remove('hidden');
    document.getElementById('username-display').innerText = `Olá, ${username}`;
    loadCategories();
  } else {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('voting-section').classList.add('hidden');
    document.getElementById('leaderboard-section').classList.add('hidden');
    document.getElementById('user-info').classList.add('hidden');
  }
}

function showSection(sectionId) {
  document.getElementById('voting-section').classList.add('hidden');
  document.getElementById('leaderboard-section').classList.add('hidden');
  document.getElementById(sectionId).classList.remove('hidden');

  if (sectionId === 'leaderboard-section') {
    loadLeaderboard();
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  checkLogin();
}

async function loadLeaderboard() {
  try {
    const response = await fetch(`${API_URL}/api/leaderboard/`);
    const data = await response.json();

    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';

    data.forEach((user, index) => {
      const row = `
                <tr class="hover:bg-gray-700 transition">
                    <td class="p-4 font-bold ${index < 3 ? 'text-yellow-500' : 'text-gray-400'}">#${index + 1}</td>
                    <td class="p-4">${user.username}</td>
                    <td class="p-4 text-right font-mono text-lg">${user.score}</td>
                </tr>
            `;
      tbody.innerHTML += row;
    });
  } catch (err) {
    console.error('Error loading leaderboard:', err);
  }
}

async function loadCategories() {
  const token = localStorage.getItem('token');
  try {
    // Fetch Categories
    const catResponse = await fetch(`${API_URL}/api/categories/`, {
      headers: { 'Authorization': `Token ${token}` }
    });
    const categories = await catResponse.json();

    // Fetch User Bets to mark selected
    const betsResponse = await fetch(`${API_URL}/api/bets/`, {
      headers: { 'Authorization': `Token ${token}` }
    });
    const bets = await betsResponse.json();
    const userBets = {}; // category_id -> nominee_id
    bets.forEach(bet => {
      userBets[bet.category] = bet.nominee;
    });

    renderCategories(categories, userBets);
  } catch (err) {
    console.error('Error loading data:', err);
  }
}

function renderCategories(categories, userBets) {
  const container = document.getElementById('categories-container');
  container.innerHTML = '';

  categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700';

    let nomineesHtml = '';
    cat.nominees.forEach(nom => {
      const isSelected = userBets[cat.id] === nom.id;
      const selectedClass = isSelected ? 'border-4 border-yellow-500 bg-gray-700' : 'border border-gray-600 hover:bg-gray-700';

      nomineesHtml += `
                <div onclick="placeBet(${cat.id}, ${nom.id}, this)" 
                     class="cursor-pointer p-3 rounded mb-2 flex items-center gap-3 transition-all ${selectedClass}"
                     data-cat-id="${cat.id}"
                     data-nom-id="${nom.id}">
                    ${nom.image_url ? `<img src="${nom.image_url}" class="w-12 h-12 object-cover rounded-full">` : '<div class="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">?</div>'}
                    <div>
                        <p class="font-bold text-sm">${nom.movie ? nom.movie.title : nom.person_name}</p>
                        ${nom.person_name && nom.movie ? `<p class="text-xs text-gray-400">${nom.person_name}</p>` : ''}
                    </div>
                    ${isSelected ? '<span class="ml-auto text-yellow-500 text-xl">✓</span>' : ''}
                </div>
            `;
    });

    card.innerHTML = `
            <h3 class="text-xl font-bold mb-4 text-center border-b border-gray-600 pb-2">${cat.name}</h3>
            <div class="space-y-2">
                ${nomineesHtml}
            </div>
        `;
    container.appendChild(card);
  });
}

async function placeBet(categoryId, nomineeId, element) {
  const token = localStorage.getItem('token');

  // UI Optimistic Update
  // Deselect others in this category
  const parent = element.parentElement;
  Array.from(parent.children).forEach(child => {
    child.className = child.className.replace('border-4 border-yellow-500 bg-gray-700', 'border border-gray-600 hover:bg-gray-700');
    const check = child.querySelector('.ml-auto');
    if (check) check.remove();
  });

  // Select clicked
  element.className = element.className.replace('border border-gray-600 hover:bg-gray-700', 'border-4 border-yellow-500 bg-gray-700');
  if (!element.querySelector('.ml-auto')) {
    element.innerHTML += '<span class="ml-auto text-yellow-500 text-xl">✓</span>';
  }

  try {
    const response = await fetch(`${API_URL}/api/bets/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        category: categoryId,
        nominee: nomineeId
      })
    });

    if (!response.ok) {
      // If fails, maybe alert user?
      console.error('Bet failed');
    }
  } catch (err) {
    console.error('Error placing bet:', err);
  }
}
