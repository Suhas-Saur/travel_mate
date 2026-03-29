import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          padding: '20px',
          background: 'rgba(255, 0, 0, 0.1)',
          border: '1px solid var(--danger)',
          borderRadius: '12px',
          color: 'var(--danger)',
          margin: '20px',
          fontSize: '0.9rem'
        }}>
          <h3>Something went wrong.</h3>
          <p>{this.state.error?.message || 'Unexpected runtime error'}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
