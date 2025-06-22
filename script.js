
let currentSearch = "";
let currentPage = 1;

const resultDiv = document.getElementById('movieResult');
const loader = document.getElementById('loader');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const apiKey = '86a59dab'; // Your OMDb API key

// Render star rating
function renderStars(rating) {
  const stars = Math.round(parseFloat(rating) / 2);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

// Main movie search
async function searchMovie(reset = true) {
  const movieName = reset ? document.getElementById('searchInput').value.trim() : currentSearch;
  const minRating = parseFloat(document.getElementById('ratingFilter').value);

  if (reset) {
    resultDiv.innerHTML = "";
    currentPage = 1;
    currentSearch = movieName;
  }

  if (!movieName) {
    resultDiv.innerHTML = `<p>Please enter a movie name.</p>`;
    return;
  }

  loader.style.display = 'block';
  loadMoreBtn.style.display = 'none';

  const url = `https://www.omdbapi.com/?s=${encodeURIComponent(movieName)}&page=${currentPage}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    loader.style.display = 'none';

    if (data.Response === "True") {
      const filteredMovies = [];

      for (const movie of data.Search) {
        const detailResponse = await fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${apiKey}`);
        const fullData = await detailResponse.json();

        const imdbRating = parseFloat(fullData.imdbRating);
        if (!isNaN(imdbRating) && imdbRating >= minRating) {
          filteredMovies.push(fullData);
        }
      }

      renderMovies(filteredMovies);
      updateSearchHistory(movieName);
      loadMoreBtn.style.display = (currentPage * 10 < parseInt(data.totalResults)) ? 'block' : 'none';
      currentPage++;
    } else {
      if (reset) resultDiv.innerHTML = `<p>No movies found.</p>`;
    }
  } catch (err) {
    loader.style.display = 'none';
    resultDiv.innerHTML = `<p>Error fetching data. Try again later.</p>`;
  }
}

// Render movie cards
function renderMovies(movies) {
  resultDiv.innerHTML += movies.map(movie => `
    <div class="movie-card">
      <img src="${movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/150x220'}" onclick="showMovieDetails('${movie.imdbID}')" />
      <p><strong>${movie.Title}</strong> (${movie.Year})</p>
      <p>${renderStars(movie.imdbRating)} <span style="font-size: 0.9em">(${movie.imdbRating})</span></p>
      <button onclick="addToWatchlist('${movie.imdbID}', '${movie.Title.replace(/'/g, "\\'")}', '${movie.Poster}')">➕ Watch Later</button>
    </div>
  `).join('');
}


// Show full movie info in modal
async function showMovieDetails(imdbID) {
  const response = await fetch(`https://www.omdbapi.com/?i=${imdbID}&apikey=${apiKey}`);
  const data = await response.json();

  const html = `
    <h2>${data.Title} (${data.Year})</h2>
    <img src="${data.Poster !== "N/A" ? data.Poster : 'https://via.placeholder.com/300x440'}" style="width:200px; float:right; margin-left:20px;" />
    <p><strong>IMDb Rating:</strong> ${renderStars(data.imdbRating)} (${data.imdbRating})</p>
    <p><strong>Genre:</strong> ${data.Genre}</p>
    <p><strong>Runtime:</strong> ${data.Runtime}</p>
    <p><strong>Director:</strong> ${data.Director}</p>
    <p><strong>Actors:</strong> ${data.Actors}</p>
    <p><strong>Plot:</strong> ${data.Plot}</p>
    <div style="clear: both;"></div>
  `;

  document.getElementById('modalDetails').innerHTML = html;
  document.getElementById('movieModal').style.display = 'block';
}

// Modal close logic
window.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.querySelector(".close-btn");
  const modal = document.getElementById("movieModal");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  });
});

// Search on Enter key
document.getElementById('searchInput').addEventListener('keyup', function (event) {
  if (event.key === 'Enter') {
    searchMovie(true);
  }
});

// Filter by IMDb rating
document.getElementById('ratingFilter').addEventListener('change', () => {
  if (currentSearch) searchMovie(true);
});

// Load more button
loadMoreBtn.addEventListener('click', () => searchMovie(false));

// Search history logic
function updateSearchHistory(movieName) {
  let history = JSON.parse(localStorage.getItem('movieHistory')) || [];

  history = history.filter(item => item.toLowerCase() !== movieName.toLowerCase());
  history.unshift(movieName);
  if (history.length > 5) history = history.slice(0, 5);

  localStorage.setItem('movieHistory', JSON.stringify(history));
  renderSearchHistory();
}

function renderSearchHistory() {
  const history = JSON.parse(localStorage.getItem('movieHistory')) || [];
  const historyButtons = document.getElementById('historyButtons');
  historyButtons.innerHTML = '';

  history.forEach(movie => {
    const btn = document.createElement('button');
    btn.textContent = movie;
    btn.onclick = () => {
      document.getElementById('searchInput').value = movie;
      searchMovie(true);
    };
    historyButtons.appendChild(btn);
  });
}

// Show trending on load
const trendingKeywords = ["Avengers", "Batman", "Spider", "Fast", "Oppenheimer"];
const randomTrending = trendingKeywords[Math.floor(Math.random() * trendingKeywords.length)];

window.addEventListener('load', () => {
  document.getElementById('searchInput').value = randomTrending;
  searchMovie(true);
  renderSearchHistory();
});
function addToWatchlist(id, title, poster) {
  let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
  const exists = watchlist.some(item => item.id === id);
  if (!exists) {
    watchlist.push({ id, title, poster });
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    renderWatchlist();
  }
}

function removeFromWatchlist(id) {
  let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
  watchlist = watchlist.filter(item => item.id !== id);
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  renderWatchlist();
}

function renderWatchlist() {
  const watchlistDiv = document.getElementById('watchlist');
  const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

  if (watchlist.length === 0) {
    watchlistDiv.innerHTML = "<p>No movies in Watch Later list.</p>";
    return;
  }

  watchlistDiv.innerHTML = `<h2>📋 Watch Later</h2>` + 
    watchlist.map(movie => `
      <div class="watch-item">
        <img src="${movie.poster}" />
        <div>
          <strong>${movie.title}</strong><br/>
          <button onclick="removeFromWatchlist('${movie.id}')">❌ Remove</button>
        </div>
      </div>
    `).join('');
}

// Load watchlist on page load
window.addEventListener('load', () => {
  renderWatchlist();
});
