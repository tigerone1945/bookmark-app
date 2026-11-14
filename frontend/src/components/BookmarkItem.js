import React from 'react';

// http/https 以外（javascript: など）をリンクにしないための検証。安全でなければ null
function toSafeUrl(value) {
	try {
		const url = new URL(value);
		return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
	} catch {
		return null;
	}
}

function BookmarkItem({ bookmark, onDelete }) {
	const safeUrl = toSafeUrl(bookmark.url);
	return (
		<div className="bookmark-item">
			<h3>{bookmark.title}</h3>
			<p>{bookmark.description}</p>
			{safeUrl ? (
				<a href={safeUrl} target="_blank"
					rel="noopener noreferrer">
					{bookmark.url}
				</a>
			) : (
				<span>{bookmark.url}</span>
			)}
			<button className='delete'
				onClick={onDelete}>Delete</button>
		</div>
	);
}
export default BookmarkItem;
