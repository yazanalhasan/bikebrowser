import { Component } from 'react';

/**
 * Error Boundary Component
 * 
 * Catches React rendering errors and displays fallback UI
 * instead of crashing the entire app.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to main process for debugging
    if (window.electronAPI?.logError) {
      window.electronAPI.logError({
        message: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">😞</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 text-lg">
                Don't worry, this happens sometimes. Let's try to fix it!
              </p>
            </div>

            {/* Error details (collapsed by default) */}
            <details className="mb-6 bg-gray-50 rounded-lg p-4">
              <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                Error Details (for developers)
              </summary>
              <div className="text-sm text-gray-600 font-mono overflow-auto max-h-64">
                <p className="mb-2"><strong>Error:</strong> {this.state.error?.toString()}</p>
                {this.state.error?.stack && (
                  <pre className="whitespace-pre-wrap text-xs">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            </details>

            {/* Action buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold
                         hover:bg-blue-600 transition-colors shadow-md"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold
                         hover:bg-gray-600 transition-colors shadow-md"
              >
                Reload App
              </button>
            </div>

            {/* Helpful tips */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">💡 Helpful Tips:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Click "Try Again" to continue where you left off</li>
                <li>• Click "Reload App" if the problem persists</li>
                <li>• Make sure you have a stable internet connection</li>
                <li>• If this keeps happening, try restarting BikeBrowser</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
