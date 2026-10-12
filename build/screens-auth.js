// GENERATED from src/screens-auth.jsx by build.js — do not edit.
function Logo({
  size = 28,
  color = 'var(--brand)',
  light = false
}) {
  return React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9
    }
  }, React.createElement("div", {
    style: {
      width: size,
      height: size
    }
  }, React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    fill: "none"
  }, React.createElement("rect", {
    x: "1",
    y: "1",
    width: "30",
    height: "30",
    rx: "9",
    fill: light ? 'rgba(255,255,255,.18)' : color
  }), React.createElement("circle", {
    cx: "9",
    cy: "23",
    r: "2",
    fill: "rgba(255,255,255,.6)"
  }), React.createElement("circle", {
    cx: "16",
    cy: "23",
    r: "2",
    fill: "rgba(255,255,255,.6)"
  }), React.createElement("circle", {
    cx: "23",
    cy: "23",
    r: "2",
    fill: "rgba(255,255,255,.6)"
  }), React.createElement("path", {
    d: "M9 21L16 14M16 21L16 14M23 21L16 14",
    stroke: "rgba(255,255,255,.38)",
    strokeWidth: "1.4",
    strokeLinecap: "round"
  }), React.createElement("circle", {
    cx: "16",
    cy: "12",
    r: "4",
    fill: "rgba(255,255,255,.18)",
    stroke: "#fff",
    strokeWidth: "1.5"
  }), React.createElement("path", {
    d: "M16 10V7M14 8.5L16 6.5L18 8.5",
    stroke: "#fff",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), React.createElement("span", {
    style: {
      fontSize: size * 0.62,
      fontWeight: 800,
      letterSpacing: '-.02em',
      color: light ? '#fff' : 'var(--ink)'
    }
  }, "IPO", React.createElement("span", {
    style: {
      color: light ? '#fff' : 'var(--brand)'
    }
  }, "Pool")));
}
function LoginScreen({
  onLogin
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = validEmail && password.length >= 1 && !loading;
  const handleLogin = async () => {
    if (!canSubmit) {
      setErr('Enter your email and password.');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const {
        error
      } = await window.sb.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        setErr(error.message.includes('Invalid login credentials') ? 'Invalid email or password.' : error.message);
        setLoading(false);
      } else {
        await onLogin();
      }
    } catch (e) {
      setErr('Connection error. Check your internet and try again.');
      setLoading(false);
    }
  };
  const inputWrap = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: '1.5px solid var(--border-strong)',
    borderRadius: 'var(--r-md)',
    padding: '13px 15px',
    background: 'var(--surface)',
    transition: 'border-color .15s'
  };
  return React.createElement("div", {
    style: {
      minHeight: '100vh',
      display: 'grid',
      background: 'var(--bg)'
    },
    className: "login-grid"
  }, React.createElement("div", {
    className: "login-brand",
    style: {
      background: 'linear-gradient(160deg, #0B8A4B 0%, #086B3A 64%, #064d2a 100%)',
      color: '#fff',
      padding: '48px 52px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden'
    }
  }, React.createElement("div", {
    style: {
      position: 'absolute',
      width: 460,
      height: 460,
      borderRadius: '50%',
      background: 'rgba(255,255,255,.06)',
      top: -160,
      right: -120
    }
  }), React.createElement("div", {
    style: {
      position: 'absolute',
      width: 320,
      height: 320,
      borderRadius: '50%',
      background: 'rgba(255,255,255,.05)',
      bottom: -120,
      left: -80
    }
  }), React.createElement(Logo, {
    light: true,
    size: 30
  }), React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 38,
      fontWeight: 800,
      lineHeight: 1.12,
      letterSpacing: '-.02em'
    }
  }, "Apply together.", React.createElement("br", null), "Profit together."), React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.6,
      color: 'rgba(255,255,255,.82)',
      maxWidth: 380,
      marginTop: 18
    }
  }, "Pool PAN accounts across friends and family, apply for every SME & Mainboard IPO, and split listing-day profits equally — tracked automatically."))), React.createElement("div", {
    style: {
      display: 'grid',
      placeItems: 'center',
      padding: '40px 24px'
    }
  }, React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 380
    }
  }, React.createElement("div", {
    className: "login-mobile-logo",
    style: {
      marginBottom: 28,
      display: 'none'
    }
  }, React.createElement(Logo, {
    size: 28
  })), React.createElement("h1", {
    style: {
      fontSize: 26,
      fontWeight: 800,
      letterSpacing: '-.02em',
      margin: '0 0 6px'
    }
  }, "Welcome back"), React.createElement("p", {
    style: {
      color: 'var(--ink-3)',
      fontSize: 14.5,
      margin: '0 0 26px'
    }
  }, "Login with the email linked to your PAN pool."), React.createElement("label", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--ink-2)',
      display: 'block',
      marginBottom: 8
    }
  }, "Email address"), React.createElement("div", {
    style: {
      ...inputWrap,
      borderColor: validEmail ? 'var(--brand)' : 'var(--border-strong)',
      marginBottom: 14
    }
  }, React.createElement(Icon, {
    name: "mail",
    size: 16,
    color: "var(--ink-2)",
    style: {
      flexShrink: 0
    }
  }), React.createElement("input", {
    value: email,
    onChange: e => {
      setEmail(e.target.value);
      setErr('');
    },
    onKeyDown: e => e.key === 'Enter' && handleLogin(),
    placeholder: "you@example.com",
    type: "email",
    style: {
      border: 'none',
      outline: 'none',
      fontSize: 15,
      fontWeight: 600,
      width: '100%',
      background: 'transparent',
      color: 'var(--ink)'
    }
  })), React.createElement("label", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--ink-2)',
      display: 'block',
      marginBottom: 8
    }
  }, "Password"), React.createElement("div", {
    style: {
      ...inputWrap,
      borderColor: password ? 'var(--brand)' : 'var(--border-strong)',
      marginBottom: err ? 10 : 22
    }
  }, React.createElement(Icon, {
    name: "lock",
    size: 16,
    color: "var(--ink-2)",
    style: {
      flexShrink: 0
    }
  }), React.createElement("input", {
    value: password,
    onChange: e => {
      setPassword(e.target.value);
      setErr('');
    },
    onKeyDown: e => e.key === 'Enter' && handleLogin(),
    placeholder: "••••••••",
    type: showPw ? 'text' : 'password',
    style: {
      border: 'none',
      outline: 'none',
      fontSize: 15,
      fontWeight: 600,
      width: '100%',
      background: 'transparent',
      color: 'var(--ink)'
    }
  }), React.createElement("button", {
    onClick: () => setShowPw(v => !v),
    style: {
      border: 'none',
      background: 'none',
      padding: 0,
      cursor: 'pointer',
      color: 'var(--ink-3)',
      display: 'grid',
      placeItems: 'center'
    }
  }, React.createElement(Icon, {
    name: showPw ? 'eyeOff' : 'eye',
    size: 16
  }))), err && React.createElement("div", {
    style: {
      color: 'var(--loss)',
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 12
    }
  }, err), React.createElement(Button, {
    variant: "primary",
    size: "lg",
    full: true,
    onClick: handleLogin,
    iconRight: loading ? undefined : 'chevR',
    style: {
      opacity: loading ? .7 : 1,
      pointerEvents: loading ? 'none' : 'auto'
    }
  }, loading ? 'Signing in…' : 'Login'))));
}
Object.assign(window, {
  LoginScreen,
  Logo
});