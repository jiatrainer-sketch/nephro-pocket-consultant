import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { requestPersistentStorage } from './storage'

// Ask the browser to keep localStorage from being auto-evicted.
// Fire-and-forget: UI works either way, result only affects durability.
requestPersistentStorage()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
