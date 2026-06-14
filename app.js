const BASE_URL = '/api';
const IMG_BASE = '/img/w500';

const searchInput   = document.getElementById('searchInput');
const searchBtn     = document.getElementById('searchBtn');
const moviesGrid    = document.getElementById('moviesGrid');
const loader        = document.getElementById('loader');
const noResults     = document.getElementById('noResults');
const pagination    = document.getElementById('pagination');
const prevBtn       = document.getElementById('prevBtn');
const nextBtn       = document.getElementById('nextBtn');
const pageInfo      = document.getElementById('pageInfo');
const sectionTitle  = document.getElementById('sectionTitle');
const heroSection   = document.getElementById('heroSection');
const themeToggle   = document.getElementById('themeToggle');
const genreFilters  = document.getElementById('genreFilters');
const tabs          = document.querySelectorAll('.tab');

let currentQuery   = '';
let currentPage    = 1;
let totalPages     = 1;
let currentSection = 'popular';
let currentGenre   = '';

// ===== Theme =====
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
  document.documentElement.classList.add('theme-transition');
  const cur  = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
  setTimeout(() => document.documentElement.classList.remove('theme-transition'), 300);
});

// ===== Genres =====
async function loadGenres() {
  try {
    const res  = await fetch(`${BASE_URL}/genre/movie/list?language=ru-RU`);
    const data = await res.json();
    (data.genres || []).forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'genre-btn';
      btn.dataset.genre = g.id;
      btn.textContent = g.name;
      btn.addEventListener('click', () => selectGenre(btn, g.id));
      genreFilters.appendChild(btn);
    });
  } catch (e) { console.error('Ошибка загрузки жанров:', e); }
}

function selectGenre(btn, genreId) {
  document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentGenre = genreId;
  currentPage  = 1;
  if (currentQuery) { currentQuery = ''; searchInput.value = ''; }
  heroSection && heroSection.classList.remove('hidden');
  document.getElementById('tabsSection').classList.remove('hidden');
  updateSectionTitle();
  loadMovies();
}

// ===== Tabs =====
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentSection = tab.dataset.section;
    currentPage    = 1;
    currentQuery   = '';
    currentGenre   = '';
    searchInput.value = '';
    document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.genre-btn[data-genre=""]').classList.add('active');
    heroSection && heroSection.classList.remove('hidden');
    updateSectionTitle();
    loadMovies();
  });
});

// ===== Search =====
searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

function doSearch() {
  const q = searchInput.value.trim().slice(0, 200);
  currentQuery = q;
  currentPage  = 1;
  currentGenre = '';
  document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.genre-btn[data-genre=""]').classList.add('active');
  if (q) {
    heroSection && heroSection.classList.add('hidden');
    document.getElementById('tabsSection').classList.add('hidden');
    sectionTitle.textContent = `Результаты по запросу: «${q}»`;
  } else {
    heroSection && heroSection.classList.remove('hidden');
    document.getElementById('tabsSection').classList.remove('hidden');
    updateSectionTitle();
  }
  loadMovies();
}

function updateSectionTitle() {
  const titles = {
    popular:    'Популярное прямо сейчас',
    top_rated:  'Топ рейтинга всех времён',
    now_playing:'Сейчас в кино',
    upcoming:   'Скоро в кино',
  };
  const genreLabel = currentGenre
    ? document.querySelector(`.genre-btn[data-genre="${currentGenre}"]`)?.textContent
    : '';
  sectionTitle.textContent = genreLabel
    ? `Жанр: ${genreLabel}`
    : (titles[currentSection] || 'Фильмы');
}

// ===== Fetch =====
async function fetchMovies(query, page = 1) {
  let endpoint;
  if (query) {
    endpoint = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}&language=ru-RU`;
  } else if (currentGenre) {
    endpoint = `${BASE_URL}/discover/movie?with_genres=${currentGenre}&sort_by=popularity.desc&page=${page}&language=ru-RU`;
  } else {
    endpoint = `${BASE_URL}/movie/${currentSection}?page=${page}&language=ru-RU`;
  }
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('Ошибка запроса');
  return res.json();
}

// ===== Render card =====
function renderCard(movie, delay = 0) {
  const card = document.createElement('a');
  card.className = 'movie-card fade-in';
  card.href      = `movie.html?id=${movie.id}`;
  card.style.animationDelay = `${delay * 0.05}s`;

  const year   = movie.release_date ? movie.release_date.slice(0, 4) : '—';
  const rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : '—';
  const poster = movie.poster_path
    ? `<img class="movie-poster" src="${IMG_BASE}${movie.poster_path}" alt="${movie.title}" loading="lazy" />`
    : `<div class="movie-poster-placeholder">🎬</div>`;

  card.innerHTML = `
    ${poster}
    <div class="movie-info">
      <div class="movie-title">${movie.title}</div>
      <div class="movie-year">${year}</div>
      <div class="movie-rating">⭐ ${rating}</div>
    </div>`;
  return card;
}

// ===== Load movies =====
async function loadMovies() {
  showLoader(true);
  moviesGrid.innerHTML = '';
  noResults.classList.add('hidden');
  pagination.classList.add('hidden');

  try {
    const data = await fetchMovies(currentQuery, currentPage);
    totalPages = Math.min(data.total_pages || 1, 500);
    if (!data.results || data.results.length === 0) {
      noResults.classList.remove('hidden');
    } else {
      data.results.forEach((movie, i) => moviesGrid.appendChild(renderCard(movie, i)));
      updatePagination(currentPage, totalPages);
    }
  } catch {
    noResults.textContent = 'Ошибка загрузки. Проверьте подключение.';
    noResults.classList.remove('hidden');
  } finally {
    showLoader(false);
  }
}

function updatePagination(page, total) {
  if (total <= 1) return;
  pagination.classList.remove('hidden');
  pageInfo.textContent = `Страница ${page} из ${total}`;
  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page >= total;
}

function showLoader(visible) {
  loader.classList.toggle('hidden', !visible);
}

prevBtn.addEventListener('click', () => {
  if (currentPage > 1) { currentPage--; loadMovies(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
});
nextBtn.addEventListener('click', () => {
  if (currentPage < totalPages) { currentPage++; loadMovies(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
});

// ===== Handle ?q= from other pages =====
const urlParams = new URLSearchParams(window.location.search);
const urlQuery  = urlParams.get('q');
if (urlQuery) {
  searchInput.value = urlQuery;
  doSearch();
} else {
  loadGenres();
  loadMovies();
}
