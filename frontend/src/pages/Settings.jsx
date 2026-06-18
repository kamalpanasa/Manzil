import { useState, useEffect } from 'react';
import { DollarSign, Check, Key, Shield, HelpCircle, Save } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const [currency, setCurrency] = useState('INR');
  const [groqKey, setGroqKey] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedCurrency = localStorage.getItem('manzil_currency') || 'INR';
    const savedKey = localStorage.getItem('manzil_groq_key') || '';
    const savedNotifs = localStorage.getItem('manzil_notifications') !== 'false';
    
    setCurrency(savedCurrency);
    setGroqKey(savedKey);
    setNotifications(savedNotifs);
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('manzil_currency', currency);
    localStorage.setItem('manzil_groq_key', groqKey);
    localStorage.setItem('manzil_notifications', notifications.toString());
    
    // Dispatch event to notify components that currency might have changed
    window.dispatchEvent(new Event('manzil_settings_changed'));

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="settings-page animate-fade-in">
      <div className="settings-header-title">
        <h2>Application Settings</h2>
        <p>Configure regional defaults, notifications, and integration settings</p>
      </div>

      <div className="settings-container glass-panel">
        {saved && (
          <div className="settings-success-toast animate-fade-in">
            <Check size={16} /> Changes saved successfully!
          </div>
        )}

        <form onSubmit={handleSaveSettings}>
          <div className="settings-section">
            <h3 className="section-title"><DollarSign size={18} /> Regional Settings</h3>
            
            <div className="settings-option">
              <div className="option-info">
                <label>Default Currency</label>
                <p>Select your default currency for itinerary costs and budget tracking</p>
              </div>
              <div className="option-control">
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">British Pound (£)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="section-title"><Key size={18} /> Custom Integrations</h3>
            
            <div className="settings-option vertical">
              <div className="option-info">
                <label>Groq API Override (Optional)</label>
                <p>Use your own Groq API Key to override default server-side planning engines</p>
              </div>
              <div className="option-control full-width">
                <input 
                  type="password" 
                  placeholder="gsk_..." 
                  value={groqKey} 
                  onChange={(e) => setGroqKey(e.target.value)} 
                  className="settings-input"
                />
                <span className="helper-text"><Shield size={12} /> Keys are encrypted and stored locally in your browser cache.</span>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="section-title"><Shield size={18} /> Privacy & Notifications</h3>
            
            <div className="settings-option">
              <div className="option-info">
                <label>Budget Exceeded Warnings</label>
                <p>Show red warning indicator alerts when expenses exceed your total budget limit</p>
              </div>
              <div className="option-control">
                <div className="toggle-switch">
                  <input 
                    type="checkbox" 
                    id="notif-toggle" 
                    checked={notifications} 
                    onChange={(e) => setNotifications(e.target.checked)}
                  />
                  <label htmlFor="notif-toggle" className="toggle-label"></label>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-footer">
            <div className="help-box">
              <HelpCircle size={16} /> Need help? Read our <a href="#docs">documentation</a>.
            </div>
            <button type="submit" className="btn-primary settings-save-btn">
              <Save size={16} /> Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
