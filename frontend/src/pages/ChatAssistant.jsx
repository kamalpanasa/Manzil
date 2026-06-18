import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Sparkles, Calendar, Users, Bus, CheckCircle2, Loader2 } from 'lucide-react';
import { getChatHistory, sendChatMessage, getLatestItinerary, updateItinerary } from '../lib/api';
import { createExpense } from '../lib/expenses';
import { addFavorite } from '../lib/favorites';
import { useCurrency, convertFromINR } from '../lib/currency';
import './ChatAssistant.css';

const QUICK_PROMPTS = [
  'Plan a 3-day Goa trip under ₹10,000',
  'Best time to visit Manali?',
  'Budget-friendly food in Jaipur',
];

const formatTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const parseMessageContent = (content) => {
  const marker = '```json-recommendation';
  if (!content.includes(marker)) {
    return { text: content, recommendation: null };
  }

  const parts = content.split(marker);
  const text = parts[0].trim();
  const rest = parts[1].split('```');
  const jsonStr = rest[0].trim();
  const trailingText = rest.slice(1).join('```').trim();

  let recommendation = null;
  try {
    recommendation = JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse recommendation JSON:', err);
  }

  return {
    text: text + (trailingText ? '\n\n' + trailingText : ''),
    recommendation
  };
};

const RecommendationCard = ({ recommendation }) => {
  const currencySymbol = useCurrency();
  const [addingTrip, setAddingTrip] = useState(false);
  const [tripAdded, setTripAdded] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [expenseAdded, setExpenseAdded] = useState(false);
  const [savingFav, setSavingFav] = useState(false);
  const [favSaved, setFavSaved] = useState(false);

  const handleAddToItinerary = async () => {
    setAddingTrip(true);
    try {
      const trip = await getLatestItinerary();
      const updatedDays = (trip.itinerary || []).map(day => ({
        day: day.day,
        title: day.title,
        location: day.location,
        description: day.description,
        start_time: day.start_time,
        estimated_cost: day.estimated_cost
      }));
      
      const nextDayNum = updatedDays.length + 1;
      updatedDays.push({
        day: nextDayNum,
        title: recommendation.title,
        location: recommendation.location || '',
        description: recommendation.description || '',
        start_time: '10:00 AM',
        estimated_cost: Number(recommendation.cost) || 0
      });
      
      await updateItinerary(trip.trip_id, updatedDays);
      setTripAdded(true);
    } catch (err) {
      console.error(err);
      alert('Could not find an active trip to update. Please plan a trip from the Dashboard first.');
    } finally {
      setAddingTrip(false);
    }
  };

  const handleAddToExpenses = async () => {
    setAddingExpense(true);
    try {
      await createExpense({
        category: recommendation.type === 'hotel' ? 'Hotel' : recommendation.type === 'restaurant' ? 'Food' : 'Activities',
        description: recommendation.title,
        amount: Number(recommendation.cost) || 0,
        expense_date: new Date().toISOString().slice(0, 10)
      });
      setExpenseAdded(true);
    } catch (err) {
      console.error(err);
      alert('Could not log expense.');
    } finally {
      setAddingExpense(false);
    }
  };

  const handleSaveFavorite = async () => {
    setSavingFav(true);
    try {
      await addFavorite({
        type: recommendation.type || 'activity',
        title: recommendation.title,
        location: recommendation.location || '',
        image_url: recommendation.type === 'hotel' ? '🏨' : recommendation.type === 'restaurant' ? '🍹' : '🎟️',
        rating: 4.5,
        price: Number(recommendation.cost) || 0,
        description: recommendation.description || ''
      });
      setFavSaved(true);
    } catch (err) {
      console.error(err);
      alert('Could not save favorite.');
    } finally {
      setSavingFav(false);
    }
  };

  return (
    <div className="chat-recommendation-card glass-panel animate-fade-in">
      <div className="rec-header">
        <span className="rec-badge">{recommendation.type?.toUpperCase()}</span>
        <span className="rec-price">{currencySymbol}{convertFromINR(Number(recommendation.cost || 0)).toLocaleString()}</span>
      </div>
      <h4>{recommendation.title}</h4>
      {recommendation.location && <p className="rec-loc">📍 {recommendation.location}</p>}
      {recommendation.description && <p className="rec-desc">{recommendation.description}</p>}
      
      <div className="rec-actions">
        <button className="btn-primary btn-sm" onClick={handleAddToItinerary} disabled={addingTrip || tripAdded}>
          {addingTrip ? 'Adding...' : tripAdded ? '✓ Added to Trip' : '＋ Add Day'}
        </button>
        <button className="btn-outline btn-sm" onClick={handleAddToExpenses} disabled={addingExpense || expenseAdded}>
          {addingExpense ? 'Logging...' : expenseAdded ? '✓ Logged' : '💰 Log Spend'}
        </button>
        <button className="btn-outline btn-sm" onClick={handleSaveFavorite} disabled={savingFav || favSaved}>
          {savingFav ? 'Saving...' : favSaved ? '♥ Saved' : '♥ Favorite'}
        </button>
      </div>
    </div>
  );
};

const AnimatedText = ({ text, speed = 12 }) => {
  const [shown, setShown] = useState('');

  useEffect(() => {
    setShown('');
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <>{shown}</>;
};

const TypingIndicator = () => (
  <div className="message-row ai">
    <div className="message-avatar ai">
      <Sparkles size={16} color="white" />
    </div>
    <div className="message-content">
      <div className="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  </div>
);

const ChatAssistant = () => {
  const currencySymbol = useCurrency();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const scrollRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    getChatHistory()
      .then((rows) => {
        if (!isMounted) return;
        setMessages(rows.map((r) => ({ ...r, animate: false })));
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Could not load your conversation history.');
      })
      .finally(() => {
        if (isMounted) setLoadingHistory(false);
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;

    setError('');
    setInput('');

    const optimisticUser = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
      animate: false,
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setSending(true);

    try {
      const { reply } = await sendChatMessage(text);
      setMessages((prev) => [...prev, { ...reply, animate: true }]);
    } catch (err) {
      setError(err.message || 'Something went wrong reaching the AI assistant.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-page-container animate-fade-in">
      <div className="chat-main">
        <div className="chat-header">
          <h2>👋 Hi Wanderer!</h2>
          <p>Where do you want to explore today?</p>
        </div>

        <div className="messages-area">
          {loadingHistory ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)', padding: '40px 0' }}>
              <Loader2 size={20} className="spin" /> Loading your conversation...
            </div>
          ) : (
            <>
              {messages.length === 0 && (
                <div className="quick-suggestions">
                  {QUICK_PROMPTS.map((p, i) => (
                    <button key={i} className="quick-suggestion-chip" onClick={() => handleSend(p)}>
                      {p.replace('₹', currencySymbol)}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg) => {
                const parsed = parseMessageContent(msg.content);
                return (
                  <div key={msg.id} className={`message-row ${msg.role === 'user' ? 'user' : 'ai'}`}>
                    {msg.role === 'assistant' && (
                      <div className="message-avatar ai">
                        <Sparkles size={16} color="white" />
                      </div>
                    )}
                    <div className="message-content">
                      <div className="text-bubble">
                        {msg.animate ? <AnimatedText text={parsed.text} /> : parsed.text}
                      </div>
                      
                      {parsed.recommendation && (
                        <RecommendationCard recommendation={parsed.recommendation} />
                      )}

                      <div className="msg-time">
                        {formatTime(msg.created_at)}{msg.role === 'user' ? ' ✓✓' : ''}
                      </div>
                    </div>
                  </div>
                );
              })}

              {sending && <TypingIndicator />}
              <div ref={scrollRef} />
            </>
          )}
        </div>

        {error && <div className="chat-error-banner">{error}</div>}

        <div className="chat-input-area">
          <button className="attach-btn"><Paperclip size={20} /></button>
          <input
            type="text"
            placeholder="Ask anything about travel..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending || loadingHistory}
          />
          <button className="send-btn" onClick={() => handleSend()} disabled={sending || loadingHistory || !input.trim()}>
            {sending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>

      <div className="chat-sidebar glass-panel">
        <h3 className="sidebar-title"><Sparkles size={18} className="text-gradient"/> Smart Suggestions</h3>

        <div className="insight-card glass-card">
          <div className="insight-icon"><Calendar size={20} /></div>
          <div className="insight-info">
            <span className="lbl">Best Travel Time</span>
            <h4>Nov - Feb</h4>
            <p>Pleasant weather & perfect for beaches.</p>
          </div>
        </div>

        <div className="insight-card glass-card">
          <div className="insight-icon"><Users size={20} /></div>
          <div className="insight-info">
            <span className="lbl">Crowd Level Prediction</span>
            <h4>Medium</h4>
            <p>Moderate crowd expected during your visit.</p>
            <div className="mini-chart">
              <svg viewBox="0 0 100 30" className="sparkline">
                <path d="M0,25 Q10,20 20,25 T40,15 T60,25 T80,5 T100,20" fill="none" stroke="var(--primary)" strokeWidth="2" />
                <path d="M0,25 Q10,20 20,25 T40,15 T60,25 T80,5 T100,20 L100,30 L0,30 Z" fill="url(#grad1)" />
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{stopColor: 'var(--primary)', stopOpacity: 0.3}} />
                    <stop offset="100%" style={{stopColor: 'var(--primary)', stopOpacity: 0}} />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        <div className="insight-card glass-card">
          <div className="insight-icon"><Bus size={20} /></div>
          <div className="insight-info">
            <span className="lbl">Cheapest Option</span>
            <h4>Bus + Hostel</h4>
            <p>Most affordable way to travel & stay in Goa.</p>
          </div>
        </div>

        <div className="ai-verification">
          <CheckCircle2 size={16} />
          <p>All suggestions are AI-generated. Click recommendation cards to sync them directly to your itinerary or budget.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
