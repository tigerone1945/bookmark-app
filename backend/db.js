const crypto = require('crypto');
const { promisify } = require('util');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const scrypt = promisify(crypto.scrypt);

// テスト時は DB_FILE=:memory: を指定してテスト間でDBを独立させる
const DB_FILE = process.env.DB_FILE || './db.sqlite';

// パスワードを "salt:hash" 形式でハッシュ化する（平文保存を避ける）
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

// 保存済みハッシュとパスワードをタイミング攻撃に強い方法で比較する
async function verifyPassword(password, stored) {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

// データベースに接続し、テーブルとシードを初期化する
async function initDB() {
  const db = await open({ filename: DB_FILE, driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      description TEXT
    )
  `);

  // ユーザーのシードを作成（開発用の初期ユーザー）
  const seeded = await db.get('SELECT 1 FROM users WHERE username = ?', ['user1']);
  if (!seeded) {
    const seedUsers = [
      ['user1', 'password1'],
      ['taro', 'yamada'],
      ['hanako', 'flower'],
      ['sachiko', 'happy'],
    ];
    for (const [username, password] of seedUsers) {
      await db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, await hashPassword(password)]
      );
    }
  }

  return db;
}

// 初期化の完了を待つ Promise。失敗した場合は呼び出し側にエラーが伝播する
const dbPromise = initDB();

// 新しいユーザーを作成する
async function createUser(username, password) {
  const db = await dbPromise;
  await db.run(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, await hashPassword(password)]
  );
}

// ユーザーを認証する。一致した場合はユーザー、しなければ null を返す
async function authenticateUser(username, password) {
  const db = await dbPromise;
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
  if (user && await verifyPassword(password, user.password)) {
    return { username: user.username };
  }
  return null;
}

// ユーザーのブックマークを取得する
async function getBookmarks(username) {
  const db = await dbPromise;
  return await db.all('SELECT * FROM bookmarks WHERE username = ?', [username]);
}

// 新しいブックマークを追加し、作成されたレコードを返す
async function addBookmark(username, url, title, description = null) {
  const db = await dbPromise;
  const result = await db.run(
    'INSERT INTO bookmarks (username, url, title, description) VALUES (?, ?, ?, ?)',
    [username, url, title, description]
  );
  return { id: result.lastID, username, url, title, description };
}

// 自分のブックマークのみ削除する。削除できた場合は true を返す
async function deleteBookmark(username, id) {
  const db = await dbPromise;
  const result = await db.run(
    'DELETE FROM bookmarks WHERE id = ? AND username = ?',
    [id, username]
  );
  return result.changes > 0;
}

// DB接続を閉じる（テスト終了時用）
async function closeDB() {
  const db = await dbPromise;
  await db.close();
}

module.exports = {
  dbPromise,
  createUser,
  authenticateUser,
  getBookmarks,
  addBookmark,
  deleteBookmark,
  closeDB
};
