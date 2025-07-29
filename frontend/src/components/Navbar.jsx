
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  let links = [];
  if (isAuthenticated && user) {
    if (user.role === 'user') {
      links = [
        { to: '/', label: 'Home' },
        { to: '/user-dashboard', label: 'Dashboard' },
        { to: '/browse-services', label: 'Browse Services' }
      ];
    } else if (user.role === 'provider') {
      links = [
        { to: '/', label: 'Home' },
        { to: '/provider-dashboard', label: 'Dashboard' },
        { to: '/provider-dashboard', label: 'My Services' }
      ];
    } else if (user.role === 'admin') {
      links = [
        { to: '/', label: 'Home' },
        { to: '/admin-dashboard', label: 'Dashboard' },
        { to: '/admin-dashboard', label: 'Manage Platform' }
      ];
    }
  } else {
    links = [
      { to: '/', label: 'Home' },
      { to: '/login', label: 'Login' },
      { to: '/signup', label: 'Sign Up' }
    ];
  }

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/" style={{ textDecoration: 'none', color: '#2d3748', fontWeight: 'bold', fontSize: '1.5rem' }}>
          <span style={{ color: '#4299e1' }}>OneForAll</span>
        </Link>
      </div>
      <div className="navbar-links">
        {links.map(link => (
          <Link
            key={link.label}
            to={link.to}
            className="navbar-link"
            style={{
              fontWeight: '500',
              color: '#2d3748',
              padding: '0.5rem 1.2rem',
              borderRadius: '6px',
              transition: 'background 0.2s',
              marginRight: '0.5rem',
              textDecoration: 'none'
            }}
          >
            {link.label}
          </Link>
        ))}
        {isAuthenticated && (
          <button
            onClick={logout}
            className="navbar-logout"
            style={{
              background: '#4299e1',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem 1.2rem',
              fontWeight: '500',
              cursor: 'pointer',
              marginLeft: '0.5rem',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => (e.target.style.background = '#2b6cb0')}
            onMouseOut={e => (e.target.style.background = '#4299e1')}
          >
            Logout
          </button>
        )}
      </div>
      <style>{`
        .navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 2rem;
          background: #f7fafc;
          box-shadow: 0 2px 8px rgba(66, 153, 225, 0.08);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .navbar-logo {
          font-size: 1.5rem;
          font-weight: bold;
        }
        .navbar-links {
          display: flex;
          align-items: center;
        }
        .navbar-link:hover {
          background: #e2e8f0;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
