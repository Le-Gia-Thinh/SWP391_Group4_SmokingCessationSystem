import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext';
import { Routes, Route } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom/client';
import $ from 'jquery';              // import mặc định
window.$ = window.jQuery = $;        // đặt jQuery global
import "animate.css/animate.min.css";
import WOW from 'wowjs';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'owl.carousel/dist/assets/owl.carousel.css';
import 'owl.carousel/dist/assets/owl.theme.default.css';

// KHÔNG import 'owl.carousel/dist/owl.carousel' ở đây
// OwlCarousel sẽ được nạp động trong component cần dùng

import 'bootstrap-icons/font/bootstrap-icons.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
