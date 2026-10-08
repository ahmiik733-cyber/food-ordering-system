// Landing Page Logic (index.html)

let currentSearch = '';
let currentCuisine = '';
let currentMinRating = 0;

document.addEventListener('DOMContentLoaded', () => {
  loadCuisines();
  loadRestaurants();

  // Bind enter key on search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchRestaurants();
      }
    });
  }
});

// Load distinct cuisine options
async function loadCuisines() {
  try {
    const data = await api.get('/restaurants/cuisines');
    const container = document.getElementById('cuisine-pills');
    if (!container || !data || !data.cuisines) return;

    // Clear except the "All Cuisines" button
    container.innerHTML = `<button id="pill-all" class="btn btn-secondary btn-sm active-pill" onclick="filterCuisine('')" style="background-color: var(--primary); color: white;">All Cuisines</button>`;

    data.cuisines.forEach(cuisine => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary btn-sm';
      btn.textContent = cuisine;
      btn.onclick = () => filterCuisine(cuisine, btn);
      container.appendChild(btn);
    });
  } catch (err) {
    console.error('Failed to load cuisines list:', err);
  }
}

// Fetch restaurants from backend and populate cards grid
async function loadRestaurants() {
  const grid = document.getElementById('restaurants-grid');
  if (!grid) return;

  grid.innerHTML = `<div style="text-align: center; grid-column: 1/-1; padding: 40px; color: var(--text-secondary);">Loading restaurants...</div>`;

  try {
    const params = {};
    if (currentSearch) params.search = currentSearch;
    if (currentCuisine) params.cuisine = currentCuisine;
    if (currentMinRating > 0) params.rating = currentMinRating;

    const data = await api.get('/restaurants', params);
    if (!data || !data.restaurants || data.restaurants.length === 0) {
      grid.innerHTML = `
        <div style="text-align: center; grid-column: 1/-1; padding: 60px; color: var(--text-secondary);">
          <svg width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom: 12px; opacity: 0.5;"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.015a2.993 2.993 0 002.25 1.015c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.5a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75h-3.5a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z"></path></svg>
          <p style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">No restaurants found</p>
          <p style="font-size: 14px;">Try modifying your search query or filters.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    data.restaurants.forEach(rest => {
      const fallbackImg = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=60';
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="${rest.image_url || fallbackImg}" class="card-img" alt="${rest.name}">
        <div class="card-body">
          <h3 class="card-title">${rest.name}</h3>
          <p class="card-text">${rest.description || 'No description available.'}</p>
          <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span>${rest.address}</span>
          </div>
          <div class="card-meta">
            <span class="badge badge-info">${rest.cuisine_type || 'General'}</span>
            <div style="display: flex; align-items: center; gap: 4px; font-weight: 700; color: #eab308;">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
              <span>${parseFloat(rest.rating).toFixed(1)}</span>
            </div>
          </div>
          <button class="btn btn-outline" style="margin-top: 20px; width: 100%;" onclick="viewMenu(${rest.id})">View Menu</button>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<div style="text-align: center; grid-column: 1/-1; padding: 40px; color: var(--danger);">Failed to connect to backend server. Ensure API is running.</div>`;
    toast.error('Failed to load restaurants.');
  }
}

// Search field click triggers
function searchRestaurants() {
  const val = document.getElementById('search-input').value.trim();
  currentSearch = val;
  loadRestaurants();
}

// Cuisine pill triggers
function filterCuisine(cuisine, element) {
  currentCuisine = cuisine;
  
  // Highlight active pill
  const pills = document.querySelectorAll('#cuisine-pills button');
  pills.forEach(p => {
    p.style.backgroundColor = 'transparent';
    p.style.color = 'var(--text-secondary)';
  });

  if (element) {
    element.style.backgroundColor = 'var(--primary)';
    element.style.color = 'white';
  } else {
    const allBtn = document.getElementById('pill-all');
    if (allBtn) {
      allBtn.style.backgroundColor = 'var(--primary)';
      allBtn.style.color = 'white';
    }
  }

  loadRestaurants();
}

// Rating dropdown trigger
function filterRating() {
  currentMinRating = parseFloat(document.getElementById('rating-select').value) || 0;
  loadRestaurants();
}

// Redirect to restaurant menu page
function viewMenu(id) {
  window.location.href = `restaurant.html?id=${id}`;
}
