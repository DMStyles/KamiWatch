import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('KamiWatch Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '80vh', gap: 16, padding: 32,
          color: '#fff', textAlign: 'center'
        }}>
          <span style={{ fontSize: 64 }}>⚠️</span>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Something went wrong rendering this page</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, fontSize: 13, background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {this.state.error?.toString() || 'Unknown rendering error'}
          </p>
          <button
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontSize: 14, fontWeight: 700, borderRadius: 10 }}
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
          >
            🔄 Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
