// Administration Dashboard Logic (admin-dashboard.html)

let currentAdminTab = 'overview';
let cuisineChart = null;

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user || user.role !== 'admin') {
    window.location.href = 'auth.html';
    return;
  }

  loadOverviewKPIs();
});

// Switch active panels in administration dashboard
function switchAdminTab(tab) {
  currentAdminTab = tab;
  
  // Highlight active sidebar buttons
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`btn-tab-${tab}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Toggle views
  document.querySelectorAll('.admin-tab-view').forEach(v => {
    v.classList.remove('active');
  });
  document.getElementById(`view-${tab}`).classList.add('active');

  // Trigger loads based on active tab
  if (tab === 'overview') {
    loadOverviewKPIs();
  } else if (tab === 'users') {
    loadUsersRegistry();
  } else if (tab === 'approvals') {
    loadRestaurantApprovals();
  } else if (tab === 'reports') {
    loadReportLogs();
  }
}

// ============ SYSTEM OVERVIEW & CHARTS ============

async function loadOverviewKPIs() {
  try {
    const data = await api.get('/admin/stats');
    if (!data || !data.stats) return;

    const stats = data.stats;
    
    // Set KPI labels values
    document.getElementById('kpi-revenue').textContent = `Rs. ${parseFloat(stats.orders.total_revenue).toFixed(2)}`;
    document.getElementById('kpi-completed-orders').textContent = stats.orders.completed_orders || 0;
    document.getElementById('kpi-active-restaurants').textContent = stats.restaurants.active || 0;
    document.getElementById('kpi-total-users').textContent = stats.users.total || 0;

    // Render Chart.js
    renderCuisineSalesChart(stats.cuisineSales);
  } catch (err) {
    toast.error('Failed to load system KPIs.');
  }
}

function renderCuisineSalesChart(salesData) {
  const ctx = document.getElementById('revenue-chart').getContext('2d');
  
  if (cuisineChart) {
    cuisineChart.destroy(); // Destroy previous instance to re-render clean
  }

  const labels = salesData.map(item => item.cuisine_type || 'General');
  const sales = salesData.map(item => parseFloat(item.sales));

  // Premium harmonized colors
  const backgroundColors = [
    'rgba(255, 107, 53, 0.75)',  // Warm orange (Primary)
    'rgba(0, 78, 100, 0.75)',    // Deep teal (Secondary)
    'rgba(37, 99, 235, 0.75)',   // Accent blue
    'rgba(16, 185, 129, 0.75)',  // Success green
    'rgba(245, 158, 11, 0.75)',  // Warning yellow
  ];

  const borderColors = [
    '#ff6b35',
    '#004e64',
    '#2563eb',
    '#10b981',
    '#f59e0b',
  ];

  cuisineChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['No Sales Recorded'],
      datasets: [{
        label: 'Revenue (Rs.)',
        data: sales.length > 0 ? sales : [0],
        backgroundColor: labels.length > 0 ? backgroundColors.slice(0, labels.length) : ['rgba(148, 163, 184, 0.5)'],
        borderColor: labels.length > 0 ? borderColors.slice(0, labels.length) : ['#94a3b8'],
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#475569', font: { family: 'Inter' } },
          grid: { color: '#e2e8f0' }
        },
        x: {
          ticks: { color: '#475569', font: { family: 'Inter', weight: 600 } },
          grid: { display: false }
        }
      }
    }
  });
}

// ============ SYSTEM USERS AUDIT ============

async function loadUsersRegistry() {
  const tbody = document.getElementById('admin-users-rows');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Loading users list...</td></tr>`;

  try {
    const data = await api.get('/admin/users');
    if (!data || !data.users || data.users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No users registered.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    data.users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${u.id}</td>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td><span class="badge ${getRoleBadgeClass(u.role)}">${u.role}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openRoleEditModal(${u.id}, '${u.role}')">Change Role</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    toast.error('Failed to load users.');
  }
}

function getRoleBadgeClass(role) {
  if (role === 'admin') return 'badge-danger';
  if (role === 'owner') return 'badge-info';
  if (role === 'delivery') return 'badge-warning';
  return 'badge-success';
}

function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// Role toggle workflows
function openRoleEditModal(userId, currentRole) {
  document.getElementById('role-user-id').value = userId;
  document.getElementById('role-select').value = currentRole;
  openModal('role-modal');
}

async function submitRoleChange() {
  const userId = document.getElementById('role-user-id').value;
  const role = document.getElementById('role-select').value;

  try {
    await api.put(`/admin/users/${userId}/role`, { role });
    toast.success('User role changed successfully.');
    closeModal('role-modal');
    loadUsersRegistry();
  } catch (err) {
    toast.error('Failed to change role.');
  }
}

// ============ RESTAURANT APPROVALS WORKFLOW ============

async function loadRestaurantApprovals() {
  const tbody = document.getElementById('admin-approvals-rows');
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Loading restaurants list...</td></tr>`;

  try {
    const data = await api.get('/admin/restaurants');
    if (!data || !data.restaurants || data.restaurants.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No restaurants registered.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    data.restaurants.forEach(rest => {
      const tr = document.createElement('tr');
      
      let actionBtn = '';
      if (rest.status === 'pending') {
        actionBtn = `
          <button class="btn btn-primary btn-sm" onclick="updateRestState(${rest.id}, 'active')">Approve</button>
          <button class="btn btn-secondary btn-sm" onclick="updateRestState(${rest.id}, 'suspended')" style="color:var(--danger); border-color:var(--border);">Reject</button>
        `;
      } else if (rest.status === 'active') {
        actionBtn = `<button class="btn btn-secondary btn-sm" onclick="updateRestState(${rest.id}, 'suspended')" style="color:var(--danger); border-color:var(--border);">Suspend</button>`;
      } else {
        actionBtn = `<button class="btn btn-secondary btn-sm" onclick="updateRestState(${rest.id}, 'active')" style="color:var(--success); border-color:var(--border);">Unsuspend</button>`;
      }

      tr.innerHTML = `
        <td>#${rest.id}</td>
        <td><strong>${rest.name}</strong><br><span style="font-size:12px; color:var(--text-light);">${rest.description || ''}</span></td>
        <td>${rest.cuisine_type || 'General'}</td>
        <td style="font-size:13px; color:var(--text-secondary);">${rest.address}</td>
        <td>${rest.phone}</td>
        <td><span class="badge ${rest.status === 'active' ? 'badge-success' : (rest.status === 'pending' ? 'badge-warning' : 'badge-danger')}">${rest.status}</span></td>
        <td><div style="display:flex; gap:8px;">${actionBtn}</div></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    toast.error('Failed to load restaurant listings.');
  }
}

// Approve or Suspend restaurant profile
async function updateRestState(id, status) {
  try {
    await api.put(`/admin/restaurant/${id}/status`, { status });
    toast.success(`Restaurant is now marked as: ${status}`);
    loadRestaurantApprovals();
  } catch (err) {
    toast.error('Failed to update restaurant status.');
  }
}

// ============ REPORTS & LOGS WORKFLOW ============

async function loadReportLogs() {
  const tbody = document.getElementById('admin-reports-rows');
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Loading logs...</td></tr>`;

  try {
    const data = await api.get('/admin/reports');
    if (!data || !data.reports || data.reports.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-secondary);">No reports generated yet. Select a type and click Generate Report.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    data.reports.forEach(rep => {
      const date = new Date(rep.generated_at).toLocaleString();
      const tr = document.createElement('tr');
      
      // Extract preview snippet from details JSON object
      const previewText = JSON.stringify(rep.details).substr(0, 100) + '...';

      tr.innerHTML = `
        <td>#${rep.id}</td>
        <td><span class="badge ${rep.report_type === 'sales' ? 'badge-success' : 'badge-info'}">${rep.report_type}</span></td>
        <td style="font-size:12px; color:var(--text-secondary);">${date}</td>
        <td>${rep.generated_by}</td>
        <td style="font-size:12px; font-family:monospace; color:var(--text-secondary); cursor:help;" title="${JSON.stringify(rep.details, null, 2).replace(/"/g, '&quot;')}">
          ${previewText}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    toast.error('Failed to load reports.');
  }
}

// Generate new JSON report inside Database log table
async function triggerReportGeneration() {
  const select = document.getElementById('report-type-select');
  const type = select.value;

  try {
    await api.post('/admin/report', { reportType: type });
    toast.success('System report compiled and saved to database successfully.');
    loadReportLogs();
  } catch (err) {
    toast.error('Report compilation failed.');
  }
}

window.switchAdminTab = switchAdminTab;
window.openRoleEditModal = openRoleEditModal;
window.submitRoleChange = submitRoleChange;
window.updateRestState = updateRestState;
window.triggerReportGeneration = triggerReportGeneration;
window.closeModal = closeModal;
