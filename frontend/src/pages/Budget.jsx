import { useState, useEffect, useMemo } from 'react';
import { Calendar, Bell, Wallet, CreditCard, ShieldCheck, AlertCircle, Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useCurrency, convertFromINR, convertToINR } from '../lib/currency';
import { listExpenses, createExpense, updateExpense, deleteExpense } from '../lib/expenses';
import { listTrips } from '../lib/api';
import './Budget.css';

const CATEGORY_OPTIONS = ['Travel', 'Hotel', 'Food', 'Activities', 'Shopping', 'Other'];
const CATEGORY_COLORS = ['#9d4edd', '#ff4d6d', '#ff9f1c', '#3a86ff', '#06d6a0', '#f72585', '#4cc9f0', '#ffb703'];

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm = { category: 'Travel', description: '', amount: '', expense_date: todayISO() };

const Budget = () => {
  const { user } = useAuth();
  const currencySymbol = useCurrency();

  const [expenses, setExpenses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Settings integration
  const [showNotifs, setShowNotifs] = useState(true);

  useEffect(() => {
    const isNotifEnabled = localStorage.getItem('manzil_notifications') !== 'false';
    setShowNotifs(isNotifEnabled);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    Promise.all([
      listExpenses().catch(err => {
        console.warn('Failed to load expenses from Supabase. Using mock expenses.', err);
        return [
          { id: 'mock-exp-1', category: 'Hotel', description: 'Grand Hyatt Room Booking', amount: 3500, expense_date: todayISO() },
          { id: 'mock-exp-2', category: 'Food', description: 'Seafood dinner at shacks', amount: 1200, expense_date: todayISO() },
          { id: 'mock-exp-3', category: 'Travel', description: 'Cab fare from airport', amount: 1500, expense_date: todayISO() }
        ];
      }),
      listTrips().catch(err => {
        console.warn('Failed to load trips from API. Using mock trip.', err);
        return [{
          trip_id: 'mock-trip-active',
          destination: 'Goa, India',
          days: 3,
          budget: 8000,
          interests: ['Beach', 'Nature']
        }];
      })
    ])
      .then(([expensesData, tripsData]) => {
        if (!isMounted) return;
        setExpenses(expensesData);
        setTrips(tripsData);
        
        if (tripsData.length > 0) {
          setSelectedTripId(tripsData[0].trip_id);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load your budget data.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [user]);

  // Derived active trip
  const tripBudget = useMemo(() => {
    if (!selectedTripId) return null;
    return trips.find(t => t.trip_id === selectedTripId) || null;
  }, [trips, selectedTripId]);

  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses]
  );

  const totalBudget = tripBudget?.budget ?? null;
  const remaining = totalBudget != null ? totalBudget - totalSpent : null;
  const pctSpent = totalBudget ? Math.min(Math.round((totalSpent / totalBudget) * 100), 999) : null;
  const isOverBudget = totalBudget != null && totalSpent > totalBudget;

  const categoryBreakdown = useMemo(() => {
    const totals = {};
    expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
    });
    return Object.entries(totals)
      .map(([name, value], idx) => ({
        name,
        value: convertFromINR(value),
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, currencySymbol]);

  const topCategory = categoryBreakdown[0] || null;

  // Alerts calculations
  const thresholdAlerts = useMemo(() => {
    if (!totalBudget) return [];
    const alerts = [];
    
    // Total budget alerts
    if (totalSpent > totalBudget) {
      alerts.push({
        type: 'danger',
        message: `Over Budget! You have exceeded your trip budget by ${currencySymbol}${convertFromINR(totalSpent - totalBudget).toLocaleString()}.`
      });
    } else if (pctSpent >= 85) {
      alerts.push({
        type: 'warning',
        message: `Warning: You have used ${pctSpent}% of your trip budget. Limit discretionary spending.`
      });
    }

    // Category specific alerts
    categoryBreakdown.forEach(cat => {
      const catPctOfTotalBudget = (cat.value / totalBudget) * 100;
      if (cat.name === 'Shopping' && catPctOfTotalBudget > 20) {
        alerts.push({
          type: 'info',
          message: `Shopping accounts for ${catPctOfTotalBudget.toFixed(0)}% of your overall trip budget limit.`
        });
      }
      if (cat.name === 'Food' && catPctOfTotalBudget > 30) {
        alerts.push({
          type: 'info',
          message: `Food expenses represent over 30% of your total target budget.`
        });
      }
    });

    return alerts;
  }, [categoryBreakdown, totalBudget, totalSpent, pctSpent]);

  const openAddForm = () => {
    setEditingId(null);
    setFormValues(emptyForm);
    setFormError('');
    setFormOpen(true);
  };

  const openEditForm = (expense) => {
    setEditingId(expense.id);
    setFormValues({
      category: expense.category,
      description: expense.description || '',
      amount: String(convertFromINR(expense.amount)),
      expense_date: expense.expense_date,
    });
    setFormError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormValues(emptyForm);
    setFormError('');
  };

  const handleFormChange = (field) => (e) => {
    setFormValues((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const amountNum = parseFloat(formValues.amount);
    if (!formValues.amount || isNaN(amountNum) || amountNum <= 0) {
      setFormError('Enter an amount greater than 0.');
      return;
    }

    setSaving(true);
    const inrAmount = convertToINR(amountNum);
    const payload = {
      category: formValues.category,
      description: formValues.description,
      amount: inrAmount,
      expense_date: formValues.expense_date,
    };

    try {
      if (editingId && !editingId.toString().startsWith('mock-')) {
        const updated = await updateExpense(editingId, payload);
        setExpenses((prev) => prev.map((exp) => (exp.id === editingId ? updated : exp)));
      } else if (editingId) {
        // Edit local mock expense
        const updated = { id: editingId, ...payload };
        setExpenses((prev) => prev.map((exp) => (exp.id === editingId ? updated : exp)));
      } else {
        const created = await createExpense(payload);
        setExpenses((prev) => [created, ...prev]);
      }
      closeForm();
    } catch (err) {
      console.warn('Failed to save to Supabase. Saving in local memory instead.', err);
      // Fallback: update state locally
      if (editingId) {
        const updated = { id: editingId, ...payload };
        setExpenses((prev) => prev.map((exp) => (exp.id === editingId ? updated : exp)));
      } else {
        const localCreated = { id: `mock-user-${Date.now()}`, ...payload };
        setExpenses((prev) => [localCreated, ...prev]);
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense? This cannot be undone.')) return;

    setDeletingId(id);
    setError('');
    try {
      if (!id.toString().startsWith('mock-')) {
        await deleteExpense(id);
      }
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    } catch (err) {
      console.warn('Failed to delete from Supabase. Removing locally.', err);
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="budget-container animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px', color: 'var(--text-muted)' }}>
        <Loader2 size={20} className="spin" /> Loading your budget...
      </div>
    );
  }

  return (
    <div className="budget-container animate-fade-in">
      <div className="budget-header">
        <div>
          <h2>Smart Budget Analysis</h2>
          <p>Track, analyze and optimize your expenses</p>
        </div>
        <div className="header-actions">
          {trips.length > 0 ? (
            <div className="trip-select-wrapper glass-panel">
              <Calendar size={16} />
              <select 
                value={selectedTripId} 
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="budget-trip-dropdown"
              >
                {trips.map(t => (
                  <option key={t.trip_id} value={t.trip_id}>🌴 {t.destination}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="date-picker glass-panel">
              <Calendar size={16} />
              <span>No active trip</span>
            </div>
          )}
          
          <button className="icon-btn"><Bell size={18} /></button>
          <div className="user-profile-sm">
            <div className="avatar-fallback">{(user?.user_metadata?.full_name || user?.email || 'T').charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <span className="name">{(user?.user_metadata?.full_name || user?.email || '').split(' ')[0]}</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="budget-error">{error}</div>}

      {showNotifs && thresholdAlerts.length > 0 && (
        <div className="budget-alerts-section">
          {thresholdAlerts.map((alert, i) => (
            <div key={i} className={`alert-banner glass-panel ${alert.type} animate-fade-in`}>
              <AlertCircle size={16} />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="summary-cards">
        <div className="summary-card glass-card">
          <div className="card-icon" style={{ background: 'rgba(157, 78, 221, 0.1)', color: '#9d4edd' }}><Wallet /></div>
          <div className="card-info">
            <span className="lbl">Total Budget</span>
            <h3>{totalBudget != null ? `${currencySymbol}${convertFromINR(totalBudget).toLocaleString()}` : '—'}</h3>
            <span className="sub">{totalBudget != null ? 'This Trip' : 'Plan a trip to set one'}</span>
          </div>
        </div>
        <div className="summary-card glass-card">
          <div className="card-icon" style={{ background: 'rgba(255, 77, 109, 0.1)', color: '#ff4d6d' }}><CreditCard /></div>
          <div className="card-info">
            <span className="lbl">Total Spent</span>
            <h3>{currencySymbol}{convertFromINR(totalSpent).toLocaleString()}</h3>
            <span className="sub">{pctSpent != null ? `${pctSpent}% of budget` : `${expenses.length} expense${expenses.length === 1 ? '' : 's'}`}</span>
          </div>
        </div>
        <div className="summary-card glass-card">
          <div className="card-icon" style={{ background: 'rgba(58, 134, 255, 0.1)', color: '#3a86ff' }}><Wallet /></div>
          <div className="card-info">
            <span className="lbl">Remaining</span>
            <h3>{remaining != null ? `${currencySymbol}${convertFromINR(remaining).toLocaleString()}` : '—'}</h3>
            <span className="sub">{remaining != null ? `${Math.max(100 - pctSpent, 0)}% of budget` : 'No budget set'}</span>
          </div>
        </div>
        <div className="summary-card glass-card">
          <div className="card-icon" style={{ background: isOverBudget ? 'rgba(239, 71, 111, 0.1)' : 'rgba(6, 214, 160, 0.1)', color: isOverBudget ? 'var(--danger)' : '#06d6a0' }}><ShieldCheck /></div>
          <div className="card-info">
            <span className="lbl">Status</span>
            <div className={`badge ${isOverBudget ? 'danger' : 'success'}`} style={{ display: 'inline-block', marginTop: '4px' }}>
              {totalBudget == null ? 'No Budget' : isOverBudget ? 'Over Budget' : 'Within Budget'}
            </div>
            <span className="sub" style={{ marginTop: '4px' }}>{isOverBudget ? 'Time to rein it in 😅' : 'Great job! 🎉'}</span>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card glass-panel">
          <div className="chart-header">
            <h3>Expense Breakdown</h3>
            <select className="chart-select"><option>By Category</option></select>
          </div>
          {categoryBreakdown.length === 0 ? (
            <p className="empty-state">No expenses yet — add your first one below.</p>
          ) : (
            <div className="pie-chart-container">
              <ResponsiveContainer width="50%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-panel-solid)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="legend">
                {categoryBreakdown.map((item, idx) => (
                  <div key={idx} className="legend-item">
                    <div className="legend-color" style={{ background: item.color }}></div>
                    <span className="legend-name">{item.name}</span>
                    <span className="legend-val">{currencySymbol}{item.value.toLocaleString()}</span>
                    <span className="legend-pct">{((item.value / totalSpent) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="chart-footer">
            <AlertCircle size={16} />
            {topCategory
              ? <>Your highest expense is <span className="highlight-pink">{topCategory.name}</span> at {((topCategory.value / totalSpent) * 100).toFixed(0)}% of total spend.</>
              : 'Add expenses to see your breakdown.'}
          </div>
        </div>

        <div className="chart-card glass-panel">
          <div className="chart-header">
            <h3>Expenses Overview</h3>
            <select className="chart-select"><option>Bar Chart</option></select>
          </div>
          {categoryBreakdown.length === 0 ? (
            <p className="empty-state">Nothing to chart yet.</p>
          ) : (
            <div className="bar-chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryBreakdown} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dx={-10} tickFormatter={(val) => `${currencySymbol}${val.toLocaleString()}`} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-panel-solid)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="chart-footer">
            <AlertCircle size={16} />
            You've spent <span className="highlight-pink">{currencySymbol}{convertFromINR(totalSpent).toLocaleString()}</span>
            {totalBudget != null && <> out of <span className="highlight-pink">{currencySymbol}{convertFromINR(totalBudget).toLocaleString()}</span> budgeted for this trip.</>}
          </div>
        </div>
      </div>

      <div className="bottom-row">
        <div className="details-card glass-panel">
          <h3>Category Breakdown</h3>
          {categoryBreakdown.length === 0 ? (
            <p className="empty-state">Nothing here yet.</p>
          ) : (
            <table className="details-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Spent</th>
                  <th>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="cat-cell">
                        <span className="cat-color" style={{ background: item.color }}></span>
                        {item.name}
                      </div>
                    </td>
                    <td>{currencySymbol}{item.value.toLocaleString()}</td>
                    <td>
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${(item.value / convertFromINR(totalSpent)) * 100}%`, background: item.color }}></div>
                      </div>
                      <span className="pct-text">{((item.value / convertFromINR(totalSpent)) * 100).toFixed(0)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="expenses-card glass-panel">
          <div className="expenses-card-header">
            <h3>Expenses</h3>
            {!formOpen && (
              <button className="btn-primary add-expense-btn" onClick={openAddForm}>
                <Plus size={16} /> Add Expense
              </button>
            )}
          </div>

          {formOpen && (
            <form className="expense-form" onSubmit={handleSubmit}>
              {formError && <div className="budget-error">{formError}</div>}
              <div className="expense-form-row">
                <select value={formValues.category} onChange={handleFormChange('category')} disabled={saving}>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="date"
                  value={formValues.expense_date}
                  onChange={handleFormChange('expense_date')}
                  disabled={saving}
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Description (optional)"
                value={formValues.description}
                onChange={handleFormChange('description')}
                disabled={saving}
              />
              <div className="expense-form-row">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Amount"
                  value={formValues.amount}
                  onChange={handleFormChange('amount')}
                  disabled={saving}
                  required
                />
                <div className="expense-form-actions">
                  <button type="button" className="icon-btn" onClick={closeForm} disabled={saving}>
                    <X size={18} />
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? <Loader2 size={16} className="spin" /> : (editingId ? 'Save Changes' : 'Add')}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="expense-list">
            {expenses.length === 0 ? (
              <p className="empty-state">No expenses logged yet.</p>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className="expense-row">
                  <div className="expense-row-color" style={{ background: CATEGORY_COLORS[CATEGORY_OPTIONS.indexOf(exp.category) % CATEGORY_COLORS.length] || '#888' }}></div>
                  <div className="expense-row-info">
                    <span className="expense-row-category">{exp.category}</span>
                    <span className="expense-row-desc">{exp.description || '—'}</span>
                  </div>
                  <span className="expense-row-date">{exp.expense_date}</span>
                  <span className="expense-row-amount">{currencySymbol}{convertFromINR(exp.amount).toLocaleString()}</span>
                  <div className="expense-row-actions">
                    <button className="icon-btn" onClick={() => openEditForm(exp)} disabled={deletingId === exp.id}>
                      <Pencil size={16} />
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(exp.id)} disabled={deletingId === exp.id}>
                      {deletingId === exp.id ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budget;
