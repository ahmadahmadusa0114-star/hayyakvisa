import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import API_BASE from './config/api'
import App from './App.jsx'
import './index.css'

// Set default base URL for all axios requests
axios.defaults.baseURL = API_BASE;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
