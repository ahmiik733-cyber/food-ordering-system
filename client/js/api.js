// Client API Handler Wrapper
const API_BASE_URL = 'http://localhost:3000/api';

const api = {
  // Common fetch wrapper
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Inject headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // If JWT token exists, inject it
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // If unauthorized, clear token and redirect (only on secure pages)
        if (response.status === 401 && !window.location.pathname.endsWith('auth.html')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = 'auth.html';
        }
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`🔴 API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  // HTTP GET
  async get(endpoint, params = {}) {
    let query = '';
    const keys = Object.keys(params);
    if (keys.length > 0) {
      query = '?' + keys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
    }
    return this.request(`${endpoint}${query}`, { method: 'GET' });
  },

  // HTTP POST
  async post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body
    });
  },

  // HTTP PUT
  async put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body
    });
  },

  // HTTP PATCH
  async patch(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body
    });
  },

  // HTTP DELETE
  async delete(endpoint, params = {}) {
    let query = '';
    const keys = Object.keys(params);
    if (keys.length > 0) {
      query = '?' + keys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
    }
    return this.request(`${endpoint}${query}`, { method: 'DELETE' });
  }
};

// Global exports
window.api = api;

// Common layout loader: Navbar state mapping
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});

function renderNavbar() {
  const navContainer = document.getElementById('navbar-container-hook');
  if (!navContainer) return;

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  let navLinks = `
    <li><a href="index.html" class="nav-link">Home</a></li>
  `;

  if (token && user) {
    if (user.role === 'customer') {
      navLinks += `
        <li><a href="cart.html" class="nav-link">Cart</a></li>
        <li><a href="delivery.html" class="nav-link">Order Status</a></li>
      `;
    } else if (user.role === 'owner') {
      navLinks += `
        <li><a href="owner-dashboard.html" class="nav-link">Owner Panel</a></li>
      `;
    } else if (user.role === 'delivery') {
      navLinks += `
        <li><a href="delivery.html" class="nav-link">Delivery Panel</a></li>
      `;
    } else if (user.role === 'admin') {
      navLinks += `
        <li><a href="admin-dashboard.html" class="nav-link">Admin Dashboard</a></li>
      `;
    }
  }

  let actions = '';
  if (token && user) {
    actions = `
      <div class="cart-badge-wrapper" style="margin-right: 15px; cursor: pointer;" onclick="window.location.href='cart.html'">
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
        <span id="nav-cart-count" class="cart-count">0</span>
      </div>
      <span style="font-weight: 600; color: var(--text-secondary); margin-right: 10px;">Hi, ${user.name}</span>
      <button class="btn btn-secondary btn-sm" onclick="logout()">Logout</button>
    `;
  } else {
    actions = `
      <button class="btn btn-secondary btn-sm" onclick="window.location.href='auth.html'">Login</button>
      <button class="btn btn-primary btn-sm" onclick="window.location.href='auth.html?register=true'">Sign Up</button>
    `;
  }

  navContainer.innerHTML = `
    <a href="index.html" class="logo">
      QuickBites<span class="logo-dot">.</span>
    </a>
    <ul class="nav-links">
      ${navLinks}
    </ul>
    <div class="nav-actions">
      ${actions}
    </div>
  `;

  // Apply active class based on page
  const pathname = window.location.pathname;
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (pathname.includes(href)) {
      link.classList.add('active');
    }
  });

  // Load cart count for customer badge
  if (token && user && user.role === 'customer') {
    updateNavCartCount();
  } else {
    const badge = document.querySelector('.cart-badge-wrapper');
    if (badge) badge.style.display = 'none';
  }
}

async function updateNavCartCount() {
  try {
    const data = await api.get('/cart');
    const badge = document.getElementById('nav-cart-count');
    if (badge && data && data.items) {
      let count = 0;
      data.items.forEach(i => count += i.quantity);
      badge.textContent = count;
    }
  } catch (err) {
    console.error('Failed to update cart badge count:', err);
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

window.logout = logout;
window.updateNavCartCount = updateNavCartCount;
