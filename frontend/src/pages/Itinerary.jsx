import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Share2, MapPin, Calendar, DollarSign, Heart, Map, Sun, Tag,
  Edit3, Sparkles, Loader2, Trash2, Plus, Download, Save, X, Clock, Info,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getLatestItinerary, updateItinerary } from '../lib/api';
import { saveAttraction, saveTrip } from '../lib/favorites';
import { useAuth } from '../context/AuthContext';
import { useCurrency, convertFromINR, convertToINR } from '../lib/currency';
import { gsap } from 'gsap';
import RouteMap from './RouteMap';
import './Itinerary.css';

const DAY_EMOJIS = ['🏖️', '🏰', '🛍️', '⛰️', '🌅', '🍃', '🏛️', '🗺️', '🌊', '🏔️'];

const PERIOD_CONFIG = {
  Morning:   { icon: '☀️',  color: '#ff9f1c', bg: 'rgba(255,159,28,0.12)' },
  Afternoon: { icon: '🌤️', color: '#3a86ff', bg: 'rgba(58,134,255,0.12)'  },
  Evening:   { icon: '🌆', color: '#e00072', bg: 'rgba(224,0,114,0.12)'    },
  Night:     { icon: '🌙', color: '#9d4edd', bg: 'rgba(157,78,221,0.12)'   },
};

const PERIODS = ['Morning', 'Afternoon', 'Evening', 'Night'];

const CATEGORY_OPTIONS = ['sightseeing', 'food', 'culture', 'adventure', 'leisure', 'shopping', 'nature', 'photography', 'wellness', 'nightlife'];

const mapTripToTimeline = (trip) =>
  (trip?.itinerary || []).map((day, idx) => ({
    id: `day-${day.day}-${idx}-${Date.now()}`,
    day: day.day,
    title: day.title,
    location: day.location,
    desc: day.description,
    time: day.start_time,
    cost: Number(day.estimated_cost),
    img: DAY_EMOJIS[idx % DAY_EMOJIS.length],
    activities: day.activities || [],
  }));

const Itinerary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currencySymbol = useCurrency();

  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const topBarRef = useRef(null);
  const mapPanelRef = useRef(null);

  const [trip, setTrip] = useState(location.state?.trip || null);
  const [itinerary, setItinerary] = useState([]);
  const [loading, setLoading] = useState(!location.state?.trip);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingFav, setSavingFav] = useState(false);
  const [favSaved, setFavSaved] = useState(false);
  const [favError, setFavError] = useState('');
  const [savedActs, setSavedActs] = useState(new Set());
  const [savingActKey, setSavingActKey] = useState(null);
  const [mapOpen, setMapOpen] = useState(true);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [expandedDays, setExpandedDays] = useState({});

  const [editingDayId, setEditingDayId] = useState(null);
  const [editActivities, setEditActivities] = useState([]);

  const [editInfoId, setEditInfoId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCost, setEditCost] = useState('');

  useEffect(() => {
    if (trip) setItinerary(mapTripToTimeline(trip));
  }, [trip]);

  useEffect(() => {
    if (loading || !pageRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(topBarRef.current, { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.5 })
      .fromTo(heroRef.current, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.55 }, '-=0.25')
      .fromTo('.plan-header-controls', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.2')
      .fromTo('.timeline-item', { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.07 }, '-=0.15');
  }, [loading]);

  useEffect(() => {
    if (location.state?.trip) return;
    let isMounted = true;
    setLoading(true);
    getLatestItinerary()
      .then((data) => { if (isMounted) setTrip(data); })
      .catch(() => { if (isMounted) setError('No itinerary found. Plan a trip from the Dashboard first.'); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [location]);

  const saveToDatabase = async (updatedTimeline) => {
    if (!trip?.trip_id) return;
    setSaving(true);
    try {
      const payload = updatedTimeline.map(item => ({
        day: item.day,
        title: item.title,
        location: item.location,
        description: item.desc,
        start_time: item.time,
        estimated_cost: Number(item.cost),
        activities: item.activities || [],
      }));
      const updatedTrip = await updateItinerary(trip.trip_id, payload);
      setTrip(updatedTrip);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToFavorites = async () => {
    if (!trip) return;
    setSavingFav(true);
    setFavError('');
    try {
      await saveTrip({
        title: `${trip.destination} — ${trip.days}-Day Trip`,
        destination: trip.destination,
        source: trip.source || '',
        days: trip.days,
        tripId: trip.trip_id || '',
        totalCost: trip.total_estimated_cost || trip.budget || 0,
      });
      setFavSaved(true);
    } catch (err) {
      console.error('Save to favorites failed:', err);
      setFavError(err.message || 'Could not save. Make sure you are logged in and the favorites table exists in Supabase.');
    } finally {
      setSavingFav(false);
    }
  };

  const handleSaveAct = async (act, dayLocation) => {
    const key = `${act.name}-${act.time}`;
    if (savedActs.has(key) || savingActKey === key) return;
    setSavingActKey(key);
    try {
      await saveAttraction({
        name: act.name,
        description: act.description,
        category: act.category,
        location: dayLocation,
        cost: act.cost,
      });
      setSavedActs(prev => new Set([...prev, key]));
    } catch (err) {
      console.error('Save attraction failed:', err);
    } finally {
      setSavingActKey(null);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(itinerary);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    const updated = items.map((item, i) => ({ ...item, day: i + 1 }));
    setItinerary(updated);
    saveToDatabase(updated);
  };

  const startActivityEdit = (item) => {
    setEditingDayId(item.id);
    setEditActivities(item.activities.map(a => ({ ...a })));
    setEditInfoId(null);
  };

  const updateActivity = (index, field, value) => {
    setEditActivities(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const deleteActivity = (index) => {
    setEditActivities(prev => prev.filter((_, i) => i !== index));
  };

  const addActivity = (period) => {
    const defaultTimes = { Morning: '8:00 AM', Afternoon: '1:00 PM', Evening: '6:00 PM', Night: '8:30 PM' };
    setEditActivities(prev => [
      ...prev,
      { time: defaultTimes[period] || '9:00 AM', period, name: '', description: '', category: 'sightseeing', cost: 0 },
    ]);
  };

  const saveActivityEdit = () => {
    const periodOrder = { Morning: 0, Afternoon: 1, Evening: 2, Night: 3 };
    const sorted = [...editActivities].sort((a, b) => (periodOrder[a.period] ?? 9) - (periodOrder[b.period] ?? 9));
    const updated = itinerary.map(item =>
      item.id === editingDayId ? { ...item, activities: sorted } : item
    );
    setItinerary(updated);
    setEditingDayId(null);
    setExpandedDays(prev => ({ ...prev, [editingDayId]: true }));
    saveToDatabase(updated);
  };

  const startInfoEdit = (item) => {
    setEditInfoId(item.id);
    setEditTitle(item.title);
    setEditLocation(item.location);
    setEditTime(item.time);
    setEditCost(convertFromINR(item.cost).toString());
    setEditingDayId(null);
  };

  const saveInfoEdit = () => {
    const updated = itinerary.map(item =>
      item.id === editInfoId
        ? { ...item, title: editTitle, location: editLocation, time: editTime, cost: convertToINR(parseFloat(editCost) || 0) }
        : item
    );
    setItinerary(updated);
    setEditInfoId(null);
    saveToDatabase(updated);
  };

  const handleAddDay = () => {
    const newDayNum = itinerary.length + 1;
    const newDay = {
      id: `day-${newDayNum}-${Date.now()}`,
      day: newDayNum,
      title: `Explore ${trip?.destination || 'City'}`,
      location: trip?.destination || '',
      desc: "Customize this day's activities.",
      time: '09:00 AM',
      cost: 2000,
      img: DAY_EMOJIS[newDayNum % DAY_EMOJIS.length],
      activities: [],
    };
    const updated = [...itinerary, newDay];
    setItinerary(updated);
    saveToDatabase(updated);
  };

  const handleDeleteDay = (id) => {
    if (itinerary.length <= 1) { alert('Your trip must have at least one day!'); return; }
    if (!window.confirm('Delete this day?')) return;
    const filtered = itinerary.filter(item => item.id !== id);
    const reordered = filtered.map((item, i) => ({ ...item, day: i + 1 }));
    setItinerary(reordered);
    saveToDatabase(reordered);
  };

  const handleExportCalendar = () => {
    let icsContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Manzil AI//Travel Planner//EN\r\n';
    itinerary.forEach(item => {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      icsContent += `BEGIN:VEVENT\r\nSUMMARY:Manzil: ${item.title}\r\nDESCRIPTION:${item.desc}\r\nLOCATION:${item.location}\r\nDTSTART;VALUE=DATE:${dateStr}\r\nEND:VEVENT\r\n`;
    });
    icsContent += 'END:VCALENDAR\r\n';
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Itinerary_${trip?.destination || 'Trip'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleDayExpand = (id) => setExpandedDays(prev => ({ ...prev, [id]: !prev[id] }));

  const mapPoints = itinerary.map((item, idx) => {
    const total = Math.max(itinerary.length - 1, 1);
    const x = 50 + idx * (460 / total);
    const y = 130 + Math.sin(idx * 1.2) * 55;
    return { ...item, x, y };
  });

  let pathD = '';
  mapPoints.forEach((pt, idx) => {
    if (idx === 0) {
      pathD = `M ${pt.x} ${pt.y}`;
    } else {
      const prev = mapPoints[idx - 1];
      const cx = (prev.x + pt.x) / 2;
      pathD += ` C ${cx} ${prev.y} ${cx} ${pt.y} ${pt.x} ${pt.y}`;
    }
  });

  const totalCost = itinerary.reduce((sum, item) => sum + item.cost, 0);

  if (loading) {
    return (
      <div className="itinerary-container animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px', color: 'var(--text-muted)' }}>
        <Loader2 size={20} className="spin" /> Loading your itinerary...
      </div>
    );
  }

  if (error) {
    return (
      <div className="itinerary-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Plan a Trip</button>
      </div>
    );
  }

  return (
    <div className="itinerary-page-wrapper animate-fade-in" ref={pageRef}>
      <div className="top-bar" ref={topBarRef}>
        <div className="top-left">
          <Link to="/" className="back-btn"><ArrowLeft size={20} /></Link>
          <div className="title-section">
            <h2>Your Trip Itinerary</h2>
            <div className="status-indicator">
              {saving ? (
                <span className="saving-badge"><Loader2 size={12} className="spin" /> Saving...</span>
              ) : (
                <span className="saved-badge">✓ Auto-saved</span>
              )}
            </div>
          </div>
        </div>
        <div className="top-right">
          <button
            className={`btn-primary save-fav-btn ${favSaved ? 'saved' : ''}`}
            onClick={handleSaveToFavorites}
            disabled={savingFav || favSaved}
          >
            {savingFav ? <><Loader2 size={14} className="spin" /> Saving...</> :
             favSaved ? <><Heart size={14} fill="currentColor" /> Saved!</> :
             <><Heart size={14} /> Save Trip</>}
          </button>
          {favSaved && (
            <button className="btn-outline ics-btn" onClick={() => navigate('/favorites')}>
              View Favorites →
            </button>
          )}
          {favError && !favSaved && (
            <span style={{ fontSize: '12px', color: '#ff6b6b', maxWidth: '180px', lineHeight: '1.3' }}>
              ⚠️ {favError}
            </span>
          )}
          {!favSaved && (
            <button className="btn-outline ics-btn" onClick={handleExportCalendar}>
              <Download size={14} /> Export
            </button>
          )}
          <button className="btn-outline print-btn" onClick={() => {
    const allExpanded = {};
    itinerary.forEach(item => { allExpanded[item.id] = true; });
    setExpandedDays(allExpanded);
    setTimeout(() => window.print(), 300);
  }}>Print</button>
        </div>
      </div>

      <div className="hero-card glass-card" ref={heroRef}>
        <div className="hero-details">
          <div className="destination-info">
            <span className="excited-text">🌴 Excited for your trip to</span>
            <h1>{trip?.destination || 'Your Destination'}</h1>
          </div>
          <div className="trip-stats">
            <div className="stat">
              <MapPin size={16} className="text-muted" />
              <div>
                <span className="label">From</span>
                <span className="value">{trip?.source || 'Your City'}</span>
              </div>
            </div>
            <div className="stat">
              <Calendar size={16} className="text-muted" />
              <div>
                <span className="label">Duration</span>
                <span className="value">{itinerary.length} Days</span>
              </div>
            </div>
            <div className="stat">
              <DollarSign size={16} className="text-muted" />
              <div>
                <span className="label">Est. Total</span>
                <span className="value">{currencySymbol}{convertFromINR(totalCost).toLocaleString()}</span>
              </div>
            </div>
            <div className="stat">
              <Heart size={16} className="text-muted" />
              <div>
                <span className="label">Interests</span>
                <span className="value">{(trip?.interests || []).slice(0, 2).join(', ') || '—'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="ai-badge">
          <Sparkles size={22} className="text-gradient animate-pulse" />
          <span className="badge-title">AI Optimized</span>
          <span className="badge-desc">Morning · Afternoon · Evening · Night</span>
        </div>
      </div>

      <div className="plan-header-controls">
        <div className="plan-title">
          <Calendar size={22} color="var(--primary)" />
          <div>
            <h3>Day-wise Plan</h3>
            <p>Drag to reorder · Edit activities · Expand to see full schedule</p>
          </div>
        </div>
        <button className="btn-outline map-toggle" onClick={() => setMapOpen(true)}>
          <Map size={16} /> View Full Map
        </button>
      </div>

      <div className="itinerary-layout-split">
        <div className="itinerary-timeline-panel">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="itinerary">
              {(provided) => (
                <div className="timeline" {...provided.droppableProps} ref={provided.innerRef}>
                  <div className="timeline-line"></div>

                  {itinerary.map((item, index) => {
                    const isActivityEditing = editingDayId === item.id;
                    const isInfoEditing = editInfoId === item.id;
                    const isExpanded = expandedDays[item.id];
                    const hasActivities = item.activities && item.activities.length > 0;

                    const groupedActivities = {};
                    (item.activities || []).forEach(act => {
                      const p = act.period || 'Morning';
                      if (!groupedActivities[p]) groupedActivities[p] = [];
                      groupedActivities[p].push(act);
                    });

                    return (
                      <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={isActivityEditing || isInfoEditing}>
                        {(provided) => (
                          <div
                            className={`timeline-item ${activeDayIdx === index ? 'focused' : ''}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => setActiveDayIdx(index)}
                          >
                            <div className="timeline-marker"><div className="dot"></div></div>
                            <div className="day-indicator">
                              <span className="day-label">DAY</span>
                              <span className="day-number">{item.day}</span>
                            </div>

                            {isActivityEditing ? (
                              <div className="activity-card glass-card activity-editor-card">
                                <div className="editor-header">
                                  <div>
                                    <h4>Edit Day {item.day} — {item.title}</h4>
                                    <p className="editor-subhead">Edit, add, or remove activities in each period</p>
                                  </div>
                                  <div className="editor-header-actions">
                                    <button className="btn-outline small" onClick={(e) => { e.stopPropagation(); setEditingDayId(null); }}>
                                      <X size={13} /> Cancel
                                    </button>
                                    <button className="btn-primary small" onClick={(e) => { e.stopPropagation(); saveActivityEdit(); }}>
                                      <Save size={13} /> Save Changes
                                    </button>
                                  </div>
                                </div>

                                {PERIODS.map(period => {
                                  const cfg = PERIOD_CONFIG[period];
                                  return (
                                    <div key={period} className="edit-period-section">
                                      <div className="edit-period-header" style={{ color: cfg.color, background: cfg.bg }}>
                                        <span>{cfg.icon}</span>
                                        <span>{period}</span>
                                      </div>

                                      {editActivities.map((act, idx) => {
                                        if (act.period !== period) return null;
                                        return (
                                          <div key={idx} className="edit-activity-row" onClick={e => e.stopPropagation()}>
                                            <input
                                              className="act-field act-time"
                                              placeholder="Time"
                                              value={act.time}
                                              onChange={e => updateActivity(idx, 'time', e.target.value)}
                                            />
                                            <input
                                              className="act-field act-name"
                                              placeholder="Attraction / Activity name"
                                              value={act.name}
                                              onChange={e => updateActivity(idx, 'name', e.target.value)}
                                            />
                                            <input
                                              className="act-field act-desc"
                                              placeholder="Brief description"
                                              value={act.description}
                                              onChange={e => updateActivity(idx, 'description', e.target.value)}
                                            />
                                            <select
                                              className="act-field act-cat"
                                              value={act.category || 'sightseeing'}
                                              onChange={e => updateActivity(idx, 'category', e.target.value)}
                                            >
                                              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <input
                                              className="act-field act-cost"
                                              type="number"
                                              placeholder="Cost ₹"
                                              value={act.cost ?? 0}
                                              onChange={e => updateActivity(idx, 'cost', parseFloat(e.target.value) || 0)}
                                            />
                                            <button
                                              className="act-delete-btn"
                                              onClick={(e) => { e.stopPropagation(); deleteActivity(idx); }}
                                              title="Remove activity"
                                            >
                                              <X size={14} />
                                            </button>
                                          </div>
                                        );
                                      })}

                                      <button
                                        className="add-activity-btn"
                                        style={{ color: cfg.color, borderColor: cfg.color }}
                                        onClick={(e) => { e.stopPropagation(); addActivity(period); }}
                                      >
                                        <Plus size={13} /> Add {period} activity
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : isInfoEditing ? (
                              <div className="activity-card glass-card editing-card">
                                <div className="edit-form">
                                  <p className="edit-form-title">Edit Day Info</p>
                                  <div className="edit-row">
                                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Day Title" />
                                    <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="Location" />
                                  </div>
                                  <div className="edit-row">
                                    <input type="text" value={editTime} onChange={e => setEditTime(e.target.value)} placeholder="Start Time" />
                                    <input type="number" value={editCost} onChange={e => setEditCost(e.target.value)} placeholder="Est. Cost" />
                                  </div>
                                  <div className="edit-actions">
                                    <button className="btn-outline small" onClick={(e) => { e.stopPropagation(); setEditInfoId(null); }}><X size={12} /> Cancel</button>
                                    <button className="btn-primary small" onClick={(e) => { e.stopPropagation(); saveInfoEdit(); }}><Save size={12} /> Save</button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="activity-card glass-card">
                                <div className="activity-img">
                                  <span className="emoji-huge">{item.img}</span>
                                </div>
                                <div className="activity-content">
                                  <h4>{item.title}</h4>
                                  <p className="location"><MapPin size={13} /> {item.location}</p>
                                  <p className="desc">{item.desc}</p>

                                  {hasActivities && (
                                    <button
                                      className="expand-activities-btn"
                                      onClick={(e) => { e.stopPropagation(); toggleDayExpand(item.id); }}
                                    >
                                      {isExpanded ? `▲ Hide Schedule` : `▼ View ${item.activities.length} Activities`}
                                    </button>
                                  )}

                                  {isExpanded && hasActivities && (
                                    <div className="activities-breakdown">
                                      {PERIODS.map(period => {
                                        const acts = groupedActivities[period];
                                        if (!acts || acts.length === 0) return null;
                                        const cfg = PERIOD_CONFIG[period];
                                        return (
                                          <div key={period} className="period-group">
                                            <div className="period-header" style={{ color: cfg.color }}>
                                              <span className="period-icon">{cfg.icon}</span>
                                              <span className="period-name">{period}</span>
                                              <span className="period-count">{acts.length} activities</span>
                                            </div>
                                            {acts.map((act, ai) => {
                                              const actKey = `${act.name}-${act.time}`;
                                              const isActSaved = savedActs.has(actKey);
                                              const isActSaving = savingActKey === actKey;
                                              return (
                                                <div key={ai} className="activity-item" style={{ borderLeftColor: cfg.color }}>
                                                  <div className="act-time-badge" style={{ background: cfg.bg, color: cfg.color }}>
                                                    {act.time}
                                                  </div>
                                                  <div className="act-details">
                                                    <strong>{act.name}</strong>
                                                    <p>{act.description}</p>
                                                  </div>
                                                  {act.cost != null && (
                                                    <div className="act-cost">
                                                      {act.cost === 0 ? 'Free' : `${currencySymbol}${convertFromINR(act.cost).toLocaleString()}`}
                                                    </div>
                                                  )}
                                                  <button
                                                    className={`act-save-btn ${isActSaved ? 'saved' : ''}`}
                                                    onClick={(e) => { e.stopPropagation(); handleSaveAct(act, item.location); }}
                                                    disabled={isActSaved || isActSaving}
                                                    title={isActSaved ? 'Saved!' : 'Save to favorites'}
                                                  >
                                                    <Heart size={13} fill={isActSaved ? 'currentColor' : 'none'} />
                                                  </button>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                <div className="activity-meta">
                                  <div className="meta-item">
                                    <Sun size={15} className="text-warning" />
                                    <div>
                                      <span className="meta-val">{item.time}</span>
                                      <span className="meta-lbl">Starts</span>
                                    </div>
                                  </div>
                                  <div className="meta-item">
                                    <Tag size={15} className="text-muted" />
                                    <div>
                                      <span className="meta-val">{currencySymbol}{convertFromINR(item.cost).toLocaleString()}</span>
                                      <span className="meta-lbl">Day Cost</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="activity-actions">
                                  <button
                                    className="icon-btn primary-action"
                                    onClick={(e) => { e.stopPropagation(); startActivityEdit(item); }}
                                    title="Edit activities"
                                  >
                                    <Edit3 size={15} />
                                  </button>
                                  <button
                                    className="icon-btn"
                                    onClick={(e) => { e.stopPropagation(); startInfoEdit(item); }}
                                    title="Edit day info (title, location, cost)"
                                  >
                                    <Info size={15} />
                                  </button>
                                  <button
                                    className="icon-btn danger"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteDay(item.id); }}
                                    title="Delete day"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <button className="btn-outline add-day-btn" onClick={handleAddDay}>
            <Plus size={16} /> Add Travel Day
          </button>
        </div>

      </div>

      {mapOpen && (
        <div
          className="map-fullscreen-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setMapOpen(false); }}
        >
          <div className="map-fullscreen-modal">
            <div className="map-modal-header">
              <div className="map-modal-title">
                <Map size={20} />
                <div>
                  <h3>Route Map — {trip?.destination || 'Your Trip'}</h3>
                  <p>GPS navigation · Real road routing · Multi-stop</p>
                </div>
              </div>
              <button className="map-modal-close" onClick={() => setMapOpen(false)} title="Close map">
                <X size={20} />
              </button>
            </div>

            <div className="map-modal-body">
              <RouteMap
                itinerary={itinerary}
                activeDayIdx={activeDayIdx}
                setActiveDayIdx={setActiveDayIdx}
                currencySymbol={currencySymbol}
                convertFromINR={convertFromINR}
              />
            </div>

            <div className="map-modal-footer">
              <div className="mmf-stat">
                <span className="mmf-val">{itinerary.length}</span>
                <span className="mmf-lbl">Days</span>
              </div>
              <div className="mmf-divider" />
              <div className="mmf-stat">
                <span className="mmf-val">{itinerary.reduce((s, d) => s + (d.activities?.length || 0), 0)}</span>
                <span className="mmf-lbl">Activities</span>
              </div>
              <div className="mmf-divider" />
              <div className="mmf-stat">
                <span className="mmf-val">{currencySymbol}{convertFromINR(totalCost).toLocaleString()}</span>
                <span className="mmf-lbl">Est. Total</span>
              </div>
              {itinerary[activeDayIdx] && (
                <>
                  <div className="mmf-divider" />
                  <div className="mmf-active-day">
                    <span className="mmf-day-emoji">{itinerary[activeDayIdx].img}</span>
                    <div>
                      <div className="mmf-day-title">{itinerary[activeDayIdx].title}</div>
                      <div className="mmf-day-loc"><MapPin size={11} /> {itinerary[activeDayIdx].location}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="itinerary-footer glass-card">
        <div className="total-cost">
          <span className="label">Total Estimated Cost</span>
          <span className="value">{currencySymbol}{convertFromINR(totalCost).toLocaleString()}</span>
        </div>
        <div className="footer-stats">
          <div className="f-stat">
            <Calendar size={20} color="var(--primary)" />
            <div>
              <span className="val">{itinerary.length} Days</span>
              <span className="lbl">Duration</span>
            </div>
          </div>
          <div className="f-stat">
            <Sparkles size={20} color="var(--secondary)" />
            <div>
              <span className="val">{itinerary.reduce((s, d) => s + (d.activities?.length || 0), 0)}</span>
              <span className="lbl">Activities</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Itinerary;
