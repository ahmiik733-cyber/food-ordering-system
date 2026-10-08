// Restaurant detail and menu handling (restaurant.html)

let selectedRating = 0;
let restaurantId = null;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  restaurantId = params.get('id');

  if (!restaurantId) {
    window.location.href = 'index.html';
    return;
  }

  // Load reviews/unauth check
  const token = localStorage.getItem('token');
  if (!token) {
    document.getElementById('review-form-hook').style.display = 'none';
    document.getElementById('review-form-unauth').style.display = 'block';
  }

  loadRestaurantDetail();
  loadRestaurantMenu();
  loadRestaurantReviews();
  selectStar(5); // Default review star
});

// Load restaurant headers
async function loadRestaurantDetail() {
  try {
    const data = await api.get(`/restaurants/${restaurantId}`);
    if (data && data.restaurant) {
      const rest = data.restaurant;
      document.getElementById('rest-name').textContent = rest.name;
      document.getElementById('rest-desc').textContent = rest.description || 'No description available.';
      document.getElementById('rest-cuisine').textContent = rest.cuisine_type || 'General';
      document.getElementById('rest-rating').textContent = parseFloat(rest.rating).toFixed(1) + ' ★';
      document.getElementById('rest-address').textContent = rest.address;
      
      // Update background banner if image is valid
      if (rest.image_url) {
        document.querySelector('.restaurant-header').style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('${rest.image_url}')`;
      }
    }
  } catch (err) {
    toast.error('Failed to load restaurant profile.');
  }
}

// Fetch categories and food items
async function loadRestaurantMenu() {
  const categoriesList = document.getElementById('menu-categories-list');
  const itemsSection = document.getElementById('menu-items-section');

  try {
    const data = await api.get(`/food/menu/${restaurantId}`);
    
    if (!data || !data.menu || Object.keys(data.menu).length === 0) {
      itemsSection.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-secondary);">No menu items available for this restaurant.</div>`;
      return;
    }

    // Clear loading elements
    categoriesList.innerHTML = `<h3 style="font-size: 14px; margin-bottom: 12px; color: var(--text-secondary); text-transform: uppercase;">Categories</h3>`;
    itemsSection.innerHTML = '';

    const categories = Object.keys(data.menu);

    categories.forEach((catName, index) => {
      // 1. Add sidebar category link
      const catId = data.menu[catName].categoryId;
      const catSlug = `cat-${catId}`;
      
      const link = document.createElement('a');
      link.className = `category-link ${index === 0 ? 'active' : ''}`;
      link.textContent = catName;
      link.onclick = () => {
        // Highlight active category
        document.querySelectorAll('.category-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        // Smooth scroll to element
        document.getElementById(catSlug).scrollIntoView({ behavior: 'smooth' });
      };
      categoriesList.appendChild(link);

      // 2. Add header and food items
      const categoryContainer = document.createElement('div');
      categoryContainer.id = catSlug;
      categoryContainer.style.scrollMarginTop = '100px';
      categoryContainer.innerHTML = `<h2 style="font-size: 24px; border-bottom: 2px solid var(--border); padding-bottom: 8px; margin-bottom: 20px; margin-top: ${index === 0 ? '0' : '40px'};">${catName}</h2>`;

      data.menu[catName].items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-item-card';

        const fallbackImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60';
        
        itemCard.innerHTML = `
          <img src="${item.imageUrl || fallbackImg}" class="menu-item-img" alt="${item.name}">
          <div class="menu-item-details">
            <h3 style="font-size: 18px;">${item.name}</h3>
            <p style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;">${item.description || 'No description available.'}</p>
            <div class="menu-item-price">Rs. ${parseFloat(item.price).toFixed(2)}</div>
          </div>
          <div style="display: flex; flex-direction: column; justify-content: center; gap: 8px; align-items: flex-end;">
            ${item.isAvailable ? `
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <label for="qty-${item.id}" style="font-size: 12px; color: var(--text-secondary);">Qty:</label>
                <input type="number" id="qty-${item.id}" value="1" min="1" max="10" class="form-input" style="width: 60px; padding: 4px 8px; text-align: center;">
              </div>
              <button class="btn btn-primary btn-sm" onclick="addItemToCart(${item.id})">Add to Cart</button>
            ` : `
              <span class="badge badge-danger">Sold Out</span>
            `}
          </div>
        `;
        categoryContainer.appendChild(itemCard);
      });

      itemsSection.appendChild(categoryContainer);
    });
  } catch (err) {
    toast.error('Failed to load menu items.');
  }
}

// Add item to database cart
async function addItemToCart(foodItemId) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!token || !user) {
    toast.warning('Please login to add items to your cart.');
    setTimeout(() => {
      window.location.href = 'auth.html';
    }, 1000);
    return;
  }

  if (user.role !== 'customer') {
    toast.error('Only customers can place orders.');
    return;
  }

  const qtyInput = document.getElementById(`qty-${foodItemId}`);
  const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

  try {
    await api.post('/cart/add', { foodItemId, quantity });
    toast.success('Added item to cart!');
    updateNavCartCount(); // Trigger navbar cart sync
  } catch (err) {
    toast.error(err.message || 'Failed to add item to cart.');
  }
}

// Fetch Reviews
async function loadRestaurantReviews() {
  const container = document.getElementById('reviews-list-hook');
  try {
    const data = await api.get(`/reviews/restaurant/${restaurantId}`);
    
    if (!data || !data.reviews || data.reviews.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-secondary);">No reviews yet. Be the first to share your thoughts!</div>`;
      return;
    }

    container.innerHTML = '';
    data.reviews.forEach(rev => {
      const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
      const date = new Date(rev.created_at).toLocaleDateString();
      const div = document.createElement('div');
      div.className = 'card';
      div.style.padding = '20px';
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <strong>${rev.user_name}</strong>
          <span style="color: var(--text-light); font-size:12px;">${date}</span>
        </div>
        <div style="color: #eab308; font-weight:700; margin-bottom:8px;">${stars}</div>
        <p style="color: var(--text-secondary); font-size:14px;">${rev.comment || 'No comment provided.'}</p>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error('Failed to load reviews:', err);
  }
}

// Highlight stars selector in reviews form
function selectStar(num) {
  selectedRating = num;
  const stars = document.querySelectorAll('.star-rating');
  stars.forEach(star => {
    const sNum = parseInt(star.getAttribute('data-star'));
    if (sNum <= num) {
      star.style.color = '#eab308';
    } else {
      star.style.color = 'var(--text-light)';
    }
  });
}

// Post feedback to reviews table
async function submitReview(e) {
  e.preventDefault();
  const comment = document.getElementById('review-comment').value.trim();

  if (selectedRating === 0) {
    toast.warning('Please select a star rating.');
    return;
  }

  try {
    await api.post('/reviews', {
      restaurantId,
      rating: selectedRating,
      comment
    });

    toast.success('Thank you for your review!');
    document.getElementById('review-comment').value = '';
    
    // Refresh ratings header and reviews list
    loadRestaurantDetail();
    loadRestaurantReviews();
  } catch (err) {
    toast.error(err.message || 'Failed to submit review.');
  }
}

// Switch menu/reviews tabs
function switchRestaurantTab(tab) {
  const menuTab = document.getElementById('tab-btn-menu');
  const reviewsTab = document.getElementById('tab-btn-reviews');
  const menuSec = document.getElementById('section-menu');
  const reviewsSec = document.getElementById('section-reviews');

  if (tab === 'menu') {
    menuTab.style.color = 'var(--primary)';
    menuTab.style.borderBottom = '3px solid var(--primary)';
    reviewsTab.style.color = 'var(--text-secondary)';
    reviewsTab.style.borderBottom = 'none';
    menuSec.classList.add('active');
    reviewsSec.classList.remove('active');
  } else {
    reviewsTab.style.color = 'var(--primary)';
    reviewsTab.style.borderBottom = '3px solid var(--primary)';
    menuTab.style.color = 'var(--text-secondary)';
    menuTab.style.borderBottom = 'none';
    reviewsSec.classList.add('active');
    menuSec.classList.remove('active');
  }
}

window.addItemToCart = addItemToCart;
window.selectStar = selectStar;
window.submitReview = submitReview;
window.switchRestaurantTab = switchRestaurantTab;
