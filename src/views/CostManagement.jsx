import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, PlusCircle, Loader, X, Edit2, Save, Trash2, ChevronLeft } from 'lucide-react';
import { fetchExpenses, addExpense, deleteExpense, fetchBudget, updateBudget, resetExpenses } from '../lib/dataStore';

const CostManagement = ({ isCollapsed, onToggleCollapse }) => {
  const [budget, setBudget] = useState(5000);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newExp, setNewExp] = useState({ name: '', amount: '', category: 'General', date: new Date().toISOString().split('T')[0] });
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const b = await fetchBudget();
    setBudget(b || 5000);
    const e = await fetchExpenses();
    setExpenses(e || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateBudget = async () => {
    const success = await updateBudget(parseFloat(budget));
    if (success) setIsEditingBudget(false);
  };

  const handleDeleteExpense = async (id) => {
    setDeletingId(id);
    const success = await deleteExpense(id);
    if (success) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
    setDeletingId(null);
  };

  const handleResetExpenses = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }

    setLoading(true);
    await resetExpenses();
    setExpenses([]);
    setConfirmReset(false);
    setLoading(false);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExp.name || !newExp.amount) return;
    setAdding(true);
    const saved = await addExpense({ ...newExp, amount: parseFloat(newExp.amount) });
    if (saved) {
      setExpenses(prev => [saved, ...prev]);
      setNewExp({ name: '', amount: '', category: 'General', date: new Date().toISOString().split('T')[0] });
      setShowAdd(false);
    }
    setAdding(false);
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const balance = budget - totalExpenses;

  if (isCollapsed) {
    return (
      <button 
        onClick={onToggleCollapse}
        className="panel-expand-pill"
        title="Expand Cost Tracker"
      >
        <DollarSign size={18} color="var(--accent)" />
        <span>Open Cost Tracker</span>
        <ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
      </button>
    );
  }

  return (
    <div className="dashboard-panel glass-panel">
      <div className="panel-header-row">
        <div className="panel-title">
          <DollarSign className="icon" color="var(--accent)" /> 
          Cost Tracker
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            onClick={handleResetExpenses}
            style={{ 
              background: confirmReset ? 'var(--danger)' : 'rgba(239, 68, 68, 0.08)', 
              border: 'none', 
              color: confirmReset ? 'white' : 'var(--danger)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: '600',
              transition: '0.2s'
            }}
          >
            <Trash2 size={14} /> {confirmReset ? 'Confirm?' : 'Reset'}
          </button>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="sidebar-toggle-btn"
            style={{ width: '30px', height: '30px', borderRadius: '8px', color: 'var(--accent)' }}
            title="Add Expense"
          >
            {showAdd ? <X size={17} /> : <PlusCircle size={17} />}
          </button>
          <button 
            onClick={onToggleCollapse}
            className="sidebar-toggle-btn"
            style={{ width: '30px', height: '30px', borderRadius: '8px' }}
            title="Minimize Panel to View Map"
          >
            <ChevronLeft size={17} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', position: 'relative' }}>
          <p style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span>Total Budget</span>
            <button 
              onClick={() => isEditingBudget ? handleUpdateBudget() : setIsEditingBudget(true)}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
            >
              {isEditingBudget ? <Save size={14} /> : <Edit2 size={14} />}
            </button>
          </p>
          {isEditingBudget ? (
            <input 
              type="number" 
              className="input" 
              style={{ marginBottom: 0, padding: '4px 8px', width: '100%', height: '32px', fontSize: '1.1rem' }}
              value={budget} 
              onChange={e => setBudget(e.target.value)}
              autoFocus
            />
          ) : (
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.3rem', color: '#0f172a' }}>
              <ArrowUpRight size={18} color="var(--success)" /> ${parseFloat(budget).toLocaleString()}
            </h2>
          )}
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '4px' }}>Remaining</p>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.3rem', color: balance < 0 ? 'var(--danger)' : '#0f172a' }}>
            <ArrowDownRight size={18} color={balance < 0 ? 'var(--danger)' : 'var(--success)'} /> ${balance.toLocaleString()}
          </h2>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAddExpense} style={{ background: 'rgba(255, 255, 255, 0.9)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.08)', marginBottom: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <input 
              type="text" placeholder="Expense Name" className="input" style={{ marginBottom: 0 }}
              value={newExp.name} onChange={e => setNewExp({...newExp, name: e.target.value})}
              required
            />
            <input 
              type="number" placeholder="Amount ($)" className="input" style={{ marginBottom: 0 }}
              value={newExp.amount} onChange={e => setNewExp({...newExp, amount: e.target.value})}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <select 
              className="input" style={{ marginBottom: 0 }}
              value={newExp.category} onChange={e => setNewExp({...newExp, category: e.target.value})}
            >
              <option value="Transport">Transport</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Food">Food & Dining</option>
              <option value="Activities">Activities & Sightseeing</option>
              <option value="General">General</option>
            </select>
            <input 
              type="date" className="input" style={{ marginBottom: 0 }}
              value={newExp.date} onChange={e => setNewExp({...newExp, date: e.target.value})}
            />
          </div>
          <button type="submit" className="btn" style={{ width: '100%' }} disabled={adding}>
            {adding ? <Loader className="animate-spin" size={15} /> : <PlusCircle size={15} />}
            {adding ? 'Saving...' : 'Add Expense'}
          </button>
        </form>
      )}

      <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>Expense Log</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}><Loader className="animate-spin" size={20} color="var(--accent)" /></div>
        ) : expenses.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '20px' }}>No expenses recorded yet.</p>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.85)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: '600', color: '#0f172a' }}>{expense.name}</h4>
                <p style={{ fontSize: '0.72rem', color: '#64748b' }}>{expense.category} &bull; {expense.date}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.92rem', color: '#0f172a' }}>
                  -${expense.amount}
                </span>
                <button 
                  onClick={() => handleDeleteExpense(expense.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                  disabled={deletingId === expense.id}
                  title="Delete"
                >
                  {deletingId === expense.id ? <Loader className="animate-spin" size={14} /> : <X size={14} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CostManagement;
