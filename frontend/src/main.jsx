import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Global guard preventing resource error events (e.g. image loads) from bubbling with circular DOM elements
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
