// Authentication Client Code (auth.html)

document.addEventListener('DOMContentLoaded', () => {
  // If register=true query param is set, switch to signup tab
  const params = new URLSearchParams(window.location.search);
  if (params.get('register') === 'true') {
    switchTab('register');
  }

  // If already logged in, redirect away
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  if (token && user) {
    redirectUser(user.role);
  }
});

// Toggle register/login UI panels
function switchTab(tab) {
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');

  if (tab === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
  }
}

// Post login payload to backend
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const data = await api.post('/auth/login', { email, password });
    
    // Save state
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    toast.success('Login successful! Redirecting...');
    
    setTimeout(() => {
      redirectUser(data.user.role);
    }, 1000);
  } catch (err) {
    toast.error(err.message || 'Incorrect email or password.');
  }
}

// Post registration payload to backend
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const phone = document.getElementById('reg-phone').value.trim();
  const address = document.getElementById('reg-address').value.trim();
  const role = document.getElementById('reg-role').value;

  try {
    const data = await api.post('/auth/register', {
      name,
      email,
      password,
      phone,
      address,
      role
    });

    // Save state
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    toast.success('Registration successful! Redirecting...');
    
    setTimeout(() => {
      redirectUser(data.user.role);
    }, 1000);
  } catch (err) {
    toast.error(err.message || 'Registration failed. Try a different email.');
  }
}

// Redirect user to appropriate dashboard based on database role
function redirectUser(role) {
  if (role === 'admin') {
    window.location.href = 'admin-dashboard.html';
  } else if (role === 'owner') {
    window.location.href = 'owner-dashboard.html';
  } else if (role === 'delivery') {
    window.location.href = 'delivery.html';
  } else {
    window.location.href = 'index.html';
  }
}
window.switchTab = switchTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
