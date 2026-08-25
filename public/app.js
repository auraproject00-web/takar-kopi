const API_BASE = '/api';

// Auth State
let currentUser = null;
let currentMember = null;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const adminScreen = document.getElementById('admin-screen');
const studentScreen = document.getElementById('student-screen');
const toastContainer = document.getElementById('toast-container');
const modalTemplate = document.getElementById('modal-template');

// --- API Helper ---
async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (currentUser) {
    headers['x-user'] = JSON.stringify(currentUser);
  }
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Terjadi kesalahan');
  return data;
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', init);

async function init() {
  setupLogin();
  setupNavigation();
  setupThemeToggle();
  fetchNetworkInfo();
  
  const savedUser = localStorage.getItem('perpus_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      const data = await apiFetch('/auth/me');
      currentUser = data.user;
      currentMember = data.member;
      showMainScreen();
    } catch (e) {
      logout();
    }
  }
}

// --- Auth ---
function setupLogin() {
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
      errorEl.classList.add('hidden');
      const btn = form.querySelector('button');
      btn.disabled = true;
      btn.textContent = 'Memproses...';
      
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      currentUser = res.user;
      currentMember = res.member;
      localStorage.setItem('perpus_user', JSON.stringify(currentUser));
      form.reset();
      showMainScreen();
      showToast('Login berhasil', 'success');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      const btn = form.querySelector('button');
      btn.disabled = false;
      btn.textContent = 'MASUK';
    }
  });
  
  document.getElementById('admin-logout').addEventListener('click', logout);
  document.getElementById('student-logout').addEventListener('click', logout);
}

function logout() {
  currentUser = null;
  currentMember = null;
  localStorage.removeItem('perpus_user');
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  loginScreen.classList.add('active');
  showToast('Anda telah logout', 'info');
}

function showMainScreen() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  if (currentUser.role === 'admin') {
    adminScreen.classList.add('active');
    document.querySelector('#admin-sidebar .nav-item[data-page="dashboard"]').click();
  } else {
    studentScreen.classList.add('active');
    document.querySelector('#student-sidebar .nav-item[data-page="dashboard"]').click();
  }
}

// --- Navigation ---
function setupNavigation() {
  document.querySelectorAll('#admin-sidebar .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('#admin-sidebar .nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.getElementById('page-title').textContent = item.textContent.trim();
      loadAdminPage(item.getAttribute('data-page'));
    });
  });

  document.querySelectorAll('#student-sidebar .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('#student-sidebar .nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.getElementById('student-page-title').textContent = item.textContent.trim();
      loadStudentPage(item.getAttribute('data-page'));
    });
  });
  
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('admin-sidebar');
    sidebar.style.transform = sidebar.style.transform === 'translateX(-100%)' ? 'translateX(0)' : 'translateX(-100%)';
  });
  document.getElementById('student-sidebar-toggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('student-sidebar');
    sidebar.style.transform = sidebar.style.transform === 'translateX(-100%)' ? 'translateX(0)' : 'translateX(-100%)';
  });
}

// --- Theme & Network ---
function setupThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('perpus_theme') || 'dark';
  
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light-theme');
  }
  
  toggleBtn?.addEventListener('click', () => {
    document.documentElement.classList.toggle('light-theme');
    const isLight = document.documentElement.classList.contains('light-theme');
    localStorage.setItem('perpus_theme', isLight ? 'light' : 'dark');
  });
}

async function fetchNetworkInfo() {
  try {
    const data = await fetch('/api/network').then(res => res.json());
    const el = document.getElementById('network-info');
    if (el && data.ips && data.ips.length > 0) {
      el.innerHTML = `📡 ${data.ips[0]}:${data.port}`;
      el.title = "Akses aplikasi ini di perangkat lain melalui alamat ini";
    }
  } catch (e) {
    console.error('Failed to fetch network info');
  }
}

// --- Admin Pages ---
async function loadAdminPage(page) {
  const container = document.getElementById('admin-main');
  container.innerHTML = '<div class="empty-state">Loading...</div>';
  
  try {
    if (page === 'dashboard') {
      const data = await apiFetch('/dashboard/admin');
      container.innerHTML = renderAdminDashboard(data);
    } 
    else if (page === 'books') {
      const data = await apiFetch('/books');
      container.innerHTML = renderAdminBooks(data);
      setupBookActions();
    }
    else if (page === 'members') {
      const data = await apiFetch('/members');
      container.innerHTML = renderAdminMembers(data);
      setupMemberActions();
    }
    else if (page === 'transactions') {
      const data = await apiFetch('/transactions');
      container.innerHTML = renderAdminTransactions(data);
      setupTransactionActions();
    }
    else if (page === 'reports') {
      container.innerHTML = renderEmptyState('📋', 'Laporan', 'Fitur laporan akan segera hadir (V2).');
    }
    else if (page === 'settings') {
      container.innerHTML = renderEmptyState('⚙️', 'Pengaturan', 'Fitur pengaturan akan segera hadir.');
    }
  } catch (err) {
    container.innerHTML = renderEmptyState('⚠️', 'Error', err.message);
  }
}

// Admin Dashboard
function renderAdminDashboard({ stats, recentTransactions, popularBooks }) {
  let html = `<div class="stat-grid">`;
  const statItems = [
    { label: 'Total Buku', value: stats.totalBooks, icon: '📚' },
    { label: 'Tersedia', value: stats.availableBooks, icon: '✅' },
    { label: 'Dipinjam', value: stats.borrowedBooks, icon: '📖' },
    { label: 'Total Anggota', value: stats.totalMembers, icon: '👥' }
  ];
  statItems.forEach(s => {
    html += `
      <div class="stat-card">
        <div class="stat-icon">${s.icon}</div>
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    `;
  });
  html += `</div>
  
  <div class="form-row">
    <div>
      <div class="section-header">
        <h2>Transaksi Terbaru</h2>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Siswa</th><th>Buku</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${recentTransactions.map(t => `
              <tr>
                <td>${escapeHtml(t.student)}</td>
                <td>${escapeHtml(t.book)}</td>
                <td>${renderBadge(t.status)}</td>
              </tr>
            `).join('') || '<tr><td colspan="3" class="text-center">Belum ada transaksi</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
    
    <div>
      <div class="section-header">
        <h2>Buku Terpopuler</h2>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Judul</th><th>Dipinjam</th></tr>
          </thead>
          <tbody>
            ${popularBooks.map(b => `
              <tr>
                <td>${escapeHtml(b.title)}</td>
                <td>${b.borrow_count} kali</td>
              </tr>
            `).join('') || '<tr><td colspan="2" class="text-center">Belum ada data</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
  return html;
}

// Admin Books
function renderAdminBooks(data) {
  return `
    <div class="section-header">
      <div class="search-box">
        <input type="text" id="search-book" placeholder="Cari judul, penulis, atau ISBN...">
      </div>
      <button class="btn btn-primary" id="btn-add-book">+ Tambah Buku</button>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID / ISBN</th>
            <th>Judul Buku</th>
            <th>Kategori</th>
            <th>Stok</th>
            <th>Tersedia</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody id="books-table-body">
          ${renderBooksTableRows(data.books)}
        </tbody>
      </table>
    </div>
  `;
}

function renderBooksTableRows(books) {
  if (!books.length) return `<tr><td colspan="7"><div class="empty-state">Belum Ada Buku</div></td></tr>`;
  return books.map(b => `
    <tr>
      <td><small>${escapeHtml(b.isbn || b.id)}</small></td>
      <td>
        <strong>${escapeHtml(b.title)}</strong><br>
        <small class="fg-muted">${escapeHtml(b.author)}</small>
      </td>
      <td>${escapeHtml(b.category || '-')}</td>
      <td>${b.stock}</td>
      <td>${b.available_stock}</td>
      <td>${renderBadge(b.status)}</td>
      <td>
        <button class="btn-action edit-book" data-id="${b.id}">✏️</button>
        <button class="btn-action delete delete-book" data-id="${b.id}">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function setupBookActions() {
  document.getElementById('btn-add-book')?.addEventListener('click', () => openBookModal());
  document.getElementById('search-book')?.addEventListener('input', debounce(async (e) => {
    const data = await apiFetch(`/books?search=${encodeURIComponent(e.target.value)}`);
    document.getElementById('books-table-body').innerHTML = renderBooksTableRows(data.books);
  }, 300));
  
  document.getElementById('books-table-body')?.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.edit-book');
    const delBtn = e.target.closest('.delete-book');
    if (editBtn) {
      const book = await apiFetch(`/books/${editBtn.dataset.id}`);
      openBookModal(book);
    }
    if (delBtn) {
      confirmDialog('Hapus Buku', 'Apakah Anda yakin ingin menghapus buku ini?', async () => {
        try {
          await apiFetch(`/books/${delBtn.dataset.id}`, { method: 'DELETE' });
          showToast('Buku berhasil dihapus', 'success');
          loadAdminPage('books');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  });
}

function openBookModal(book = null) {
  const isEdit = !!book;
  const content = `
    <form id="book-form">
      <div class="form-row">
        <div class="form-group">
          <label>Judul Buku *</label>
          <input type="text" name="title" value="${book?.title || ''}" required>
        </div>
        <div class="form-group">
          <label>Penulis *</label>
          <input type="text" name="author" value="${book?.author || ''}" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>ISBN</label>
          <input type="text" name="isbn" value="${book?.isbn || ''}">
        </div>
        <div class="form-group">
          <label>Kategori</label>
          <input type="text" name="category" value="${book?.category || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Stok</label>
          <input type="number" name="stock" value="${book?.stock || 1}" min="1" required>
        </div>
        <div class="form-group">
          <label>Lokasi Rak</label>
          <input type="text" name="shelf" value="${book?.shelf || ''}">
        </div>
      </div>
    </form>
  `;
  openModal(isEdit ? 'Edit Buku' : 'Tambah Buku', content, async () => {
    const form = document.getElementById('book-form');
    if (!form.reportValidity()) return false;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
      if (isEdit) {
        await apiFetch(`/books/${book.id}`, { method: 'PUT', body: JSON.stringify(data) });
        showToast('Buku berhasil diupdate', 'success');
      } else {
        await apiFetch(`/books`, { method: 'POST', body: JSON.stringify(data) });
        showToast('Buku berhasil ditambahkan', 'success');
      }
      loadAdminPage('books');
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  });
}

// Admin Members
function renderAdminMembers(data) {
  return `
    <div class="section-header">
      <div class="search-box">
        <input type="text" id="search-member" placeholder="Cari nama, NIS...">
      </div>
      <button class="btn btn-primary" id="btn-add-member">+ Tambah Anggota</button>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>NIS</th>
            <th>Nama Lengkap</th>
            <th>Kelas / Jurusan</th>
            <th>Username</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody id="members-table-body">
          ${renderMembersTableRows(data.members)}
        </tbody>
      </table>
    </div>
  `;
}

function renderMembersTableRows(members) {
  if (!members.length) return `<tr><td colspan="6"><div class="empty-state">Belum Ada Anggota</div></td></tr>`;
  return members.map(m => `
    <tr>
      <td>${escapeHtml(m.nis || '-')}</td>
      <td><strong>${escapeHtml(m.name)}</strong></td>
      <td>${escapeHtml(m.class || '-')} ${escapeHtml(m.major || '')}</td>
      <td>${escapeHtml(m.username || '-')}</td>
      <td>${renderBadge(m.status)}</td>
      <td>
        <button class="btn-action edit-member" data-id="${m.id}">✏️</button>
        <button class="btn-action delete delete-member" data-id="${m.id}">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function setupMemberActions() {
  document.getElementById('btn-add-member')?.addEventListener('click', () => openMemberModal());
  document.getElementById('search-member')?.addEventListener('input', debounce(async (e) => {
    const data = await apiFetch(`/members?search=${encodeURIComponent(e.target.value)}`);
    document.getElementById('members-table-body').innerHTML = renderMembersTableRows(data.members);
  }, 300));
  
  document.getElementById('members-table-body')?.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.edit-member');
    const delBtn = e.target.closest('.delete-member');
    if (editBtn) {
      const data = await apiFetch(`/members/${editBtn.dataset.id}`);
      openMemberModal(data.member);
    }
    if (delBtn) {
      confirmDialog('Hapus Anggota', 'Apakah Anda yakin ingin menghapus anggota ini?', async () => {
        try {
          await apiFetch(`/members/${delBtn.dataset.id}`, { method: 'DELETE' });
          showToast('Anggota berhasil dihapus', 'success');
          loadAdminPage('members');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  });
}

function openMemberModal(member = null) {
  const isEdit = !!member;
  const content = `
    <form id="member-form">
      <div class="form-row">
        <div class="form-group">
          <label>Nama Lengkap *</label>
          <input type="text" name="name" value="${member?.name || ''}" required>
        </div>
        <div class="form-group">
          <label>NIS</label>
          <input type="text" name="nis" value="${member?.nis || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Kelas</label>
          <input type="text" name="class" value="${member?.class || ''}">
        </div>
        <div class="form-group">
          <label>Jurusan</label>
          <input type="text" name="major" value="${member?.major || ''}">
        </div>
      </div>
      ${!isEdit ? `
      <div class="form-row">
        <div class="form-group">
          <label>Username Login *</label>
          <input type="text" name="username" required>
        </div>
        <div class="form-group">
          <label>Password *</label>
          <input type="text" name="password" required>
        </div>
      </div>
      ` : `
      <div class="form-group">
        <label>Status</label>
        <select name="status">
          <option value="active" ${member.status === 'active' ? 'selected' : ''}>Aktif</option>
          <option value="inactive" ${member.status === 'inactive' ? 'selected' : ''}>Tidak Aktif</option>
        </select>
      </div>
      `}
    </form>
  `;
  openModal(isEdit ? 'Edit Anggota' : 'Tambah Anggota', content, async () => {
    const form = document.getElementById('member-form');
    if (!form.reportValidity()) return false;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
      if (isEdit) {
        await apiFetch(`/members/${member.id}`, { method: 'PUT', body: JSON.stringify(data) });
        showToast('Anggota berhasil diupdate', 'success');
      } else {
        await apiFetch(`/members`, { method: 'POST', body: JSON.stringify(data) });
        showToast('Anggota berhasil ditambahkan', 'success');
      }
      loadAdminPage('members');
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  });
}

// Admin Transactions
function renderAdminTransactions(data) {
  return `
    <div class="section-header">
      <h2>Riwayat Transaksi</h2>
      <div class="topbar-right">
        <button class="btn btn-primary btn-sm" id="btn-borrow-admin">Buat Peminjaman</button>
      </div>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Tanggal Pinjam</th>
            <th>Siswa</th>
            <th>Buku</th>
            <th>Jatuh Tempo</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${data.transactions.length ? data.transactions.map(t => `
            <tr>
              <td>${formatDate(t.borrow_date)}</td>
              <td>${escapeHtml(t.member_name)}<br><small class="fg-muted">${escapeHtml(t.nis || '')}</small></td>
              <td>${escapeHtml(t.book_title)}</td>
              <td>${formatDate(t.due_date)}</td>
              <td>${renderBadge(t.status)}</td>
              <td>
                ${(t.status === 'borrowed' || t.status === 'overdue') ? 
                  `<button class="btn btn-secondary btn-sm admin-return-btn" data-id="${t.id}">Terima</button>` 
                  : '-'}
              </td>
            </tr>
          `).join('') : '<tr><td colspan="6"><div class="empty-state">Belum Ada Transaksi</div></td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

function setupTransactionActions() {
  document.getElementById('btn-borrow-admin')?.addEventListener('click', async () => {
    try {
      const [membersData, booksData] = await Promise.all([
        apiFetch('/members?status=active'),
        apiFetch('/books?status=available')
      ]);
      
      const content = `
        <form id="admin-borrow-form">
          <div class="form-group">
            <label>Pilih Siswa</label>
            <select name="member_id" required>
              <option value="">-- Pilih Siswa --</option>
              ${membersData.members.map(m => `<option value="${m.id}">${escapeHtml(m.name)} (${escapeHtml(m.nis || '-')})</option>`).join('')}
            </select>
          </div>
          <div class="form-group mt-3">
            <label>Pilih Buku</label>
            <select name="book_id" required>
              <option value="">-- Pilih Buku --</option>
              ${booksData.books.map(b => `<option value="${b.id}">${escapeHtml(b.title)} (${b.available_stock} tersedia)</option>`).join('')}
            </select>
          </div>
        </form>
      `;
      openModal('Proses Peminjaman', content, async () => {
        const form = document.getElementById('admin-borrow-form');
        if (!form.reportValidity()) return false;
        const data = Object.fromEntries(new FormData(form).entries());
        try {
          await apiFetch('/transactions/admin-borrow', { method: 'POST', body: JSON.stringify(data) });
          showToast('Peminjaman berhasil diproses', 'success');
          loadAdminPage('transactions');
          return true;
        } catch (err) {
          showToast(err.message, 'error');
          return false;
        }
      });
    } catch (err) {
      showToast('Gagal memuat data', 'error');
    }
  });

  document.querySelectorAll('.admin-return-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      confirmDialog('Terima Pengembalian', 'Proses pengembalian buku ini?', async () => {
        try {
          const res = await apiFetch('/transactions/admin-return', { method: 'POST', body: JSON.stringify({ transaction_id: id }) });
          let msg = 'Pengembalian berhasil.';
          if (res.fine > 0) msg += ` Terdapat denda: Rp ${res.fine}`;
          showToast(msg, res.fine > 0 ? 'warning' : 'success');
          loadAdminPage('transactions');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  });
}

// --- Student Pages ---
async function loadStudentPage(page) {
  const container = document.getElementById('student-main');
  container.innerHTML = '<div class="empty-state">Loading...</div>';
  
  try {
    if (page === 'dashboard') {
      const data = await apiFetch('/dashboard/student');
      container.innerHTML = renderStudentDashboard(data);
    } 
    else if (page === 'catalog') {
      const data = await apiFetch('/books');
      container.innerHTML = renderStudentCatalog(data);
      setupCatalogActions();
    }
    else if (page === 'borrowed' || page === 'return') {
      const data = await apiFetch('/dashboard/student');
      container.innerHTML = renderStudentBorrowed(data.currentBorrowed, page === 'return');
      setupStudentReturnActions();
    }
    else if (page === 'history') {
      const data = await apiFetch('/student/history');
      container.innerHTML = renderStudentHistory(data);
    }
  } catch (err) {
    container.innerHTML = renderEmptyState('⚠️', 'Error', err.message);
  }
}

// Student Dashboard
function renderStudentDashboard({ member, stats, currentBorrowed }) {
  let html = `
    <div style="margin-bottom: 1.5rem">
      <h2>Halo, ${escapeHtml(member.name)} 👋</h2>
    </div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon">📖</div>
        <div class="stat-value">${stats.borrowed}</div>
        <div class="stat-label">Buku Sedang Dipinjam</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚠️</div>
        <div class="stat-value">${stats.overdue}</div>
        <div class="stat-label">Terlambat</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📜</div>
        <div class="stat-value">${stats.totalHistory}</div>
        <div class="stat-label">Total Riwayat</div>
      </div>
    </div>
    
    <div class="section-header" style="margin-top: 2rem">
      <h2>Buku Yang Sedang Dipinjam</h2>
    </div>
  `;
  
  if (currentBorrowed.length === 0) {
    html += renderEmptyState('📖', 'Belum Ada Peminjaman', 'Anda tidak sedang meminjam buku apa pun.');
  } else {
    html += `<div class="book-grid">`;
    currentBorrowed.forEach(t => {
      html += `
        <div class="book-card">
          <div class="cover">
            ${t.cover ? `<img src="${t.cover}" alt="cover">` : '📚'}
            <div class="status-badge">${renderBadge(t.status)}</div>
          </div>
          <div class="info">
            <div class="title">${escapeHtml(t.title)}</div>
            <div class="author">${escapeHtml(t.author)}</div>
            <div class="meta">
              <span>Jatuh Tempo: ${formatDate(t.due_date)}</span>
            </div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }
  return html;
}

// Student Catalog
function renderStudentCatalog(data) {
  let html = `
    <div class="section-header">
      <div class="search-box">
        <input type="text" id="search-catalog" placeholder="Cari buku...">
      </div>
    </div>
    <div class="book-grid" id="catalog-grid">
      ${renderCatalogBooks(data.books)}
    </div>
  `;
  return html;
}

function renderCatalogBooks(books) {
  if (!books.length) return `<div style="grid-column: 1/-1">${renderEmptyState('📚', 'Buku Tidak Ditemukan', '')}</div>`;
  return books.map(b => `
    <div class="book-card">
      <div class="cover">
        ${b.cover ? `<img src="${b.cover}" alt="cover">` : '📚'}
        <div class="status-badge">${renderBadge(b.status)}</div>
      </div>
      <div class="info">
        <div class="title">${escapeHtml(b.title)}</div>
        <div class="author">${escapeHtml(b.author)}</div>
        <div class="meta">
          <span>Kategori: ${escapeHtml(b.category || '-')}</span>
          <span>Tersedia: ${b.available_stock}</span>
        </div>
        <div class="actions">
          <button class="btn ${b.available_stock > 0 ? 'btn-primary' : 'btn-secondary'} btn-full btn-sm btn-borrow-book" 
                  data-id="${b.id}" ${b.available_stock <= 0 ? 'disabled' : ''}>
            ${b.available_stock > 0 ? 'PINJAM BUKU' : 'TIDAK TERSEDIA'}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function setupCatalogActions() {
  document.getElementById('search-catalog')?.addEventListener('input', debounce(async (e) => {
    const data = await apiFetch(`/books?search=${encodeURIComponent(e.target.value)}`);
    document.getElementById('catalog-grid').innerHTML = renderCatalogBooks(data.books);
  }, 300));
  
  document.getElementById('catalog-grid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-borrow-book');
    if (btn) {
      confirmDialog('Pinjam Buku', 'Ajukan peminjaman untuk buku ini?', async () => {
        try {
          await apiFetch('/transactions/borrow', { method: 'POST', body: JSON.stringify({ book_id: btn.dataset.id }) });
          showToast('Peminjaman berhasil', 'success');
          loadStudentPage('catalog');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  });
}

// Student Borrowed & Return
function renderStudentBorrowed(borrowed, isReturnPage = false) {
  let html = `
    <div class="section-header">
      <h2>${isReturnPage ? 'Pengembalian Buku' : 'Buku Yang Sedang Dipinjam'}</h2>
    </div>
  `;
  if (!borrowed.length) {
    return html + renderEmptyState('📖', 'Kosong', 'Tidak ada buku yang sedang dipinjam.');
  }
  
  html += `<div class="book-grid">`;
  borrowed.forEach(t => {
    html += `
      <div class="book-card">
        <div class="cover">
          ${t.cover ? `<img src="${t.cover}" alt="cover">` : '📚'}
        </div>
        <div class="info">
          <div class="title">${escapeHtml(t.title)}</div>
          <div class="meta">
            <span>Pinjam: ${formatDate(t.borrow_date)}</span>
            <span>Tenggat: ${formatDate(t.due_date)}</span>
          </div>
          ${isReturnPage ? `
          <div class="actions">
            <button class="btn btn-primary btn-full btn-sm btn-return-book" data-id="${t.id}">Ajukan Pengembalian</button>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

function setupStudentReturnActions() {
  document.querySelectorAll('.btn-return-book').forEach(btn => {
    btn.addEventListener('click', (e) => {
      confirmDialog('Pengembalian Buku', 'Apakah Anda yakin ingin mengembalikan buku ini sekarang?', async () => {
        try {
          const res = await apiFetch('/transactions/return', { method: 'POST', body: JSON.stringify({ transaction_id: e.target.dataset.id }) });
          let msg = 'Buku berhasil dikembalikan.';
          if (res.fine > 0) msg += ` Terdapat denda Rp ${res.fine}.`;
          showToast(msg, res.fine > 0 ? 'warning' : 'success');
          loadStudentPage('return');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  });
}

// Student History
function renderStudentHistory(transactions) {
  return `
    <div class="section-header">
      <h2>Riwayat Peminjaman</h2>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Buku</th>
            <th>Tanggal Pinjam</th>
            <th>Jatuh Tempo</th>
            <th>Dikembalikan</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.length ? transactions.map(t => `
            <tr>
              <td><strong>${escapeHtml(t.title)}</strong></td>
              <td>${formatDate(t.borrow_date)}</td>
              <td>${formatDate(t.due_date)}</td>
              <td>${t.return_date ? formatDate(t.return_date) : '-'}</td>
              <td>${renderBadge(t.status)}</td>
            </tr>
          `).join('') : '<tr><td colspan="5"><div class="empty-state">Belum Ada Riwayat</div></td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

// --- UI Helpers ---
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    padding: 1rem 1.5rem;
    margin-bottom: 0.5rem;
    background: var(--glass-bg);
    border-left: 4px solid ${type === 'success' ? 'var(--accent-success)' : type === 'error' ? 'var(--accent-danger)' : 'var(--accent-warning)'};
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    animation: slideInRight 0.3s ease;
    backdrop-filter: blur(20px);
  `;
  toast.innerHTML = escapeHtml(message);
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function openModal(title, bodyHTML, onConfirm = null) {
  const clone = modalTemplate.content.cloneNode(true);
  const overlay = clone.querySelector('.modal-overlay');
  clone.querySelector('#modal-title').textContent = title;
  clone.querySelector('#modal-body').innerHTML = bodyHTML;
  
  const footer = clone.querySelector('#modal-footer');
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Batal';
  cancelBtn.onclick = () => overlay.remove();
  footer.appendChild(cancelBtn);
  
  if (onConfirm) {
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.textContent = 'Simpan';
    confirmBtn.onclick = async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Loading...';
      const success = await onConfirm();
      if (success) overlay.remove();
      else {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Simpan';
      }
    };
    footer.appendChild(confirmBtn);
  }
  
  clone.querySelector('.modal-close').onclick = () => overlay.remove();
  document.body.appendChild(clone);
}

function confirmDialog(title, message, onConfirm) {
  openModal(title, `<p>${escapeHtml(message)}</p>`, async () => {
    await onConfirm();
    return true;
  });
}

function renderEmptyState(icon, title, subtitle) {
  return `
    <div class="empty-state">
      <div class="icon">${icon}</div>
      <h3>${title}</h3>
      <p>${subtitle}</p>
    </div>
  `;
}

function renderBadge(status) {
  const map = {
    'available': 'Tersedia',
    'borrowed': 'Dipinjam',
    'empty': 'Habis',
    'inactive': 'Tidak Aktif',
    'pending': 'Menunggu',
    'returned': 'Kembali',
    'overdue': 'Terlambat',
    'rejected': 'Ditolak',
    'active': 'Aktif'
  };
  return `<span class="badge badge-${status}">${map[status] || status}</span>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
