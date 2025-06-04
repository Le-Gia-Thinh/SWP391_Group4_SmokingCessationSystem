  // components/GoogleRedirectHandler.jsx
  import React, { useEffect, useState } from "react";
  import { useNavigate, useSearchParams } from "react-router-dom";

  const GoogleRedirectHandler = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("Đang xử lý...");

    useEffect(() => {
      console.log("GoogleRedirectHandler mounted");
      console.log("Current URL:", window.location.href);
      console.log("Search params:", Object.fromEntries(searchParams));

      const token = searchParams.get("token");
      const error = searchParams.get("error");

      console.log("Token:", token ? "Present" : "Missing");
      console.log("Error:", error);

      if (error) {
        console.error("Google auth error:", error);
        setStatus("Có lỗi xảy ra: " + error);
        setTimeout(() => {
          navigate("/login?error=" + error);
        }, 2000);
        return;
      }

      if (token) {
        console.log("Token received, saving to localStorage");

        // 1. Lưu token vào localStorage
        localStorage.setItem("token", token);

        // 2. Giải mã payload từ token để lấy user info
        try {
          // JWT có 3 phần: header.payload.signature
          // payload được mã base64, ta decode nó bằng atob()
          const base64Payload = token.split(".")[1];
          const payloadString = atob(base64Payload);
          const payload = JSON.parse(payloadString);
          console.log("Token payload:", payload);

          // Giả sử payload chứa { id, email, name, avatar? }
          const userObj = {
            id: payload.id,
            email: payload.email,
            name: payload.name,
            // Nếu trong payload có trường avatar, gán vào avatarUrl
            avatar: payload.avatar || null
          };

          // 3. Lưu thông tin user giống như Login bằng email/password
          localStorage.setItem("user", JSON.stringify(userObj));

          setStatus("Đăng nhập thành công! Đang chuyển hướng...");
        } catch (e) {
          console.error("Invalid token format or cannot decode:", e);
          setStatus("Token không hợp lệ");
          setTimeout(() => {
            navigate("/login?error=invalid_token");
          }, 2000);
          return;
        }

        // 4. Chuyển về /home sau 1s
        console.log("Redirecting to /home in 1 second...");
        setTimeout(() => {
          navigate("/home");
        }, 1000);
      } else {
        console.error("No token received from Google auth");
        setStatus("Không nhận được token xác thực");
        setTimeout(() => {
          navigate("/login?error=no_token");
        }, 2000);
      }
    }, [navigate, searchParams]);

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h3>🔄 {status}</h3>
          <p>Vui lòng chờ trong giây lát...</p>

          {/* Debug info - chỉ hiển thị trong development */}
          {process.env.NODE_ENV === "development" && (
            <div
              style={{
                marginTop: "20px",
                padding: "10px",
                backgroundColor: "#f5f5f5",
                borderRadius: "5px",
                fontSize: "12px",
                color: "#666"
              }}
            >
              <p>
                <strong>Debug Info:</strong>
              </p>
              <p>URL: {window.location.href}</p>
              <p>Token: {searchParams.get("token") ? "Present" : "Missing"}</p>
              <p>Error: {searchParams.get("error") || "None"}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  export default GoogleRedirectHandler;
