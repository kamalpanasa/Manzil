import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  PieChart,
  Sparkles,
  Heart,
  User,
  Settings,
  LogOut,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Itinerary', path: '/itinerary', icon: <Map size={20} /> },
    { name: 'Budget', path: '/budget', icon: <PieChart size={20} /> },
    { name: 'AI Assistant', path: '/chat', icon: <Sparkles size={20} /> },
    { name: 'Favorites', path: '/favorites', icon: <Heart size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  const profileMenuItems = [
    { label: 'My Profile', icon: <User size={16} />, path: '/profile' },
    { label: 'My Trips', icon: <Map size={16} />, path: '/itinerary' },
    { label: 'Favorites', icon: <Heart size={16} />, path: '/favorites' },
    { label: 'Budget Tracker', icon: <PieChart size={16} />, path: '/budget' },
    { label: 'Settings', icon: <Settings size={16} />, path: '/settings' },
  ];

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email || 'Traveler';
  const shortName = displayName.split(' ')[0];
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className={`sidebar glass-panel ${isOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <Sparkles className="logo-icon" size={24} color="var(--primary)" />
          <span className="logo-text">Manzil</span>
        </div>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer" ref={dropdownRef}>
        {dropdownOpen && (
          <div className="profile-dropdown glass-panel animate-fade-in">
            <div className="dropdown-user-info">
              <div className="dropdown-avatar">{initial}</div>
              <div>
                <p className="dropdown-name">{displayName}</p>
                <p className="dropdown-email">{user?.email}</p>
              </div>
            </div>
            <div className="dropdown-divider"></div>
            {profileMenuItems.map((item, i) => (
              <button
                key={i}
                className="dropdown-item"
                onClick={() => { navigate(item.path); setDropdownOpen(false); handleNavClick(); }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
            <div className="dropdown-divider"></div>
            <button className="dropdown-item logout-item" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}

        <button
          className="sidebar-user-btn"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className="sidebar-user-avatar">{initial}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{shortName}</span>
            <span className="sidebar-user-role">Traveler</span>
          </div>
          <ChevronDown
            size={16}
            className="dropdown-chevron"
            style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
