import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setPremium] = useState(false);

  // Hàm riêng để fetch số ngày còn lại
  const fetchPremium = async (token) => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/subscriptions/remaining",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Cannot fetch remainingDays");
      const { remainingDays } = await res.json();
      setPremium(remainingDays > 0);
    } catch (err) {
      console.error("Error fetching remainingDays:", err);
      setPremium(false);
    }
  };

  // Chạy 1 lần khi mount để lấy user + premium
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        // 1) Fetch user info
        const meRes = await fetch("http://localhost:5000/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) throw new Error("Cannot fetch user");
        const data = await meRes.json();
        setUser({ ...data, role: data.user_role });
        localStorage.setItem("user", JSON.stringify(data));

        // 2) Fetch premium status
        await fetchPremium(token);
      } catch (err) {
        console.error("AuthProvider init error:", err);
        setUser(null);
        setPremium(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Login với API thực tế
  const login = async (email, password) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }
      const token = data.token;
      localStorage.setItem("token", token);

      // Lấy lại user + premium ngay sau login
      const meRes = await fetch("http://localhost:5000/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) throw new Error("Cannot fetch user after login");
      const userData = await meRes.json();
      setUser({ ...userData, role: userData.user_role });
      localStorage.setItem("user", JSON.stringify(userData));

      await fetchPremium(token);

      return userData;
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPremium(false);
  };

  // Kiểm tra role
  const hasRole = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };
  const isUser = () => hasRole(["member", "coach", "admin"]);
  const isCoach = () => hasRole(["coach"]);
  const isAdmin = () => hasRole(["admin"]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isPremium,
        fetchPremium,
        login,
        logout,
        hasRole,
        isUser,
        isCoach,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
