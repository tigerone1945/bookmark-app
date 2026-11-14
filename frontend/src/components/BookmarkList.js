import React from 'react';
import BookmarkItem from './BookmarkItem';
function BookmarkList({ bookmarks, onDeleteBookmark }) {
	return (
		<div>
			{bookmarks.map((bookmark) => (
				<BookmarkItem
					key={bookmark.id}
					bookmark={bookmark}
					onDelete={() => onDeleteBookmark(bookmark.id)}
				/>
			))}
		</div>
	);
}
export default BookmarkList;