const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

let DB_PATH = path.join(__dirname, 'perpustakaan.db');

if (process.env.VERCEL) {
  const tmpPath = path.join('/tmp', 'perpustakaan.db');
  if (!fs.existsSync(tmpPath) && fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, tmpPath);
  }
  DB_PATH = tmpPath;
}

const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    nis TEXT UNIQUE,
    name TEXT NOT NULL,
    class TEXT,
    major TEXT,
    gender TEXT CHECK (gender IN ('L', 'P')),
    phone TEXT,
    address TEXT,
    photo TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    isbn TEXT UNIQUE,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    publisher TEXT,
    year INTEGER,
    category TEXT,
    description TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    available_stock INTEGER NOT NULL DEFAULT 0,
    shelf TEXT,
    cover TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'empty', 'inactive')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    borrow_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    return_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'borrowed', 'returned', 'overdue', 'rejected')),
    fine INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_book ON transactions(book_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
  CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
  CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
  CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
`);

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount > 0) return;

  const insertUser = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
  const insertMember = db.prepare('INSERT INTO members (user_id, nis, name, class, major, gender, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertBook = db.prepare('INSERT INTO books (isbn, title, author, publisher, year, category, description, stock, available_stock, shelf) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

  const adminId = insertUser.run('admin', 'admin123', 'admin').lastInsertRowid;
  const studentId = insertUser.run('andi', 'andi123', 'student').lastInsertRowid;

  insertMember.run(studentId, '2024001', 'Andi Pratama', '10', 'IPA', 'L', '081234567890', 'Jl. Merdeka No. 10');

  const books = [
    ['9786020324781', 'Laskar Pelangi', 'Andrea Hirata', 'Bentang Pustaka', 2005, 'Novel', 'Kisah inspiratif anak-anak Belitung yang bersekolah di SD Muhammadiyah.', 10, 7, 'Rak A-1'],
    ['9789793062792', 'Bumi Manusia', 'Pramoedya Ananta Toer', 'Hasta Mitra', 1980, 'Novel Sejarah', 'Roman sejarah kolonial Hindia Belanda.', 8, 5, 'Rak A-2'],
    ['9786020632762', 'Filosofi Teras', 'Henry Manampiring', 'Kompas', 2018, 'Filsafat', 'Panduan praktis stoisme untuk kehidupan modern.', 12, 12, 'Rak B-1'],
    ['9786237121041', 'Atomic Habits', 'James Clear', 'Gramedia', 2020, 'Pengembangan Diri', 'Cara membangun kebiasaan baik dan menghapus kebiasaan buruk.', 6, 4, 'Rak B-2'],
    ['9786020639013', 'Sebuah Seni untuk Bersikap Bodo Amat', 'Mark Manson', 'Penerbit Buku Kompas', 2019, 'Psikologi', 'Menemukan fokus pada hal yang benar-benar penting.', 5, 5, 'Rak B-3'],
    ['9789791078306', 'Negeri 5 Menara', 'A. Fuadi', 'Gramedia Pustaka Utama', 2009, 'Novel', 'Perjuangan memenuhi cita-cita di Pondok Modern Gontor.', 9, 8, 'Rak A-3'],
    ['9786020616045', 'Sapiens', 'Yuval Noah Harari', 'Kepustakaan Populer Gramedia', 2017, 'Sains', 'Sejarah singkat umat manusia.', 4, 3, 'Rak C-1'],
    ['9786230012345', 'Pemrograman Web Dasar', 'Budi Raharjo', 'Informatika Bandung', 2021, 'Teknologi', 'Belajar HTML, CSS, JavaScript untuk pemula.', 15, 15, 'Rak D-1'],
    ['9786020632763', 'Rich Dad Poor Dad', 'Robert Kiyosaki', 'Gramedia', 2000, 'Keuangan', 'Pendidikan keuangan yang tidak diajarkan di sekolah.', 7, 6, 'Rak B-4'],
    ['9786020324782', 'Ayah', 'Andrea Hirata', 'Bentang Pustaka', 2015, 'Novel', 'Kisah ayah yang menginspirasi.', 3, 2, 'Rak A-4'],
  ];

  for (const b of books) {
    insertBook.run(...b);
  }

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('max_borrow', '3');
  insertSetting.run('borrow_days', '7');
  insertSetting.run('fine_per_day', '1000');
  insertSetting.run('school_name', 'SMK Negeri 1');
}

seed();

module.exports = db;