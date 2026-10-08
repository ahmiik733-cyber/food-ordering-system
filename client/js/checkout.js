// Checkout Page Logic (checkout.html)

let currentPaymentMethod = 'easypaisa';
let totalAmountVal = 0;

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    window.location.href = 'auth.html';
    return;
  }

  // Pre-fill shipping form fields from profile
  document.getElementById('ship-name').value = user.name || '';
  
  loadUserProfile();
  loadCartPreview();
});

// Fetch full user profile details for prefilling
async function loadUserProfile() {
  try {
    const data = await api.get('/auth/profile');
    if (data && data.user) {
      document.getElementById('ship-phone').value = data.user.phone || '';
      document.getElementById('ship-address').value = data.user.address || '';
    }
  } catch (err) {
    console.error('Failed to pre-fill profile data:', err);
  }
}

// Render items summary preview
async function loadCartPreview() {
  const container = document.getElementById('checkout-items-list');
  try {
    const data = await api.get('/cart');
    
    if (!data || !data.items || data.items.length === 0) {
      window.location.href = 'cart.html';
      return;
    }

    container.innerHTML = '';
    data.items.forEach(item => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.justify = 'space-between';
      div.style.fontSize = '14px';
      div.innerHTML = `
        <span style="color: var(--text-secondary);">${item.name} x ${item.quantity}</span>
        <strong style="color: var(--text-primary);">Rs. ${(parseFloat(item.price) * item.quantity).toFixed(2)}</strong>
      `;
      container.appendChild(div);
    });

    const subtotal = data.subtotal;
    const tax = subtotal * 0.05;
    const total = subtotal + 3.99 + tax;
    totalAmountVal = total;

    document.getElementById('check-subtotal').textContent = `Rs. ${subtotal.toFixed(2)}`;
    document.getElementById('check-tax').textContent = `Rs. ${tax.toFixed(2)}`;
    document.getElementById('check-total').textContent = `Rs. ${total.toFixed(2)}`;
  } catch (err) {
    toast.error('Failed to load order summary.');
  }
}

// Payment method radio tabs toggles
function selectPaymentMethod(method) {
  currentPaymentMethod = method;
  
  // Update radios visual states
  document.querySelectorAll('.payment-option-card').forEach(card => {
    card.classList.remove('active');
    const radio = card.querySelector('input[type="radio"]');
    if (radio.value === method) {
      card.classList.add('active');
      radio.checked = true;
    }
  });

  // Toggle visible fields
  document.querySelectorAll('.payment-fields').forEach(f => f.classList.remove('active'));
  const targetFields = document.getElementById(`fields-${method}`);
  if (targetFields) {
    targetFields.classList.add('active');
  }
}

// Triggers transaction placement and simulation
async function placeOrderAndPay() {
  const deliveryAddress = document.getElementById('ship-address').value.trim();
  const contactPhone = document.getElementById('ship-phone').value.trim();
  const name = document.getElementById('ship-name').value.trim();

  if (!deliveryAddress || !contactPhone || !name) {
    toast.warning('Please fill in all delivery information.');
    return;
  }

  // Verify payment details depending on selection
  if (currentPaymentMethod === 'card') {
    const cardNum = document.getElementById('card-num').value.trim();
    const exp = document.getElementById('card-exp').value.trim();
    const cvv = document.getElementById('card-cvv').value.trim();
    if (!cardNum || !exp || !cvv) {
      toast.warning('Please enter valid credit card details.');
      return;
    }
  } else if (currentPaymentMethod === 'easypaisa') {
    const easypaisaNum = document.getElementById('easypaisa-num').value.trim();
    if (!easypaisaNum) {
      toast.warning('Please enter your EasyPaisa mobile number.');
      return;
    }
  }

  const modal = document.getElementById('processing-modal');
  const title = document.getElementById('process-title');
  const subtitle = document.getElementById('process-subtitle');

  try {
    // 1. Place Order in Database
    const orderData = await api.post('/orders', { deliveryAddress, contactPhone });
    const orderId = orderData.orderId;

    // 2. Launch loading simulation screen
    modal.style.display = 'flex';
    
    // Stage 1: Payment processing
    title.textContent = 'Processing Payment...';
    subtitle.textContent = 'Contacting payment gateway. Please wait...';
    
    setTimeout(async () => {
      try {
        // Post payment details
        await api.post('/payments', {
          orderId,
          paymentMethod: currentPaymentMethod
        });

        // Stage 2: Database validation and clearing cart
        title.textContent = 'Verifying Transaction...';
        subtitle.textContent = 'Authorizing payment and preparing invoice...';

        setTimeout(() => {
          title.textContent = 'Confirming Order...';
          subtitle.textContent = 'Sending specifications to restaurant kitchen...';

          setTimeout(() => {
            modal.style.display = 'none';
            toast.success('Order placed successfully!');
            // Sync navbar badge count
            updateNavCartCount();
            
            // Redirect to tracking page
            window.location.href = `delivery.html?id=${orderId}`;
          }, 1000);

        }, 1200);

      } catch (payErr) {
        modal.style.display = 'none';
        toast.error('Payment failed. Please try a different card.');
      }
    }, 1500);

  } catch (err) {
    toast.error(err.message || 'Checkout failed. Could not place order.');
  }
}

window.selectPaymentMethod = selectPaymentMethod;
window.placeOrderAndPay = placeOrderAndPay;
