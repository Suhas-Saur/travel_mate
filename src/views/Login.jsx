import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, Compass, Loader, ArrowRight, User } from 'lucide-react';
import { signIn, signUp } from '../lib/dataStore';
import { supabase } from '../lib/supabase';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signIn(formData.username, formData.password);
      } else {
        await signUp(formData.username, formData.password);
      }
      // Reload is handled by signUp/signIn in dataStore or App.jsx parent
      window.location.reload(); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e0f7fa 0%, #80deea 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Bubbles */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', filter: 'blur(40px)' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(76,175,80,0.1)', filter: 'blur(60px)' }}></div>

      <div className="glass-panel login-card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '48px',
        textAlign: 'center',
        zIndex: 10,
        animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: 'var(--accent)', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px',
            boxShadow: '0 8px 16px var(--accent-glow)'
          }}>
            <Compass size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--primary-text)', marginBottom: '8px' }}>
            Travel Mate
          </h1>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.95rem' }}>
            {isLogin ? 'Welcome back! Ready for the next adventure?' : 'Start your journey with us today.'}
          </p>
        </div>

        <form onSubmit={handleAuth}>
          {error && (
            <div style={{ 
              background: 'rgba(211, 47, 47, 0.1)', 
              color: 'var(--danger)', 
              padding: '12px', 
              borderRadius: '8px', 
              fontSize: '0.85rem', 
              marginBottom: '20px',
              border: '1px solid rgba(211, 47, 47, 0.2)'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                name="username"
                className="input" 
                placeholder="Enter your name"
                required
                value={formData.username}
                onChange={handleChange}
                style={{ paddingLeft: '40px', marginBottom: 0 }}
              />
              <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--secondary-text)' }} />
            </div>
          </div>

          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                name="password"
                className="input" 
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={handleChange}
                style={{ paddingLeft: '40px', marginBottom: 0 }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--secondary-text)' }} />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '14px', 
              fontSize: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px' 
            }}
          >
            {loading ? <Loader className="animate-spin" size={20} /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
            {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Account')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ marginTop: '32px', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--secondary-text)' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--accent)', 
                fontWeight: '600', 
                marginLeft: '6px', 
                cursor: 'pointer' 
              }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
