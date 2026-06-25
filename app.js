const API_BASE = '/api';
const IMG_BASE = '/img';

const searchInput  = document.getElementById('searchInput');
const searchBtn    = document.getElementById('searchBtn');
const moviesGrid   = document.getElementById('moviesGrid');
const loader       = document.getElementById('loader');
const noResults    = document.getElementById('noResults');
const pagination   = document.getElementById('pagination');
const prevBtn      = document.getElementById('prevBtn');
const nextBtn      = document.getElementById('nextBtn');
const pageInfo     = document.getElementById('pageInfo');
const sectionTitle = document.getElementById('sectionTitle');
const heroSection  = document.getElementById('heroSection');
const themeToggle  = document.getElementById('themeToggle');
const genreFilters = document.getElementById('genreFilters');
const tabs         = document.querySelectorAll('.tab');

let currentQuery   = '';
let currentPage    = 1;
let totalPages     = 1;
let currentSection = 'popular';
let currentGenreId = '';

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
    const res  = await fetch(`${API_BASE}/genre/movie/list?language=ru-RU`);
    const data = await res.json();
    (data.genres || []).forEach(g => {
      const btn = document.createElement('button');
      btn.className     = 'genre-btn';
      btn.dataset.genre = g.id;
      btn.textContent   = g.name;
      btn.addEventListener('click', () => selectGenre(btn, g.id));
      genreFilters.appendChild(btn);
    });
  } catch {}
}

function selectGenre(btn, genreId) {
  document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentGenreId = genreId;
  currentPage    = 1;
  if (currentQuery) { currentQuery = ''; searchInput.value = ''; }
  heroSection?.classList.remove('hidden');
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
    currentGenreId = '';
    searchInput.value = '';
    document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.genre-btn[data-genre=""]').classList.add('active');
    heroSection?.classList.remove('hidden');
    updateSectionTitle();
    loadMovies();
  });
});

// ===== Search =====
searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

function doSearch() {
  const q = searchInput.value.trim().slice(0, 200);
  currentQuery   = q;
  currentPage    = 1;
  currentGenreId = '';
  document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.genre-btn[data-genre=""]').classList.add('active');
  if (q) {
    heroSection?.classList.add('hidden');
    document.getElementById('tabsSection').classList.add('hidden');
    sectionTitle.textContent = `Результаты по запросу: «${q}»`;
  } else {
    heroSection?.classList.remove('hidden');
    document.getElementById('tabsSection').classList.remove('hidden');
    updateSectionTitle();
  }
  loadMovies();
}

function updateSectionTitle() {
  const titles = {
    popular:     'Популярное прямо сейчас',
    top_rated:   'Топ рейтинга всех времён',
    now_playing: 'Сейчас в кино',
    upcoming:    'Скоро в кино',
  };
  const genreBtn = currentGenreId
    ? document.querySelector(`.genre-btn[data-genre="${currentGenreId}"]`)
    : null;
  sectionTitle.textContent = genreBtn
    ? `Жанр: ${genreBtn.textContent}`
    : (titles[currentSection] || 'Фильмы');
}

// ===== TMDB API =====
async function fetchMovies(query, page = 1) {
  const lang = 'language=ru-RU&region=RU';

  if (query) {
    const res = await fetch(`${API_BASE}/search/movie?query=${encodeURIComponent(query)}&${lang}&page=${page}`);
    if (!res.ok) throw new Error();
    return res.json();
  }

  if (currentGenreId) {
    const sortMap = {
      popular:     'popularity.desc',
      top_rated:   'vote_average.desc',
      now_playing: 'popularity.desc',
      upcoming:    'primary_release_date.desc',
    };
    const sort       = sortMap[currentSection] || 'popularity.desc';
    const voteFilter = currentSection === 'top_rated' ? '&vote_count.gte=1000' : '';
    const res = await fetch(`${API_BASE}/discover/movie?with_genres=${currentGenreId}&${lang}&sort_by=${sort}&page=${page}${voteFilter}`);
    if (!res.ok) throw new Error();
    return res.json();
  }

  const res = await fetch(`${API_BASE}/movie/${currentSection}?${lang}&page=${page}`);
  if (!res.ok) throw new Error();
  return res.json();
}

// ===== Render card =====
function renderCard(movie, delay = 0) {
  const card = document.createElement('a');
  card.className = 'movie-card fade-in';
  card.href      = `movie.html?id=${movie.id}`;
  card.style.animationDelay = `${delay * 0.05}s`;

  const title  = movie.title || movie.original_title || 'Без названия';
  const year   = movie.release_date ? movie.release_date.split('-')[0] : '—';
  const rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : '—';
  const poster = movie.poster_path
    ? `<img class="movie-poster" src="${IMG_BASE}/w300${movie.poster_path}" alt="${title}" loading="lazy" />`
    : `<div class="movie-poster-placeholder">🎬</div>`;

  card.innerHTML = `
    ${poster}
    <div class="movie-info">
      <div class="movie-title">${title}</div>
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
