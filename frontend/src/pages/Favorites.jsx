import { useState, useEffect } from 'react';
import { Heart, MapPin, Star, Trash2, Sparkles, Navigation, Plus, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listFavorites, deleteFavorite, addFavorite } from '../lib/favorites';
import { useCurrency, convertFromINR, convertToINR } from '../lib/currency';
import './Favorites.css';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'trip', label: 'Trips' },
  { key: 'place', label: 'Places' },
];

const Favorites = () => {
  const navigate = useNavigate();
  const currencySymbol = useCurrency();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [favType, setFavType] = useState('destination');
  const [favTitle, setFavTitle] = useState('');
  const [favLocation, setFavLocation] = useState('');
  const [favImage, setFavImage] = useState('📍');
  const [favPrice, setFavPrice] = useState('');
  const [favDesc, setFavDesc] = useState('');
  const [savingFav, setSavingFav] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listFavorites();
      setFavorites(data);
    } catch (err) {
      setError(err.message || 'Failed to load favorites.');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item from your favorites?')) return;
    try {
      await deleteFavorite(id);
      setFavorites(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error(err);
      setFavorites(prev => prev.filter(f => f.id !== id));
    }
  };

  const handlePlanTrip = (destinationName) => {
    navigate('/', { state: { prefilledDestination: destinationName } });
  };

  const resetModal = () => {
    setFavTitle('');
    setFavLocation('');
    setFavDesc('');
    setFavPrice('');
    setFavImage('📍');
    setFavType('destination');
  };

  const handleAddFavorite = async (e) => {
    e.preventDefault();
    if (!favTitle.trim()) return;

    setSavingFav(true);
    try {
      const newFav = await addFavorite({
        type: favType,
        title: favTitle,
        location: favLocation,
        image_url: favImage,
        rating: 5.0,
        price: favPrice ? convertToINR(parseFloat(favPrice)) : null,
        description: favDesc,
      });
      setFavorites(prev => [newFav, ...prev]);
      setShowModal(false);
      resetModal();
    } catch (err) {
      console.error(err);
      setError('Could not save to database. Please check your Supabase favorites table is set up.');
    } finally {
      setSavingFav(false);
    }
  };

  const filteredFavorites = favorites.filter(f => {
    if (activeTab === 'all') return true;
    if (activeTab === 'trip') return f.type === 'trip';
    if (activeTab === 'place') return f.type !== 'trip';
    return true;
  });

  const tripCount = favorites.filter(f => f.type === 'trip').length;
  const placeCount = favorites.filter(f => f.type !== 'trip').length;

  return (
    <div className="favorites-page animate-fade-in">
      <div className="favorites-header">
        <div>
          <h2>Saved Favorites</h2>
          <p>Your curated bucket list of destinations, stays, and culinary spots</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Favorite
        </button>
      </div>

      {error && (
        <div className="fav-error-banner glass-panel">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="fav-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`fav-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="fav-tab-count">
              {tab.key === 'all' ? favorites.length : tab.key === 'trip' ? tripCount : placeCount}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          Loading your bucket list...
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="empty-state-card glass-panel">
          <Heart size={56} className="empty-icon animate-pulse" style={{ color: 'var(--secondary)' }} />
          <h3>
            {activeTab === 'trip' ? 'No Saved Trips' :
             activeTab === 'place' ? 'No Saved Places' :
             'Your Bucket List is Empty'}
          </h3>
          <p>
            {activeTab === 'trip'
              ? 'Generate an itinerary and tap "Save Trip" to keep it here for later.'
              : activeTab === 'place'
              ? 'Tap the ♡ heart on any activity in your itinerary to save it here.'
              : 'Start adding destinations, hotels, restaurants, and activities you want to explore.'}
          </p>
          <div className="empty-actions">
            <button className="btn-primary" onClick={() => navigate('/')}>
              <Sparkles size={16} /> Plan a Trip
            </button>
            {activeTab !== 'trip' && (
              <button className="btn-outline" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Add Manually
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="favorites-grid">
          {filteredFavorites.map((item) =>
            item.type === 'trip' ? (
              <div key={item.id} className="favorite-card trip-card glass-panel">
                <div className="fav-card-image trip-card-image">
                  <span className="fav-emoji">✈️</span>
                  <button className="remove-btn" onClick={() => handleDelete(item.id)} title="Remove">
                    <Trash2 size={16} />
                  </button>
                  <div className="fav-type-tag trip-tag">TRIP</div>
                </div>

                <div className="fav-card-content">
                  <div className="title-row">
                    <h4>{item.title}</h4>
                  </div>

                  {item.location && (
                    <p className="fav-location"><Plane size={12} /> {item.location}</p>
                  )}

                  {item.price != null && (
                    <div className="fav-price-row">
                      <span className="lbl">Est. Total</span>
                      <span className="val text-gradient font-bold">
                        {currencySymbol}{convertFromINR(item.price).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="fav-card-actions trip-actions">
                  <button className="btn-outline plan-trip-btn" onClick={() => navigate('/itinerary')}>
                    <MapPin size={14} /> View Itinerary
                  </button>
                  <button
                    className="btn-primary plan-trip-btn"
                    onClick={() => handlePlanTrip(item.location?.split('→').pop()?.trim() || item.title)}
                  >
                    <Navigation size={14} /> Re-Plan
                  </button>
                </div>
              </div>
            ) : (
              <div key={item.id} className="favorite-card glass-panel">
                <div className="fav-card-image">
                  <span className="fav-emoji">{item.image_url || '📍'}</span>
                  <button className="remove-btn" onClick={() => handleDelete(item.id)} title="Remove from favorites">
                    <Trash2 size={16} />
                  </button>
                  <div className="fav-type-tag">{item.type?.toUpperCase()}</div>
                </div>

                <div className="fav-card-content">
                  <div className="title-row">
                    <h4>{item.title}</h4>
                    {item.rating && (
                      <span className="fav-rating">
                        <Star size={14} className="star-icon" /> {item.rating}
                      </span>
                    )}
                  </div>

                  {item.location && (
                    <p className="fav-location"><MapPin size={12} /> {item.location}</p>
                  )}

                  {item.description && <p className="fav-desc">{item.description}</p>}

                  {item.price && (
                    <div className="fav-price-row">
                      <span className="lbl">Est. Price</span>
                      <span className="val text-gradient font-bold">
                        {currencySymbol}{convertFromINR(item.price).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="fav-card-actions">
                  <button
                    className="btn-primary plan-trip-btn"
                    onClick={() => handlePlanTrip(item.location || item.title)}
                  >
                    <Navigation size={14} /> Plan Trip Here
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); resetModal(); } }}>
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h3>Add Favorite</h3>
              <button className="close-btn" onClick={() => { setShowModal(false); resetModal(); }}>×</button>
            </div>

            <form onSubmit={handleAddFavorite}>
              <div className="form-group">
                <label>Type *</label>
                <select value={favType} onChange={(e) => setFavType(e.target.value)}>
                  <option value="destination">Destination</option>
                  <option value="hotel">Hotel</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="activity">Activity</option>
                </select>
              </div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Eiffel Tower"
                  value={favTitle}
                  onChange={(e) => setFavTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Paris, France"
                    value={favLocation}
                    onChange={(e) => setFavLocation(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Emoji Icon</label>
                  <input
                    type="text"
                    placeholder="e.g. 🗼"
                    value={favImage}
                    onChange={(e) => setFavImage(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Estimated Price</label>
                <div className="price-input">
                  <span className="currency">{currencySymbol}</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={favPrice}
                    onChange={(e) => setFavPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Why do you want to visit here?"
                  value={favDesc}
                  onChange={(e) => setFavDesc(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '8px', resize: 'vertical' }}
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => { setShowModal(false); resetModal(); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingFav}>
                  {savingFav ? 'Saving...' : 'Save Favorite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;
