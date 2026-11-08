PRAGMA foreign_keys = ON;

-- 1. Tabel invitations (Undangan Utama)
CREATE TABLE IF NOT EXISTS invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  groom_name TEXT NOT NULL,
  bride_name TEXT NOT NULL,
  groom_parents TEXT DEFAULT '',
  bride_parents TEXT DEFAULT '',
  event_date TEXT DEFAULT '',
  event_time TEXT DEFAULT '',
  reception_time TEXT DEFAULT '',
  venue TEXT DEFAULT '',
  address TEXT DEFAULT '',
  maps_url TEXT DEFAULT '',
  quote_text TEXT DEFAULT '',
  story_text TEXT DEFAULT '',
  music_url TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  bank_name TEXT DEFAULT '',
  bank_account TEXT DEFAULT '',
  bank_holder TEXT DEFAULT '',
  gift_address TEXT DEFAULT '',
  gallery_json TEXT DEFAULT '[]',
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel guests (Daftar Tamu Terdaftar / Link Personal)
CREATE TABLE IF NOT EXISTS guests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invitation_id INTEGER NOT NULL,
  guest_name TEXT NOT NULL,
  guest_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
);

-- 3. Tabel rsvps (Konfirmasi Kehadiran & Buku Tamu/Ucapan)
CREATE TABLE IF NOT EXISTS rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invitation_id INTEGER NOT NULL,
  guest_id INTEGER,
  guest_name TEXT NOT NULL,
  attendance TEXT NOT NULL CHECK(attendance IN ('hadir','tidak_hadir','ragu')),
  guest_count INTEGER NOT NULL DEFAULT 1,
  message TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL
);

-- Indeks Performa
CREATE INDEX IF NOT EXISTS idx_invitations_slug ON invitations(slug);
CREATE INDEX IF NOT EXISTS idx_guests_invitation ON guests(invitation_id);
CREATE INDEX IF NOT EXISTS idx_guests_token ON guests(guest_token);
CREATE INDEX IF NOT EXISTS idx_rsvps_invitation ON rsvps(invitation_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_guest ON rsvps(guest_id);
