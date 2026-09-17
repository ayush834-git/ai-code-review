import React from 'react';

/**
 * Comment Component
 * Renders user submitted comment in discussion threads
 * Vulnerability 6: Cross-Site Scripting (XSS) via dangerouslySetInnerHTML
 */
export function Comment({ comment, onLike }) {
  if (!comment) return null;

  return (
    <div className="comment-card" id={`comment-${comment.id}`}>
      <div className="comment-header">
        <span className="author-name">{comment.author || 'Anonymous'}</span>
        <span className="comment-date">{comment.createdAt || 'Just now'}</span>
      </div>

      {/* Vulnerable: Raw HTML injection without sanitization */}
      <div
        className="comment-body"
        dangerouslySetInnerHTML={{ __html: comment.body }}
      />

      <div className="comment-actions">
        <button onClick={() => onLike && onLike(comment.id)}>
          Like ({comment.likes || 0})
        </button>
      </div>
    </div>
  );
}

export default Comment;
