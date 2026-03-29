import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, PlusCircle, Loader, X } from 'lucide-react';
import { fetchExpenses, addExpense, deleteExpense, fetchBudget, updateBudget, resetExpenses } from '../lib/dataStore';
import { Edit2, Save, Trash2, AlertTriangle } from 'lucide-react';

const CostManagement = () => {
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

  return (
    <div className="dashboard-panel glass-panel">
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <DollarSign className="icon" /> 
          Cost tracker
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={handleResetExpenses}
            style={{ 
              background: confirmReset ? 'var(--danger)' : 'none', 
              border: 'none', 
              color: confirmReset ? 'white' : 'var(--danger)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              transition: '0.3s'
            }}
          >
            <Trash2 size={16} /> {confirmReset ? 'Confirm?' : 'Reset'}
          </button>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
          >
            {showAdd ? <X size={20} /> : <PlusCircle size={20} />}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '12px', position: 'relative' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', display: 'flex', justifyContent: 'space-between' }}>
            Total Budget
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
              style={{ marginBottom: 0, padding: '4px 8px', width: '100%', height: '32px', fontSize: '1.2rem' }}
              value={budget} 
              onChange={e => setBudget(e.target.value)}
              autoFocus
            />
          ) : (
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpRight size={18} color="var(--success)" /> ${parseFloat(budget).toLocaleString()}
            </h2>
          )}
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '12px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Remaining</p>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px', color: balance < 0 ? 'var(--danger)' : 'var(--primary-text)' }}>
            <ArrowDownRight size={18} color="var(--danger)" /> ${balance.toLocaleString()}
          </h2>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAddExpense} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <input 
              type="text" placeholder="Expense Name" className="input" style={{ marginBottom: 0 }}
              value={newExp.name} onChange={e => setNewExp({...newExp, name: e.target.value})}
            />
            <input 
              type="number" placeholder="Amount ($)" className="input" style={{ marginBottom: 0 }}
              value={newExp.amount} onChange={e => setNewExp({...newExp, amount: e.target.value})}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <select 
              className="input" style={{ marginBottom: 0 }}
              value={newExp.category} onChange={e => setNewExp({...newExp, category: e.target.value})}
            >
              <option value="Transport">Transport</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Food">Food</option>
              <option value="Activities">Activities</option>
              <option value="General">General</option>
            </select>
            <input 
              type="date" className="input" style={{ marginBottom: 0 }}
              value={newExp.date} onChange={e => setNewExp({...newExp, date: e.target.value})}
            />
          </div>
          <button type="submit" className="btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }} disabled={adding}>
            {adding ? <Loader className="animate-spin" size={16} /> : <PlusCircle size={16} />}
            {adding ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      )}

      <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Recent Expenses</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}><Loader className="animate-spin" size={24} color="var(--accent)" /></div>
        ) : expenses.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', textAlign: 'center' }}>No expenses recorded.</p>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--glass-highlight)', borderRadius: '8px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.9rem' }}>{expense.name}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>{expense.category} &bull; {expense.date}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontWeight: '600' }}>
                  -${expense.amount}
                </div>
                <button 
                  onClick={() => handleDeleteExpense(expense.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.6 }}
                  disabled={deletingId === expense.id}
                >
                  {deletingId === expense.id ? <Loader className="animate-spin" size={14} /> : <X size={14} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default CostManagement;
