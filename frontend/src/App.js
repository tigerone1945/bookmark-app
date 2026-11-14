import React, { useState, useEffect } from 'react';
import './App.css';
// LoginPageコンポーネントをインポート
import LoginPage from './pages/LoginPage';
// HomePageコンポーネントをインポート
import HomePage from './pages/HomePage';

function App() {
  // ログイン状態を管理するステートを定義
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // 起動時のセッション確認が終わるまで画面を出し分けない
  const [checkingSession, setCheckingSession] = useState(true);

  // リロード後もサーバー側のセッションが生きていればログイン状態を復元する
  useEffect(() => {
    fetch('/api/me')
      .then((response) => setIsLoggedIn(response.ok))
      .catch(() => setIsLoggedIn(false))
      .finally(() => setCheckingSession(false));
  }, []);

  // ログイン処理を行う関数
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // ログアウト処理を行う関数
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', { method: 'POST' });
      if (response.ok) {
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  if (checkingSession) {
    return <div className="App">Loading...</div>;
  }

  return (
    <div className="App">
      {isLoggedIn ? (
        <HomePage onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
