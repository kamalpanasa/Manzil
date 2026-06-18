import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gsap } from 'gsap';
import { Navigation2, MapPin, Clock, Ruler, Play, X, ChevronRight, AlertCircle } from 'lucide-react';
import './RouteMap.css';

const KNOWN_COORDS = {
  'goa': [15.2993, 74.1240],
  'mumbai': [19.0760, 72.8777],
  'delhi': [28.6139, 77.2090],
  'new delhi': [28.6139, 77.2090],
  'bangalore': [12.9716, 77.5946],
  'bengaluru': [12.9716, 77.5946],
  'chennai': [13.0827, 80.2707],
  'kolkata': [22.5726, 88.3639],
  'hyderabad': [17.3850, 78.4867],
  'pune': [18.5204, 73.8567],
  'jaipur': [26.9124, 75.7873],
  'agra': [27.1767, 78.0081],
  'manali': [32.2396, 77.1887],
  'shimla': [31.1048, 77.1734],
  'darjeeling': [27.0360, 88.2627],
  'kerala': [10.8505, 76.2711],
  'kochi': [9.9312, 76.2673],
  'munnar': [10.0889, 77.0595],
  'varanasi': [25.3176, 82.9739],
  'udaipur': [24.5854, 73.7125],
  'jodhpur': [26.2389, 73.0243],
  'pushkar': [26.4900, 74.5510],
  'rishikesh': [30.0869, 78.2676],
  'haridwar': [29.9457, 78.1642],
  'ooty': [11.4102, 76.6950],
  'coorg': [12.3375, 75.8069],
  'andaman': [11.7401, 92.6586],
  'leh': [34.1526, 77.5771],
  'ladakh': [34.1526, 77.5771],
  'amritsar': [31.6340, 74.8723],
  'chandigarh': [30.7333, 76.7794],
  'ahmedabad': [23.0225, 72.5714],
  'mysore': [12.2958, 76.6394],
  'mysuru': [12.2958, 76.6394],
  'hampi': [15.3350, 76.4600],
  'alleppey': [9.4981, 76.3388],
  'pondicherry': [11.9416, 79.8083],
  'tirupati': [13.6288, 79.4192],
  'kanyakumari': [8.0883, 77.5385],
  'madurai': [9.9252, 78.1198],
  'rameswaram': [9.2885, 79.3129],
  'mahabalipuram': [12.6269, 80.1927],
  'varkala': [8.7379, 76.7163],
  'kovalam': [8.4005, 76.9787],
  'kasol': [32.0994, 77.3157],
  'spiti': [32.2464, 78.0339],
  'dharamsala': [32.2190, 76.3234],
  'mussoorie': [30.4545, 78.0650],
  'nainital': [29.3803, 79.4636],
  'jim corbett': [29.5300, 78.7747],
  'ranthambore': [26.0173, 76.5026],
  'khajuraho': [24.8318, 79.9199],
  'bhopal': [23.2599, 77.4126],
  'guwahati': [26.1445, 91.7362],
  'shillong': [25.5788, 91.8933],
  'gangtok': [27.3389, 88.6065],
  'puri': [19.8133, 85.8314],
  'visakhapatnam': [17.6868, 83.2185],
  'vizag': [17.6868, 83.2185],
  'srinagar': [34.0837, 74.7973],
  'kashmir': [34.0837, 74.7973],
  'mount abu': [24.5926, 72.7156],
  'jaisalmer': [26.9157, 70.9083],
  'bikaner': [28.0229, 73.3119],
  'ajmer': [26.4499, 74.6399],
  'lonavala': [18.7537, 73.4063],
  'mahabaleshwar': [17.9237, 73.6586],
  'alibaug': [18.6414, 72.8722],
  'somnath': [20.8880, 70.4015],
  'dwarka': [22.2394, 68.9678],
  'sasan gir': [21.1243, 70.6168],
  'diu': [20.7144, 70.9874],
};

const TILE_URLS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

const PERIOD_ICONS = { Morning: '☀️', Afternoon: '🌤️', Evening: '🌆', Night: '🌙' };

const lookupCoord = (location) => {
  if (!location) return null;
  const key = location.toLowerCase().trim();
  for (const [k, v] of Object.entries(KNOWN_COORDS)) {
    if (key === k || key.startsWith(k + ',') || key.startsWith(k + ' ')) return v;
  }
  for (const [k, v] of Object.entries(KNOWN_COORDS)) {
    if (key.includes(k)) return v;
  }
  return null;
};

const geocodeLocation = async (location) => {
  const known = lookupCoord(location);
  if (known) return known;
  try {
    const q = encodeURIComponent(location + ', India');
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=in`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'ManzilTravelApp/1.0' } }
    );
    const data = await res.json();
    if (data && data[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {}
  return [20.5937 + (Math.random() - 0.5) * 4, 78.9629 + (Math.random() - 0.5) * 4];
};

const fetchOSRMRoute = async (waypoints) => {
  const coordStr = waypoints.map(([lat, lng]) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error('OSRM request failed');
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found');
  const route = data.routes[0];
  return {
    geometry: route.geometry,
    distance: (route.distance / 1000).toFixed(1),
    duration: Math.round(route.duration / 60),
  };
};

const clearLayers = (ref) => {
  if (!ref.current) return;
  if (Array.isArray(ref.current)) {
    ref.current.forEach(l => { try { l.remove(); } catch {} });
  } else {
    try { ref.current.remove(); } catch {}
  }
  ref.current = null;
};

const RouteMap = ({ itinerary, activeDayIdx, setActiveDayIdx }) => {
  const wrapRef = useRef(null);
  const mapDivRef = useRef(null);
  const lMapRef = useRef(null);
  const tileRef = useRef(null);
  const dayMarkersRef = useRef([]);
  const routeLayersRef = useRef(null);
  const userMarkerRef = useRef(null);
  const coordsCacheRef = useRef({});

  const [coordsList, setCoordsList] = useState([]);
  const [geocoding, setGeocoding] = useState(true);
  const [mapType, setMapType] = useState('dark');
  const [selectedDayIdx, setSelectedDayIdx] = useState(activeDayIdx || 0);
  const [userPos, setUserPos] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (!wrapRef.current) return;
    gsap.fromTo(wrapRef.current,
      { opacity: 0, y: 18, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  useEffect(() => {
    if (!itinerary.length) return;
    setGeocoding(true);
    (async () => {
      const results = [];
      for (const item of itinerary) {
        const loc = item.location || item.title;
        if (!coordsCacheRef.current[loc]) {
          coordsCacheRef.current[loc] = await geocodeLocation(loc);
          await new Promise(r => setTimeout(r, 280));
        }
        results.push({ coord: coordsCacheRef.current[loc], item });
      }
      setCoordsList(results);
      setGeocoding(false);
    })();
  }, [itinerary]);

  const buildDayMarkers = useCallback((map, list, activeIdx) => {
    dayMarkersRef.current.forEach(m => { try { m.remove(); } catch {} });
    dayMarkersRef.current = [];
    list.forEach((c, idx) => {
      const isActive = idx === activeIdx;
      const icon = L.divIcon({
        html: `<div class="day-pin${isActive ? ' day-pin-active' : ''}">
                 <span class="day-pin-num">${c.item.day}</span>
                 ${isActive ? '<div class="day-pin-pulse"></div>' : ''}
               </div>`,
        className: 'day-marker-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const marker = L.marker(c.coord, { icon })
        .addTo(map)
        .on('click', () => {
          setSelectedDayIdx(idx);
          setActiveDayIdx(idx);
          map.panTo(c.coord, { animate: true, duration: 0.6 });
        });
      dayMarkersRef.current.push(marker);
    });
  }, [setActiveDayIdx]);

  useEffect(() => {
    if (!coordsList.length || !mapDivRef.current) return;

    if (lMapRef.current) { lMapRef.current.remove(); lMapRef.current = null; }
    delete L.Icon.Default.prototype._getIconUrl;

    const map = L.map(mapDivRef.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.attribution({ prefix: false, position: 'bottomleft' }).addTo(map);

    const tile = L.tileLayer(TILE_URLS[mapType], { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    tileRef.current = tile;
    lMapRef.current = map;

    buildDayMarkers(map, coordsList, selectedDayIdx);

    const latLngs = coordsList.map(c => c.coord);
    if (latLngs.length === 1) {
      map.setView(latLngs[0], 12);
    } else {
      try { map.fitBounds(latLngs, { padding: [60, 60], maxZoom: 12 }); } catch {}
    }

    return () => { map.remove(); lMapRef.current = null; };
  }, [coordsList]);

  useEffect(() => {
    if (!lMapRef.current || !coordsList.length) return;
    buildDayMarkers(lMapRef.current, coordsList, selectedDayIdx);
    const coord = coordsList[selectedDayIdx]?.coord;
    if (coord) lMapRef.current.panTo(coord, { animate: true, duration: 0.5 });
  }, [selectedDayIdx, coordsList, buildDayMarkers]);

  const drawRoute = useCallback(async (from, destIdx) => {
    if (!lMapRef.current || !coordsList[destIdx]) return;
    setRouteLoading(true);
    setRouteInfo(null);
    setLocationError('');
    clearLayers(routeLayersRef);

    try {
      const dest = coordsList[destIdx].coord;
      const result = await fetchOSRMRoute([from, dest]);

      const shadow = L.geoJSON(result.geometry, {
        style: { color: 'rgba(157,78,221,0.18)', weight: 14, lineCap: 'round', lineJoin: 'round' },
      }).addTo(lMapRef.current);

      const glow = L.geoJSON(result.geometry, {
        style: { color: '#c084fc', weight: 7, opacity: 0.4, lineCap: 'round', lineJoin: 'round' },
      }).addTo(lMapRef.current);

      const main = L.geoJSON(result.geometry, {
        style: { color: '#9d4edd', weight: 4, opacity: 1, lineCap: 'round', lineJoin: 'round' },
        className: 'route-line-anim',
      }).addTo(lMapRef.current);

      routeLayersRef.current = [shadow, glow, main];

      const bounds = main.getBounds();
      if (bounds.isValid()) {
        lMapRef.current.fitBounds(bounds, { padding: [60, 60] });
      }

      setRouteInfo({ distance: result.distance, duration: result.duration });
    } catch (err) {
      console.warn('OSRM routing failed:', err.message);
      setLocationError('Could not calculate route. The OSRM service may be temporarily unavailable.');
    } finally {
      setRouteLoading(false);
    }
  }, [coordsList]);

  useEffect(() => {
    if (isNavigating && userPos && coordsList.length) {
      drawRoute(userPos, selectedDayIdx);
    }
  }, [isNavigating, userPos, selectedDayIdx, drawRoute]);

  const handleStartTrip = () => {
    setGettingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const position = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(position);
        setIsNavigating(true);
        setGettingLocation(false);

        if (lMapRef.current) {
          if (userMarkerRef.current) { try { userMarkerRef.current.remove(); } catch {} }
          const gpsIcon = L.divIcon({
            html: `<div class="gps-outer-ring"><div class="gps-inner-ring"></div><div class="gps-dot-center"></div></div>`,
            className: 'gps-icon-container',
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          });
          userMarkerRef.current = L.marker(position, { icon: gpsIcon, zIndexOffset: 2000 })
            .addTo(lMapRef.current)
            .bindPopup('<div class="rp-inner"><div class="rp-day">Your Location</div><div class="rp-title">You are here</div></div>', { className: 'route-popup', closeButton: false })
            .openPopup();
        }
      },
      (err) => {
        const msgs = {
          1: 'Location access denied. Please allow location in your browser settings.',
          2: 'Location unavailable. Check your GPS/network and try again.',
          3: 'Location request timed out. Move to an open area and try again.',
        };
        setLocationError(msgs[err.code] || 'Could not detect location.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 14000, maximumAge: 0 }
    );
  };

  const handleEndTrip = () => {
    setIsNavigating(false);
    setUserPos(null);
    setRouteInfo(null);
    setLocationError('');
    clearLayers(routeLayersRef);
    if (userMarkerRef.current) { try { userMarkerRef.current.remove(); } catch {} userMarkerRef.current = null; }
    if (lMapRef.current && coordsList.length) {
      const latLngs = coordsList.map(c => c.coord);
      if (latLngs.length === 1) lMapRef.current.setView(latLngs[0], 12);
      else { try { lMapRef.current.fitBounds(latLngs, { padding: [60, 60], maxZoom: 12 }); } catch {} }
    }
  };

  useEffect(() => {
    if (!lMapRef.current) return;
    if (tileRef.current) { try { tileRef.current.remove(); } catch {} }
    const newTile = L.tileLayer(TILE_URLS[mapType], { maxZoom: 19 }).addTo(lMapRef.current);
    tileRef.current = newTile;
    lMapRef.current.invalidateSize();
  }, [mapType]);

  const currentDay = itinerary[selectedDayIdx];
  const activities = currentDay?.activities || [];
  const groupedActs = {};
  activities.forEach(act => {
    const p = act.period || 'Morning';
    if (!groupedActs[p]) groupedActs[p] = [];
    groupedActs[p].push(act);
  });

  return (
    <div ref={wrapRef} className="route-map-wrapper">

      <div className="rmap-toolbar">
        <div className="rmap-type-btns">
          {['dark', 'street', 'satellite'].map(t => (
            <button key={t}
              className={`rmap-type-btn ${mapType === t ? 'active' : ''}`}
              onClick={() => setMapType(t)}>
              {t === 'dark' ? '🌑' : t === 'street' ? '🗺️' : '🛰️'}
              <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
            </button>
          ))}
        </div>

        {!isNavigating ? (
          <button
            className="start-trip-btn"
            onClick={handleStartTrip}
            disabled={gettingLocation || geocoding}
          >
            {gettingLocation
              ? <><span className="btn-spinner" /> Locating…</>
              : <><Play size={13} fill="currentColor" /> Start Trip</>
            }
          </button>
        ) : (
          <button className="end-trip-btn" onClick={handleEndTrip}>
            <X size={13} /> End Navigation
          </button>
        )}
      </div>

      {isNavigating && routeInfo && (
        <div className="route-info-bar">
          <div className="ri-item">
            <Ruler size={15} className="ri-icon" />
            <div>
              <div className="ri-val">{routeInfo.distance} km</div>
              <div className="ri-lbl">Distance</div>
            </div>
          </div>
          <div className="ri-divider" />
          <div className="ri-item">
            <Clock size={15} className="ri-icon" />
            <div>
              <div className="ri-val">{routeInfo.duration} min</div>
              <div className="ri-lbl">ETA</div>
            </div>
          </div>
          <div className="ri-divider" />
          <div className="ri-item">
            <Navigation2 size={15} className="ri-icon" />
            <div>
              <div className="ri-val" style={{ fontSize: '0.78rem', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentDay?.location || '—'}
              </div>
              <div className="ri-lbl">Destination</div>
            </div>
          </div>
          {isNavigating && userPos && (
            <button className="reroute-btn" onClick={() => drawRoute(userPos, selectedDayIdx)} disabled={routeLoading}>
              <Navigation2 size={12} /> Reroute
            </button>
          )}
        </div>
      )}

      {routeLoading && (
        <div className="route-calc-bar">
          <span className="btn-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
          Calculating route via OSRM…
        </div>
      )}

      {locationError && (
        <div className="location-error-bar">
          <AlertCircle size={13} />
          <span>{locationError}</span>
          <button className="err-close" onClick={() => setLocationError('')}><X size={11} /></button>
        </div>
      )}

      <div className="rmap-container">
        {geocoding && (
          <div className="rmap-loading">
            <div className="rmap-loading-spinner" />
            <span>Locating destinations…</span>
          </div>
        )}
        <div ref={mapDivRef} className="leaflet-map-el" />
      </div>

      {itinerary.length > 1 && (
        <div className="day-tabs">
          {itinerary.map((item, idx) => (
            <button
              key={idx}
              className={`day-tab${selectedDayIdx === idx ? ' active' : ''}`}
              onClick={() => {
                setSelectedDayIdx(idx);
                setActiveDayIdx(idx);
              }}
            >
              <span className="day-tab-emoji">{item.img}</span>
              Day {item.day}
            </button>
          ))}
        </div>
      )}

      {currentDay && (
        <div className="rmap-dest-card">
          <div className="dest-header">
            <div className="dest-emoji">{currentDay.img}</div>
            <div className="dest-meta">
              <div className="dest-title">{currentDay.title}</div>
              <div className="dest-loc"><MapPin size={11} /> {currentDay.location}</div>
            </div>
            {isNavigating && (
              <button
                className="navigate-to-btn"
                disabled={routeLoading || !userPos}
                onClick={() => userPos && drawRoute(userPos, selectedDayIdx)}
                title={!userPos ? 'Start Trip first to navigate' : 'Route to this day'}
              >
                <Navigation2 size={13} />
              </button>
            )}
          </div>

          {activities.length > 0 ? (
            <div className="stops-list">
              <div className="stops-label">
                <span>Today's Stops</span>
                <span className="stops-count">{activities.length} activities</span>
              </div>
              {['Morning', 'Afternoon', 'Evening', 'Night'].map(period => {
                const acts = groupedActs[period];
                if (!acts?.length) return null;
                return (
                  <div key={period} className="period-block">
                    <div className="period-block-header">
                      <span>{PERIOD_ICONS[period]}</span>
                      <span>{period}</span>
                    </div>
                    {acts.map((act, i) => (
                      <div
                        key={i}
                        className="stop-item"
                        onClick={() => {
                          const coord = coordsList[selectedDayIdx]?.coord;
                          if (lMapRef.current && coord) {
                            lMapRef.current.panTo(coord, { animate: true });
                            lMapRef.current.setZoom(15);
                          }
                        }}
                      >
                        <div className="stop-num">{i + 1}</div>
                        <div className="stop-content">
                          <div className="stop-name">{act.name || 'Activity'}</div>
                          <div className="stop-time">{act.time} · {act.category || 'sightseeing'}</div>
                        </div>
                        <MapPin size={12} className="stop-pin-icon" />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-stops-hint">No activities scheduled. Edit this day to add stops.</div>
          )}
        </div>
      )}

      <div className="rmap-legend">
        <div className="rmap-legend-item"><span className="legend-dot" style={{ background: '#9d4edd' }} /> Route</div>
        <div className="rmap-legend-item"><span className="legend-dot" style={{ background: '#e00072' }} /> Active Day</div>
        {isNavigating && (
          <div className="rmap-legend-item"><span className="legend-dot gps-pulse-tiny" /> Your Position</div>
        )}
      </div>
    </div>
  );
};

export default RouteMap;
