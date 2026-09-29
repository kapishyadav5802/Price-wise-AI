import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './src/App.jsx'
import { initPlatform } from './src/platform'
import './src/styles/base.css'
import './src/styles/components.css'

/* installed-app behaviour: install prompt, offline SW, native bridge */
initPlatform()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
