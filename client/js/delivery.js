// Delivery tracking and courier dashboard logic (delivery.html)

let trackingInterval = null;
let bikeAnimationInterval = null;
let currentOrderId = null;

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    window.location.href = 'auth.html';
    return;
  }

  // Toggle visible pane based on roles
  if (user.role === 'delivery') {
    document.getElementById('view-customer').classList.remove('active');
    document.getElementById('view-delivery').classList.add('active');
    loadDriverDashboard();
  } else {
    document.getElementById('view-customer').classList.add('active');
    document.getElementById('view-delivery').classList.remove('active');
    
    const params = new URLSearchParams(window.location.search);
    currentOrderId = params.get('id');
    
    initCustomerTracking();
  }
});

// ================= CUSTOMER TRACKING WORKFLOW =================

async function initCustomerTracking() {
  if (!currentOrderId) {
    // Attempt to locate most recent order
    try {
      const data = await api.get('/auth/orders');
      if (data && data.orders && data.orders.length > 0) {
        currentOrderId = data.orders[0].id;
      } else {
        document.getElementById('no-active-order-view').style.display = 'block';
        document.getElementById('active-tracking-view').style.display = 'none';
        return;
      }
    } catch (err) {
      console.error(err);
      document.getElementById('no-active-order-view').style.display = 'block';
      document.getElementById('active-tracking-view').style.display = 'none';
      return;
    }
  }

  document.getElementById('no-active-order-view').style.display = 'none';
  document.getElementById('active-tracking-view').style.display = 'grid';

  // Perform initial load and start polling every 5 seconds
  loadTrackingDetails();
  trackingInterval = setInterval(loadTrackingDetails, 5000);
}

async function loadTrackingDetails() {
  try {
    const data = await api.get(`/orders/${currentOrderId}`);
    if (!data || !data.order) return;

    const order = data.order;
    document.getElementById('track-order-id').textContent = `#${order.id}`;
    document.getElementById('track-restaurant-name').textContent = order.restaurant_name;
    document.getElementById('track-delivery-address').textContent = order.delivery_address;

    // Update milestones
    updateMilestoneUI(order.status);

    // Update delivery staff info if assigned
    const agentDiv = document.getElementById('delivery-agent-info');
    if (order.delivery && order.delivery.delivery_staff_id) {
      agentDiv.style.display = 'block';
      document.getElementById('track-driver-name').textContent = order.delivery.delivery_name;
      document.getElementById('track-driver-phone').textContent = `📞 ${order.delivery.delivery_phone}`;
      document.getElementById('track-driver-vehicle').textContent = `Vehicle: ${order.delivery.vehicle_type || 'Bicycle'}`;
    } else {
      agentDiv.style.display = 'none';
    }
  } catch (err) {
    console.error('Failed to load tracking details:', err);
    clearInterval(trackingInterval);
  }
}

function updateMilestoneUI(status) {
  const bar = document.getElementById('milestone-progress-bar');
  const bike = document.getElementById('delivery-bike');

  // Reset steps
  const steps = ['placed', 'preparing', 'transit', 'delivered'];
  steps.forEach(s => {
    document.getElementById(`step-${s}`).classList.remove('active', 'completed');
  });

  // Calculate statuses percentages and positions
  if (status === 'placed') {
    document.getElementById('step-placed').classList.add('active');
    bar.style.width = '0%';
    bike.style.left = '10%';
    document.getElementById('track-est-time').textContent = '25 - 35 mins';
    stopBikeAnimation();
  } else if (status === 'preparing') {
    document.getElementById('step-placed').classList.add('completed');
    document.getElementById('step-preparing').classList.add('active');
    bar.style.width = '33%';
    bike.style.left = '36%';
    document.getElementById('track-est-time').textContent = '15 - 20 mins';
    stopBikeAnimation();
  } else if (status === 'out_for_delivery') {
    document.getElementById('step-placed').classList.add('completed');
    document.getElementById('step-preparing').classList.add('completed');
    document.getElementById('step-transit').classList.add('active');
    bar.style.width = '66%';
    document.getElementById('track-est-time').textContent = '5 - 10 mins';
    
    // Animate map simulation bike
    startBikeAnimation();
  } else if (status === 'delivered') {
    document.getElementById('step-placed').classList.add('completed');
    document.getElementById('step-preparing').classList.add('completed');
    document.getElementById('step-transit').classList.add('completed');
    document.getElementById('step-delivered').classList.add('completed');
    bar.style.width = '100%';
    bike.style.left = '90%';
    document.getElementById('track-est-time').textContent = 'Arrived!';
    stopBikeAnimation();
    
    // End tracking queries
    clearInterval(trackingInterval);
  } else if (status === 'cancelled') {
    document.getElementById('track-est-time').textContent = 'Cancelled';
    document.getElementById('track-est-time').style.color = 'var(--danger)';
    clearInterval(trackingInterval);
    stopBikeAnimation();
  }
}

// Simulated map animations
function startBikeAnimation() {
  if (bikeAnimationInterval) return;
  
  const bike = document.getElementById('delivery-bike');
  let currentPos = 36;
  
  bikeAnimationInterval = setInterval(() => {
    currentPos += 1;
    if (currentPos > 85) {
      currentPos = 36; // Loop back
    }
    bike.style.left = `${currentPos}%`;
  }, 100);
}

function stopBikeAnimation() {
  if (bikeAnimationInterval) {
    clearInterval(bikeAnimationInterval);
    bikeAnimationInterval = null;
  }
}

// ================= DRIVER PANEL WORKFLOW =================

async function loadDriverDashboard() {
  const select = document.getElementById('driver-status-select');
  const grid = document.getElementById('driver-orders-grid');

  try {
    // 1. Get driver profile status
    const data = await api.get('/deliveries/staff/profile');
    if (data && data.profile) {
      select.value = data.profile.status;
    }

    // 2. Load assigned active orders
    const orderData = await api.get('/orders/delivery/my');
    
    if (!orderData || !orderData.orders || orderData.orders.length === 0) {
      grid.innerHTML = `
        <div style="text-align: center; grid-column: 1/-1; padding: 40px; color: var(--text-secondary);">
          <p style="font-size:16px; font-weight:600; margin-bottom:4px;">No active deliveries assigned.</p>
          <p style="font-size:13px;">Toggle status to "Available" and wait for admin/owner assignments.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    orderData.orders.forEach(order => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.padding = '24px';
      
      let actionBtn = '';
      if (order.delivery_status === 'assigned') {
        actionBtn = `<button class="btn btn-primary" style="width:100%; margin-top:20px;" onclick="updateDelivery(${order.id}, 'picked_up')">Mark as Picked Up</button>`;
      } else if (order.delivery_status === 'picked_up') {
        actionBtn = `<button class="btn btn-success" style="width:100%; margin-top:20px; background-color: var(--success); color: white;" onclick="updateDelivery(${order.id}, 'delivered')">Mark as Delivered</button>`;
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
          <h3 style="font-size:18px;">Order #${order.id}</h3>
          <span class="badge ${order.delivery_status === 'picked_up' ? 'badge-warning' : 'badge-info'}">${order.delivery_status}</span>
        </div>

        <div style="margin-bottom:12px;">
          <span style="font-size:11px; color:var(--text-light); text-transform:uppercase; display:block;">Restaurant Pickup</span>
          <strong>${order.restaurant_name}</strong>
          <p style="font-size:13px; color:var(--text-secondary);">${order.restaurant_address}</p>
        </div>

        <div style="margin-bottom:12px;">
          <span style="font-size:11px; color:var(--text-light); text-transform:uppercase; display:block;">Customer Delivery</span>
          <strong>${order.customer_name}</strong>
          <p style="font-size:13px; color:var(--text-secondary);">${order.delivery_address}</p>
        </div>

        <div style="margin-bottom:12px;">
          <span style="font-size:11px; color:var(--text-light); text-transform:uppercase; display:block;">Total Amount</span>
          <strong style="color:var(--primary);">Rs. ${parseFloat(order.total_amount).toFixed(2)}</strong>
        </div>

        ${actionBtn}
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    toast.error('Failed to load courier panel.');
  }
}

// Toggle Online / Offline driver status
async function toggleDutyStatus() {
  const select = document.getElementById('driver-status-select');
  const val = select.value;

  try {
    await api.put('/deliveries/staff/status', { status: val });
    toast.success(`Duty status updated to: ${val}`);
    loadDriverDashboard();
  } catch (err) {
    toast.error('Failed to update duty status.');
  }
}

// Driver updates status milestone
async function updateDelivery(orderId, status) {
  try {
    await api.put(`/deliveries/${orderId}/status`, { status });
    toast.success(`Order status updated to: ${status}`);
    
    // If completed status, the driver is automatically freed inside the database model
    loadDriverDashboard();
  } catch (err) {
    toast.error('Failed to update status.');
  }
}

// Free loops on window close
window.onbeforeunload = () => {
  clearInterval(trackingInterval);
  stopBikeAnimation();
};

window.toggleDutyStatus = toggleDutyStatus;
window.updateDelivery = updateDelivery;
