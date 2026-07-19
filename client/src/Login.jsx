import { useState } from "react";
import axios from "axios";

function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await axios.post("http://localhost:5000/api/auth/register", {
          name,
          email,
          password,
        });
        // Auto-login after register
        const loginRes = await axios.post("http://localhost:5000/api/auth/login", {
          email,
          password,
        });
        localStorage.setItem("token", loginRes.data.token);
        onLoginSuccess();
      } else {
        const response = await axios.post("http://localhost:5000/api/auth/login", {
          email,
          password,
        });
        localStorage.setItem("token", response.data.token);
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", fontFamily: "sans-serif", color: "#eee" }}>
      <h1 style={{ textAlign: "center" }}>{isRegister ? "Create Account" : "Login"}</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
        {isRegister && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {error && <p style={{ color: "#ef4444", margin: 0 }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading} style={buttonStyle}>
          {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
        </button>

        <p style={{ textAlign: "center", color: "#aaa" }}>
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{ color: "#3b82f6", cursor: "pointer" }}
          >
            {isRegister ? "Login" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "12px",
  fontSize: "16px",
  borderRadius: "6px",
  border: "1px solid #444",
  background: "#2a2a2a",
  color: "#fff",
};

const buttonStyle = {
  padding: "12px",
  fontSize: "16px",
  borderRadius: "6px",
  border: "none",
  background: "#3b82f6",
  color: "#fff",
  cursor: "pointer",
};

export default Login;