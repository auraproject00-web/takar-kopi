const express = require('express');
const cors = require('cors');
const path = require('path');
const { networkInterfaces } = require('os');
const db = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getLocalIPs() {
  const nets = networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

function requireAuth(req, res, next) {
  const user = req.headers['x-user'];
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = JSON.parse(user);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid user data' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

app.get('/api/network', (req, res) => {
  res.json({ ips: getLocalIPs(), port: PORT });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, dan role wajib diisi' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND role = ?').get(username, role);
  if (!user) return res.status(401).json({ error: 'Username tidak ditemukan' });
  if (user.password !== password) return res.status(401).json({ error: 'Password salah' });
  if (user.status !== 'active') return res.status(403).json({ error: 'Akun tidak aktif' });

  let member = null;
  if (role === 'student') {
    member = db.prepare('SELECT * FROM members WHERE user_id = ?').get(user.id);
  }
  res.json({ user: { id: user.id, username: user.username, role: user.role }, member });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  let member = null;
  if (req.user.role === 'student') {
    member = db.prepare('SELECT * FROM members WHERE user_id = ?').get(req.user.id);
  }
  res.json({ user: req.user, member });
});

app.get('/api/dashboard/admin', requireAuth, requireRole('admin'), (req, res) => {
  const totalBooks = db.prepare('SELECT COUNT(*) as c FROM books').get().c;
  const availableBooks = db.prepare("SELECT COUNT(*) as c FROM books WHERE status = 'available'").get().c;
  const borrowedBooks = db.prepare("SELECT COUNT(*) as c FROM books WHERE status = 'borrowed'").get().c;
  const totalMembers = db.prepare("SELECT COUNT(*) as c FROM members WHERE status = 'active'").get().c;
  const today = new Date().toISOString().split('T')[0];
  const borrowToday = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE borrow_date = ?").get(today).c;
  const returnToday = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE return_date = ?").get(today).c;

  const recentTx = db.prepare(`
    SELECT t.id, m.name as student, b.title as book, t.borrow_date, t.status
    FROM transactions t
    JOIN members m ON t.member_id = m.id
    JOIN books b ON t.book_id = b.id
    ORDER BY t.created_at DESC LIMIT 5
  `).all();

  const popularBooks = db.prepare(`
    SELECT b.title, b.author, COUNT(t.id) as borrow_count
    FROM transactions t
    JOIN books b ON t.book_id = b.id
    GROUP BY b.id
    ORDER BY borrow_count DESC LIMIT 5
  `).all();

  res.json({
    stats: { totalBooks, availableBooks, borrowedBooks, totalMembers, borrowToday, returnToday },
    recentTransactions: recentTx,
    popularBooks
  });
});

app.get('/api/dashboard/student', requireAuth, requireRole('student'), (req, res) => {
  const member = db.prepare('SELECT * FROM members WHERE user_id = ?').get(req.user.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  const borrowed = db.prepare(`
    SELECT t.*, b.title, b.author, b.cover
    FROM transactions t
    JOIN books b ON t.book_id = b.id
    WHERE t.member_id = ? AND t.status IN ('pending', 'borrowed', 'overdue')
  `).all(member.id);

  const overdue = borrowed.filter(t => t.status === 'overdue' || (t.status === 'borrowed' && new Date(t.due_date) < new Date())).length;
  const totalHistory = db.prepare('SELECT COUNT(*) as c FROM transactions WHERE member_id = ?').get(member.id).c;
  const totalFine = db.prepare('SELECT SUM(fine) as total FROM transactions WHERE member_id = ?').get(member.id).total || 0;

  res.json({
    member,
    stats: { borrowed: borrowed.length, totalHistory, overdue, totalFine },
    currentBorrowed: borrowed
  });
});

app.get('/api/books', requireAuth, (req, res) => {
  const { search, category, status, page = 1, limit = 20 } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (search) {
    where += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (category) { where += ' AND category = ?'; params.push(category); }
  if (status) { where += ' AND status = ?'; params.push(status); }

  const offset = (page - 1) * limit;
  const books = db.prepare(`SELECT * FROM books ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
  const total = db.prepare(`SELECT COUNT(*) as c FROM books ${where}`).get(...params).c;
  const categories = db.prepare("SELECT DISTINCT category FROM books WHERE category IS NOT NULL AND category != ''").all();

  res.json({ books, total, page: +page, limit: +limit, categories: categories.map(c => c.category) });
});

app.get('/api/books/:id', requireAuth, (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Buku tidak ditemukan' });
  res.json(book);
});

app.post('/api/books', requireAuth, requireRole('admin'), (req, res) => {
  const { isbn, title, author, publisher, year, category, description, stock, shelf, cover } = req.body;
  if (!title || !author) return res.status(400).json({ error: 'Judul dan penulis wajib diisi' });
  const available = stock || 0;
  const stmt = db.prepare('INSERT INTO books (isbn, title, author, publisher, year, category, description, stock, available_stock, shelf, cover) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const result = stmt.run(isbn, title, author, publisher, year, category, description, stock || 0, available, shelf, cover);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Buku berhasil ditambahkan' });
});

app.put('/api/books/:id', requireAuth, requireRole('admin'), (req, res) => {
  const { isbn, title, author, publisher, year, category, description, stock, shelf, cover, status } = req.body;
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Buku tidak ditemukan' });
  const available = Math.max(0, (stock ?? book.stock) - (book.stock - book.available_stock));
  db.prepare('UPDATE books SET isbn=?, title=?, author=?, publisher=?, year=?, category=?, description=?, stock=?, available_stock=?, shelf=?, cover=?, status=? WHERE id=?')
    .run(isbn, title, author, publisher, year, category, description, stock, available, shelf, cover, status, req.params.id);
  res.json({ message: 'Buku berhasil diupdate' });
});

app.delete('/api/books/:id', requireAuth, requireRole('admin'), (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Buku tidak ditemukan' });
  const activeTx = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE book_id = ? AND status IN ('pending', 'borrowed', 'overdue')").get(req.params.id).c;
  if (activeTx > 0) return res.status(400).json({ error: 'Buku sedang dipinjam, tidak bisa dihapus' });
  db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  res.json({ message: 'Buku berhasil dihapus' });
});

app.get('/api/members', requireAuth, requireRole('admin'), (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (search) { where += ' AND (name LIKE ? OR nis LIKE ? OR class LIKE ?)'; const s = `%${search}%`; params.push(s, s, s); }
  if (status) { where += ' AND status = ?'; params.push(status); }
  const offset = (page - 1) * limit;
  const members = db.prepare(`SELECT m.*, u.username FROM members m LEFT JOIN users u ON m.user_id = u.id ${where} ORDER BY m.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
  const total = db.prepare(`SELECT COUNT(*) as c FROM members ${where}`).get(...params).c;
  res.json({ members, total, page: +page, limit: +limit });
});

app.get('/api/members/:id', requireAuth, requireRole('admin'), (req, res) => {
  const member = db.prepare('SELECT m.*, u.username FROM members m LEFT JOIN users u ON m.user_id = u.id WHERE m.id = ?').get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Anggota tidak ditemukan' });
  const transactions = db.prepare(`
    SELECT t.*, b.title, b.author
    FROM transactions t JOIN books b ON t.book_id = b.id
    WHERE t.member_id = ? ORDER BY t.created_at DESC
  `).all(req.params.id);
  res.json({ member, transactions });
});

app.post('/api/members', requireAuth, requireRole('admin'), (req, res) => {
  const { nis, name, class: cls, major, gender, phone, address, username, password } = req.body;
  if (!name || !username || !password) return res.status(400).json({ error: 'Nama, username, password wajib diisi' });
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(400).json({ error: 'Username sudah digunakan' });
  const userResult = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, password, 'student');
  const memberResult = db.prepare('INSERT INTO members (user_id, nis, name, class, major, gender, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(userResult.lastInsertRowid, nis, name, cls, major, gender, phone, address);
  res.status(201).json({ id: memberResult.lastInsertRowid, message: 'Anggota berhasil ditambahkan' });
});

app.put('/api/members/:id', requireAuth, requireRole('admin'), (req, res) => {
  const { nis, name, class: cls, major, gender, phone, address, status } = req.body;
  db.prepare('UPDATE members SET nis=?, name=?, class=?, major=?, gender=?, phone=?, address=?, status=? WHERE id=?')
    .run(nis, name, cls, major, gender, phone, address, status, req.params.id);
  res.json({ message: 'Anggota berhasil diupdate' });
});

app.delete('/api/members/:id', requireAuth, requireRole('admin'), (req, res) => {
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Anggota tidak ditemukan' });
  const activeTx = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE member_id = ? AND status IN ('pending', 'borrowed', 'overdue')").get(req.params.id).c;
  if (activeTx > 0) return res.status(400).json({ error: 'Anggota memiliki transaksi aktif' });
  if (member.user_id) db.prepare('DELETE FROM users WHERE id = ?').run(member.user_id);
  db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);
  res.json({ message: 'Anggota berhasil dihapus' });
});

app.get('/api/transactions', requireAuth, requireRole('admin'), (req, res) => {
  const { status, member_id, book_id, date_from, date_to, page = 1, limit = 20 } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (status) { where += ' AND t.status = ?'; params.push(status); }
  if (member_id) { where += ' AND t.member_id = ?'; params.push(member_id); }
  if (book_id) { where += ' AND t.book_id = ?'; params.push(book_id); }
  if (date_from) { where += ' AND t.borrow_date >= ?'; params.push(date_from); }
  if (date_to) { where += ' AND t.borrow_date <= ?'; params.push(date_to); }
  const offset = (page - 1) * limit;
  const tx = db.prepare(`
    SELECT t.*, m.name as member_name, m.nis, b.title as book_title, b.author as book_author
    FROM transactions t
    JOIN members m ON t.member_id = m.id
    JOIN books b ON t.book_id = b.id
    ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset);
  const total = db.prepare(`SELECT COUNT(*) as c FROM transactions t ${where}`).get(...params).c;
  res.json({ transactions: tx, total, page: +page, limit: +limit });
});

app.post('/api/transactions/borrow', requireAuth, (req, res) => {
  const { book_id } = req.body;
  const member = db.prepare('SELECT * FROM members WHERE user_id = ?').get(req.user.id);
  if (!member) return res.status(404).json({ error: 'Data anggota tidak ditemukan' });
  if (member.status !== 'active') return res.status(403).json({ error: 'Anggota tidak aktif' });

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
  if (!book) return res.status(404).json({ error: 'Buku tidak ditemukan' });
  if (book.available_stock <= 0) return res.status(400).json({ error: 'Buku tidak tersedia' });
  if (book.status !== 'available') return res.status(400).json({ error: 'Buku tidak bisa dipinjam' });

  const activeCount = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE member_id = ? AND status IN ('pending', 'borrowed', 'overdue')").get(member.id).c;
  const maxBorrow = +db.prepare('SELECT value FROM settings WHERE key = ?').get('max_borrow').value;
  if (activeCount >= maxBorrow) return res.status(400).json({ error: `Maksimal peminjaman ${maxBorrow} buku` });

  const existing = db.prepare("SELECT id FROM transactions WHERE member_id = ? AND book_id = ? AND status IN ('pending', 'borrowed', 'overdue')").get(member.id, book_id);
  if (existing) return res.status(400).json({ error: 'Buku sudah dipinjam' });

  const borrowDays = +db.prepare('SELECT value FROM settings WHERE key = ?').get('borrow_days').value;
  const borrowDate = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + borrowDays * 86400000).toISOString().split('T')[0];

  const tx = db.prepare('INSERT INTO transactions (member_id, book_id, borrow_date, due_date, status) VALUES (?, ?, ?, ?, ?)')
    .run(member.id, book_id, borrowDate, dueDate, 'borrowed');
  db.prepare('UPDATE books SET available_stock = available_stock - 1 WHERE id = ?').run(book_id);
  db.prepare("UPDATE books SET status = CASE WHEN available_stock = 0 THEN 'borrowed' ELSE 'available' END WHERE id = ?").run(book_id);

  res.status(201).json({ id: tx.lastInsertRowid, message: 'Peminjaman berhasil', borrowDate, dueDate });
});

app.post('/api/transactions/return', requireAuth, (req, res) => {
  const { transaction_id } = req.body;
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transaction_id);
  if (!tx) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
  if (tx.status === 'returned') return res.status(400).json({ error: 'Buku sudah dikembalikan' });

  const member = db.prepare('SELECT * FROM members WHERE user_id = ?').get(req.user.id);
  if (req.user.role === 'student' && tx.member_id !== member?.id) return res.status(403).json({ error: 'Tidak bisa mengembalikan buku orang lain' });

  const returnDate = new Date().toISOString().split('T')[0];
  let fine = 0;
  if (new Date(returnDate) > new Date(tx.due_date)) {
    const finePerDay = +db.prepare('SELECT value FROM settings WHERE key = ?').get('fine_per_day').value;
    const diffDays = Math.ceil((new Date(returnDate) - new Date(tx.due_date)) / 86400000);
    fine = diffDays * finePerDay;
  }

  db.prepare('UPDATE transactions SET return_date = ?, status = ?, fine = ? WHERE id = ?')
    .run(returnDate, 'returned', fine, transaction_id);
  db.prepare('UPDATE books SET available_stock = available_stock + 1 WHERE id = ?').run(tx.book_id);
  db.prepare("UPDATE books SET status = CASE WHEN available_stock > 0 THEN 'available' ELSE 'borrowed' END WHERE id = ?").run(tx.book_id);

  res.json({ message: 'Pengembalian berhasil', fine, returnDate });
});

app.post('/api/transactions/admin-borrow', requireAuth, requireRole('admin'), (req, res) => {
  const { member_id, book_id } = req.body;
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(member_id);
  if (!member || member.status !== 'active') return res.status(400).json({ error: 'Anggota tidak valid' });
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
  if (!book || book.available_stock <= 0) return res.status(400).json({ error: 'Buku tidak tersedia' });

  const activeCount = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE member_id = ? AND status IN ('pending', 'borrowed', 'overdue')").get(member_id).c;
  const maxBorrow = +db.prepare('SELECT value FROM settings WHERE key = ?').get('max_borrow').value;
  if (activeCount >= maxBorrow) return res.status(400).json({ error: `Maksimal peminjaman ${maxBorrow} buku` });

  const borrowDays = +db.prepare('SELECT value FROM settings WHERE key = ?').get('borrow_days').value;
  const borrowDate = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + borrowDays * 86400000).toISOString().split('T')[0];

  const tx = db.prepare('INSERT INTO transactions (member_id, book_id, borrow_date, due_date, status) VALUES (?, ?, ?, ?, ?)')
    .run(member_id, book_id, borrowDate, dueDate, 'borrowed');
  db.prepare('UPDATE books SET available_stock = available_stock - 1 WHERE id = ?').run(book_id);
  db.prepare("UPDATE books SET status = CASE WHEN available_stock = 0 THEN 'borrowed' ELSE 'available' END WHERE id = ?").run(book_id);

  res.status(201).json({ id: tx.lastInsertRowid, message: 'Peminjaman admin berhasil', borrowDate, dueDate });
});

app.post('/api/transactions/admin-return', requireAuth, requireRole('admin'), (req, res) => {
  const { transaction_id } = req.body;
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transaction_id);
  if (!tx) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
  if (tx.status === 'returned') return res.status(400).json({ error: 'Sudah dikembalikan' });

  const returnDate = new Date().toISOString().split('T')[0];
  let fine = tx.fine;
  if (new Date(returnDate) > new Date(tx.due_date) && tx.fine === 0) {
    const finePerDay = +db.prepare('SELECT value FROM settings WHERE key = ?').get('fine_per_day').value;
    const diffDays = Math.ceil((new Date(returnDate) - new Date(tx.due_date)) / 86400000);
    fine = diffDays * finePerDay;
  }

  db.prepare('UPDATE transactions SET return_date = ?, status = ?, fine = ? WHERE id = ?')
    .run(returnDate, 'returned', fine, transaction_id);
  db.prepare('UPDATE books SET available_stock = available_stock + 1 WHERE id = ?').run(tx.book_id);
  db.prepare("UPDATE books SET status = CASE WHEN available_stock > 0 THEN 'available' ELSE 'borrowed' END WHERE id = ?").run(tx.book_id);

  res.json({ message: 'Pengembalian admin berhasil', fine, returnDate });
});

app.get('/api/student/history', requireAuth, requireRole('student'), (req, res) => {
  const member = db.prepare('SELECT * FROM members WHERE user_id = ?').get(req.user.id);
  const tx = db.prepare(`
    SELECT t.*, b.title, b.author, b.cover
    FROM transactions t JOIN books b ON t.book_id = b.id
    WHERE t.member_id = ? ORDER BY t.created_at DESC
  `).all(member.id);
  res.json(tx);
});

app.get('/api/reports/transactions', requireAuth, requireRole('admin'), (req, res) => {
  const { date_from, date_to, status } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (date_from) { where += ' AND t.borrow_date >= ?'; params.push(date_from); }
  if (date_to) { where += ' AND t.borrow_date <= ?'; params.push(date_to); }
  if (status) { where += ' AND t.status = ?'; params.push(status); }
  const tx = db.prepare(`
    SELECT t.*, m.name, m.nis, b.title, b.author
    FROM transactions t JOIN members m ON t.member_id = m.id JOIN books b ON t.book_id = b.id
    ${where} ORDER BY t.borrow_date DESC
  `).all(...params);
  res.json(tx);
});

app.get('/api/reports/books', requireAuth, requireRole('admin'), (req, res) => {
  const books = db.prepare('SELECT * FROM books ORDER BY title').all();
  res.json(books);
});

app.get('/api/reports/fines', requireAuth, requireRole('admin'), (req, res) => {
  const tx = db.prepare(`
    SELECT t.*, m.name, m.nis, b.title
    FROM transactions t JOIN members m ON t.member_id = m.id JOIN books b ON t.book_id = b.id
    WHERE t.fine > 0 ORDER BY t.fine DESC
  `).all();
  res.json(tx);
});

app.get('/api/settings', requireAuth, requireRole('admin'), (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all();
  res.json(Object.fromEntries(settings.map(s => [s.key, s.value])));
});

app.put('/api/settings', requireAuth, requireRole('admin'), (req, res) => {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(req.body)) stmt.run(k, String(v));
  res.json({ message: 'Pengaturan disimpan' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalIPs();
    console.log(`Server running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    ips.forEach(ip => console.log(`Network: http://${ip}:${PORT}`));
  });
}

module.exports = app;