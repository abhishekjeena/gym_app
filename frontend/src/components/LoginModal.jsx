import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";

const initialRegister = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  gender: "",
  age: "",
  membershipPlan: "Monthly",
  joinDate: new Date().toISOString().slice(0, 10),
  gdprConsent: false,
};

export function LoginModal({ open, onClose }) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState("login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState(initialRegister);
  const [forgotData, setForgotData] = useState({
    email: "",
    verificationToken: "",
    resetCode: "",
    newPassword: "",
  });
  const [devResetCode, setDevResetCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const user = await login(loginData);
      toast.success("Login successful.");
      onClose();
      navigate(user.role === "admin" ? "/admin" : "/client");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const payload = { ...registerData, age: Number(registerData.age) || null };
      await register(payload);
      const successMessage = "Registration complete. You can now log in.";
      setMessage(successMessage);
      toast.success(successMessage);
      setMode("login");
      setRegisterData(initialRegister);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  }

  async function handleForgot(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      if (!forgotData.verificationToken) {
        const data = await api.post("/auth/forgot-password", { email: forgotData.email });
        setForgotData((current) => ({
          ...current,
          verificationToken: data.verificationToken,
        }));
        setDevResetCode(data.devResetCode || "");
        const successMessage =
          "Step 1 complete. Enter the 6-digit reset code and your new password.";
        setMessage(successMessage);
        toast.info(successMessage);
        return;
      }

      await api.post("/auth/reset-password", forgotData);
      const successMessage = "Password reset complete. Please log in with your new password.";
      setMessage(successMessage);
      toast.success(successMessage);
      setMode("login");
      setForgotData({
        email: "",
        verificationToken: "",
        resetCode: "",
        newPassword: "",
      });
      setDevResetCode("");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button className="modal-close" onClick={onClose} type="button">
          x
        </button>
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Join
          </button>
          <button
            type="button"
            className={mode === "forgot" ? "active" : ""}
            onClick={() => setMode("forgot")}
          >
            Forgot Password
          </button>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-success">{message}</p> : null}
        {devResetCode ? (
          <p className="form-hint">Development reset code: {devResetCode}</p>
        ) : null}

        {mode === "login" ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={loginData.email}
              onChange={(e) =>
                setLoginData((current) => ({ ...current, email: e.target.value }))
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData((current) => ({ ...current, password: e.target.value }))
              }
              required
            />
            <button type="submit" className="primary-button">
              Login to Dashboard
            </button>
            <p className="form-hint">
              Role-based routing is automatic. Admin and client both use this same login.
            </p>
          </form>
        ) : null}

        {mode === "register" ? (
          <form className="auth-form" onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Full name"
              value={registerData.fullName}
              onChange={(e) =>
                setRegisterData((current) => ({ ...current, fullName: e.target.value }))
              }
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={registerData.email}
              onChange={(e) =>
                setRegisterData((current) => ({ ...current, email: e.target.value }))
              }
              required
            />
            <input
              type="password"
              placeholder="Strong password"
              value={registerData.password}
              onChange={(e) =>
                setRegisterData((current) => ({ ...current, password: e.target.value }))
              }
              required
            />
            <div className="grid-two">
              <input
                type="text"
                placeholder="Phone"
                value={registerData.phone}
                onChange={(e) =>
                  setRegisterData((current) => ({ ...current, phone: e.target.value }))
                }
              />
              <input
                type="number"
                placeholder="Age"
                value={registerData.age}
                onChange={(e) =>
                  setRegisterData((current) => ({ ...current, age: e.target.value }))
                }
              />
            </div>
            <div className="grid-two">
              <select
                value={registerData.gender}
                onChange={(e) =>
                  setRegisterData((current) => ({ ...current, gender: e.target.value }))
                }
              >
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              <select
                value={registerData.membershipPlan}
                onChange={(e) =>
                  setRegisterData((current) => ({
                    ...current,
                    membershipPlan: e.target.value,
                  }))
                }
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            <input
              type="date"
              value={registerData.joinDate}
              onChange={(e) =>
                setRegisterData((current) => ({ ...current, joinDate: e.target.value }))
              }
              required
            />
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={registerData.gdprConsent}
                onChange={(e) =>
                  setRegisterData((current) => ({
                    ...current,
                    gdprConsent: e.target.checked,
                  }))
                }
              />
              <span>I agree to privacy, cookie use, and secure account processing.</span>
            </label>
            <button type="submit" className="primary-button">
              Create Membership
            </button>
          </form>
        ) : null}

        {mode === "forgot" ? (
          <form className="auth-form" onSubmit={handleForgot}>
            <input
              type="email"
              placeholder="Account email"
              value={forgotData.email}
              onChange={(e) =>
                setForgotData((current) => ({ ...current, email: e.target.value }))
              }
              required
            />
            {forgotData.verificationToken ? (
              <>
                <input
                  type="text"
                  placeholder="6-digit verification code"
                  value={forgotData.resetCode}
                  onChange={(e) =>
                    setForgotData((current) => ({
                      ...current,
                      resetCode: e.target.value,
                    }))
                  }
                  required
                />
                <input
                  type="password"
                  placeholder="New strong password"
                  value={forgotData.newPassword}
                  onChange={(e) =>
                    setForgotData((current) => ({
                      ...current,
                      newPassword: e.target.value,
                    }))
                  }
                  required
                />
              </>
            ) : null}
            <button type="submit" className="primary-button">
              {forgotData.verificationToken ? "Reset Password" : "Send Reset Code"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
