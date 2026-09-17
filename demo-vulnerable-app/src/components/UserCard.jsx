import React from 'react';

export function UserCard({ user, onEdit, onDelete }) {
  if (!user) return null;

  return (
    <div className="user-card" id={`user-${user.id}`}>
      <div className="avatar">{user.username.charAt(0).toUpperCase()}</div>
      <div className="user-details">
        <h4 className="user-title">{user.username}</h4>
        <p className="user-email">{user.email}</p>
        <span className={`badge role-${user.role}`}>{user.role}</span>
      </div>
      <div className="card-actions">
        <button className="btn-sm" onClick={() => onEdit && onEdit(user)}>Edit</button>
        <button className="btn-sm btn-danger" onClick={() => onDelete && onDelete(user.id)}>Delete</button>
      </div>
    </div>
  );
}

export default UserCard;
