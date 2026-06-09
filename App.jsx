import { useState, useEffect } from "react";

const OWNER_EMAIL = "kapishyadav5802@gmail.com";
const SESSION_DURATION = 24 * 60 * 60 * 1000;

const PRODUCTS = [
  { id: 1, name: "Sony WH-1000XM5 Headphones", amazon: 24990, flipkart: 23499, img: "🎧", category: "Electronics" },
  { id: 2, name: "Samsung Galaxy S24 Ultra", amazon: 129999, flipkart: 124999, img: "📱", category: "Mobile" },
  { id: 3, name: "Apple AirPods Pro", amazon: 24900, flipkart: 22990, img: "🎵", category: "Electronics" },
  { id: 4, name: "Nike Air Max 270", amazon: 10995, flipkart: 9999, img: "👟", category: "Footwear" },
  { id: 5, name: "Dyson V15 Vacuum", amazon: 54900, flipkart: 52490, img: "🧹", category: "Home" },
  { id: 6, name: "MacBook Air M3", amazon: 114900, flipkart: 112990, img: "💻", category: "Computers" },
];

const fmt = (n) => "₹" + n.toLocaleString("en-IN");

const SESSION_KEY = 'pricewise_session';

const sessionStore = {
  save(user) {
    const data = { ...user, loginAt: Date.now() };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch (e) {}
  },
  load() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data.loginAt > SESSION_DURATION) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return data;
    } catch (e) { return null; }
  },
  clear() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  },
};

// Google logo SVG
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export default function App() {
  const [page, setPage] = useState("loading");
  const [tab, setTab] = useState("search");
  const [isOwner, setIsOwner] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  // Login form state
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [loginStep, setLoginStep] = useState("email"); // email | name | signingin
  const [loginErr, setLoginErr] = useState("");
  const [sessionLabel, setSessionLabel] = useState("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [aiTip, setAiTip] = useState("");
  const [searching, setSearching] = useState(false);

  const [earnings, setEarnings] = useState([
    { product: "Sony WH-1000XM5", price: 23499, comm: 2350, platform: "Flipkart", date: "2024-06-01", user: "rahul@gmail.com" },
    { product: "Nike Air Max 270", price: 9999, comm: 1000, platform: "Flipkart", date: "2024-06-03", user: "priya@gmail.com" },
    { product: "Apple AirPods Pro", price: 22990, comm: 2299, platform: "Flipkart", date: "2024-06-05", user: "amit@gmail.com" },
  ]);
  const totalEarned = earnings.reduce((a, e) => a + e.comm, 0);
  const [withdrawn, setWithdrawn] = useState(0);
  const [wMethod, setWMethod] = useState("phonepe");
  const [wUpi, setWUpi] = useState("");
  const [wAmt, setWAmt] = useState("");
  const [wMsg, setWMsg] = useState("");
  const [wHistory, setWHistory] = useState([]);
  const available = totalEarned - withdrawn;

  // Check existing session on mount
  useEffect(() => {
    const s = sessionStore.load();
    if (s) {
      applySession(s);
    } else {
      setPage("login");
    }
  }, []);

  const applySession = (s) => {
    setUserEmail(s.email);
    setUserName(s.name);
    setIsOwner(s.email === OWNER_EMAIL);
    const remaining = SESSION_DURATION - (Date.now() - s.loginAt);
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    setSessionLabel(`${h}h ${m}m left`);
    setPage("app");
    setTab("search");
  };

  const handleEmailNext = () => {
    setLoginErr("");
    const e = emailInput.trim().toLowerCase();
    if (!e) { setLoginErr("Please enter your Gmail address."); return; }
    if (!e.includes("@")) { setLoginErr("Enter a valid email address."); return; }
    // Owner email — skip name step, sign in directly
    if (e === OWNER_EMAIL) {
      doSignIn(e, "Kapish Yadav");
    } else {
      setLoginStep("name");
    }
  };

  const handleNameNext = () => {
    setLoginErr("");
    const n = nameInput.trim();
    if (!n) { setLoginErr("Please enter your name."); return; }
    doSignIn(emailInput.trim().toLowerCase(), n);
  };

  const doSignIn = (email, name) => {
    setLoginStep("signingin");
    setTimeout(() => {
      const userData = { email, name, loginAt: Date.now() };
      sessionStore.save(userData);
      applySession(userData);
    }, 1200);
  };

  const doLogout = () => {
    sessionStore.clear();
    setPage("login");
    setLoginStep("email");
    setEmailInput("");
    setNameInput("");
    setLoginErr("");
    setIsOwner(false);
    setUserEmail(""); setUserName("");
    setResults([]); setAiTip(""); setQuery("");
    setSessionLabel("");
  };

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setResults([]); setAiTip("");
    const q = query.toLowerCase();
    const found = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
    await new Promise(r => setTimeout(r, 400));
    setResults(found.length ? found : PRODUCTS.slice(0, 4));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 150,
          messages: [{ role: "user", content: `2-sentence buying tip for "${query}" comparing Amazon vs Flipkart India. Be brief and helpful.` }]
        })
      });
      const data = await res.json();
      if (data.content?.[0]?.text) setAiTip(data.content[0].text);
    } catch { setAiTip("Check both platforms for bank discounts before buying!"); }
    setSearching(false);
  };

  const buyProduct = (product, platform) => {
    const price = platform === "amazon" ? product.amazon : product.flipkart;
    const comm = Math.round(price * 0.1);
    setEarnings(prev => [{
      product: product.name, price, comm,
      platform: platform === "amazon" ? "Amazon" : "Flipkart",
      date: new Date().toISOString().split("T")[0],
      user: userEmail
    }, ...prev]);
    alert(`🛒 Opening ${platform === "amazon" ? "Amazon" : "Flipkart"}\n${product.name}\nPrice: ${fmt(price)}`);
  };

  const doWithdraw = () => {
    setWMsg("");
    const amt = parseInt(wAmt);
    if (!wUpi.trim()) { setWMsg("Enter your UPI ID."); return; }
    if (!amt || amt < 100) { setWMsg("Minimum withdrawal is ₹100."); return; }
    if (amt > available) { setWMsg("Not enough balance. Available: " + fmt(available)); return; }
    setWHistory(prev => [{ amount: amt, method: wMethod, upi: wUpi, date: new Date().toISOString().split("T")[0], status: "Processing" }, ...prev]);
    setWithdrawn(prev => prev + amt);
    setWMsg(`✅ ₹${amt} via ${wMethod === "phonepe" ? "PhonePe" : "Paytm"} initiated! Credits in 2-3 hours.`);
    setWUpi(""); setWAmt("");
  };

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
    padding: "13px 14px", color: "#fff", fontSize: 15, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
  };

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (page === "loading") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>🏷️</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading…</div>
      </div>
    </div>
  );

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  if (page === "login") return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#0f0c29 0%,#302b63 55%,#24243e 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, fontFamily: "'Segoe UI', system-ui, sans-serif"
    }}>
      <div style={{
        background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)",
        borderRadius: 28, padding: "48px 36px", width: "100%", maxWidth: 400,
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.65)", textAlign: "center"
      }}>
        <div style={{ fontSize: 50, marginBottom: 10 }}>🏷️</div>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 900, margin: "0 0 6px", letterSpacing: -0.5 }}>PriceWiseAI</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 32px" }}>Smart Price Comparison · India</p>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.04)", borderRadius: 18,
          padding: "28px 22px", marginBottom: 20,
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          {loginStep === "signingin" ? (
            // Signing in animation
            <div style={{ padding: "20px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>⟳</div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Signing you in…</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{emailInput}</div>
            </div>
          ) : loginStep === "email" ? (
            <>
              {/* Google-style sign in button look */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
                <GoogleLogo />
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Sign in with Google</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "0 0 20px", lineHeight: 1.6 }}>
                Enter your Gmail address to continue
              </p>
              <input
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEmailNext()}
                placeholder="you@gmail.com"
                type="email"
                style={inputStyle}
              />
              {loginErr && <div style={{ color: "#ff8080", fontSize: 12, marginTop: 8, textAlign: "left" }}>{loginErr}</div>}
              <button onClick={handleEmailNext} style={{
                width: "100%", marginTop: 14, padding: "13px 0",
                background: "linear-gradient(135deg,#4285F4,#34A853)",
                border: "none", borderRadius: 10, color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 0.2
              }}>
                Next →
              </button>
            </>
          ) : (
            // name step
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, justifyContent: "center" }}>
                <GoogleLogo />
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>One more step</span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 18 }}>{emailInput}</div>
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleNameNext()}
                placeholder="Your full name"
                style={inputStyle}
              />
              {loginErr && <div style={{ color: "#ff8080", fontSize: 12, marginTop: 8, textAlign: "left" }}>{loginErr}</div>}
              <button onClick={handleNameNext} style={{
                width: "100%", marginTop: 14, padding: "13px 0",
                background: "linear-gradient(135deg,#4285F4,#34A853)",
                border: "none", borderRadius: 10, color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: "pointer"
              }}>
                Sign In →
              </button>
              <button onClick={() => { setLoginStep("email"); setLoginErr(""); }} style={{
                width: "100%", marginTop: 8, padding: "10px 0",
                background: "transparent", border: "none",
                color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer"
              }}>← Back</button>
            </>
          )}
        </div>

        {/* Auto-login badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
          borderRadius: 20, padding: "5px 14px", marginBottom: 18
        }}>
          <span style={{ fontSize: 11 }}>⚡</span>
          <span style={{ color: "#34d399", fontSize: 11, fontWeight: 600 }}>Stays logged in for 24 hours</span>
        </div>

        <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 11, margin: 0, lineHeight: 1.7 }}>
          By signing in, you agree to our Terms of Service.<br />
          Your data is safe and never shared.
        </p>
      </div>
    </div>
  );

  // ── MAIN APP ───────────────────────────────────────────────────────────────
  const tabs = [
    { id: "search", label: "🔍 Search" },
    { id: "compare", label: "⚖️ Compare" },
    ...(isOwner ? [
      { id: "earnings", label: "💰 Earnings", gold: true },
      { id: "withdraw", label: "💸 Withdraw", gold: true },
    ] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d1a", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#fff" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#1a1a2e,#16213e)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 62,
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🏷️</span>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>PriceWiseAI</span>
          {isOwner && (
            <span style={{ background: "linear-gradient(135deg,#f7971e,#ffd200)", color: "#000", fontSize: 9, fontWeight: 900, padding: "2px 9px", borderRadius: 20, letterSpacing: 0.8 }}>OWNER</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {sessionLabel && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 20, padding: "3px 10px" }}>
              <span style={{ fontSize: 9 }}>🟢</span>
              <span style={{ color: "#34d399", fontSize: 10, fontWeight: 600 }}>{sessionLabel}</span>
            </div>
          )}
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#4285F4,#34A853)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
            {userName?.[0]?.toUpperCase() || "U"}
          </div>
          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</span>
          <button onClick={doLogout} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#12122a", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 16px", display: "flex", overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "12px 18px", background: "none", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
            color: tab === t.id ? (t.gold ? "#ffd200" : "#a78bfa") : "rgba(255,255,255,0.38)",
            borderBottom: `2px solid ${tab === t.id ? (t.gold ? "#ffd200" : "#a78bfa") : "transparent"}`,
            transition: "color 0.15s"
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 840, margin: "0 auto", padding: "24px 16px" }}>

        {/* SEARCH */}
        {tab === "search" && (
          <div>
            <h2 style={{ margin: "0 0 20px", fontSize: 21, fontWeight: 800 }}>Find Best Prices</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
                placeholder="Search any product…"
                style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 11, padding: "13px 15px", color: "#fff", fontSize: 15, outline: "none" }} />
              <button onClick={doSearch} disabled={searching} style={{ background: "linear-gradient(135deg,#667eea,#764ba2)", border: "none", borderRadius: 11, padding: "13px 22px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15, opacity: searching ? 0.7 : 1 }}>
                {searching ? "…" : "Search"}
              </button>
            </div>
            {aiTip && (
              <div style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 11, padding: "13px 15px", marginBottom: 18, fontSize: 13, color: "rgba(255,255,255,0.82)", lineHeight: 1.65 }}>
                <b style={{ color: "#a78bfa" }}>🤖 AI Tip: </b>{aiTip}
              </div>
            )}
            {results.map(p => {
              const best = p.flipkart <= p.amazon ? "flipkart" : "amazon";
              const save = Math.abs(p.amazon - p.flipkart);
              return (
                <div key={p.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 18, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
                    <span style={{ fontSize: 34 }}>{p.img}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12, marginTop: 2 }}>{p.category}</div>
                    </div>
                    {save > 0 && <div style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.28)", borderRadius: 7, padding: "4px 10px", fontSize: 11, color: "#34d399", fontWeight: 700 }}>Save {fmt(save)}</div>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                    {[["amazon", "🟠 Amazon", p.amazon], ["flipkart", "🔵 Flipkart", p.flipkart]].map(([plat, label, price]) => (
                      <button key={plat} onClick={() => buyProduct(p, plat)} style={{
                        background: best === plat ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${best === plat ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.07)"}`,
                        borderRadius: 11, padding: "13px 11px", cursor: "pointer", textAlign: "left", color: "#fff"
                      }}>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: best === plat ? "#34d399" : "#fff" }}>{fmt(price)}</div>
                        {best === plat && <div style={{ fontSize: 10, color: "#34d399", fontWeight: 700, marginTop: 3 }}>✓ Best Price</div>}
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 3 }}>Tap to buy →</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {results.length === 0 && !searching && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
                Search for headphones, phones, laptops and more…
              </div>
            )}
          </div>
        )}

        {/* COMPARE */}
        {tab === "compare" && (
          <div>
            <h2 style={{ margin: "0 0 18px", fontSize: 21, fontWeight: 800 }}>Full Price Comparison</h2>
            <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                    {["Product", "Amazon", "Flipkart", "Best Deal", "You Save"].map(h => (
                      <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PRODUCTS.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: i < PRODUCTS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 600 }}>{p.img} {p.name}</td>
                      <td style={{ padding: "12px 14px", color: p.amazon <= p.flipkart ? "#34d399" : "rgba(255,255,255,0.6)", fontWeight: p.amazon <= p.flipkart ? 700 : 400 }}>{fmt(p.amazon)}</td>
                      <td style={{ padding: "12px 14px", color: p.flipkart <= p.amazon ? "#34d399" : "rgba(255,255,255,0.6)", fontWeight: p.flipkart <= p.amazon ? 700 : 400 }}>{fmt(p.flipkart)}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#34d399" }}>{p.flipkart <= p.amazon ? "🔵 Flipkart" : "🟠 Amazon"}</td>
                      <td style={{ padding: "12px 14px", color: "#fbbf24", fontWeight: 600 }}>{fmt(Math.abs(p.amazon - p.flipkart))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EARNINGS */}
        {tab === "earnings" && isOwner && (
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 21, fontWeight: 800 }}>💰 My Earnings</h2>
            <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, marginBottom: 22 }}>10% commission on every purchase</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
              {[["Total Earned", fmt(totalEarned), "#34d399"], ["Withdrawn", fmt(withdrawn), "#60a5fa"], ["Available", fmt(available), "#fbbf24"]].map(([l, v, c]) => (
                <div key={l} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 13, padding: "16px 15px" }}>
                  <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 11, marginBottom: 5 }}>{l}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: c }}>{v}</div>
                </div>
              ))}
            </div>
            {earnings.map((e, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 11, padding: "13px 15px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.product}</div>
                  <div style={{ color: "rgba(255,255,255,0.32)", fontSize: 11, marginTop: 3 }}>{e.platform} · {e.date} · {e.user}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{fmt(e.price)}</div>
                  <div style={{ color: "#34d399", fontWeight: 800, fontSize: 15 }}>+{fmt(e.comm)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WITHDRAW */}
        {tab === "withdraw" && isOwner && (
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 21, fontWeight: 800 }}>💸 Withdraw</h2>
            <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, marginBottom: 20 }}>Transfer earnings via PhonePe or Paytm</p>
            <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 13, padding: "18px 20px", marginBottom: 22 }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 5 }}>Available Balance</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#fbbf24" }}>{fmt(available)}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 8, letterSpacing: 0.8 }}>PAYMENT METHOD</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["phonepe", "📲 PhonePe"], ["paytm", "🟦 Paytm"]].map(([m, l]) => (
                  <button key={m} onClick={() => setWMethod(m)} style={{
                    flex: 1, padding: "11px 0", borderRadius: 10,
                    border: `1px solid ${wMethod === m ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.08)"}`,
                    background: wMethod === m ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.03)",
                    color: wMethod === m ? "#a78bfa" : "rgba(255,255,255,0.5)",
                    cursor: "pointer", fontWeight: 700, fontSize: 13
                  }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7, letterSpacing: 0.8 }}>UPI ID</label>
              <input value={wUpi} onChange={e => setWUpi(e.target.value)} placeholder="yourname@upi"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7, letterSpacing: 0.8 }}>AMOUNT (₹)</label>
              <input type="number" value={wAmt} onChange={e => setWAmt(e.target.value)} placeholder="Min ₹100"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            {wMsg && (
              <div style={{ background: wMsg.startsWith("✅") ? "rgba(52,211,153,0.1)" : "rgba(255,80,80,0.1)", border: `1px solid ${wMsg.startsWith("✅") ? "rgba(52,211,153,0.25)" : "rgba(255,80,80,0.25)"}`, borderRadius: 10, padding: "11px 14px", color: wMsg.startsWith("✅") ? "#34d399" : "#ff8080", fontSize: 13, marginBottom: 14 }}>{wMsg}</div>
            )}
            <button onClick={doWithdraw} style={{ width: "100%", padding: "14px 0", background: "linear-gradient(135deg,#f7971e,#ffd200)", border: "none", borderRadius: 12, color: "#000", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              Withdraw Now →
            </button>
            {wHistory.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "rgba(255,255,255,0.7)" }}>Withdrawal History</h3>
                {wHistory.map((w, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#fbbf24" }}>{fmt(w.amount)}</div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>{w.method === "phonepe" ? "PhonePe" : "Paytm"} · {w.upi} · {w.date}</div>
                    </div>
                    <div style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 6, padding: "3px 9px", color: "#fbbf24", fontSize: 11, fontWeight: 700 }}>{w.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
