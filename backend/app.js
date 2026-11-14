const express = require('express');
const session = require('express-session');

// ルートハンドラー設定を含むモジュールをインポート
const routes = require('./routes');

// 本番環境では秘密鍵を環境変数から必ず受け取る
const sessionSecret = process.env.SESSION_SECRET
  || (process.env.NODE_ENV === 'production' ? null : 'dev-only-secret');
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set in production');
}

// Expressアプリケーションを作成（listen は index.js に分離し、テストから利用可能にする）
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// セッション管理のミドルウェアを設定
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

// publicディレクトリを静的ファイルの提供に使用するように設定
app.use(express.static('public'));

// '/api'パスに対するルートハンドラーを設定
app.use('/api', routes);

module.exports = app;
