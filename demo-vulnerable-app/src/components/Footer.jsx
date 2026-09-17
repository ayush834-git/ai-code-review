import React from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <div className="footer-links">
        <a href="/docs">Documentation</a>
        <a href="/status">Status</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </div>
      <p className="copyright">
        &copy; {currentYear} CloudPulse Technologies Inc. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;
