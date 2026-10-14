import { useState } from "react";
import { register, sendOTP, verifyOTP } from "../services/authService.js";
// import ConnectionStatus from "../components/ConnectionStatus";

/* Same style tokens as Dashboard.jsx */
const BRAND = "PayNest";
const TXT = "text-[#191B45] dark:text-[#EEEFFC]";
const MUTED = "text-[#4B4E7A] dark:text-[#A8ABD8]";
const LINE = "border-[#D8DBEE] dark:border-[#2C3068]";
const SURF = "bg-white dark:bg-[#171A47]";
const INPUT = `w-full min-h-[46px] rounded-[10px] border-[1.5px] px-3 py-2.5 ${LINE} ${TXT} bg-[#F5F6FB] dark:bg-[#0E1030] placeholder:opacity-70 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#2F33A8] dark:focus-visible:outline-[#A9ACFF] aria-[invalid=true]:border-[#B3261E] dark:aria-[invalid=true]:border-[#FF8A80]`;
const BTN = "inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border-[1.5px] px-5 py-2.5 font-semibold transition focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#2F33A8]";
const PRIMARY = `${BTN} border-transparent bg-[#2F33A8] text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#D6F04A] dark:text-[#191B45]`;
const GHOST = `${BTN} ${LINE} ${TXT} bg-transparent hover:border-current`;
const WRAP = "mx-auto w-full max-w-[1160px] px-5";

const Tick = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none text-[#D6F04A]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

function Field({ id, label, err, children }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-[.95rem] font-semibold">{label}</label>
      {children}
      {err && <p role="alert" className="mt-1.5 text-[.9rem] text-[#B3261E] dark:text-[#FF8A80]">{err}</p>}
    </div>
  );
}

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "",  phone: "", password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpHint, setOtpHint] = useState("");

  const PHONE_RE = /^[6-9]\d{9}$/;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setFieldErrors((p) => ({ ...p, [name]: undefined }));
    if (name === "phone") {
      setPhoneVerified(false);
      setOtp("");
      setOtpHint("");
    }
  };

  const validate = () => {
    const er = {};
    const { name, email, phone, password, confirmPassword } = formData;
    if (name.trim().length < 2) er.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) er.email = "Enter a valid email address, for example name@example.com.";
    if (!PHONE_RE.test(phone.trim())) {
      er.phone = "Enter a valid 10-digit phone number.";
    }
    if (password.length < 6) er.password = "Use at least 6 characters.";
    if (confirmPassword !== password) er.confirmPassword = "Passwords do not match.";
    setFieldErrors(er);
    const first = ["name", "email", "phone", "password", "confirmPassword"].find((k) => er[k]);
    if (first) document.getElementById(first)?.focus();
    return !first;
  };

  const handleSendOTP = async () => {
    setMessage("");
    setError("");
    setOtpHint("");
    const phone = formData.phone.trim();
    if (!PHONE_RE.test(phone)) {
      setFieldErrors((p) => ({ ...p, phone: "Enter a valid 10-digit phone number." }));
      return;
    }
    try {
      setOtpBusy(true);
      setPhoneVerified(false);
      const res = await sendOTP(phone);
      if (res.success) {
        setMessage(res.message || "OTP sent to your phone.");
        // Dev mode only: the backend returns the OTP. Remove this in production.
        if (res.otp) setOtpHint(`Dev mode OTP: ${res.otp}`);
      } else {
        setError(res.message || "Failed to send OTP.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setOtpBusy(false);
    }
  };

  const handleVerifyOTP = async () => {
    setMessage("");
    setError("");
    const phone = formData.phone.trim();
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit OTP sent to your phone.");
      return;
    }
    try {
      setOtpBusy(true);
      const res = await verifyOTP(phone, otp.trim());
      if (res.success) {
        setPhoneVerified(true);
        setMessage(res.message || "Phone number verified.");
      } else {
        setPhoneVerified(false);
        setError(res.message || "OTP verification failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setOtpBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!validate()) return;

    if (!phoneVerified) {
      setError("Please verify your phone number with the OTP before creating an account.");
      return;
    }

    try {
      setLoading(true);
      const data = await register(formData.name.trim(), formData.email.trim(),formData.phone.trim(), formData.password);
      setMessage(data.message || "Registration successful");
      setFormData({ name: "", email: "",  phone: "", password: "", confirmPassword: "" });
      setOtp("");
      setPhoneVerified(false);
      setOtpHint("");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const bind = (name) => ({
    id: name,
    name,
    value: formData[name],
    onChange: handleChange,
    "aria-invalid": !!fieldErrors[name],
  });

  return (
    <div className={`flex min-h-screen flex-col bg-[#F5F6FB] text-[17px] leading-[1.55] dark:bg-[#0E1030] ${TXT}`}>
      {/* ---------- Header ---------- */}
      <header className={`sticky top-0 z-20 border-b ${LINE} ${SURF} pt-[env(safe-area-inset-top,0px)]`}>
        <div className={`${WRAP} flex h-16 items-center gap-7`}>
          <a href="/" className="flex items-center gap-2.5 text-[1.3rem] font-bold tracking-tight" aria-label={`${BRAND} home`}>
            <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
              <rect width="34" height="34" rx="10" className="fill-[#2F33A8] dark:fill-[#D6F04A]" />
              <path d="M9 13h15l-3.5-3.5M25 21H10l3.5 3.5" fill="none" className="stroke-white dark:stroke-[#191B45]" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {BRAND}
          </a>
          <nav aria-label="Main" className={`ml-auto hidden gap-6 font-medium md:flex ${MUTED}`}>
            {[["/#services", "Services"], ["/#how", "How it works"], ["/#fees", "Fees"], ["/#retailers", "Retailers"], ["/#faq", "Help"]].map(([h, t]) => (
              <a key={h} href={h} className="hover:text-[#191B45] dark:hover:text-white">{t}</a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 md:ml-0">
            {/* <ConnectionStatus /> */}
            <a href="/login" className={`${GHOST} !min-h-10 !px-4 !py-2`}>Log in</a>
          </div>
        </div>
      </header>

      {/* ---------- Hero with form ---------- */}
      <main className="relative flex-1 overflow-hidden bg-[#22258C] text-white dark:bg-[#14173F]">
        <div className="pointer-events-none absolute inset-0 bg-[repeating-radial-gradient(circle_at_92%_8%,transparent_0_16px,rgba(255,255,255,.055)_16px_17px)]" />
        <div className={`${WRAP} relative grid items-start gap-9 pb-12 pt-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:pb-[76px] lg:pt-16`}>
          <div>
            <h1 className="max-w-[13em] text-[clamp(2.3rem,5.2vw,3.7rem)] font-bold leading-[1.03] tracking-[-.025em]">Create your account in a minute</h1>
            <p className="mb-2.5 mt-5 max-w-[34em] text-[1.15rem] text-[#CDCFF3]">Save your recipients, see your past recharges and pay bills faster.</p>
            <p lang="hi" className="mb-6 text-[1.05rem] text-[#D6F04A]">अपना खाता बनाएं और रिचार्ज व भुगतान आसान करें।</p>
            <ul className="grid gap-2.5">
              {["Recharge, pay bills and send money from one place", "See the fee before you pay", "Get a receipt on screen and by SMS"].map((t) => (
                <li key={t} className="flex items-center gap-2.5"><Tick />{t}</li>
              ))}
            </ul>
          </div>

          <div className={`overflow-hidden rounded-[18px] shadow-[0_1px_2px_rgba(25,27,69,.08),0_14px_36px_rgba(25,27,69,.16)] ${SURF} ${TXT}`}>
            <div className="p-[18px] sm:p-[26px]">
              <h2 className="mb-4 text-[1.5rem] font-bold leading-tight tracking-tight">Create account</h2>

              {message && (
                <div role="status" className="mb-4 rounded-[10px] bg-[#17794A]/10 px-3.5 py-3 text-[.95rem] text-[#17794A] dark:bg-[#5FD497]/10 dark:text-[#5FD497]">{message}</div>
              )}
              {error && (
                <div role="alert" className="mb-4 rounded-[10px] bg-[#B3261E]/10 px-3.5 py-3 text-[.95rem] text-[#B3261E] dark:bg-[#FF8A80]/10 dark:text-[#FF8A80]">{error}</div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <Field id="name" label="Full name" err={fieldErrors.name}>
                  <input type="text" autoComplete="name" placeholder="Name as on your ID" className={INPUT} {...bind("name")} />
                </Field>
                <Field id="email" label="Email" err={fieldErrors.email}>
                  <input type="email" autoComplete="email" placeholder="name@example.com" className={INPUT} {...bind("email")} />
                </Field>
               <Field id="phone" label="Phone" err={fieldErrors.phone}>
                <input type="tel" autoComplete="tel" placeholder="9998887776" className={INPUT} {...bind("phone")}/>
              </Field>

                <Field id="otp" label="Phone OTP">
                  <div className="flex flex-wrap gap-2">
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                      placeholder="6-digit OTP"
                      className={`${INPUT} flex-1`}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      disabled={phoneVerified}
                    />
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={otpBusy || phoneVerified}
                      className={`${GHOST} !min-h-[46px] whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      Send OTP
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={otpBusy || phoneVerified || otp.length !== 6}
                      className={`${PRIMARY} !min-h-[46px] whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      Verify
                    </button>
                  </div>
                  {phoneVerified && (
                    <p className="mt-1.5 text-[.9rem] text-[#17794A] dark:text-[#5FD497]">Phone number verified.</p>
                  )}
                  {otpHint && !phoneVerified && (
                    <p className="mt-1.5 text-[.9rem] text-[#4B4E7A] dark:text-[#A8ABD8]">{otpHint}</p>
                  )}
                </Field>

                <div className="grid gap-x-3 sm:grid-cols-2">
                  <Field id="password" label="Password" err={fieldErrors.password}>
                    <input type="password" autoComplete="new-password" placeholder="At least 6 characters" className={INPUT} {...bind("password")} />
                  </Field>
                  <Field id="confirmPassword" label="Confirm password" err={fieldErrors.confirmPassword}>
                    <input type="password" autoComplete="new-password" placeholder="Repeat password" className={INPUT} {...bind("confirmPassword")} />
                  </Field>
                </div>
                <button type="submit" disabled={loading || !phoneVerified} className={`${PRIMARY} w-full disabled:cursor-not-allowed disabled:opacity-60`}>
                  {loading ? "Creating account..." : "Create account"}
                </button>
                {!phoneVerified && (
                  <p className={`mt-2 text-center text-[.85rem] ${MUTED}`}>Verify your phone number to enable account creation.</p>
                )}
              </form>

              <p className={`mt-4 text-center text-[.95rem] ${MUTED}`}>
                Already have an account?{" "}
                <a href="/login" className="font-semibold text-[#2F33A8] underline dark:text-[#A9ACFF]">Log in</a>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="bg-[#22258C] pb-9 pt-10 text-[#CDCFF3] dark:bg-[#14173F]">
        <div className={`${WRAP} border-t border-white/15 pt-5 text-[.9rem]`}>
          &copy; {new Date().getFullYear()} {BRAND}. All rights reserved.
          <br />[Add your company registration, licence and partner-bank details here]
        </div>
      </footer>
    </div>
  );
}
