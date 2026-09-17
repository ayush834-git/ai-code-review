import React from 'react';

export function Header({ currentTenant, user }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="logo-icon">⚡</span>
        <h1>CloudPulse</h1>
      </div>
      <div className="header-tenant">
        <span>Workspace: {currentTenant || 'Default'}</span>
      </div>
      <div className="header-user">
        {user ? (
          <span>Welcome, {user.username}</span>
        ) : (
          <a href="/login">Sign In</a>
        )}
      </div>
    </header>
  );
}

export default Header;
