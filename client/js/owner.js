// Restaurant Owner Dashboard Logic (owner-dashboard.html)

let currentRestaurantId = null;
let currentTab = 'profile';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user || user.role !== 'owner') {
    window.location.href = 'auth.html';
    return;
  }

  loadRestaurantProfile();
});

// Switch visible tabs on owner dashboard
function switchDashboardTab(tab) {
  currentTab = tab;
  
  // Update buttons highlight state
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`btn-tab-${tab}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Toggle views
  document.querySelectorAll('.owner-tab-view').forEach(v => {
    v.classList.remove('active');
  });
  document.getElementById(`view-${tab}`).classList.add('active');

  // Trigger loads based on active tab
  if (tab === 'menu' && currentRestaurantId) {
    loadMenuManager();
    loadCategoriesDropdown();
  } else if (tab === 'orders' && currentRestaurantId) {
    loadIncomingOrders();
  }
}

// Fetch owned restaurant details
async function loadRestaurantProfile() {
  const alertBox = document.getElementById('no-restaurant-alert');
  const submitBtn = document.getElementById('profile-submit-btn');

  try {
    const data = await api.get('/restaurants/owner/my');
    
    // Disable Menu and Orders tabs until restaurant is created
    const menuBtn = document.getElementById('btn-tab-menu');
    const ordersBtn = document.getElementById('btn-tab-orders');

    if (!data || !data.restaurants || data.restaurants.length === 0) {
      alertBox.style.display = 'block';
      submitBtn.textContent = 'Create Restaurant Profile';
      
      menuBtn.style.pointerEvents = 'none';
      menuBtn.style.opacity = '0.5';
      ordersBtn.style.pointerEvents = 'none';
      ordersBtn.style.opacity = '0.5';
      
      document.getElementById('add-item-btn-hook').disabled = true;
      return;
    }

    // Enable tabs
    alertBox.style.display = 'none';
    submitBtn.textContent = 'Save Profile Settings';
    menuBtn.style.pointerEvents = 'auto';
    menuBtn.style.opacity = '1';
    ordersBtn.style.pointerEvents = 'auto';
    ordersBtn.style.opacity = '1';
    document.getElementById('add-item-btn-hook').disabled = false;

    // Load first restaurant owned
    const rest = data.restaurants[0];
    currentRestaurantId = rest.id;
    
    document.getElementById('profile-rest-id').value = rest.id;
    document.getElementById('profile-name').value = rest.name;
    document.getElementById('profile-cuisine').value = rest.cuisine_type || '';
    document.getElementById('profile-phone').value = rest.phone;
    document.getElementById('profile-desc').value = rest.description || '';
    document.getElementById('profile-address').value = rest.address;
    document.getElementById('profile-img').value = rest.image_url || '';

    // If initial tab matches other values, load them
    if (currentTab === 'menu') loadMenuManager();
    if (currentTab === 'orders') loadIncomingOrders();
  } catch (err) {
    // Don't redirect on error — show a friendly message instead
    console.error('Owner profile load error:', err);
    alertBox.style.display = 'block';
    alertBox.innerHTML = `<strong>Error loading profile:</strong> ${err.message || 'Could not reach the server. Make sure you are logged in as an owner.'}`;
  }
}

// Update or Create restaurant profile
async function saveProfileSettings(e) {
  e.preventDefault();
  const restId = document.getElementById('profile-rest-id').value;
  const name = document.getElementById('profile-name').value.trim();
  const cuisineType = document.getElementById('profile-cuisine').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();
  const description = document.getElementById('profile-desc').value.trim();
  const address = document.getElementById('profile-address').value.trim();
  const imageUrl = document.getElementById('profile-img').value.trim();

  const payload = { name, cuisineType, phone, description, address, imageUrl };

  try {
    if (restId) {
      // Update existing
      await api.put(`/restaurants/${restId}`, payload);
      toast.success('Restaurant profile updated successfully.');
    } else {
      // Create new (starts as pending admin approval)
      await api.post('/restaurants', payload);
      toast.success('Restaurant registered! Awaiting admin approval.');
    }
    loadRestaurantProfile();
  } catch (err) {
    toast.error(err.message || 'Failed to save settings.');
  }
}

// ============ MENU MANAGEMENT WORKFLOWS ============

async function loadMenuManager() {
  const tbody = document.getElementById('owner-menu-rows');
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Loading menu catalog...</td></tr>`;

  try {
    const data = await api.get(`/food/menu/${currentRestaurantId}`);
    
    if (!data || !data.menu || Object.keys(data.menu).length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-secondary);">No menu items added yet. Click Add Food Item to get started.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    
    // Iterate over categorized menu JSON
    Object.keys(data.menu).forEach(catName => {
      data.menu[catName].items.forEach(item => {
        // MySQL returns is_available as 0/1 integer — coerce to boolean
        const isAvail = !!item.isAvailable;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${item.name}</strong><br><span style="font-size:12px; color:var(--text-light);">${item.description || ''}</span></td>
          <td>${catName}</td>
          <td>Rs. ${parseFloat(item.price).toFixed(2)}</td>
          <td>
            <span class="badge ${isAvail ? 'badge-success' : 'badge-danger'}">
              ${isAvail ? 'Available' : 'Sold Out'}
            </span>
          </td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary btn-sm" onclick="toggleAvailability(${item.id}, ${isAvail})">
                ${isAvail ? 'Deactivate' : 'Activate'}
              </button>
              <button class="btn btn-secondary btn-sm" style="color: var(--accent); border-color: var(--border);" onclick="openEditFoodModal(${JSON.stringify(item).replace(/"/g, '&quot;')}, ${data.menu[catName].categoryId})">
                Edit
              </button>
              <button class="btn btn-secondary btn-sm" style="color: var(--danger); border-color: var(--border);" onclick="deleteFoodItem(${item.id})">
                Delete
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    });
  } catch (err) {
    toast.error('Failed to load menu items.');
  }
}

// Fetch categories and populate modal select dropdown
async function loadCategoriesDropdown() {
  const select = document.getElementById('food-category-select');
  try {
    const data = await api.get(`/food/categories/${currentRestaurantId}`);
    select.innerHTML = '';
    
    if (!data || !data.categories || data.categories.length === 0) {
      select.innerHTML = '<option value="">No categories. Add one first!</option>';
      return;
    }

    data.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load categories dropdown:', err);
  }
}

// Toggle modals
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// Category add workflow
function openAddCategoryModal() {
  document.getElementById('new-category-name').value = '';
  openModal('add-category-modal');
}

async function submitCategory() {
  const name = document.getElementById('new-category-name').value.trim();
  if (!name) {
    toast.warning('Category name is required.');
    return;
  }

  try {
    await api.post('/food/category', { restaurantId: currentRestaurantId, name });
    toast.success('Category added!');
    closeModal('add-category-modal');
    loadCategoriesDropdown();
  } catch (err) {
    toast.error(err.message || 'Failed to add category.');
  }
}

// Food Item add/edit workflow
function openAddFoodModal() {
  document.getElementById('food-modal-title').textContent = 'Add Menu Item';
  document.getElementById('food-item-id').value = '';
  document.getElementById('food-name').value = '';
  document.getElementById('food-price').value = '';
  document.getElementById('food-desc').value = '';
  document.getElementById('food-img').value = '';
  document.getElementById('food-available').checked = true;
  openModal('food-modal');
}

function openEditFoodModal(item, categoryId) {
  document.getElementById('food-modal-title').textContent = 'Edit Menu Item';
  document.getElementById('food-item-id').value = item.id;
  document.getElementById('food-name').value = item.name;
  document.getElementById('food-price').value = item.price;
  document.getElementById('food-desc').value = item.description || '';
  document.getElementById('food-img').value = item.imageUrl || '';
  // MySQL returns 0/1 — coerce to boolean for checkbox
  document.getElementById('food-available').checked = !!item.isAvailable;
  
  // Set category dropdown value
  document.getElementById('food-category-select').value = categoryId;
  openModal('food-modal');
}

async function submitFoodItem() {
  const itemId = document.getElementById('food-item-id').value;
  const name = document.getElementById('food-name').value.trim();
  const categoryId = document.getElementById('food-category-select').value;
  const price = parseFloat(document.getElementById('food-price').value);
  const description = document.getElementById('food-desc').value.trim();
  const imageUrl = document.getElementById('food-img').value.trim();
  const isAvailable = document.getElementById('food-available').checked;

  if (!name || isNaN(price) || !categoryId) {
    toast.warning('Please provide item name, category, and valid price.');
    return;
  }

  const payload = {
    name,
    categoryId,
    price,
    description,
    imageUrl,
    isAvailable,
    restaurantId: currentRestaurantId
  };

  try {
    if (itemId) {
      await api.put(`/food/item/${itemId}`, payload);
      toast.success('Menu item updated.');
    } else {
      await api.post('/food/item', payload);
      toast.success('Menu item added.');
    }
    closeModal('food-modal');
    loadMenuManager();
  } catch (err) {
    toast.error(err.message || 'Failed to save menu item.');
  }
}

async function toggleAvailability(id, currentStatus) {
  try {
    await api.patch(`/food/item/${id}/availability`, {
      isAvailable: !currentStatus,
      restaurantId: currentRestaurantId
    });
    toast.success('Availability toggled.');
    loadMenuManager();
  } catch (err) {
    toast.error('Failed to toggle availability.');
  }
}

async function deleteFoodItem(id) {
  if (!confirm('Are you sure you want to delete this menu item?')) return;
  try {
    await api.delete(`/food/item/${id}`, { restaurantId: currentRestaurantId });
    toast.success('Menu item deleted.');
    loadMenuManager();
  } catch (err) {
    toast.error('Failed to delete item.');
  }
}

// ============ INCOMING ORDERS WORKFLOWS ============

async function loadIncomingOrders() {
  const tbody = document.getElementById('owner-orders-rows');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Loading incoming orders...</td></tr>`;

  try {
    const data = await api.get(`/orders/restaurant/${currentRestaurantId}`);
    
    if (!data || !data.orders || data.orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-secondary);">No orders received yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    data.orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleString();
      const tr = document.createElement('tr');
      
      let actionBtn = '';
      if (order.status === 'placed') {
        actionBtn = `<button class="btn btn-primary btn-sm" onclick="openDriverAssignModal(${order.id})">Accept & Assign</button>`;
      } else if (order.status === 'preparing') {
        actionBtn = `<button class="btn btn-secondary btn-sm" style="color: var(--primary); border-color: var(--primary);" onclick="markOrderReady(${order.id})">Mark Ready / Out</button>`;
      } else {
        actionBtn = `<span style="font-size:12px; color:var(--text-light);">No actions needed</span>`;
      }

      tr.innerHTML = `
        <td><strong>#${order.id}</strong></td>
        <td>${order.user_name}</td>
        <td style="font-weight:700;">Rs. ${parseFloat(order.total_amount).toFixed(2)}</td>
        <td style="font-size:12px; color:var(--text-secondary);">${date}</td>
        <td>
          <span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span>
        </td>
        <td>${actionBtn}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    toast.error('Failed to load incoming orders.');
  }
}

function getStatusBadgeClass(status) {
  if (status === 'placed') return 'badge-info';
  if (status === 'preparing') return 'badge-warning';
  if (status === 'out_for_delivery') return 'badge-warning';
  if (status === 'delivered') return 'badge-success';
  return 'badge-danger';
}

// Assignment modal workflows
async function openDriverAssignModal(orderId) {
  document.getElementById('assign-order-id').value = orderId;
  const select = document.getElementById('driver-select');
  select.innerHTML = '<option>Loading available agents...</option>';

  try {
    const data = await api.get('/deliveries/staff/available');
    select.innerHTML = '';
    
    if (!data || !data.staff || data.staff.length === 0) {
      select.innerHTML = '<option value="">No available drivers. Mark ready anyway?</option>';
    } else {
      data.staff.forEach(staff => {
        const opt = document.createElement('option');
        opt.value = staff.user_id;
        opt.textContent = `${staff.name} (${staff.vehicle_type || 'bike'})`;
        select.appendChild(opt);
      });
    }

    openModal('assign-driver-modal');
  } catch (err) {
    toast.error('Failed to load drivers list.');
  }
}

async function submitAssignment() {
  const orderId = document.getElementById('assign-order-id').value;
  const driverId = document.getElementById('driver-select').value;

  if (!driverId) {
    // If no driver, fall back to setting preparing without driver
    await markOrderPreparing(orderId);
    closeModal('assign-driver-modal');
    return;
  }

  try {
    await api.post('/deliveries/assign', {
      orderId,
      deliveryStaffId: driverId,
      estimatedMinutes: 30
    });
    toast.success('Order accepted! Driver assigned and notified.');
    closeModal('assign-driver-modal');
    loadIncomingOrders();
  } catch (err) {
    toast.error('Assignment failed.');
  }
}

async function markOrderPreparing(orderId) {
  try {
    await api.put(`/orders/${orderId}/status`, { status: 'preparing' });
    toast.success('Order status updated to: preparing.');
    loadIncomingOrders();
  } catch (err) {
    toast.error('Failed to update order status.');
  }
}

async function markOrderReady(orderId) {
  try {
    // Sets order status to out_for_delivery (or changes delivery status to picked_up depending on structure)
    // We will set order status to out_for_delivery directly
    await api.put(`/orders/${orderId}/status`, { status: 'out_for_delivery' });
    toast.success('Order marked as out for delivery!');
    loadIncomingOrders();
  } catch (err) {
    toast.error('Failed to update status.');
  }
}

window.switchDashboardTab = switchDashboardTab;
window.saveProfileSettings = saveProfileSettings;
window.submitCategory = submitCategory;
window.submitFoodItem = submitFoodItem;
window.openAddCategoryModal = openAddCategoryModal;
window.openAddFoodModal = openAddFoodModal;
window.openEditFoodModal = openEditFoodModal;
window.deleteFoodItem = deleteFoodItem;
window.toggleAvailability = toggleAvailability;
window.openDriverAssignModal = openDriverAssignModal;
window.submitAssignment = submitAssignment;
window.markOrderReady = markOrderReady;
window.closeModal = closeModal;
