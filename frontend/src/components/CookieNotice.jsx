import { useEffect, useState } from "react";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = window.localStorage.getItem("gym-cookie-consent");
    setVisible(!accepted);
  }, []);

  if (!visible) return null;

  return (
    <div className="cookie-notice">
      <div>
        <strong>Privacy Notice</strong>
        <p>
          We use secure authentication cookies for login sessions and collect only
          the profile data needed to run your gym membership.
        </p>
      </div>
      <button
        type="button"
        className="primary-button"
        onClick={() => {
          window.localStorage.setItem("gym-cookie-consent", "accepted");
          setVisible(false);
        }}
      >
        Accept
      </button>
    </div>
  );
}

