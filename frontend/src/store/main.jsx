import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../common/App.jsx'
import '../common/index.css'

// Global guard preventing resource error events from bubbling
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event && event.target && event.target instanceof Element) {
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
    }
  }, true);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
