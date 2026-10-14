import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// import ConnectionStatus from "../../components/ConnectionStatus";

/* Same style tokens as Register.jsx / Dashboard.jsx */
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

function Field({ id, label, err, children, aside }) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="block text-[.95rem] font-semibold">{label}</label>
        {aside}
      </div>
      {children}
      {err && <p role="alert" className="mt-1.5 text-[.9rem] text-[#B3261E] dark:text-[#FF8A80]">{err}</p>}
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ phone: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setFieldErrors((p) => ({ ...p, [name]: undefined }));
  };

  const validate = () => {
    const er = {};
    const { phone, password } = formData;
    if (!/^[6-9]\d{9}$/.test(phone.trim())) er.phone = "Enter a valid phone address, for example name@example.com.";
    if (!password) er.password = "Enter your password.";
    setFieldErrors(er);
    const first = ["phone", "password"].find((k) => er[k]);
    if (first) document.getElementById(first)?.focus();
    return !first;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!validate()) return;

    try {
      setLoading(true);
      await login(formData.phone.trim(), formData.password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your phone and password and try again.");
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
            <a href="/register" className={`${GHOST} !min-h-10 !px-4 !py-2`}>Sign up</a>
          </div>
        </div>
      </header>

      {/* ---------- Hero with form ---------- */}
      <main className="relative flex-1 overflow-hidden bg-[#22258C] text-white dark:bg-[#14173F]">
        <div className="pointer-events-none absolute inset-0 bg-[repeating-radial-gradient(circle_at_92%_8%,transparent_0_16px,rgba(255,255,255,.055)_16px_17px)]" />
        <div className={`${WRAP} relative grid items-start gap-9 pb-12 pt-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:pb-[76px] lg:pt-16`}>
          <div>
            <h1 className="max-w-[13em] text-[clamp(2.3rem,5.2vw,3.7rem)] font-bold leading-[1.03] tracking-[-.025em]">Welcome back</h1>
            <p className="mb-2.5 mt-5 max-w-[34em] text-[1.15rem] text-[#CDCFF3]">Log in to recharge, pay bills and check your past payments.</p>
            <p lang="hi" className="mb-6 text-[1.05rem] text-[#D6F04A]">अपने खाते में लॉग इन करें और भुगतान करें।</p>
            <ul className="grid gap-2.5">
              {["Your saved recipients are ready to use", "See the fee before you pay", "Find every receipt in your history"].map((t) => (
                <li key={t} className="flex items-center gap-2.5"><Tick />{t}</li>
              ))}
            </ul>
          </div>

          <div className={`overflow-hidden rounded-[18px] shadow-[0_1px_2px_rgba(25,27,69,.08),0_14px_36px_rgba(25,27,69,.16)] ${SURF} ${TXT}`}>
            <div className="p-[18px] sm:p-[26px]">
              <h2 className="mb-4 text-[1.5rem] font-bold leading-tight tracking-tight">Log in</h2>

              {message && (
                <div role="status" className="mb-4 rounded-[10px] bg-[#17794A]/10 px-3.5 py-3 text-[.95rem] text-[#17794A] dark:bg-[#5FD497]/10 dark:text-[#5FD497]">{message}</div>
              )}
              {error && (
                <div role="alert" className="mb-4 rounded-[10px] bg-[#B3261E]/10 px-3.5 py-3 text-[.95rem] text-[#B3261E] dark:bg-[#FF8A80]/10 dark:text-[#FF8A80]">{error}</div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <Field id="phone" label="Mobile Number" err={fieldErrors.phone}>
                  <input type="tel" inputMode="numeric" autoComplete="tel" placeholder="9876543210" className={INPUT} {...bind("phone")} />
                </Field>

                <Field
                  id="password"
                  label="Password"
                  err={fieldErrors.password}
                  aside={
                    <a href="/forgot-password" className="text-[.9rem] font-semibold text-[#2F33A8] underline dark:text-[#A9ACFF]">Forgot password?</a>
                  }
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
                    className={INPUT}
                    {...bind("password")}
                  />
                </Field>

                <label className="mb-5 flex cursor-pointer items-center gap-2.5 text-[.95rem]">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="h-[18px] w-[18px] accent-[#2F33A8] dark:accent-[#D6F04A]"
                  />
                  Show password
                </label>

                <button type="submit" disabled={loading} className={`${PRIMARY} w-full`}>
                  {loading ? "Logging in..." : "Log in"}
                </button>
              </form>

              <p className={`mt-4 text-center text-[.95rem] ${MUTED}`}>
                New to {BRAND}?{" "}
                <a href="/register" className="font-semibold text-[#2F33A8] underline dark:text-[#A9ACFF]">Create an account</a>
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
