import { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, DollarSign, Sparkles, Heart, Loader2, X, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateItinerary, listTrips } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency, convertFromINR } from '../lib/currency';
import { gsap } from 'gsap';
import './Dashboard.css';

const BUDGET_MAP = {
  'Budget': 2000,
  'Medium': 4500,
  'Luxury': 10000,
};

const PRESET_INTERESTS = ['Culture', 'Nature', 'Food', 'Adventure', 'History', 'Shopping', 'Beach', 'Photography', 'Nightlife', 'Wellness', 'Relaxation', 'Art'];

const TRAVEL_TYPES = [
  { key: 'Solo', emoji: '🚶', desc: 'Independent travel' },
  { key: 'Couple', emoji: '👫', desc: 'Romantic getaway' },
  { key: 'Family', emoji: '👨‍👩‍👧‍👦', desc: 'Family vacation' },
  { key: 'Friends', emoji: '🍻', desc: 'Group adventure' },
];

const TRENDING = [
  { name: 'Goa', image: '/goa.png', type: 'Beach', rating: 4.8, price: '₹15k', days: '3-5' },
  { name: 'Manali', image: '/manali.png', type: 'Mountains', rating: 4.9, price: '₹12k', days: '4-6' },
  { name: 'Kerala', image: '/kerala.png', type: 'Nature', rating: 4.7, price: '₹18k', days: '5-7' },
  { name: 'Jaipur', image: '/jaipur.png', type: 'Heritage', rating: 4.6, price: '₹10k', days: '3-4' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const currencySymbol = useCurrency();

  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const formRef = useRef(null);
  const rightPanelRef = useRef(null);
  const typeGridRef = useRef(null);
  const suggestionsRef = useRef(null);
  const budgetHintRef = useRef(null);
  const prevDays = useRef('');

  const [source, setSource] = useState('New Delhi');
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [recentTrips, setRecentTrips] = useState([]);

  const [budget, setBudget] = useState('Medium');
  const [interests, setInterests] = useState([]);
  const [travelType, setTravelType] = useState('Couple');
  const [customInterest, setCustomInterest] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (location.state?.prefilledDestination) {
      setDestination(location.state.prefilledDestination);
    }
  }, [location]);

  useEffect(() => {
    if (user) {
      if (user.user_metadata?.preferences?.departure_city) {
        setSource(user.user_metadata.preferences.departure_city);
      }
      listTrips()
        .then(data => setRecentTrips(data.slice(0, 3)))
        .catch(err => console.warn('Could not fetch recent trips:', err.message));
    }
  }, [user]);

  useEffect(() => {
    if (!containerRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      headerRef.current,
      { opacity: 0, y: -24 },
      { opacity: 1, y: 0, duration: 0.55 }
    )
    .fromTo(
      formRef.current,
      { opacity: 0, x: -32 },
      { opacity: 1, x: 0, duration: 0.6 },
      '-=0.3'
    )
    .fromTo(
      rightPanelRef.current,
      { opacity: 0, x: 32 },
      { opacity: 1, x: 0, duration: 0.6 },
      '<'
    )
    .fromTo(
      typeGridRef.current ? typeGridRef.current.querySelectorAll('.type-card') : [],
      { opacity: 0, y: 20, scale: 0.93 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.08 },
      '-=0.25'
    )
    .fromTo(
      suggestionsRef.current ? suggestionsRef.current.querySelectorAll('.suggestion-card') : [],
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.09 },
      '-=0.2'
    );
  }, []);

  useEffect(() => {
    if (!budgetHintRef.current) return;
    if (days && days !== prevDays.current) {
      gsap.fromTo(
        budgetHintRef.current,
        { opacity: 0, scale: 0.9, y: -6 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.6)' }
      );
      prevDays.current = days;
    }
  }, [days]);

  const toggleInterest = (interest) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const addCustomInterest = () => {
    const val = customInterest.trim();
    if (val && !interests.includes(val)) {
      setInterests(prev => [...prev, val]);
    }
    setCustomInterest('');
    setShowCustomInput(false);
  };

  const removeInterest = (interest) => {
    setInterests(prev => prev.filter(i => i !== interest));
  };

  const handlePlanTrip = async (e, overrideDest = null, overrideDays = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    const finalDest = overrideDest || destination;
    const finalDays = parseInt(overrideDays || days, 10);

    if (!finalDest.trim()) { setError('Please enter a destination.'); return; }
    if (!finalDays || finalDays <= 0) { setError('Please enter a valid number of days.'); return; }

    const budgetINR = BUDGET_MAP[budget] * finalDays;
    const allInterests = [...interests, `${travelType} Trip`];

    setGenerating(true);
    try {
      const trip = await generateItinerary({
        source,
        destination: finalDest,
        days: finalDays,
        budget: budgetINR,
        interests: allInterests,
      });
      navigate('/itinerary', { state: { trip } });
    } catch (err) {
      setError(err.message || 'Something went wrong while generating your itinerary.');
    } finally {
      setGenerating(false);
    }
  };

  const budgetPerDay = BUDGET_MAP[budget];

  return (
    <div className="dashboard-container animate-fade-in" ref={containerRef}>
      <div className="dashboard-header" ref={headerRef}>
        <div>
          <h2>Plan Your Perfect Trip</h2>
          <p>Tell us your preferences and let AI craft the perfect journey for you.</p>
        </div>
        <div className="header-actions">
          <button className="user-avatar-btn" onClick={() => navigate('/profile')} title="Go to Profile">
            {(user?.user_metadata?.full_name || user?.email || 'T').charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="plan-form glass-card" ref={formRef}>
          <div className="form-group">
            <label>Departure City</label>
            <div className="input-wrapper">
              <MapPin className="input-icon" size={18} />
              <input
                type="text"
                placeholder="Where are you departing from?"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                disabled={generating}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Destination</label>
            <div className="input-wrapper">
              <MapPin className="input-icon" size={18} />
              <input
                type="text"
                placeholder="Enter your dream destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={generating}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Trip Duration</label>
            <div className="input-wrapper">
              <Calendar className="input-icon" size={18} />
              <input
                type="number"
                min="1"
                max="60"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                disabled={generating}
                placeholder="Number of days"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Budget Per Day</label>
            <div className="budget-selector">
              {Object.entries(BUDGET_MAP).map(([label, perDay]) => (
                <button
                  key={label}
                  className={`budget-option ${budget === label ? 'active' : ''}`}
                  onClick={() => setBudget(label)}
                  disabled={generating}
                >
                  <span className="budget-label">{label === 'Budget' ? '💰' : label === 'Medium' ? '💳' : '💎'} {label}</span>
                  <span className="budget-amount">₹{perDay.toLocaleString()}/day</span>
                </button>
              ))}
            </div>
            {days && (
              <p className="budget-total-hint" ref={budgetHintRef}>
                Total budget: ₹{(budgetPerDay * parseInt(days || 1, 10)).toLocaleString()} for {days} day{days > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="form-group interests-section">
            <label>Travel Interests</label>
            <div className="interest-chips">
              {PRESET_INTERESTS.map(interest => (
                <button
                  key={interest}
                  className={`chip ${interests.includes(interest) ? 'active' : ''}`}
                  onClick={() => toggleInterest(interest)}
                  disabled={generating}
                >
                  {interest}
                </button>
              ))}

              {interests.filter(i => !PRESET_INTERESTS.includes(i)).map(custom => (
                <span key={custom} className="chip active custom-chip">
                  {custom}
                  <button className="remove-custom" onClick={() => removeInterest(custom)}><X size={10} /></button>
                </span>
              ))}

              {showCustomInput ? (
                <span className="custom-input-wrapper">
                  <input
                    className="custom-chip-input"
                    value={customInterest}
                    onChange={e => setCustomInterest(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addCustomInterest(); if (e.key === 'Escape') setShowCustomInput(false); }}
                    placeholder="Type & Enter"
                    autoFocus
                  />
                  <button className="inline-add-btn" onClick={addCustomInterest}>✓</button>
                </span>
              ) : (
                <button className="chip add-more" disabled={generating} onClick={() => setShowCustomInput(true)}>
                  <Plus size={12} /> Add More
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          <button className="btn-primary plan-btn" onClick={handlePlanTrip} disabled={generating}>
            {generating ? (
              <><Loader2 size={18} className="spin" /> Crafting your itinerary...</>
            ) : (
              <><Sparkles size={18} /> Plan My Trip</>
            )}
          </button>

          {recentTrips.length > 0 && (
            <div className="recent-trips-selector">
              <span className="recent-lbl">Jump to saved trips:</span>
              <div className="recent-links">
                {recentTrips.map((rt) => (
                  <button
                    key={rt.trip_id}
                    className="btn-outline recent-trip-link"
                    onClick={() => navigate('/itinerary', { state: { trip: rt } })}
                  >
                    🌴 {rt.destination} ({rt.days}D)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-right" ref={rightPanelRef}>
          <div className="travel-types animate-fade-in">
            <h3>How are you traveling?</h3>
            <p className="subtitle">Select your travel style</p>
            <div className="type-grid" ref={typeGridRef}>
              {TRAVEL_TYPES.map(({ key, emoji, desc }) => (
                <div
                  key={key}
                  className={`type-card glass-card ${travelType === key ? 'active' : ''}`}
                  onClick={() => setTravelType(key)}
                >
                  <div className="type-icon">{emoji}</div>
                  <h4>{key}</h4>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="trending-destinations animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="section-header">
              <h3><MapPin size={20} color="var(--primary)" /> Trending Destinations</h3>
              <button className="btn-outline view-all">View All</button>
            </div>
            <div className="suggestion-cards" ref={suggestionsRef}>
              {TRENDING.map(dest => (
                <div
                  key={dest.name}
                  className="suggestion-card glass-card clickable-suggestion"
                  onClick={() => {
                    setDestination(dest.name);
                    setDays('4');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div
                    className="card-img-placeholder"
                    style={{ backgroundImage: `url(${dest.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                  >
                    <Heart className="heart-icon" size={18} />
                    <div className="badge type-badge">{dest.type}</div>
                  </div>
                  <div className="card-info">
                    <h4>{dest.name}</h4>
                    <p className="meta">India • {dest.days} days</p>
                    <div className="card-footer">
                      <span className="rating">★ {dest.rating}</span>
                      <span className="price">{dest.price} <span>/person</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
