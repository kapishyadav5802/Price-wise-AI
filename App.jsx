// App.jsx — PriceWiseAI (Firebase Auth + all fixes applied)
import { useState, useEffect, useRef } from "react";
import { auth, googleProvider } from "./firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// ─── Constants ────────────────────────────────────────────────────────────────
const OWNER_EMAIL = "kapishyadav5802@gmail.com";

const PRODUCTS = [
  { id: 1,  name: "Sony WH-1000XM5 Headphones",  amazon: 24990,  flipkart: 23499,  img: "🎧", category: "Electronics" },
  { id: 2,  name: "Samsung Galaxy S24 Ultra",     amazon: 129999, flipkart: 124999, img: "📱", category: "Mobile" },
  { id: 3,  name: "Apple AirPods Pro 2",          amazon: 24900,  flipkart: 22990,  img: "🎵", category: "Electronics" },
  { id: 4,  name: "Nike Air Max 270",             amazon: 10995,  flipkart: 9999,   img: "👟", category: "Footwear" },
  { id: 5,  name: "Dyson V15 Vacuum",             amazon: 54900,  flipkart: 52490,  img: "🧹", category: "Home" },
  { id: 6,  name: "MacBook Air M3",               amazon: 114900, flipkart: 112990, img: "💻", category: "Computers" },
  { id: 7,  name: "iPhone 15 Pro Max",            amazon: 159900, flipkart: 157999, img: "📱", category: "Mobile" },
  { id: 8,  name: "iPhone 15 Pro",                amazon: 134900, flipkart: 132999, img: "📱", category: "Mobile" },
  { id: 9,  name: "iPhone 15",                    amazon: 79900,  flipkart: 77990,  img: "📱", category: "Mobile" },
  { id: 10, name: "OnePlus 12",                   amazon: 64999,  flipkart: 62999,  img: "📱", category: "Mobile" },
  { id: 11, name: "Google Pixel 8 Pro",           amazon: 106999, flipkart: 104999, img: "📱", category: "Mobile" },
  { id: 12, name: "iPad Pro M4",                  amazon: 119900, flipkart: 117990, img: "📱", category: "Tablets" },
  { id: 13, name: "Samsung Galaxy Tab S9",        amazon: 72999,  flipkart: 70999,  img: "📱", category: "Tablets" },
  { id: 14, name: "Dell XPS 15",                  amazon: 169990, flipkart: 166990, img: "💻", category: "Computers" },
  { id: 15, name: "Bose QuietComfort 45",         amazon: 22900,  flipkart: 21499,  img: "🎧", category: "Electronics" },
  { id: 16, name: "Adidas Ultraboost 22",         amazon: 12995,  flipkart: 11999,  img: "👟", category: "Footwear" },
  { id: 17, name: "LG OLED 55\" TV",             amazon: 149990, flipkart: 144990, img: "📺", category: "Electronics" },
  { id: 18, name: "Xiaomi 14 Ultra",              amazon: 99999,  flipkart: 97999,  img: "📱", category: "Mobile" },
  { id: 19, name: "Nothing Phone 2",              amazon: 44999,  flipkart: 43499,  img: "📱", category: "Mobile" },
  { id: 20, name: "realme GT 6",                  amazon: 39999,  flipkart: 38999,  img: "📱", category: "Mobile" },
];

const fmt = (n) => "₹" + n.toLocaleString("en-IN");

// ─── Smart fuzzy search ────────────────────────────────────────────────────────
// Tokenises both the query and product names so "iPhone 15 Pro Max" matches even
// when words appear in different order, handles partial words, etc.
function scoreProduct(product, rawQuery) {
  const q = rawQuery.toLowerCase().trim();
  const name = product.name.toLowerCase();
  const cat  = product.category.toLowerCase();

  // Exact / substring match — highest priority
  if (name.includes(q)) return 100;
  if (cat.includes(q))  return 60;

  // Token match — every query word must appear somewhere in name or category
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  const matchedTokens = tokens.filter(t => name.includes(t) || cat.includes(t));
  if (matchedTokens.length === tokens.length) return 80;          // all tokens matched
  if (matchedTokens.length >= Math.ceil(tokens.length * 0.6))
    return 40 + (matchedTokens.length / tokens.length) * 30;     // partial match

  return 0;
}

function searchProducts(query) {
  if (!query.trim()) return [];
  const scored = PRODUCTS
    .map(p => ({ ...p, _score: scoreProduct(p, query) }))
    .filter(p => p._score > 0)
    .sort((a, b) => b._score - a._score);
  return scored;
}

// ─── Google logo SVG ──────────────────────────────────────────────────────────
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]         = useState("loading");
  const [tab, setTab]           = useState("search");
  const [isOwner, setIsOwner]   = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName]   = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [authErr, setAuthErr]     = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
  const [aiTip, setAiTip]       = useState("");
  const [searching, setSearching] = useState(false);

  const [earnings, setEarnings] = useState([
    { product: "Sony WH-1000XM5", price: 23499, comm: 2350, platform: "Flipkart", date: "2024-06-01", user: "rahul@gmail.com" },
    { product: "Nike Air Max 270", price: 9999,  comm: 1000, platform: "Flipkart", date: "2024-06-03", user: "priya@gmail.com" },
    { product: "Apple AirPods Pro", price: 22990, comm: 2299, platform: "Flipkart", date: "2024-06-05", user: "amit@gmail.com" },
  ]);
  const totalEarned = earnings.reduce((a, e) => a + e.comm, 0);
  const [withdrawn, setWithdrawn] = useState(0);
  const [wMethod, setWMethod] = useState("phonepe");
  const [wUpi, setWUpi]       = useState("");
  const [wAmt, setWAmt]       = useState("");
  const [wMsg, setWMsg]       = useState("");
  const [wHistory, setWHistory] = useState([]);
  const available = totalEarned - withdrawn;

  // ── Firebase Auth listener ─────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const email = fbUser.email || "";
        const name  = fbUser.displayName || email.split("@")[0];
        const photo = fbUser.photoURL || "";
        setUserEmail(email);
        setUserName(name);
        setUserPhoto(photo);
        setIsOwner(email === OWNER_EMAIL);
        setPage("app");
        setTab("search");
      } else {
        setUserEmail(""); setUserName(""); setUserPhoto("");
        setIsOwner(false);
        setPage("login");
      }
    });
    return () => unsub();
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Sign in with Google ────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setAuthErr("");
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle the rest
    } catch (err) {
      const msgs = {
        "auth/popup-closed-by-user":     "Sign-in popup was closed. Please try again.",
        "auth/cancelled-popup-request":  "Another sign-in is already in progress.",
        "auth/popup-blocked":            "Popup was blocked by your browser. Please allow popups for this site.",
        "auth/network-request-failed":   "Network error. Please check your connection.",
      };
      setAuthErr(msgs[err.code] || "Sign-in failed. Please try again.");
    } finally {
      setSigningIn(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const doLogout = async () => {
    setProfileOpen(false);
    await signOut(auth);
    setResults([]); setAiTip(""); setQuery("");
  };

  // ── Search (broadened — uses AI for all product types) ─────────────────────
  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setResults([]); setAiTip("");

    // Smart local search first
    const found = searchProducts(query);
    await new Promise(r => setTimeout(r, 300));
    // Show matched results, or fall back to top-4 if nothing matches
    setResults(found.length ? found : PRODUCTS.slice(0, 4));

    // AI tip — broadened prompt works for all product categories globally
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 180,
          messages: [{
            role: "user",
            content: `You are a global price comparison assistant. Give a 2-sentence buying tip for "${query}".
Cover: best time to buy, which platform (Amazon, Flipkart, or other major global retailer) typically has the best price, and one money-saving trick. 
Do NOT limit advice to groceries. The product may be electronics, mobile phones, clothing, shoes, appliances, laptops, or any retail category worldwide.`
          }]
        })
      });
      const data = await res.json();
      if (data.content?.[0]?.text) setAiTip(data.content[0].text);
    } catch {
      setAiTip("Check both Amazon and Flipkart, and look for bank card discounts during sale events!");
    }
    setSearching(false);
  };

  // ── Buy ────────────────────────────────────────────────────────────────────
  const buyProduct = (product, platform) => {
    const price = platform === "amazon" ? product.amazon : product.flipkart;
    const comm  = Math.round(price * 0.1);
    setEarnings(prev => [{
      product: product.name, price, comm,
      platform: platform === "amazon" ? "Amazon" : "Flipkart",
      date: new Date().toISOString().split("T")[0],
      user: userEmail,
    }, ...prev]);
    alert(`🛒 Opening ${platform === "amazon" ? "Amazon" : "Flipkart"}\n${product.name}\nPrice: ${fmt(price)}`);
  };

  // ── Withdraw ───────────────────────────────────────────────────────────────
  const doWithdraw = () => {
    setWMsg("");
    const amt = parseInt(wAmt);
    if (!wUpi.trim())        { setWMsg("Enter your UPI ID."); return; }
    if (!amt || amt < 100)   { setWMsg("Minimum withdrawal is ₹100."); return; }
    if (amt > available)     { setWMsg("Not enough balance. Available: " + fmt(available)); return; }
    setWHistory(prev => [{
      amount: amt, method: wMethod, upi: wUpi,
      date: new Date().toISOString().split("T")[0], status: "Processing"
    }, ...prev]);
    setWithdrawn(prev => prev + amt);
    setWMsg(`✅ ₹${amt} via ${wMethod === "phonepe" ? "PhonePe" : "Paytm"} initiated! Credits in 2-3 hours.`);
    setWUpi(""); setWAmt("");
  };

  // ─── LOADING ────────────────────────────────────────────────────────────────
  if (page === "loading") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>🏷️</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading…</div>
      </div>
    </div>
  );

  // ─── LOGIN ──────────────────────────────────────────────────────────────────
  if (page === "login") return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#0f0c29 0%,#302b63 55%,#24243e 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, fontFamily: "'Segoe UI', system-ui, sans-serif"
    }}>
      <div style={{
        background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)",
        borderRadius: 28, padding: "48px 32px", width: "100%", maxWidth: 400,
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.65)", textAlign: "center"
      }}>
        <div style={{ fontSize: 50, marginBottom: 10 }}>🏷️</div>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 900, margin: "0 0 6px", letterSpacing: -0.5 }}>PriceWiseAI</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 32px" }}>Smart Price Comparison · India</p>

        <div style={{
          background: "rgba(255,255,255,0.04)", borderRadius: 18,
          padding: "32px 22px", marginBottom: 20,
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          {signingIn ? (
            <div style={{ padding: "20px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>⟳</div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Connecting to Google…</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Please complete sign-in in the popup.</div>
            </div>
          ) : (
            <>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                Sign in with your Google account to access price comparisons and deals.
              </div>

              {/* Primary Google Sign-In button */}
              <button
                onClick={handleGoogleSignIn}
                style={{
                  width: "100%", padding: "14px 0",
                  background: "#fff", border: "none", borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  fontSize: 15, fontWeight: 700, color: "#3c3c3c",
                  cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  marginBottom: 12,
                }}
              >
                <GoogleLogo />
                Sign in with Google
              </button>

              {/* Helper text */}
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "0 0 0", lineHeight: 1.7 }}>
                A popup will appear — choose any saved Gmail account or sign in with a different account.
              </p>

              {authErr && (
                <div style={{
                  marginTop: 16, background: "rgba(255,80,80,0.1)",
                  border: "1px solid rgba(255,80,80,0.25)", borderRadius: 10,
                  padding: "10px 14px", color: "#ff8080", fontSize: 13
                }}>
                  {authErr}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
          borderRadius: 20, padding: "5px 14px", marginBottom: 18
        }}>
          <span style={{ fontSize: 11 }}>🔒</span>
          <span style={{ color: "#34d399", fontSize: 11, fontWeight: 600 }}>Secured by Firebase Authentication</span>
        </div>

        <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 11, margin: 0, lineHeight: 1.7 }}>
          By signing in, you agree to our Terms of Service.<br />
          Your data is safe and never shared.
        </p>
      </div>
    </div>
  );

  // ─── MAIN APP ───────────────────────────────────────────────────────────────
  const tabs = [
    { id: "search",  label: "🔍 Search" },
    { id: "compare", label: "⚖️ Compare" },
    ...(isOwner ? [
      { id: "earnings", label: "💰 Earnings", gold: true },
      { id: "withdraw", label: "💸 Withdraw", gold: true },
    ] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d1a", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#fff" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg,#1a1a2e,#16213e)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 16px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 62,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🏷️</span>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>PriceWiseAI</span>
          {isOwner && (
            <span style={{ background: "linear-gradient(135deg,#f7971e,#ffd200)", color: "#000", fontSize: 9, fontWeight: 900, padding: "2px 9px", borderRadius: 20, letterSpacing: 0.8 }}>OWNER</span>
          )}
        </div>

        {/* ── Profile pill — merged with Logout (Fix #1) ────────────────── */}
        <div ref={profileRef} style={{ position: "relative" }}>
          {/* Clickable avatar + name pill */}
          <button
            onClick={() => setProfileOpen(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: profileOpen ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 24, padding: "5px 12px 5px 5px",
              cursor: "pointer", maxWidth: 200,
            }}
          >
            {userPhoto ? (
              <img src={userPhoto} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#4285F4,#34A853)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {userName?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}>
              {userName}
            </span>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{profileOpen ? "▲" : "▼"}</span>
          </button>

          {/* Dropdown — logout lives here, never overflows off-screen */}
          {profileOpen && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              background: "#1e1e35", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14, minWidth: 220, zIndex: 200,
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)", overflow: "hidden",
            }}>
              {/* User info inside dropdown */}
              <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {userPhoto ? (
                    <img src={userPhoto} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#4285F4,#34A853)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}>
         
