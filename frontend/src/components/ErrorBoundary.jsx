import { Component } from 'react'
import { Scale, RefreshCw, Home } from 'lucide-react'

/**
 * ErrorBoundary – Catches unhandled React render errors and displays
 * a user-friendly fallback instead of a blank white page.
 *
 * Wrap around <App /> or individual route trees.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-navy-900 gradient-mesh px-4">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />

          <div className="w-full max-w-md relative z-10 text-center">
            <div className="glass-card p-8">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <Scale className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="font-display font-bold text-2xl text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-400 text-sm mb-6">
                An unexpected error occurred. Please try reloading the page.
              </p>

              {this.state.error && (
                <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-left">
                  <p className="text-xs text-red-300 font-mono break-all">
                    {this.state.error.message || 'Unknown error'}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleReload}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
                <button
                  onClick={this.handleHome}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
