import sqlite3
import os

DB_PATH = os.path.join(os.path.expanduser("~"), ".anivault", "anivault.db")

def get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    return sqlite3.connect(DB_PATH)

def init_db():
    conn = get_conn()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS library (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            episode TEXT,
            file_path TEXT,
            thumbnail TEXT,
            source TEXT,
            download_date TEXT DEFAULT CURRENT_TIMESTAMP,
            file_size INTEGER DEFAULT 0
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS follows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            url TEXT,
            thumbnail TEXT,
            source TEXT,
            last_episode TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS translations (
            romaji TEXT PRIMARY KEY,
            english TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    conn.commit()
    conn.close()

def get_config(key, default=None):
    try:
        conn = get_conn()
        c = conn.cursor()
        c.execute("SELECT value FROM config WHERE key = ?", (key,))
        row = c.fetchone()
        conn.close()
        return row[0] if row else default
    except Exception:
        return default

def set_config(key, value):
    try:
        conn = get_conn()
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)", (key, value))
        conn.commit()
        conn.close()
    except Exception:
        pass

def add_to_library(title, episode, file_path, thumbnail, source, file_size=0):
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "INSERT INTO library (title, episode, file_path, thumbnail, source, file_size) VALUES (?,?,?,?,?,?)",
        (title, episode, file_path, thumbnail, source, file_size)
    )
    conn.commit()
    conn.close()

def get_library():
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM library ORDER BY download_date DESC")
    rows = c.fetchall()
    conn.close()
    cols = ["id","title","episode","file_path","thumbnail","source","download_date","file_size"]
    return [dict(zip(cols, row)) for row in rows]

def add_follow(title, url, thumbnail, source, last_episode=""):
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "INSERT OR IGNORE INTO follows (title, url, thumbnail, source, last_episode) VALUES (?,?,?,?,?)",
        (title, url, thumbnail, source, last_episode)
    )
    conn.commit()
    conn.close()

def get_follows():
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM follows")
    rows = c.fetchall()
    conn.close()
    cols = ["id","title","url","thumbnail","source","last_episode","created_at"]
    return [dict(zip(cols, row)) for row in rows]

def get_translation(romaji):
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT english FROM translations WHERE romaji = ?", (romaji,))
    row = c.fetchone()
    conn.close()
    return row[0] if row else None

def save_translation(romaji, english):
    conn = get_conn()
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO translations (romaji, english) VALUES (?, ?)", (romaji, english))
    conn.commit()
    conn.close()

class DynamicBaseURL:
    def __init__(self, key, default):
        self.key = key
        self.default = default
        
    def __str__(self):
        val = get_config(self.key, self.default)
        if val.endswith("/"):
            val = val[:-1]
        return val

    def __add__(self, other):
        return str(self) + other

    def __radd__(self, other):
        return other + str(self)
        
    def __getattr__(self, name):
        return getattr(str(self), name)
