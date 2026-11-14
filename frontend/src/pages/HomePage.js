import React, { useState, useEffect, useCallback } from 'react';
import BookmarkList from '../components/BookmarkList';
// ブックマーク追加フォームのコンポーネント
import BookmarkForm from '../components/BookmarkForm';

function HomePage({ onLogout }) {
	// ブックマークの配列を管理するステートを定義
	const [bookmarks, setBookmarks] = useState([]);
	// 操作に失敗したときのメッセージ
	const [error, setError] = useState('');

	// ブックマークを取得する非同期関数
	const fetchBookmarks = useCallback(async () => {
		try {
			const response = await fetch('/api/bookmarks');
			if (!response.ok) {
				throw new Error(`status ${response.status}`);
			}
			// APIは { success, bookmarks } 形式で返す
			const data = await response.json();
			setBookmarks(data.bookmarks);
		} catch (err) {
			console.error('Failed to fetch bookmarks:', err);
			setError('ブックマークの取得に失敗しました');
		}
	}, []);

	// コンポーネントがマウントされたらブックマークを取得
	useEffect(() => {
		fetchBookmarks();
	}, [fetchBookmarks]);

	// 新しいブックマークを追加する非同期関数
	const handleAddBookmark = async (bookmark) => {
		try {
			const response = await fetch('/api/bookmarks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(bookmark),
			});
			if (!response.ok) {
				throw new Error(`status ${response.status}`);
			}
			setError('');
			await fetchBookmarks(); // リストを再取得して更新
		} catch (err) {
			console.error('Failed to add bookmark:', err);
			setError('ブックマークの追加に失敗しました');
		}
	};

	// ブックマークを削除するための非同期関数
	const handleDeleteBookmark = async (id) => {
		try {
			const response = await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
			if (!response.ok) {
				throw new Error(`status ${response.status}`);
			}
			setError('');
			// 連続削除でも古い state を参照しないよう関数形式で更新
			setBookmarks((current) => current.filter((bookmark) => bookmark.id !== id));
		} catch (err) {
			console.error('Failed to delete bookmark:', err);
			setError('ブックマークの削除に失敗しました');
		}
	};

	return (
		<div>
			<h2>Bookmark</h2>
			<button onClick={onLogout}>Logout</button>
			<hr />
			<h3>Add Bookmark</h3>
			<BookmarkForm onAddBookmark={handleAddBookmark} />
			{error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
			<hr />
			<h3>Bookmarks list</h3>
			<BookmarkList bookmarks={bookmarks}
				onDeleteBookmark={handleDeleteBookmark} />
		</div>
	);
}
export default HomePage;
