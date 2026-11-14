# Bookmark App - Backend

ユーザーごとにブックマークを管理するための REST API サーバーです。
Express 5 + express-session + SQLite（`sqlite` / `sqlite3`）で構成されています。

## 機能

- ログイン / ログアウト（セッションCookieによる認証）
- ブックマークの一覧取得・追加・削除（ログインユーザー自身のデータのみ操作可能）
- パスワードは scrypt でハッシュ化して保存

## ファイル構成

| ファイル | 役割 |
|----------|------|
| `index.js` | エントリーポイント。DB初期化完了後にサーバーを起動 |
| `app.js` | Express アプリの組み立て（ミドルウェア・セッション・ルーティング）。テストからも利用 |
| `routes.js` | APIエンドポイントの定義と入力検証 |
| `db.js` | SQLite の接続・テーブル作成・初期ユーザー投入・データ操作関数 |
| `test/api.test.js` | APIの自動テスト |

## セットアップと起動

前提: Node.js v22.23.1（動作確認済みのバージョン）

```bash
cd backend
npm install
npm start
```

`http://localhost:3000` で起動します。初回起動時に `db.sqlite` が作成され、開発用ユーザーが登録されます。

> **frontend と一緒に開発する場合の注意**
> frontend の開発サーバーも 3000 番を使うため、既定ポートのままだと衝突します。
> frontend の `package.json` の `"proxy": "http://localhost:3001"` に合わせ、backend は **3001 番**で起動してください。
>
> ```bash
> PORT=3001 npm start
> ```
>
> frontend の起動方法は [frontend/README.md](../frontend/README.md) を参照してください。

### 環境変数

| 変数 | 既定値 | 説明 |
|------|--------|------|
| `PORT` | `3000` | 待ち受けポート |
| `DB_FILE` | `./db.sqlite` | SQLite ファイルのパス（`:memory:` でインメモリ） |
| `SESSION_SECRET` | 開発用の固定値 | セッション署名用の秘密鍵。`NODE_ENV=production` では**必須**（未設定だと起動エラー） |

```bash
# 本番想定の例
NODE_ENV=production SESSION_SECRET=長いランダム文字列 npm start
```

### 初期ユーザー（開発用）

| username | password |
|----------|----------|
| user1 | password1 |
| taro | yamada |
| hanako | flower |
| sachiko | happy |

> 本番では使用せず、削除または変更してください。

## API

ベースパスは `/api` です。リクエスト／レスポンスは JSON です。

| メソッド | パス | 認証 | 説明 | 主なステータス |
|----------|------|------|------|----------------|
| POST | `/api/login` | 不要 | `{ username, password }` でログイン | 200 / 400 / 401 |
| POST | `/api/logout` | 不要 | ログアウト（セッション破棄） | 200 |
| GET | `/api/bookmarks` | 必要 | 自分のブックマーク一覧 | 200 / 401 |
| POST | `/api/bookmarks` | 必要 | `{ url, title, description? }` を追加。`url` は http(s) のみ | 201 / 400 / 401 |
| DELETE | `/api/bookmarks/:id` | 必要 | 自分のブックマークを削除 | 200 / 400 / 401 / 404 |

### curl での動作確認例

```bash
curl -c jar -H 'Content-Type: application/json' \
  -d '{"username":"user1","password":"password1"}' localhost:3000/api/login

curl -b jar localhost:3000/api/bookmarks

curl -b jar -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com","title":"Example"}' localhost:3000/api/bookmarks

curl -b jar -X DELETE localhost:3000/api/bookmarks/1

curl -b jar -c jar -X POST localhost:3000/api/logout
```

## テスト

```bash
npm test
```

Node 標準の `node:test` と supertest を使用します。DB は `:memory:` を使うため、実データには影響しません。
