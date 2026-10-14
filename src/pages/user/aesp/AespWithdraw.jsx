import { useMemo, useRef, useState } from "react";

/* Same style tokens as Login.jsx / Register.jsx / Dashboard.jsx */
const BRAND = "PayNest";
const TXT = "text-[#191B45] dark:text-[#EEEFFC]";
const MUTED = "text-[#4B4E7A] dark:text-[#A8ABD8]";
const LINE = "border-[#D8DBEE] dark:border-[#2C3068]";
const SURF = "bg-white dark:bg-[#171A47]";
const INPUT = `w-full min-h-[46px] rounded-[10px] border-[1.5px] px-3 py-2.5 ${LINE} ${TXT} bg-[#F5F6FB] dark:bg-[#0E1030] placeholder:opacity-70 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#2F33A8] dark:focus-visible:outline-[#A9ACFF] aria-[invalid=true]:border-[#B3261E] dark:aria-[invalid=true]:border-[#FF8A80]`;
const BTN = "inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border-[1.5px] px-5 py-2.5 font-semibold transition focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#2F33A8]";
const PRIMARY = `${BTN} border-transparent bg-[#2F33A8] text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#D6F04A] dark:text-[#191B45]`;
const GHOST = `${BTN} ${LINE} ${TXT} bg-transparent hover:border-current disabled:cursor-not-allowed disabled:opacity-60`;
const WRAP = "mx-auto w-full max-w-[1160px] px-5";
const CARD = `rounded-[18px] shadow-[0_1px_2px_rgba(25,27,69,.08),0_14px_36px_rgba(25,27,69,.10)] ${SURF} ${TXT}`;

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

/* ------------------------------------------------------------------
   Config
------------------------------------------------------------------- */
const SERVICES = [
  { id: "withdraw", label: "Cash withdrawal", hint: "Hand cash to the customer", amount: true, cta: "Withdraw cash" },
  { id: "balance", label: "Balance enquiry", hint: "Show the account balance", amount: false, cta: "Check balance" },
  { id: "statement", label: "Mini statement", hint: "Show the last 5 transactions", amount: false, cta: "Get statement" },
  { id: "pay", label: "Aadhaar Pay", hint: "Collect a payment for goods", amount: true, cta: "Collect payment" },
];

const BANKS = [
  "State Bank of India", "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank of India",
  "Bank of India", "Central Bank of India", "Indian Bank", "India Post Payments Bank", "HDFC Bank",
  "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "IDBI Bank", "UCO Bank", "Indian Overseas Bank",
];

const MIN_AMOUNT = 100;
const MAX_AMOUNT = 10000;
const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

/* ------------------------------------------------------------------
   Aadhaar number check (12 digits, first digit 2-9, Verhoeff checksum)
------------------------------------------------------------------- */
const D = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
const P = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];

function isValidAadhaar(num) {
  if (!/^[2-9]\d{11}$/.test(num)) return false;
  let c = 0;
  [...num].reverse().forEach((ch, i) => {
    c = D[c][P[i % 8][Number(ch)]];
  });
  return c === 0;
}

const formatAadhaar = (digits) => digits.replace(/(\d{4})(?=\d)/g, "$1 ");

/* ------------------------------------------------------------------
   Backend + device hooks.  USE_MOCK lets you click through the UI
   before the real integration exists. Set it to false when ready.
------------------------------------------------------------------- */
const USE_MOCK = true;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Capture a fingerprint from the connected biometric device.
 * TODO (real device): call the device's RD Service on the retailer's
 * machine (for example POST http://127.0.0.1:11100/rd/capture with a
 * PidOptions XML body, as your device vendor documents). Send the
 * returned PID XML straight to your backend. Never store it.
 */
async function captureFingerprint() {
  if (USE_MOCK) {
    await wait(1400);
    return { pid: "MOCK_PID_BLOCK", quality: 78 };
  }
  throw new Error("Connect the fingerprint device and try again.");
}

/**
 * Send the transaction to your backend, which calls your AePS provider.
 * TODO: replace the endpoint and fields to match your provider.
 */
async function submitAeps(payload) {
  if (USE_MOCK) {
    await wait(1800);
    const now = new Date();
    return {
      rrn: String(Math.floor(1e11 + Math.random() * 9e11)),
      time: now.toISOString(),
      balance: 18425.5,
      statement: [
        { date: "09 Oct", note: "UPI/Grocery Mart", amount: -640, type: "Dr" },
        { date: "08 Oct", note: "Salary credit", amount: 22000, type: "Cr" },
        { date: "06 Oct", note: "ATM cash withdrawal", amount: -3000, type: "Dr" },
        { date: "04 Oct", note: "NEFT/Rent", amount: -8500, type: "Dr" },
        { date: "02 Oct", note: "Interest credit", amount: 112, type: "Cr" },
      ],
    };
  }
  const res = await fetch("/api/aeps/transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "The bank could not complete this request.");
  return data;
}

/* ------------------------------------------------------------------
   Small pieces
------------------------------------------------------------------- */
function Field({ id, label, hint, err, children }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-[.95rem] font-semibold">{label}</label>
      {children}
      {hint && !err && <p className={`mt-1.5 text-[.88rem] ${MUTED}`}>{hint}</p>}
      {err && <p role="alert" className="mt-1.5 text-[.9rem] text-[#B3261E] dark:text-[#FF8A80]">{err}</p>}
    </div>
  );
}

const Spinner = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
);

const FingerprintIcon = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6.5 6.2A8 8 0 0 1 20 11c0 1.4-.1 2.7-.4 4" />
    <path d="M4 12a8 8 0 0 1 .5-2.8" />
    <path d="M8 18.5c.6-1.7 1-3.6 1-5.5a3 3 0 0 1 6 0c0 2.4-.4 4.6-1.3 6.6" />
    <path d="M12 13c0 3-.5 5.6-1.6 8" />
    <path d="M4.2 15.5c.5-.9.8-1.9.8-3" />
  </svg>
);

const Tick = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/* ------------------------------------------------------------------
   Page
------------------------------------------------------------------- */
export default function AepsWithdraw() {
  const [service, setService] = useState("withdraw");
  const [form, setForm] = useState({ aadhaar: "", mobile: "", bank: "", amount: "" });
  const [errors, setErrors] = useState({});
  const [consent, setConsent] = useState(false);
  const [capture, setCapture] = useState({ status: "idle", quality: 0, pid: null, msg: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  const svc = useMemo(() => SERVICES.find((s) => s.id === service), [service]);

  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const pickService = (id) => {
    setService(id);
    setErrors({});
    setError("");
  };

  const doCapture = async () => {
    setCapture({ status: "capturing", quality: 0, pid: null, msg: "" });
    setErrors((p) => ({ ...p, finger: undefined }));
    try {
      const { pid, quality } = await captureFingerprint();
      setCapture({ status: "done", quality, pid, msg: "" });
    } catch (err) {
      setCapture({ status: "error", quality: 0, pid: null, msg: err.message || "Could not read the fingerprint." });
    }
  };

  const validate = () => {
    const er = {};
    if (!isValidAadhaar(form.aadhaar)) er.aadhaar = "Enter a valid 12-digit Aadhaar number.";
    if (!/^[6-9]\d{9}$/.test(form.mobile)) er.mobile = "Enter a valid 10-digit mobile number.";
    if (!form.bank) er.bank = "Choose the customer's bank.";
    if (svc.amount) {
      const amt = Number(form.amount);
      if (!form.amount) er.amount = "Enter the amount.";
      else if (!Number.isInteger(amt) || amt < MIN_AMOUNT || amt > MAX_AMOUNT)
        er.amount = `Enter a whole amount from ${inr.format(MIN_AMOUNT).replace(".00", "")} to ${inr.format(MAX_AMOUNT).replace(".00", "")}.`;
    }
    if (capture.status !== "done") er.finger = "Capture the customer's fingerprint.";
    if (!consent) er.consent = "Confirm that the customer has agreed.";
    setErrors(er);
    const first = ["aadhaar", "mobile", "bank", "amount", "finger", "consent"].find((k) => er[k]);
    if (first) document.getElementById(first)?.focus();
    return !first;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    try {
      setSubmitting(true);
      const data = await submitAeps({
        service,
        aadhaar: form.aadhaar,
        mobile: form.mobile,
        bank: form.bank,
        amount: svc.amount ? Number(form.amount) : undefined,
        pid: capture.pid,
        consent: true,
      });
      setResult({
        ...data,
        service,
        label: svc.label,
        amount: svc.amount ? Number(form.amount) : null,
        bank: form.bank,
        last4: form.aadhaar.slice(-4),
      });
      // Don't keep the Aadhaar number after a completed transaction
      setForm({ aadhaar: "", mobile: "", bank: "", amount: "" });
      setConsent(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (err) {
      setError(err.message || "Transaction failed. No money was moved. Try again.");
    } finally {
      // A fingerprint capture is single use: always ask for a fresh one
      setCapture({ status: "idle", quality: 0, pid: null, msg: "" });
      setSubmitting(false);
    }
  };

  const newTransaction = () => {
    setResult(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`flex min-h-screen flex-col bg-[#F5F6FB] text-[17px] leading-[1.55] dark:bg-[#0E1030] ${TXT}`}>
      {/* ---------- Header ---------- */}
      <header className={`sticky top-0 z-20 border-b ${LINE} ${SURF} pt-[env(safe-area-inset-top,0px)] print:hidden`}>
        <div className={`${WRAP} flex h-16 items-center gap-7`}>
          <a href="/dashboard" className="flex items-center gap-2.5 text-[1.3rem] font-bold tracking-tight" aria-label={`${BRAND} dashboard`}>
            <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
              <rect width="34" height="34" rx="10" className="fill-[#2F33A8] dark:fill-[#D6F04A]" />
              <path d="M9 13h15l-3.5-3.5M25 21H10l3.5 3.5" fill="none" className="stroke-white dark:stroke-[#191B45]" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {BRAND}
          </a>
          <nav aria-label="Main" className={`ml-auto flex items-center gap-6 font-medium ${MUTED}`}>
            <a href="/dashboard" className="hover:text-[#191B45] dark:hover:text-white">Dashboard</a>
            <a href="/aeps" aria-current="page" className="border-b-2 border-[#2F33A8] pb-0.5 font-semibold text-[#191B45] dark:border-[#D6F04A] dark:text-white">AePS</a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ---------- Title band ---------- */}
        <div className="relative overflow-hidden bg-[#22258C] text-white dark:bg-[#14173F] print:hidden">
          <div className="pointer-events-none absolute inset-0 bg-[repeating-radial-gradient(circle_at_92%_8%,transparent_0_16px,rgba(255,255,255,.055)_16px_17px)]" />
          <div className={`${WRAP} relative pb-14 pt-9 lg:pb-16 lg:pt-12`}>
            <h1 className="text-[clamp(2rem,4.4vw,3rem)] font-bold leading-[1.05] tracking-[-.025em]">Aadhaar payments</h1>
            <p className="mt-3 max-w-[36em] text-[1.1rem] text-[#CDCFF3]">
              Withdraw cash, check a balance or collect a payment using the customer&apos;s Aadhaar number and fingerprint.
            </p>
            <p lang="hi" className="mt-2 text-[1.02rem] text-[#D6F04A]">आधार नंबर और फिंगरप्रिंट से नकद निकासी और बैलेंस जांच करें।</p>
          </div>
        </div>

        <div className={`${WRAP} -mt-8 grid items-start gap-6 pb-14 lg:grid-cols-[1.1fr_.9fr]`}>
          {/* ---------- Form ---------- */}
          <section aria-labelledby="form-title" className={`${CARD} p-[18px] sm:p-[26px] print:hidden`}>
            <h2 id="form-title" className="mb-4 text-[1.5rem] font-bold leading-tight tracking-tight">New transaction</h2>

            <fieldset className="mb-6">
              <legend className="mb-2 text-[.95rem] font-semibold">What does the customer need?</legend>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Service">
                {SERVICES.map((s) => {
                  const on = s.id === service;
                  return (
                    <label
                      key={s.id}
                      className={`flex cursor-pointer flex-col rounded-[12px] border-[1.5px] px-3.5 py-3 transition has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-[#2F33A8] dark:has-[:focus-visible]:outline-[#A9ACFF] ${
                        on
                          ? "border-[#2F33A8] bg-[#2F33A8]/[.07] dark:border-[#D6F04A] dark:bg-[#D6F04A]/10"
                          : `${LINE} hover:border-[#2F33A8] dark:hover:border-[#A9ACFF]`
                      }`}
                    >
                      <input type="radio" name="service" value={s.id} checked={on} onChange={() => pickService(s.id)} className="sr-only" />
                      <span className="flex items-center justify-between font-semibold">
                        {s.label}
                        {on && <Tick className="h-4 w-4 text-[#2F33A8] dark:text-[#D6F04A]" />}
                      </span>
                      <span className={`text-[.88rem] ${MUTED}`}>{s.hint}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {error && (
              <div role="alert" className="mb-4 rounded-[10px] bg-[#B3261E]/10 px-3.5 py-3 text-[.95rem] text-[#B3261E] dark:bg-[#FF8A80]/10 dark:text-[#FF8A80]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <Field id="aadhaar" label="Aadhaar number" err={errors.aadhaar}>
                <input
                  id="aadhaar"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0000 0000 0000"
                  className={`${INPUT} tracking-[.12em]`}
                  value={formatAadhaar(form.aadhaar)}
                  onChange={(e) => setField("aadhaar", e.target.value.replace(/\D/g, "").slice(0, 12))}
                  aria-invalid={!!errors.aadhaar}
                />
              </Field>

              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field id="mobile" label="Customer's mobile number" err={errors.mobile}>
                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="9876543210"
                    maxLength={10}
                    className={INPUT}
                    value={form.mobile}
                    onChange={(e) => setField("mobile", e.target.value.replace(/\D/g, ""))}
                    aria-invalid={!!errors.mobile}
                  />
                </Field>

                <Field id="bank" label="Customer's bank" err={errors.bank}>
                  <select
                    id="bank"
                    className={INPUT}
                    value={form.bank}
                    onChange={(e) => setField("bank", e.target.value)}
                    aria-invalid={!!errors.bank}
                  >
                    <option value="">Choose a bank</option>
                    {BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {svc.amount && (
                <Field
                  id="amount"
                  label="Amount (₹)"
                  err={errors.amount}
                  hint={`From ${MIN_AMOUNT} to ${MAX_AMOUNT.toLocaleString("en-IN")} per transaction.`}
                >
                  <input
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="1000"
                    className={INPUT}
                    value={form.amount}
                    onChange={(e) => setField("amount", e.target.value.replace(/\D/g, "").slice(0, 5))}
                    aria-invalid={!!errors.amount}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setField("amount", String(a))}
                        className={`cursor-pointer rounded-full border-[1.5px] px-3.5 py-1 text-[.9rem] font-semibold transition hover:border-[#2F33A8] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#2F33A8] dark:hover:border-[#A9ACFF] dark:focus-visible:outline-[#A9ACFF] ${LINE}`}
                      >
                        {inr.format(a).replace(".00", "")}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              {/* Fingerprint */}
              <div className="mb-4">
                <p className="mb-1.5 text-[.95rem] font-semibold">Customer&apos;s fingerprint</p>
                <div
                  className={`flex items-center gap-4 rounded-[12px] border-[1.5px] p-3.5 ${
                    errors.finger ? "border-[#B3261E] dark:border-[#FF8A80]" : LINE
                  }`}
                >
                  <div
                    className={`flex h-14 w-14 flex-none items-center justify-center rounded-full ${
                      capture.status === "done"
                        ? "bg-[#17794A]/12 text-[#17794A] dark:bg-[#5FD497]/12 dark:text-[#5FD497]"
                        : "bg-[#2F33A8]/10 text-[#2F33A8] dark:bg-[#A9ACFF]/10 dark:text-[#A9ACFF]"
                    } ${capture.status === "capturing" ? "animate-pulse" : ""}`}
                  >
                    {capture.status === "done" ? <Tick className="h-7 w-7" /> : <FingerprintIcon className="h-8 w-8" />}
                  </div>
                  <div className="min-w-0 flex-1" aria-live="polite">
                    {capture.status === "idle" && <p className={`text-[.95rem] ${MUTED}`}>Ask the customer to place a finger on the scanner, then tap Capture.</p>}
                    {capture.status === "capturing" && <p className="text-[.95rem] font-semibold">Reading fingerprint... keep the finger still.</p>}
                    {capture.status === "done" && (
                      <>
                        <p className="text-[.95rem] font-semibold text-[#17794A] dark:text-[#5FD497]">Fingerprint captured</p>
                        <p className={`text-[.88rem] ${MUTED}`}>Quality {capture.quality}%. This scan can be used once.</p>
                      </>
                    )}
                    {capture.status === "error" && <p role="alert" className="text-[.95rem] text-[#B3261E] dark:text-[#FF8A80]">{capture.msg}</p>}
                  </div>
                  <button
                    type="button"
                    id="finger"
                    onClick={doCapture}
                    disabled={capture.status === "capturing" || submitting}
                    className={`${GHOST} !min-h-10 flex-none !px-4 !py-2`}
                  >
                    {capture.status === "capturing" ? <Spinner /> : capture.status === "done" || capture.status === "error" ? "Scan again" : "Capture"}
                  </button>
                </div>
                {errors.finger && <p role="alert" className="mt-1.5 text-[.9rem] text-[#B3261E] dark:text-[#FF8A80]">{errors.finger}</p>}
              </div>

              {/* Consent */}
              <div className="mb-5">
                <label className="flex cursor-pointer items-start gap-2.5 text-[.95rem]">
                  <input
                    id="consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      setErrors((p) => ({ ...p, consent: undefined }));
                    }}
                    aria-invalid={!!errors.consent}
                    className="mt-1 h-[18px] w-[18px] flex-none accent-[#2F33A8] dark:accent-[#D6F04A]"
                  />
                  <span>The customer has agreed to use their Aadhaar number and fingerprint for this transaction.</span>
                </label>
                {errors.consent && <p role="alert" className="mt-1.5 text-[.9rem] text-[#B3261E] dark:text-[#FF8A80]">{errors.consent}</p>}
              </div>

              <button type="submit" disabled={submitting} className={`${PRIMARY} w-full`}>
                {submitting ? (
                  <>
                    <Spinner /> Talking to the bank...
                  </>
                ) : (
                  svc.cta
                )}
              </button>
            </form>
          </section>

          {/* ---------- Right column: guidance or receipt ---------- */}
          <aside ref={resultRef} className="scroll-mt-24 lg:sticky lg:top-24" aria-live="polite">
            {!result ? (
              <div className={`${CARD} p-[18px] sm:p-[26px] print:hidden`}>
                <h2 className="mb-3 text-[1.25rem] font-bold leading-tight tracking-tight">Before you start</h2>
                <ul className="grid gap-3 text-[.97rem]">
                  {[
                    "Plug in your fingerprint scanner and make sure it is ready.",
                    "The customer must be with you. Their Aadhaar must be linked to their bank account.",
                    "Read the customer's Aadhaar number from their own card or phone. Do not keep a copy.",
                    `Each cash transaction is limited to ${inr.format(MAX_AMOUNT).replace(".00", "")}.`,
                  ].map((t) => (
                    <li key={t} className="flex gap-2.5">
                      <Tick className="mt-0.5 h-5 w-5 flex-none text-[#2F33A8] dark:text-[#D6F04A]" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <p className={`mt-5 rounded-[10px] bg-[#F5F6FB] p-3.5 text-[.9rem] dark:bg-[#0E1030] ${MUTED}`}>
                  {BRAND} never stores the Aadhaar number or fingerprint. Your receipt shows only the last 4 digits.
                </p>
              </div>
            ) : (
              <Receipt result={result} onNew={newTransaction} />
            )}
          </aside>
        </div>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="bg-[#22258C] pb-9 pt-10 text-[#CDCFF3] dark:bg-[#14173F] print:hidden">
        <div className={`${WRAP} border-t border-white/15 pt-5 text-[.9rem]`}>
          &copy; {new Date().getFullYear()} {BRAND}. All rights reserved.
          <br />[Add your company registration, licence and partner-bank details here]
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------
   Receipt (also prints cleanly: everything else is print:hidden)
------------------------------------------------------------------- */
function Receipt({ result, onNew }) {
  const when = new Date(result.time).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const rows = [
    ["Service", result.label],
    result.amount != null && ["Amount", inr.format(result.amount)],
    ["Bank", result.bank],
    ["Aadhaar", `XXXX XXXX ${result.last4}`],
    ["Reference no.", result.rrn],
    ["Date and time", when],
  ].filter(Boolean);

  return (
    <div className={`${CARD} overflow-hidden print:shadow-none`}>
      <div className="flex items-center gap-3 bg-[#17794A]/10 px-[18px] py-4 text-[#17794A] dark:bg-[#5FD497]/10 dark:text-[#5FD497] sm:px-[26px]">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#17794A] text-white dark:bg-[#5FD497] dark:text-[#0E1030]">
          <Tick className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-[1.2rem] font-bold leading-tight">
            {result.service === "withdraw" ? "Hand over the cash" : result.service === "pay" ? "Payment collected" : "Request complete"}
          </h2>
          {result.amount != null && <p className="text-[.92rem]">{inr.format(result.amount)} {result.service === "withdraw" ? "was debited from the customer" : "was received"}.</p>}
        </div>
      </div>

      <div className="p-[18px] sm:p-[26px]">
        <dl className="grid gap-2.5 text-[.97rem]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className={MUTED}>{k}</dt>
              <dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        {result.balance != null && (
          <div className={`mt-5 flex items-baseline justify-between gap-4 border-t pt-4 ${LINE}`}>
            <span className={MUTED}>Account balance</span>
            <span className="text-[1.5rem] font-bold tracking-tight">{inr.format(result.balance)}</span>
          </div>
        )}

        {result.service === "statement" && result.statement?.length > 0 && (
          <div className={`mt-5 border-t pt-4 ${LINE}`}>
            <h3 className="mb-2 font-semibold">Last {result.statement.length} transactions</h3>
            <ul className="grid gap-2">
              {result.statement.map((t, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-[.95rem]">
                  <span className="min-w-0">
                    <span className="block truncate">{t.note}</span>
                    <span className={`text-[.85rem] ${MUTED}`}>{t.date}</span>
                  </span>
                  <span className={`flex-none font-semibold ${t.amount < 0 ? "" : "text-[#17794A] dark:text-[#5FD497]"}`}>
                    {t.amount < 0 ? "-" : "+"}{inr.format(Math.abs(t.amount))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 grid gap-2.5 sm:grid-cols-2 print:hidden">
          <button type="button" onClick={() => window.print()} className={GHOST}>Print receipt</button>
          <button type="button" onClick={onNew} className={PRIMARY}>New transaction</button>
        </div>
      </div>
    </div>
  );
}
