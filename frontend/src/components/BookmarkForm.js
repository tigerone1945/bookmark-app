import React, { useState } from 'react';
function BookmarkForm({ onAddBookmark }) {
	// URL、タイトル、説明のステートを定義
	const [url, setUrl] = useState('');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	// フォーム送信時に呼ばれる関数
	const handleSubmit = (e) => {
		e.preventDefault(); // フォームの送信アクションを停止
		// 新しいブックマークオブジェクトを作成
		const newBookmark = { url, title, description };
		// onAddBookmark関数で新しいブックマークを追加
		onAddBookmark(newBookmark);
		// フォームの入力ステートをリセット
		setUrl('');
		setTitle('');
		setDescription('');
	};
	return (
		<form onSubmit={handleSubmit}>
			<input
				type="text"
				value={url}
				onChange={(e) => setUrl(e.target.value)}
				placeholder="URL"
				required
			/>
			<input
				type="text"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder="Title"
				required
			/>
			<textarea
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				placeholder="Description"
				required
			></textarea>
			<button type="submit">Add Bookmark</button>
		</form>
	);
}
export default BookmarkForm;