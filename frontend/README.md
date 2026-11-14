# Bookmark App - Frontend

ブックマーク管理アプリの画面（React 19 + Create React App）です。
ログイン、ブックマークの一覧表示・追加・削除、ログアウトができます。API は [backend](../backend/README.md) を利用します。

## 起動方法（開発）

前提: Node.js v22.23.1（動作確認済みのバージョン）。backend と frontend の 2 つを別ターミナルで起動します。

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

ブラウザで [http://localhost:3000](http://localhost:3000) を開き、開発用ユーザー（例: `user1` / `password1`）でログインしてください。

- `/api` へのリクエストは、`package.json` の `"proxy": "http://localhost:3001"` により backend に転送されます。backend のポートを変える場合は、この値も合わせて変更してください。
- backend の既定ポートは 3000 で frontend と衝突するため、必ず `PORT=3001` を指定してください。

## ファイル構成

| パス | 役割 |
|------|------|
| `src/App.js` | ログイン状態の管理（起動時に `/api/me` でセッションを復元） |
| `src/pages/LoginPage.js`、`HomePage.js` | ログイン画面、ブックマーク一覧画面 |
| `src/components/` | `LoginForm`、`BookmarkForm`、`BookmarkList`、`BookmarkItem` |
| `src/App.test.js` | フェイクバックエンドを使った画面テスト |

## テストとビルド

```bash
CI=true npm test -- --watchAll=false   # 単発実行（backend の起動は不要）
npm run build                          # 本番ビルド（build/ に出力）
```

---

以下は Create React App 標準のドキュメントです。

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
