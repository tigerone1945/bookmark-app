const express = require('express');
const {
  authenticateUser,
  getBookmarks, addBookmark, deleteBookmark
} = require('./db');

// Expressのルーターを作成（セッションは app.js 側で一元管理する）
const router = express.Router();

// 未ログインなら401を返すミドルウェア
function requireLogin(req, res, next) {
  if (!req.session.username) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

// 空でない文字列かを判定する
const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

// http/https のURLかを判定する（javascript: などを弾く）
function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

// ログイン用のAPIエンドポイント
router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
    return res.status(400).json({ success: false, message: 'username and password are required' });
  }
  const user = await authenticateUser(username, password);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  // セッション固定攻撃対策としてログイン時にセッションIDを再生成する
  req.session.regenerate((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Login failed' });
    }
    req.session.username = user.username;
    res.json({ success: true });
  });
});

// ログアウト用のAPIエンドポイント
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Logout failed' });
    } else {
      res.json({ success: true });
    }
  });
});

// ブックマークを取得するAPIエンドポイント
router.get('/bookmarks', requireLogin, async (req, res) => {
  const bookmarks = await getBookmarks(req.session.username);
  res.json({ success: true, bookmarks });
});

// ブックマークを追加するAPIエンドポイント
router.post('/bookmarks', requireLogin, async (req, res) => {
  const { url, title, description } = req.body ?? {};
  if (!isNonEmptyString(url) || !isHttpUrl(url) || !isNonEmptyString(title)) {
    return res.status(400).json({ success: false, message: 'A valid http(s) url and a title are required' });
  }
  const bookmark = await addBookmark(req.session.username, url, title, description ?? null);
  res.status(201).json({ success: true, bookmark });
});

// ブックマークを削除するAPIエンドポイント
router.delete('/bookmarks/:id', requireLogin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }
  const deleted = await deleteBookmark(req.session.username, id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Bookmark not found' });
  }
  res.json({ success: true });
});

module.exports = router;
