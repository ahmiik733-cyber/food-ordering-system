// Cart Page Handler (cart.html)

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    window.location.href = 'auth.html';
    return;
  }

  if (user.role !== 'customer') {
    toast.error('Only customers can access the shopping cart.');
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    return;
  }

  loadCart();
});

// Load cart details from Express backend
async function loadCart() {
  const emptyView = document.getElementById('cart-empty-view');
  const activeView = document.getElementById('cart-active-view');
  const tableRows = document.getElementById('cart-items-rows');

  try {
    const data = await api.get('/cart');
    
    if (!data || !data.items || data.items.length === 0) {
      emptyView.style.display = 'block';
      activeView.style.display = 'none';
      return;
    }

    emptyView.style.display = 'none';
    activeView.style.display = 'grid';

    document.getElementById('cart-restaurant-name').textContent = `Ordering from: ${data.restaurantName}`;

    tableRows.innerHTML = '';
    data.items.forEach(item => {
      const row = document.createElement('tr');
      const fallbackImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60';
      const itemTotal = parseFloat(item.price) * item.quantity;
      
      row.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="${item.image_url || fallbackImg}" style="width:50px; height:50px; border-radius:var(--radius-sm); object-fit:cover;">
            <div>
              <strong style="display:block;">${item.name}</strong>
              ${!item.is_available ? '<span class="badge badge-danger">Unavailable</span>' : ''}
            </div>
          </div>
        </td>
        <td>Rs. ${parseFloat(item.price).toFixed(2)}</td>
        <td>
          <input type="number" value="${item.quantity}" min="1" max="15" class="form-input" style="width:70px; padding:6px; text-align:center;" onchange="updateQty(${item.food_item_id}, this.value)">
        </td>
        <td>Rs. ${itemTotal.toFixed(2)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="removeCartItem(${item.food_item_id})" style="color:var(--danger); border-color:var(--border);">
            Remove
          </button>
        </td>
      `;
      tableRows.appendChild(row);
    });

    // Populate calculations summaries
    const subtotal = data.subtotal;
    const tax = subtotal * 0.05; // 5% GST
    const total = subtotal + 3.99 + tax; // subtotal + delivery + tax

    document.getElementById('summary-subtotal').textContent = `Rs. ${subtotal.toFixed(2)}`;
    document.getElementById('summary-tax').textContent = `Rs. ${tax.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `Rs. ${total.toFixed(2)}`;
  } catch (err) {
    toast.error('Failed to load cart items.');
  }
}

// Adjust item quantities
async function updateQty(foodItemId, value) {
  const qty = parseInt(value);
  if (isNaN(qty) || qty <= 0) return;

  try {
    await api.put('/cart/update', { foodItemId, quantity: qty });
    loadCart(); // Refresh cart calculations
    updateNavCartCount(); // Sync navbar badge
  } catch (err) {
    toast.error(err.message || 'Failed to update quantity.');
  }
}

// Delete cart item
async function removeCartItem(foodItemId) {
  try {
    await api.delete('/cart/remove', { foodItemId });
    toast.success('Item removed.');
    loadCart(); // Refresh cart calculations
    updateNavCartCount(); // Sync navbar badge
  } catch (err) {
    toast.error('Failed to remove item.');
  }
}

// Direct to checkout page
function proceedToCheckout() {
  window.location.href = 'checkout.html';
}

window.updateQty = updateQty;
window.removeCartItem = removeCartItem;
window.proceedToCheckout = proceedToCheckout;
