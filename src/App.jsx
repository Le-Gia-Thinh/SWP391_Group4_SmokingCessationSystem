import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // Thêm router
import Login from "./component/Login";
import Register from "./component/Register";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} /> {/* fallback route */}
      </Routes>
    </Router>
  );
}

export default App;
