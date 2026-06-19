import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gsap } from 'gsap';
import { Navigation2, MapPin, Clock, Ruler, Play, X, ChevronRight, AlertCircle } from 'lucide-react';
import './RouteMap.css';

const KNOWN_COORDS = {
  // ── India ──────────────────────────────────────────
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

  // ── Southeast Asia ─────────────────────────────────
  'vietnam': [14.0583, 108.2772],
  'hanoi': [21.0285, 105.8542],
  'ho chi minh': [10.8231, 106.6297],
  'ho chi minh city': [10.8231, 106.6297],
  'saigon': [10.8231, 106.6297],
  'da nang': [16.0544, 108.2022],
  'hoi an': [15.8801, 108.3380],
  'hue': [16.4637, 107.5909],
  'nha trang': [12.2388, 109.1967],
  'phu quoc': [10.2899, 103.9840],
  'halong bay': [20.9101, 107.1839],
  'thailand': [15.8700, 100.9925],
  'bangkok': [13.7563, 100.5018],
  'phuket': [7.8804, 98.3923],
  'chiang mai': [18.7883, 98.9853],
  'krabi': [8.0863, 98.9063],
  'koh samui': [9.5120, 100.0136],
  'pattaya': [12.9236, 100.8825],
  'bali': [-8.3405, 115.0920],
  'indonesia': [-0.7893, 113.9213],
  'jakarta': [-6.2088, 106.8456],
  'yogyakarta': [-7.7956, 110.3695],
  'lombok': [-8.6500, 116.3240],
  'komodo': [-8.5485, 119.4898],
  'malaysia': [4.2105, 101.9758],
  'kuala lumpur': [3.1390, 101.6869],
  'penang': [5.4141, 100.3288],
  'langkawi': [6.3500, 99.8000],
  'singapore': [1.3521, 103.8198],
  'philippines': [12.8797, 121.7740],
  'manila': [14.5995, 120.9842],
  'boracay': [11.9674, 121.9248],
  'palawan': [9.8349, 118.7384],
  'cebu': [10.3157, 123.8854],
  'cambodia': [12.5657, 104.9910],
  'phnom penh': [11.5564, 104.9282],
  'siem reap': [13.3671, 103.8448],
  'angkor wat': [13.4125, 103.8670],
  'myanmar': [21.9162, 95.9560],
  'yangon': [16.8661, 96.1951],
  'bagan': [21.1717, 94.8585],
  'laos': [19.8563, 102.4955],
  'luang prabang': [19.8833, 102.1347],
  'vientiane': [17.9757, 102.6331],

  // ── East Asia ──────────────────────────────────────
  'japan': [36.2048, 138.2529],
  'tokyo': [35.6762, 139.6503],
  'osaka': [34.6937, 135.5022],
  'kyoto': [35.0116, 135.7681],
  'hiroshima': [34.3853, 132.4553],
  'sapporo': [43.0618, 141.3545],
  'nara': [34.6851, 135.8048],
  'fukuoka': [33.5904, 130.4017],
  'china': [35.8617, 104.1954],
  'beijing': [39.9042, 116.4074],
  'shanghai': [31.2304, 121.4737],
  'guangzhou': [23.1291, 113.2644],
  'shenzhen': [22.5431, 114.0579],
  'chengdu': [30.5728, 104.0668],
  'xian': [34.3416, 108.9398],
  'guilin': [25.2736, 110.2907],
  'zhangjiajie': [29.1256, 110.4792],
  'south korea': [35.9078, 127.7669],
  'seoul': [37.5665, 126.9780],
  'busan': [35.1796, 129.0756],
  'jeju': [33.4996, 126.5312],
  'taiwan': [23.6978, 120.9605],
  'taipei': [25.0330, 121.5654],
  'hong kong': [22.3193, 114.1694],

  // ── South Asia ─────────────────────────────────────
  'nepal': [28.3949, 84.1240],
  'kathmandu': [27.7172, 85.3240],
  'pokhara': [28.2096, 83.9856],
  'everest': [27.9881, 86.9250],
  'sri lanka': [7.8731, 80.7718],
  'colombo': [6.9271, 79.8612],
  'kandy': [7.2906, 80.6337],
  'sigiriya': [7.9570, 80.7603],
  'maldives': [3.2028, 73.2207],
  'male': [4.1755, 73.5093],
  'bangladesh': [23.6850, 90.3563],
  'dhaka': [23.8103, 90.4125],
  'bhutan': [27.5142, 90.4336],
  'thimphu': [27.4712, 89.6339],
  'pakistan': [30.3753, 69.3451],
  'lahore': [31.5204, 74.3587],
  'karachi': [24.8607, 67.0011],
  'islamabad': [33.7294, 73.0931],

  // ── Middle East ────────────────────────────────────
  'dubai': [25.2048, 55.2708],
  'abu dhabi': [24.4539, 54.3773],
  'uae': [23.4241, 53.8478],
  'qatar': [25.3548, 51.1839],
  'doha': [25.2854, 51.5310],
  'saudi arabia': [23.8859, 45.0792],
  'riyadh': [24.7136, 46.6753],
  'oman': [21.4735, 55.9754],
  'muscat': [23.5880, 58.3829],
  'jordan': [30.5852, 36.2384],
  'amman': [31.9454, 35.9284],
  'petra': [30.3285, 35.4444],
  'israel': [31.0461, 34.8516],
  'tel aviv': [32.0853, 34.7818],
  'jerusalem': [31.7683, 35.2137],
  'turkey': [38.9637, 35.2433],
  'istanbul': [41.0082, 28.9784],
  'cappadocia': [38.6431, 34.8289],
  'antalya': [36.8969, 30.7133],

  // ── Europe ─────────────────────────────────────────
  'france': [46.2276, 2.2137],
  'paris': [48.8566, 2.3522],
  'nice': [43.7102, 7.2620],
  'uk': [55.3781, -3.4360],
  'united kingdom': [55.3781, -3.4360],
  'london': [51.5074, -0.1278],
  'edinburgh': [55.9533, -3.1883],
  'germany': [51.1657, 10.4515],
  'berlin': [52.5200, 13.4050],
  'munich': [48.1351, 11.5820],
  'italy': [41.8719, 12.5674],
  'rome': [41.9028, 12.4964],
  'venice': [45.4408, 12.3155],
  'florence': [43.7696, 11.2558],
  'milan': [45.4642, 9.1900],
  'amalfi': [40.6340, 14.6025],
  'spain': [40.4637, -3.7492],
  'barcelona': [41.3851, 2.1734],
  'madrid': [40.4168, -3.7038],
  'seville': [37.3891, -5.9845],
  'greece': [39.0742, 21.8243],
  'athens': [37.9838, 23.7275],
  'santorini': [36.3932, 25.4615],
  'mykonos': [37.4500, 25.3667],
  'portugal': [39.3999, -8.2245],
  'lisbon': [38.7223, -9.1393],
  'porto': [41.1579, -8.6291],
  'switzerland': [46.8182, 8.2275],
  'zurich': [47.3769, 8.5417],
  'interlaken': [46.6863, 7.8632],
  'netherlands': [52.1326, 5.2913],
  'amsterdam': [52.3676, 4.9041],
  'austria': [47.5162, 14.5501],
  'vienna': [48.2082, 16.3738],
  'innsbruck': [47.2692, 11.4041],
  'czech republic': [49.8175, 15.4730],
  'prague': [50.0755, 14.4378],
  'hungary': [47.1625, 19.5033],
  'budapest': [47.4979, 19.0402],
  'croatia': [45.1000, 15.2000],
  'dubrovnik': [42.6507, 18.0944],
  'split': [43.5081, 16.4402],
  'scandinavia': [64.0000, 20.0000],
  'norway': [60.4720, 8.4689],
  'oslo': [59.9139, 10.7522],
  'bergen': [60.3913, 5.3221],
  'sweden': [60.1282, 18.6435],
  'stockholm': [59.3293, 18.0686],
  'denmark': [56.2639, 9.5018],
  'copenhagen': [55.6761, 12.5683],
  'finland': [61.9241, 25.7482],
  'helsinki': [60.1699, 24.9384],
  'iceland': [64.9631, -19.0208],
  'reykjavik': [64.1355, -21.8954],
  'russia': [61.5240, 105.3188],
  'moscow': [55.7558, 37.6173],
  'st petersburg': [59.9311, 30.3609],

  // ── Americas ───────────────────────────────────────
  'usa': [37.0902, -95.7129],
  'united states': [37.0902, -95.7129],
  'new york': [40.7128, -74.0060],
  'los angeles': [34.0522, -118.2437],
  'san francisco': [37.7749, -122.4194],
  'chicago': [41.8781, -87.6298],
  'miami': [25.7617, -80.1918],
  'las vegas': [36.1699, -115.1398],
  'hawaii': [20.7967, -156.3319],
  'honolulu': [21.3069, -157.8583],
  'orlando': [28.5383, -81.3792],
  'canada': [56.1304, -106.3468],
  'toronto': [43.6532, -79.3832],
  'vancouver': [49.2827, -123.1207],
  'montreal': [45.5017, -73.5673],
  'mexico': [23.6345, -102.5528],
  'mexico city': [19.4326, -99.1332],
  'cancun': [21.1619, -86.8515],
  'brazil': [-14.2350, -51.9253],
  'rio de janeiro': [-22.9068, -43.1729],
  'sao paulo': [-23.5505, -46.6333],
  'peru': [-9.1900, -75.0152],
  'lima': [-12.0464, -77.0428],
  'machu picchu': [-13.1631, -72.5450],
  'argentina': [-38.4161, -63.6167],
  'buenos aires': [-34.6037, -58.3816],
  'colombia': [4.5709, -74.2973],
  'bogota': [4.7110, -74.0721],
  'cartagena': [10.3910, -75.4794],
  'chile': [-35.6751, -71.5430],
  'santiago': [-33.4489, -70.6693],

  // ── Africa ─────────────────────────────────────────
  'egypt': [26.8206, 30.8025],
  'cairo': [30.0444, 31.2357],
  'luxor': [25.6872, 32.6396],
  'hurghada': [27.2578, 33.8116],
  'morocco': [31.7917, -7.0926],
  'marrakech': [31.6295, -7.9811],
  'casablanca': [33.5731, -7.5898],
  'fes': [34.0181, -5.0078],
  'south africa': [-30.5595, 22.9375],
  'cape town': [-33.9249, 18.4241],
  'johannesburg': [-26.2041, 28.0473],
  'kenya': [-0.0236, 37.9062],
  'nairobi': [-1.2921, 36.8219],
  'tanzania': [-6.3690, 34.8888],
  'zanzibar': [-6.1659, 39.2026],
  'kilimanjaro': [-3.0674, 37.3556],
  'ethiopia': [9.1450, 40.4897],
  'addis ababa': [9.0320, 38.7469],
  'nigeria': [9.0820, 8.6753],
  'ghana': [7.9465, -1.0232],

  // ── Oceania ────────────────────────────────────────
  'australia': [-25.2744, 133.7751],
  'sydney': [-33.8688, 151.2093],
  'melbourne': [-37.8136, 144.9631],
  'cairns': [-16.9186, 145.7781],
  'gold coast': [-28.0167, 153.4000],
  'new zealand': [-40.9006, 174.8860],
  'auckland': [-36.8509, 174.7645],
  'queenstown': [-45.0312, 168.6626],
  'fiji': [-17.7134, 178.0650],
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

const geocodeLocation = async (location, destinationHint) => {
  const known = lookupCoord(location);
  if (known) return known;

  const destCoord = destinationHint ? lookupCoord(destinationHint) : null;

  const tryNominatim = async (query) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'ManzilTravelApp/1.0' } }
    );
    return res.json();
  };

  const pickBestResult = (results) => {
    if (!results || !results.length) return null;
    if (!destCoord) return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
    let best = null, bestDist = Infinity;
    for (const r of results) {
      const lat = parseFloat(r.lat), lon = parseFloat(r.lon);
      const dLat = lat - destCoord[0], dLon = lon - destCoord[1];
      const dist = Math.sqrt(dLat * dLat + dLon * dLon);
      if (dist < bestDist) { bestDist = dist; best = [lat, lon]; }
    }
    return bestDist < 15 ? best : null;
  };

  try {
    const data = await tryNominatim(location);
    const coord = pickBestResult(data);
    if (coord) return coord;

    if (destinationHint) {
      const withCity = `${location}, ${destinationHint}`;
      const data2 = await tryNominatim(withCity);
      const coord2 = pickBestResult(data2);
      if (coord2) return coord2;
      if (data2 && data2[0]) return [parseFloat(data2[0].lat), parseFloat(data2[0].lon)];
    }

    if (data && data[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {}

  return destCoord || [20.0, 0.0];
};

const fetchOSRMRoute = async (waypoints) => {
  const coordStr = waypoints.map(([lat, lng]) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error('OSRM request failed');
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found');
  const route = data.routes[0];
  return {
    geometry: route.geometry,
    distance: (route.distance / 1000).toFixed(1),
    duration: Math.round(route.duration / 60),
    isFlight: false,
  };
};

const haversineKm = ([lat1, lng1], [lat2, lng2]) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(0);
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

const RouteMap = ({ itinerary, activeDayIdx, setActiveDayIdx, destination }) => {
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
          coordsCacheRef.current[loc] = await geocodeLocation(loc, destination);
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

  const drawStraightFallback = useCallback((from, dest) => {
    const distKm = haversineKm(from, dest);
    const isLongHaul = Number(distKm) > 500;

    const shadow = L.polyline([from, dest], {
      color: 'rgba(157,78,221,0.18)', weight: 14, lineCap: 'round',
    }).addTo(lMapRef.current);

    const line = L.polyline([from, dest], {
      color: '#9d4edd', weight: 3, opacity: 0.85,
      dashArray: isLongHaul ? '12 8' : '8 6',
      lineCap: 'round',
    }).addTo(lMapRef.current);

    const midLat = (from[0] + dest[0]) / 2;
    const midLng = (from[1] + dest[1]) / 2;
    const modeEmoji = isLongHaul ? '✈️' : '🚗';
    const midIcon = L.divIcon({
      html: `<div style="font-size:22px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6));cursor:default;">${modeEmoji}</div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    const midMarker = L.marker([midLat, midLng], { icon: midIcon, interactive: false })
      .addTo(lMapRef.current);

    routeLayersRef.current = [shadow, line, midMarker];

    try {
      lMapRef.current.fitBounds(line.getBounds(), { padding: [70, 70] });
    } catch {}

    setRouteInfo({ distance: distKm, duration: null, isFlight: isLongHaul });
  }, []);

  const drawRoute = useCallback(async (from, destIdx) => {
    if (!lMapRef.current || !coordsList[destIdx]) return;
    setRouteLoading(true);
    setRouteInfo(null);
    setLocationError('');
    clearLayers(routeLayersRef);

    const dest = coordsList[destIdx].coord;

    try {
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
      if (bounds.isValid()) lMapRef.current.fitBounds(bounds, { padding: [60, 60] });

      setRouteInfo({ distance: result.distance, duration: result.duration, isFlight: false });
    } catch {
      drawStraightFallback(from, dest);
    } finally {
      setRouteLoading(false);
    }
  }, [coordsList, drawStraightFallback]);

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
              <div className="ri-lbl">{routeInfo.isFlight ? 'Air Distance' : 'Distance'}</div>
            </div>
          </div>
          <div className="ri-divider" />
          {routeInfo.isFlight ? (
            <div className="ri-item">
              <span style={{ fontSize: '18px', lineHeight: 1 }}>✈️</span>
              <div>
                <div className="ri-val" style={{ fontSize: '0.78rem' }}>Flight Route</div>
                <div className="ri-lbl">Road n/a</div>
              </div>
            </div>
          ) : (
            <div className="ri-item">
              <Clock size={15} className="ri-icon" />
              <div>
                <div className="ri-val">{routeInfo.duration} min</div>
                <div className="ri-lbl">Drive ETA</div>
              </div>
            </div>
          )}
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
