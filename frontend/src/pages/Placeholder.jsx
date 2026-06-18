import React from 'react';
import { Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Placeholder = () => {
  const location = useLocation();
  const pageName = location.pathname.replace('/', '').charAt(0).toUpperCase() + location.pathname.slice(2);
  
  // Custom titles mapping based on path
  const titles = {
    '/budget': 'Trip Budget',
    '/favorites': 'Saved Favorites',
    '/profile': 'User Profile',
    '/settings': 'Application Settings'
  };

  const title = titles[location.pathname] || 'Page Under Construction';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: 'var(--text-muted)' }}>
      <div className="glass-card" style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '500px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(157, 78, 221, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={40} color="var(--primary)" />
        </div>
        <div>
          <h2 style={{ color: 'white', marginBottom: '8px', fontSize: '1.8rem' }}>{title}</h2>
          <p style={{ lineHeight: '1.6' }}>This feature is currently in development. Check back soon for exciting updates to your smart travel planner!</p>
        </div>
        <button className="btn-outline" onClick={() => window.history.back()}>Go Back</button>
      </div>
    </div>
  );
};

export default Placeholder;
