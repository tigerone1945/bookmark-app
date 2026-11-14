import React, { useState } from 'react';

function LoginForm({ onLogin }) {
  // ユーザー名とパスワードのステートを定義
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // エラーメッセージのステートを定義
  const [error, setError] = useState('');

  // フォーム送信時の処理を定義
  const handleSubmit = async (e) => {
    e.preventDefault();
    // APIにログイン情報を送信
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        onLogin();
      } else {
        setError('ログインに失敗しました');
      }
    } catch (err) {
      console.error('Failed to log in:', err);
      setError('サーバーに接続できませんでした');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username:</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
      </div>
      <button type="submit">Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

export default LoginForm;