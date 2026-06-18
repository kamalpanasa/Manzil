import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { User, Mail, Compass, Star, CheckCircle, Award, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { useCurrency, convertFromINR } from '../lib/currency';
import { gsap } from 'gsap';
import './Profile.css';

const PREDEFINED_STYLES = ['Backpacker', 'Luxury Traveler', 'Adventure Seeker', 'Food Enthusiast', 'History Buff', 'Nature Lover', 'Slow Travel', 'Solo Wanderer'];

const Profile = () => {
  const { user } = useAuth();
  const currencySymbol = useCurrency();

  const pageRef = useRef(null);
  const headerRef = useRef(null);
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const avatarRef = useRef(null);
  const statsGridRef = useRef(null);

  const [fullName, setFullName] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [selectedStyles, setSelectedStyles] = useState([]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setDepartureCity(user.user_metadata?.preferences?.departure_city || 'New Delhi');
      setSelectedStyles(user.user_metadata?.preferences?.travel_styles || []);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setStatsLoading(true);

    const fetchStats = async () => {
      try {
        const { data: tripsData, error: tripsError } = await supabase
          .from('trips')
          .select('days, total_estimated_cost')
          .eq('user_id', user.id);

        if (tripsError) throw tripsError;

        const trips = tripsData || [];
        const tripsPlanned = trips.length;
        const totalDays = trips.reduce((sum, t) => sum + (t.days || 0), 0);
        const totalBudget = trips.reduce((sum, t) => sum + parseFloat(t.total_estimated_cost || 0), 0);

        const { count: favCount } = await supabase
          .from('favorites')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setStats({
          trips_planned: tripsPlanned,
          total_days: totalDays,
          total_budget_managed: totalBudget,
          favorites_count: favCount || 0,
          saved_trips: tripsPlanned,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
        setStats({ trips_planned: 0, total_days: 0, total_budget_managed: 0, favorites_count: 0, saved_trips: 0 });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  useEffect(() => {
    if (!pageRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5 }
    )
    .fromTo(leftPanelRef.current,
      { opacity: 0, x: -36, scale: 0.97 },
      { opacity: 1, x: 0, scale: 1, duration: 0.6 },
      '-=0.25'
    )
    .fromTo(rightPanelRef.current,
      { opacity: 0, x: 36, scale: 0.97 },
      { opacity: 1, x: 0, scale: 1, duration: 0.6 },
      '<'
    );

    if (avatarRef.current) {
      tl.fromTo(avatarRef.current,
        { scale: 0.4, opacity: 0, rotation: -15 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.65, ease: 'back.out(1.8)' },
        '-=0.45'
      );
    }
  }, []);

  useEffect(() => {
    if (statsLoading || !statsGridRef.current) return;
    gsap.fromTo(
      statsGridRef.current.querySelectorAll('.stat-item'),
      { opacity: 0, y: 20, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.1, ease: 'back.out(1.4)' }
    );
  }, [statsLoading]);

  const toggleStyle = (style) => {
    setSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          preferences: {
            departure_city: departureCity,
            travel_styles: selectedStyles,
          },
        },
      });

      if (error) throw error;
      setMessage('Profile settings saved successfully! ✨');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Could not update profile metadata.');
    } finally {
      setSaving(false);
    }
  };

  const initials = fullName
    ? fullName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U';

  const budgetFormatted = stats
    ? `${currencySymbol}${(convertFromINR(stats.total_budget_managed) / 1000).toFixed(1)}K`
    : '—';

  return (
    <div className="profile-page animate-fade-in" ref={pageRef}>
      <div className="profile-header-title" ref={headerRef}>
        <h2>User Profile</h2>
        <p>Manage your account settings and travel preferences</p>
      </div>

      <div className="profile-layout">
        <div className="profile-left glass-panel" ref={leftPanelRef}>
          <div className="profile-avatar-section">
            <div className="avatar-large" ref={avatarRef}>{initials}</div>
            <h3>{fullName || 'Wanderer'}</h3>
            <p className="user-email"><Mail size={14} style={{ marginRight: 6 }} />{user?.email}</p>
            <div className="travel-badge">
              <Award size={14} /> Explorer Rank: {(stats?.trips_planned || 0) >= 5 ? 'Gold' : (stats?.trips_planned || 0) >= 2 ? 'Silver' : 'Bronze'}
            </div>
          </div>

          <div className="profile-stats">
            <h4>Travel Statistics</h4>
            {statsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', padding: '20px 0' }}>
                <Loader2 size={16} className="spin" /> Loading stats...
              </div>
            ) : (
              <div className="stats-grid" ref={statsGridRef}>
                <div className="stat-item glass-card">
                  <Compass size={20} className="icon-blue" />
                  <span className="num">{stats?.trips_planned ?? 0}</span>
                  <span className="lbl">Trips Planned</span>
                </div>
                <div className="stat-item glass-card">
                  <Calendar size={20} className="icon-pink" />
                  <span className="num">{stats?.total_days ?? 0}</span>
                  <span className="lbl">Total Days</span>
                </div>
                <div className="stat-item glass-card">
                  <DollarSign size={20} className="icon-green" />
                  <span className="num">{budgetFormatted}</span>
                  <span className="lbl">Budget Tracked</span>
                </div>
                <div className="stat-item glass-card">
                  <Star size={20} className="icon-yellow" />
                  <span className="num">{stats?.favorites_count ?? 0}</span>
                  <span className="lbl">Places Saved</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="profile-right glass-panel" ref={rightPanelRef}>
          <h3>Preferences & Details</h3>
          <p className="subtitle">These preferences customize the AI itinerary recommendations</p>

          {message && (
            <div className="success-banner animate-fade-in">
              <CheckCircle size={16} /> {message}
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSaveProfile} className="profile-form">
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User className="input-icon" size={16} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Prabh J."
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Default Departure City</label>
              <div className="input-with-icon">
                <Compass className="input-icon" size={16} />
                <input
                  type="text"
                  value={departureCity}
                  onChange={(e) => setDepartureCity(e.target.value)}
                  placeholder="e.g. New Delhi"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Travel Styles</label>
              <p className="sub-label">Select your favorite types of trips to custom-tailor recommendations</p>
              <div className="style-chips-grid">
                {PREDEFINED_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    className={`style-chip ${selectedStyles.includes(style) ? 'active' : ''}`}
                    onClick={() => toggleStyle(style)}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary save-profile-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
