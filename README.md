# Bookmark App

ユーザーごとにブックマークを管理するWebアプリです。ログインして、ブックマークの一覧表示・追加・削除ができます。

| ディレクトリ | 内容 | 技術 |
|--------------|------|------|
| [backend/](backend/README.md) | REST API サーバー | Express 5 / express-session / SQLite |
| [frontend/](frontend/README.md) | 画面（SPA） | React 19 / Create React App |

## クイックスタート（開発）

前提: Node.js v22.23.1（動作確認済みのバージョン）

backend と frontend を別ターミナルで起動します。

```bash
# ターミナル1: backend（frontend の proxy 設定に合わせて 3001 番で起動）
cd backend
npm install
PORT=3001 npm start

# ターミナル2: frontend
cd frontend
npm install
npm start
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開き、開発用ユーザーでログインします。

| username | password |
|----------|----------|
| user1 | password1 |
| taro | yamada |
| hanako | flower |
| sachiko | happy |

> 開発用の初期ユーザーです。本番では使用せず、削除または変更してください。

### ポートについて

frontend の開発サーバーは 3000 番、backend は **3001 番**で動かします。
frontend の `/api` へのリクエストは `frontend/package.json` の `"proxy": "http://localhost:3001"` で backend に転送されるため、backend のポートを変える場合はこの値も合わせて変更してください。

## テスト

backend の API テスト（node:test + supertest）:

```bash
cd backend
npm test
```

frontend の画面テスト（backend の起動は不要）:

```bash
cd frontend
CI=true npm test -- --watchAll=false
```

## 構成

```
bookmark-app/
├── backend/    API サーバー（認証・ブックマークの CRUD・SQLite）
└── frontend/   React アプリ（ログイン画面・ブックマーク一覧画面）
```

- 認証はセッションCookieで行い、ブックマークはログインユーザー自身のものだけ操作できます。
- パスワードは scrypt でハッシュ化して保存します。
- API の詳細（エンドポイント・環境変数）は [backend/README.md](backend/README.md)、画面の構成は [frontend/README.md](frontend/README.md) を参照してください。
