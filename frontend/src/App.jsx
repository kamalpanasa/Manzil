import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Menu, LayoutDashboard, Map, PieChart, Sparkles, Heart, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Itinerary from './pages/Itinerary';
import ChatAssistant from './pages/ChatAssistant';
import Budget from './pages/Budget';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import SettingsPage from './pages/Settings';
import Placeholder from './pages/Placeholder';
import { useAuth } from './context/AuthContext';
import './index.css';

const mobileNavItems = [
  { name: 'Home', path: '/', icon: <LayoutDashboard size={20} /> },
  { name: 'Itinerary', path: '/itinerary', icon: <Map size={20} /> },
  { name: 'Budget', path: '/budget', icon: <PieChart size={20} /> },
  { name: 'AI Chat', path: '/chat', icon: <Sparkles size={20} /> },
  { name: 'Saved', path: '/favorites', icon: <Heart size={20} /> },
];

function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email || 'T';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="app-container">
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {mobileSidebarOpen && (
        <div className="mobile-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}

      <div className="main-wrapper">
        <header className="mobile-header">
          <button className="mobile-hamburger" onClick={() => setMobileSidebarOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <div className="mobile-logo-wrap">
            <Sparkles size={18} color="var(--primary)" />
            <span className="mobile-logo-text">Manzil</span>
          </div>
          <div className="mobile-user-avatar">{initial}</div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/itinerary" element={<Itinerary />} />
            <Route path="/chat" element={<ChatAssistant />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>

        <nav className="mobile-bottom-nav">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
