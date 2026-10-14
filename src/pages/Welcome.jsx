import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ================= SETTINGS ================= */
const CONFIG = {
  brand: "PayNest",
  supportPhone: "1800-000-0000",
  supportEmail: "help@example.com",
  mobile: {
    operators: ["Jio", "Airtel", "Vi (Vodafone Idea)", "BSNL"],
    circles: ["Haryana", "Delhi NCR", "Punjab", "Uttar Pradesh (West)", "Uttar Pradesh (East)", "Rajasthan", "Himachal Pradesh", "Maharashtra", "Karnataka", "Tamil Nadu", "West Bengal"],
    quick: [20, 50, 100, 200, 500], min: 10, max: 5000,
  },
  dth: { operators: ["Tata Play", "Airtel Digital TV", "Dish TV", "d2h", "Sun Direct"], quick: [100, 200, 500], min: 100, max: 5000 },
  bills: {
    providers: {
      Electricity: ["UHBVN (Haryana)", "DHBVN (Haryana)", "BSES Rajdhani (Delhi)", "Tata Power Delhi"],
      Gas: ["Indane", "HP Gas", "Bharat Gas", "Indraprastha Gas (IGL)"],
      Water: ["Municipal water board", "Delhi Jal Board"],
      Broadband: ["Airtel Xstream Fiber", "JioFiber", "ACT Fibernet", "BSNL Broadband"],
      FASTag: ["SBI FASTag", "IDFC FIRST Bank FASTag", "Airtel Payments Bank FASTag"],
    },
    min: 10, max: 100000,
  },
  transfer: {
    min: 100, max: 25000, quick: [1000, 2000, 5000, 10000], modes: ["IMPS", "NEFT"],
    slabs: [{ upTo: 1000, fee: 10 }, { upTo: 5000, fee: 25 }, { upTo: 25000, fee: 50 }],
  },
};
const T = CONFIG.transfer;
const LIMITS = { mobile: CONFIG.mobile, dth: CONFIG.dth, bill: CONFIG.bills, send: T };
const NOTE_COLOURS = { 10: "#B98A66", 20: "#C9DA4F", 50: "#5CC6DE", 100: "#BAA8E6", 200: "#F3C433", 500: "#B3AFA3" };

const inr = (n) => "\u20B9" + Number(n).toLocaleString("en-IN");
const feeFor = (a) => T.slabs.find((s) => a <= s.upTo)?.fee ?? 0;

/* form schema: [field, rule, (amount only) form kind] */
const SCHEMA = {
  mobile: [["mNum", "mobile"], ["mOp", "select"], ["mCircle", "select"], ["mAmt", "amount", "mobile"]],
  dth: [["dOp", "select"], ["dId", "id"], ["dAmt", "amount", "dth"]],
  bill: [["bCat", "select"], ["bProv", "select"], ["bNum", "id"], ["bAmt", "amount", "bill"]],
  send: [["sName", "name"], ["sAcc", "account"], ["sIfsc", "ifsc"], ["sAmt", "amount", "send"]],
  lead: [["rName", "name"], ["rMob", "mobile"], ["rCity", "name"]],
};

function check(rule, v, kind) {
  switch (rule) {
    case "mobile": return /^[6-9]\d{9}$/.test(v) || "Enter a 10-digit mobile number that starts with 6, 7, 8 or 9.";
    case "select": return !!v || "Choose an option from the list.";
    case "name": return v.length >= 2 || "This field is required.";
    case "id": return v.length >= 4 || "Enter the number exactly as shown on your bill or set-top box.";
    case "account": return /^\d{9,18}$/.test(v) || "Enter the account number. It has 9 to 18 digits.";
    case "ifsc": return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v) || "The IFSC code has 11 characters, for example SBIN0001234.";
    case "pin": return /^\d{4,6}$/.test(v) || "Enter your 4 to 6 digit PIN.";
    case "amount": {
      const { min, max } = LIMITS[kind], n = Number(v);
      if (!v) return "Enter an amount.";
      if (n < min) return "The minimum amount is " + inr(min) + ".";
      if (n > max) return "The maximum amount is " + inr(max) + ".";
      return true;
    }
    default: return true;
  }
}

/* ================= STYLE TOKENS (Tailwind) ================= */
const TXT = "text-[#191B45] dark:text-[#EEEFFC]";
const MUTED = "text-[#4B4E7A] dark:text-[#A8ABD8]";
const LINE = "border-[#D8DBEE] dark:border-[#2C3068]";
const SURF = "bg-white dark:bg-[#171A47]";
const SURF2 = "bg-[#ECEEF8] dark:bg-[#20245A]";
const INPUT = `w-full min-h-[46px] rounded-[10px] border-[1.5px] px-3 py-2.5 ${LINE} ${TXT} bg-[#F5F6FB] dark:bg-[#0E1030] placeholder:opacity-70 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#2F33A8] dark:focus-visible:outline-[#A9ACFF] aria-[invalid=true]:border-[#B3261E] dark:aria-[invalid=true]:border-[#FF8A80]`;
const BTN = "inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border-[1.5px] px-5 py-2.5 font-semibold transition focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#2F33A8]";
const PRIMARY = `${BTN} border-transparent bg-[#2F33A8] text-white hover:brightness-110 dark:bg-[#D6F04A] dark:text-[#191B45]`;
const GHOST = `${BTN} ${LINE} ${TXT} bg-transparent hover:border-current`;
const WRAP = "mx-auto w-full max-w-[1160px] px-5";
const H2 = `font-bold tracking-tight text-[clamp(1.7rem,3.4vw,2.4rem)] leading-[1.12] ${TXT}`;

const Icon = ({ d, className = "h-[22px] w-[22px]", sw = 1.8 }) => (
  <svg viewBox="0 0 24 24" className={`flex-none ${className}`} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const ICONS = {
  phone: ["M9.5 2.5h5a2.5 2.5 0 0 1 2.5 2.5v14a2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 7 19V5a2.5 2.5 0 0 1 2.5-2.5z", "M11 18.5h2"],
  tv: ["M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "M8 21h8M12 17v4"],
  bolt: ["M13 2.5 5 13.5h6l-1 8 8-11h-6z"],
  drop: ["M12 3s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.2 12 3 12 3z"],
  send: ["M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"],
  bill: ["M6 3h12v18l-3-2-3 2-3-2-3 2z", "M9 8h6M9 12h6"],
  check: ["m5 12.5 4.5 4.5L19 7.5"],
  close: ["M6 6l12 12M18 6 6 18"],
};
const Ic = ({ n, ...p }) => <Icon d={ICONS[n]} {...p} />;

function Field({ id, label, err, children }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-[.95rem] font-semibold">{label}</label>
      {children}
      {err && <p role="alert" className="mt-1.5 text-[.9rem] text-[#B3261E] dark:text-[#FF8A80]">{err}</p>}
    </div>
  );
}

function Quick({ amounts, value, onPick, chips }) {
  return (
    <div className={`mb-3 grid gap-2.5 ${chips ? "grid-cols-[repeat(auto-fit,minmax(72px,1fr))]" : "grid-cols-[repeat(auto-fill,minmax(76px,1fr))]"}`} role="group" aria-label="Quick amounts">
      {amounts.map((a) => {
        const on = String(a) === value;
        return chips ? (
          <button key={a} type="button" aria-pressed={on} onClick={() => onPick(String(a))}
            className={`rounded-full border-[1.5px] px-1.5 py-2 font-semibold ${on ? "border-[#191B45] bg-[#191B45] text-white dark:border-[#EEEFFC] dark:bg-[#EEEFFC] dark:text-[#0E1030]" : `${LINE} bg-[#F5F6FB] dark:bg-[#0E1030]`}`}>
            {inr(a)}
          </button>
        ) : (
          <button key={a} type="button" aria-pressed={on} onClick={() => onPick(String(a))}
            style={{ backgroundColor: NOTE_COLOURS[a] || "#DDE0F3" }}
            className={`relative h-[52px] rounded-[7px] text-lg font-bold text-[#191B45] transition ${on ? "-translate-y-[3px] ring-2 ring-[#191B45] ring-offset-2 ring-offset-white dark:ring-[#EEEFFC] dark:ring-offset-[#171A47]" : ""}`}>
            <span className="pointer-events-none absolute inset-1 rounded border border-dashed border-[#191B45]/40" />
            {inr(a)}
          </button>
        );
      })}
    </div>
  );
}

function LoginForm({ onDone }) {
  const [v, setV] = useState({ mob: "", pin: "" });
  const [e, setE] = useState({});
  const submit = (ev) => {
    ev.preventDefault();
    const er = {};
    const a = check("mobile", v.mob), b = check("pin", v.pin);
    if (a !== true) er.mob = a;
    if (b !== true) er.pin = b;
    setE(er);
    if (!Object.keys(er).length) onDone();
  };
  return (
    <>
      <h2 id="dlgTitle" className="pr-9 text-2xl font-bold">Retailer log in</h2>
      <p className={`mb-4 mt-2 ${MUTED}`}>Manage your wallet, recharges and reports.</p>
      <form onSubmit={submit} noValidate>
        <Field id="lMob" label="Mobile number" err={e.mob}>
          <input id="lMob" autoFocus type="tel" inputMode="numeric" maxLength={10} className={INPUT} aria-invalid={!!e.mob}
            value={v.mob} onChange={(x) => setV({ ...v, mob: x.target.value.replace(/\D/g, "") })} />
        </Field>
        <Field id="lPin" label="PIN" err={e.pin}>
          <input id="lPin" type="password" inputMode="numeric" maxLength={6} className={INPUT} aria-invalid={!!e.pin}
            value={v.pin} onChange={(x) => setV({ ...v, pin: x.target.value.replace(/\D/g, "") })} />
        </Field>
        <button className={`${PRIMARY} w-full`} type="submit">Log in</button>
      </form>
    </>
  );
}

const TABS = [["mobile", "Mobile", "phone"], ["dth", "DTH", "tv"], ["bill", "Bills", "bill"], ["send", "Send money", "send"]];
const FAQ = [
  ["How long does a recharge take?", "Most recharges reach the number within a minute. If the operator is slow, the status shows as pending and updates on its own."],
  ["What happens if a recharge fails?", "The amount goes back to the payment method you used. Add your refund timeline here."],
  ["Is there a limit on money transfers?", `Each transfer can be from ${inr(T.min)} to ${inr(T.max)}. You can make more than one transfer a day.`],
  ["Which banks can I send money to?", "Any bank account in India that accepts IMPS or NEFT. You need the account number and the IFSC code."],
  ["How do I get a receipt?", "It appears on screen after payment and is sent to your mobile number by SMS."],
  ["How do I become a retailer?", "Fill in the callback form in the retailer section. Our team will call you to set up your account."],
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("mobile");
  const [vals, setVals] = useState({});
  const [errors, setErrors] = useState({});
  const [dlg, setDlg] = useState(null); // {kind:'confirm'|'done'|'login', ...}
  const widgetRef = useRef(null);

  const bind = (k, { digits, upper } = {}) => ({
    id: k,
    value: vals[k] ?? "",
    "aria-invalid": !!errors[k],
    onChange: (e) => {
      let v = e.target.value;
      if (digits) v = v.replace(/\D/g, "");
      if (upper) v = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
      setVals((p) => ({ ...p, [k]: v, ...(k === "bCat" ? { bProv: "" } : {}) }));
      setErrors((p) => ({ ...p, [k]: undefined }));
    },
  });
  const setVal = (k, v) => { setVals((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: undefined })); };
  const g = (k) => (vals[k] ?? "").trim();

  const openTab = (id, cat) => {
    setTab(id);
    if (cat) setVals((p) => ({ ...p, bCat: cat, bProv: "" }));
    widgetRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const summary = (kind) => {
    if (kind === "mobile") { const a = +g("mAmt"); return { title: "Confirm recharge", total: a, rows: [["Mobile number", g("mNum")], ["Operator", g("mOp")], ["Circle", g("mCircle")], ["Recharge amount", inr(a)]] }; }
    if (kind === "dth") { const a = +g("dAmt"); return { title: "Confirm DTH recharge", total: a, rows: [["Operator", g("dOp")], ["Subscriber ID", g("dId")], ["Recharge amount", inr(a)]] }; }
    if (kind === "bill") { const a = +g("bAmt"); return { title: "Confirm bill payment", total: a, rows: [["Bill type", g("bCat")], ["Provider", g("bProv")], ["Consumer number", g("bNum")], ["Bill amount", inr(a)]] }; }
    const a = +g("sAmt"), fee = feeFor(a);
    return { title: "Confirm transfer", total: a + fee, rows: [["Recipient", g("sName")], ["Account number", "xxxx" + g("sAcc").slice(-4)], ["IFSC", g("sIfsc")], ["Mode", g("sMode") || T.modes[0]], ["Amount", inr(a)], ["Fee", inr(fee)]] };
  };

  const submit = (kind) => (e) => {
    e.preventDefault();
    const errs = {};
    SCHEMA[kind].forEach(([k, rule, k2]) => { const r = check(rule, g(k), k2); if (r !== true) errs[k] = r; });
    setErrors(errs);
    const first = SCHEMA[kind].find(([k]) => errs[k]);
    if (first) { document.getElementById(first[0])?.focus(); return; }
    if (kind === "lead") setDlg({ kind: "done", form: kind, title: "Callback requested", lines: [`Thanks, ${g("rName")}. Our team will call you on ${g("rMob")}.`] });
    else setDlg({ kind: "confirm", form: kind, ...summary(kind) });
  };

  const pay = () => {
    const txn = "TXN" + Date.now().toString().slice(-8) + Math.floor(100 + Math.random() * 900);
    setDlg({ kind: "done", form: dlg.form, title: "Payment received", lines: [`We have received ${inr(dlg.total)}.`], txn });
  };
  const finish = () => {
    const form = dlg.form;
    if (form) setVals((p) => { const n = { ...p }; SCHEMA[form].forEach(([k]) => delete n[k]); delete n.sMode; return n; });
    setDlg(null);
  };

  const sAmt = Number(vals.sAmt || 0);
  const sOk = sAmt >= T.min && sAmt <= T.max;
  const providers = CONFIG.bills.providers[vals.bCat] || [];
  const err = (k) => errors[k];

  return (
    <div className={`min-h-screen bg-[#F5F6FB] text-[17px] leading-[1.55] dark:bg-[#0E1030] ${TXT}`}>
      {/* ---------- Header ---------- */}
      <header className={`sticky top-0 z-20 border-b ${LINE} ${SURF} pt-[env(safe-area-inset-top,0px)]`}>
        <div className={`${WRAP} flex h-16 items-center gap-7`}>
          <a href="#top" className="flex items-center gap-2.5 text-[1.3rem] font-bold tracking-tight" aria-label={`${CONFIG.brand} home`}>
            <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
              <rect width="34" height="34" rx="10" className="fill-[#2F33A8] dark:fill-[#D6F04A]" />
              <path d="M9 13h15l-3.5-3.5M25 21H10l3.5 3.5" fill="none" className="stroke-white dark:stroke-[#191B45]" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {CONFIG.brand}
          </a>
          <nav aria-label="Main" className={`ml-auto hidden gap-6 font-medium md:flex ${MUTED}`}>
            {[["#services", "Services"], ["#how", "How it works"], ["#fees", "Fees"], ["#retailers", "Retailers"], ["#faq", "Help"]].map(([h, t]) => (
              <a key={h} href={h} className="hover:text-[#191B45] dark:hover:text-white">{t}</a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 md:ml-0">
            <button type="button" onClick={() => navigate("/register")} className={`${GHOST} !min-h-10 !px-4 !py-2`}>Sign Up</button>
          </div>
          <div className="ml-auto flex items-center gap-3 md:ml-0">
            <button type="button" className={`${GHOST} !min-h-10 !px-4 !py-2`} onClick={() => navigate("/login")}>Log in</button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden bg-[#22258C] text-white dark:bg-[#14173F]">
          <div className="pointer-events-none absolute inset-0 bg-[repeating-radial-gradient(circle_at_92%_8%,transparent_0_16px,rgba(255,255,255,.055)_16px_17px)]" />
          <div className={`${WRAP} relative grid items-start gap-9 pb-12 pt-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:pb-[76px] lg:pt-16`}>
            <div>
              <h1 className="max-w-[13em] text-[clamp(2.3rem,5.2vw,3.7rem)] font-bold leading-[1.03] tracking-[-.025em]">Recharge, pay bills and send money from one place</h1>
              <p className="mb-2.5 mt-5 max-w-[34em] text-[1.15rem] text-[#CDCFF3]">Top up any mobile or DTH connection, pay electricity and gas bills, and transfer money to any bank account. Pay by UPI, card or net banking.</p>
              <p lang="hi" className="mb-6 text-[1.05rem] text-[#D6F04A]">मोबाइल रिचार्ज, बिल भुगतान और बैंक ट्रांसफर, सब एक ही जगह।</p>
              <ul className="grid gap-2.5">
                {["Recharge without creating an account", "See the fee before you pay", "Get a receipt on screen and by SMS"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5"><Ic n="check" className="h-5 w-5 text-[#D6F04A]" sw={2.4} />{t}</li>
                ))}
              </ul>
            </div>

            {/* Service widget */}
            <div ref={widgetRef} className={`overflow-hidden rounded-[18px] shadow-[0_1px_2px_rgba(25,27,69,.08),0_14px_36px_rgba(25,27,69,.16)] ${SURF} ${TXT}`}>
              <div role="tablist" aria-label="Choose a service" className={`grid grid-cols-4 gap-1 p-1.5 ${SURF2}`}>
                {TABS.map(([id, label, ic], i) => (
                  <button key={id} role="tab" type="button" aria-selected={tab === id} tabIndex={tab === id ? 0 : -1}
                    onClick={() => setTab(id)}
                    onKeyDown={(e) => {
                      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                      e.preventDefault();
                      const n = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length][0];
                      setTab(n); document.getElementById("tab-" + n)?.focus();
                    }}
                    id={"tab-" + id}
                    className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-center text-[.88rem] font-semibold leading-tight ${tab === id ? `${SURF} ${TXT} shadow` : MUTED}`}>
                    <Ic n={ic} className={`h-[22px] w-[22px] ${tab === id ? "text-[#2F33A8] dark:text-[#D6F04A]" : ""}`} />{label}
                  </button>
                ))}
              </div>

              <div className="p-[18px] sm:p-[22px]">
                {tab === "mobile" && (
                  <form onSubmit={submit("mobile")} noValidate role="tabpanel" aria-labelledby="tab-mobile">
                    <Field id="mNum" label="Mobile number" err={err("mNum")}>
                      <input type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number" className={INPUT} {...bind("mNum", { digits: true })} />
                    </Field>
                    <div className="grid gap-x-3 sm:grid-cols-2">
                      <Field id="mOp" label="Operator" err={err("mOp")}>
                        <select className={INPUT} {...bind("mOp")}><option value="">Select operator</option>{CONFIG.mobile.operators.map((o) => <option key={o}>{o}</option>)}</select>
                      </Field>
                      <Field id="mCircle" label="Circle" err={err("mCircle")}>
                        <select className={INPUT} {...bind("mCircle")}><option value="">Select circle</option>{CONFIG.mobile.circles.map((o) => <option key={o}>{o}</option>)}</select>
                      </Field>
                    </div>
                    <Field id="mAmt" label="Amount" err={err("mAmt")}>
                      <p className={`mb-2 text-[.88rem] ${MUTED}`}>Tap a note to fill the amount, or type your own.</p>
                      <Quick amounts={CONFIG.mobile.quick} value={vals.mAmt ?? ""} onPick={(v) => setVal("mAmt", v)} />
                      <input type="text" inputMode="numeric" placeholder="Amount in rupees" className={INPUT} {...bind("mAmt", { digits: true })} />
                    </Field>
                    <button className={`${PRIMARY} w-full`} onClick={() => navigate("/login")}>Review recharge</button>
                  </form>
                )}

                {tab === "dth" && (
                  <form onSubmit={submit("dth")} noValidate role="tabpanel" aria-labelledby="tab-dth">
                    <Field id="dOp" label="DTH operator" err={err("dOp")}>
                      <select className={INPUT} {...bind("dOp")}><option value="">Select operator</option>{CONFIG.dth.operators.map((o) => <option key={o}>{o}</option>)}</select>
                    </Field>
                    <Field id="dId" label="Subscriber ID or VC number" err={err("dId")}>
                      <input type="text" inputMode="numeric" placeholder="As shown on your set-top box" className={INPUT} {...bind("dId", { digits: true })} />
                    </Field>
                    <Field id="dAmt" label="Amount" err={err("dAmt")}>
                      <Quick amounts={CONFIG.dth.quick} value={vals.dAmt ?? ""} onPick={(v) => setVal("dAmt", v)} />
                      <input type="text" inputMode="numeric" placeholder="Amount in rupees" className={INPUT} {...bind("dAmt", { digits: true })} />
                    </Field>
                    <button className={`${PRIMARY} w-full`} onClick={() => navigate("/login")}>Review recharge</button>
                  </form>
                )}

                {tab === "bill" && (
                  <form onSubmit={submit("bill")} noValidate role="tabpanel" aria-labelledby="tab-bill">
                    {/* TEMPLATE NOTE: call your bill-fetch API here once the consumer number is entered and fill bAmt with the amount due. */}
                    <div className="grid gap-x-3 sm:grid-cols-2">
                      <Field id="bCat" label="Bill type" err={err("bCat")}>
                        <select className={INPUT} {...bind("bCat")}><option value="">Select bill type</option>{Object.keys(CONFIG.bills.providers).map((o) => <option key={o}>{o}</option>)}</select>
                      </Field>
                      <Field id="bProv" label="Provider" err={err("bProv")}>
                        <select className={INPUT} {...bind("bProv")}>
                          <option value="">{providers.length ? "Select provider" : "Choose a bill type first"}</option>
                          {providers.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field id="bNum" label="Consumer or account number" err={err("bNum")}>
                      <input type="text" placeholder="As printed on your bill" className={INPUT} {...bind("bNum")} />
                    </Field>
                    <Field id="bAmt" label="Bill amount" err={err("bAmt")}>
                      <input type="text" inputMode="numeric" placeholder="Amount in rupees" className={INPUT} {...bind("bAmt", { digits: true })} />
                    </Field>
                    <button className={`${PRIMARY} w-full`} onClick={() => navigate("/login")}>Review bill payment</button>
                  </form>
                )}

                {tab === "send" && (
                  <form onSubmit={submit("send")} noValidate role="tabpanel" aria-labelledby="tab-send">
                    <Field id="sName" label="Recipient name" err={err("sName")}>
                      <input type="text" placeholder="Name as on the bank account" className={INPUT} {...bind("sName")} />
                    </Field>
                    <div className="grid gap-x-3 sm:grid-cols-2">
                      <Field id="sAcc" label="Account number" err={err("sAcc")}>
                        <input type="text" inputMode="numeric" maxLength={18} className={INPUT} {...bind("sAcc", { digits: true })} />
                      </Field>
                      <Field id="sIfsc" label="IFSC code" err={err("sIfsc")}>
                        <input type="text" maxLength={11} placeholder="SBIN0001234" className={INPUT} {...bind("sIfsc", { upper: true })} />
                      </Field>
                    </div>
                    <Field id="sMode" label="Transfer mode">
                      <select className={INPUT} {...bind("sMode")}>{T.modes.map((o) => <option key={o}>{o}</option>)}</select>
                    </Field>
                    <Field id="sAmt" label="Amount to send" err={err("sAmt")}>
                      <Quick chips amounts={T.quick} value={vals.sAmt ?? ""} onPick={(v) => setVal("sAmt", v)} />
                      <input type="text" inputMode="numeric" placeholder="Amount in rupees" className={INPUT} {...bind("sAmt", { digits: true })} />
                    </Field>
                    <div className={`mb-4 grid gap-1.5 rounded-xl px-3.5 py-3 ${SURF2}`} aria-live="polite">
                      <div className="flex justify-between"><span>Amount</span><span>{sAmt ? inr(sAmt) : "-"}</span></div>
                      <div className="flex justify-between"><span>Fee</span><span>{sOk ? inr(feeFor(sAmt)) : "-"}</span></div>
                      <div className={`flex justify-between border-t border-dashed pt-2 font-bold ${LINE}`}><span>You pay</span><span>{sOk ? inr(sAmt + feeFor(sAmt)) : "-"}</span></div>
                    </div>
                    <button className={`${PRIMARY} w-full`} onClick={() => navigate("/login")}>Review transfer</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Services ---------- */}
        <section id="services" className="py-[76px]">
          <div className={WRAP}>
            <h2 className={H2}>Everything you top up or pay each month</h2>
            <p className={`mt-2.5 max-w-[38em] ${MUTED}`}>Choose a service and the form at the top of the page fills in the rest.</p>
            <div className="mt-[34px] grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr]">
              <button type="button" onClick={() => openTab("send")}
                className="flex min-h-[280px] flex-col items-start justify-end gap-1 rounded-2xl border-[1.5px] border-transparent bg-[#22258C] p-[22px] text-left text-white hover:border-[#D6F04A] sm:col-span-2 lg:col-span-1 lg:row-span-2 dark:bg-[#14173F]">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-[#D6F04A]"><Ic n="send" /></span>
                <h3 className="max-w-[10em] text-[1.7rem] font-bold leading-[1.12]">Send money to any bank account</h3>
                <p className="text-[#CDCFF3]">Transfer by IMPS or NEFT. Fees start at {inr(T.slabs[0].fee)}.</p>
              </button>
              {[
                ["mobile", null, "phone", "Mobile recharge", "Prepaid top-ups for all major operators."],
                ["dth", null, "tv", "DTH recharge", "Keep your channels on without a trip to the shop."],
                ["bill", "Electricity", "bolt", "Electricity bill", "Pay with your consumer number."],
                ["bill", "Gas", "drop", "Gas, water and broadband", "All your household bills in one list."],
              ].map(([tb, cat, ic, h, p]) => (
                <button key={h} type="button" onClick={() => openTab(tb, cat)}
                  className={`flex flex-col items-start gap-1 rounded-2xl border-[1.5px] p-[22px] text-left hover:border-[#2F33A8] dark:hover:border-[#A9ACFF] ${LINE} ${SURF}`}>
                  <span className={`mb-3 grid h-11 w-11 place-items-center rounded-xl text-[#2F33A8] dark:text-[#A9ACFF] ${SURF2}`}><Ic n={ic} /></span>
                  <h3 className="text-[1.2rem] font-bold leading-tight">{h}</h3>
                  <p className={`text-[.98rem] ${MUTED}`}>{p}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section id="how" className={`py-[76px] ${SURF}`}>
          <div className={WRAP}>
            <h2 className={H2}>Send money in four steps</h2>
            <p className={`mt-2.5 max-w-[38em] ${MUTED}`}>No branch visit and no paperwork for the person you are paying.</p>
            <ol className="mt-[38px] grid gap-[26px] md:grid-cols-4 md:gap-7">
              {[
                ["Add the recipient", "Enter the name, account number and IFSC code."],
                ["Enter the amount", "The fee and the total show before you pay."],
                ["Pay", "Use UPI, card or net banking and confirm with the OTP sent to your mobile."],
                ["Save the receipt", "Keep the transaction ID. IMPS transfers usually arrive within seconds."],
              ].map(([h, p], i, a) => (
                <li key={h} className="relative min-h-[44px] pl-[60px] pt-1 md:pl-0 md:pt-[58px]">
                  <span className="absolute left-0 top-0 grid h-[42px] w-[42px] place-items-center rounded-full bg-[#2F33A8] text-[1.1rem] font-bold text-white dark:bg-[#D6F04A] dark:text-[#191B45]">{i + 1}</span>
                  {i < a.length - 1 && <span className={`absolute left-[54px] right-[-16px] top-5 hidden h-0.5 md:block ${"bg-[#D8DBEE] dark:bg-[#2C3068]"}`} />}
                  <h3 className="mb-1 text-[1.15rem] font-bold">{h}</h3>
                  <p className={MUTED}>{p}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Fees ---------- */}
        <section id="fees" className="py-[76px]">
          <div className={`${WRAP} grid items-start gap-8 md:grid-cols-2 md:gap-14`}>
            <div>
              <h2 className={H2}>Clear fees for every transfer</h2>
              <p className={`mt-2.5 max-w-[38em] ${MUTED}`}>You always see the fee before you pay. Recharges and bill payments carry no extra fee from us.</p>
              <p className={`mt-3 text-[.9rem] ${MUTED}`}>Each transfer can be from {inr(T.min)} to {inr(T.max)}.</p>
            </div>
            <div>
              <div className={`overflow-x-auto rounded-[14px] border-[1.5px] bg-[#F5F6FB] dark:bg-[#0E1030] ${LINE}`}>
                <table className="w-full min-w-[300px] border-collapse text-left">
                  <thead><tr><th scope="col" className={`px-[18px] py-3.5 text-[.92rem] font-semibold ${MUTED}`}>Transfer amount</th><th scope="col" className={`px-[18px] py-3.5 text-[.92rem] font-semibold ${MUTED}`}>Fee</th></tr></thead>
                  <tbody>
                    {T.slabs.map((s, i) => (
                      <tr key={s.upTo} className={`border-t ${LINE}`}>
                        <td className="px-[18px] py-3.5">{inr(i ? T.slabs[i - 1].upTo + 1 : T.min)} to {inr(s.upTo)}</td>
                        <td className="px-[18px] py-3.5 font-bold">{inr(s.fee)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={`mt-3 text-[.9rem] ${MUTED}`}>Sample fees. Replace them with your own in CONFIG.transfer.slabs.</p>
            </div>
          </div>
        </section>

        {/* ---------- Retailers ---------- */}
        <section id="retailers" className={`py-[76px] ${SURF}`}>
          <div className={`${WRAP} grid items-start gap-8 md:grid-cols-2 md:gap-14`}>
            <div>
              <h2 className={H2}>Add recharge and money transfer to your shop</h2>
              <p className={`mt-2.5 max-w-[38em] ${MUTED}`}>Serve your customers from a single screen and earn on every transaction.</p>
              <ul className="mt-[22px] grid gap-3">
                {["Earn commission on every recharge and bill payment.", "Top up your wallet by UPI or bank transfer.", "Download daily and monthly statements."].map((t) => (
                  <li key={t} className="flex items-start gap-3"><Ic n="check" className="mt-0.5 h-[22px] w-[22px] text-[#17794A] dark:text-[#5FD497]" sw={2.4} />{t}</li>
                ))}
              </ul>
            </div>
            <form onSubmit={submit("lead")} noValidate className={`rounded-[18px] p-[22px] shadow-[0_1px_2px_rgba(25,27,69,.08),0_14px_36px_rgba(25,27,69,.16)] ${SURF} border ${LINE}`}>
              <h3 className="mb-4 text-[1.3rem] font-bold">Request a callback</h3>
              <Field id="rName" label="Full name" err={err("rName")}><input type="text" autoComplete="name" className={INPUT} {...bind("rName")} /></Field>
              <Field id="rMob" label="Mobile number" err={err("rMob")}><input type="tel" inputMode="numeric" maxLength={10} className={INPUT} {...bind("rMob", { digits: true })} /></Field>
              <Field id="rCity" label="Town or city" err={err("rCity")}><input type="text" autoComplete="address-level2" className={INPUT} {...bind("rCity")} /></Field>
              <button className={`${PRIMARY} w-full`} type="submit">Request callback</button>
            </form>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className="py-[76px]">
          <div className={WRAP}>
            <h2 className={H2}>Questions people ask</h2>
            <div className="mt-[30px] max-w-[780px]">
              {FAQ.map(([q, a]) => (
                <details key={q} className={`group border-b ${LINE}`}>
                  <summary className="relative cursor-pointer list-none py-[18px] pr-10 text-[1.05rem] font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className={`absolute right-1.5 top-1/2 h-2.5 w-2.5 -translate-y-[70%] rotate-45 border-b-2 border-r-2 transition-transform group-open:-translate-y-[30%] group-open:-rotate-[135deg] ${"border-[#4B4E7A] dark:border-[#A8ABD8]"}`} />
                  </summary>
                  <p className={`mb-[18px] max-w-[40em] ${MUTED}`}>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="bg-[#22258C] pb-9 pt-14 text-[#CDCFF3] dark:bg-[#14173F]">
        <div className={WRAP}>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <a href="#top" className="flex items-center gap-2.5 text-[1.3rem] font-bold text-white">
                <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="10" fill="#D6F04A" /><path d="M9 13h15l-3.5-3.5M25 21H10l3.5 3.5" fill="none" stroke="#191B45" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {CONFIG.brand}
              </a>
              <p className="mt-3 max-w-[26em]">[Your registered business name and address]</p>
            </div>
            {[
              ["Services", [["#services", "Mobile recharge"], ["#services", "DTH recharge"], ["#services", "Bill payment"], ["#how", "Send money"]]],
              ["Company", [["#", "About us"], ["#", "Terms of use"], ["#", "Privacy policy"], ["#", "Refund policy"]]],
            ].map(([h, l]) => (
              <div key={h}>
                <h3 className="mb-3 font-bold text-white">{h}</h3>
                <ul className="grid gap-2">{l.map(([href, t]) => <li key={t}><a href={href} className="hover:text-white hover:underline">{t}</a></li>)}</ul>
              </div>
            ))}
            <div>
              <h3 className="mb-3 font-bold text-white">Support</h3>
              <ul className="grid gap-2">
                <li>Call <a className="hover:text-white hover:underline" href={`tel:${CONFIG.supportPhone.replace(/\s/g, "")}`}>{CONFIG.supportPhone}</a></li>
                <li><a className="hover:text-white hover:underline" href={`mailto:${CONFIG.supportEmail}`}>{CONFIG.supportEmail}</a></li>
                <li>Monday to Saturday, 9 am to 8 pm</li>
              </ul>
            </div>
          </div>
          <div className="mt-9 border-t border-white/15 pt-5 text-[.9rem]">
            &copy; {new Date().getFullYear()} {CONFIG.brand}. All rights reserved.
            <br />[Add your company registration, licence and partner-bank details here]
          </div>
        </div>
      </footer>

      {/* ---------- Dialog ---------- */}
      {dlg && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0A0C28]/60 p-4" onClick={(e) => e.target === e.currentTarget && setDlg(null)}
          onKeyDown={(e) => e.key === "Escape" && setDlg(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="dlgTitle" className={`relative max-h-full w-full max-w-[440px] overflow-y-auto rounded-[18px] p-[26px] shadow-2xl ${SURF} ${TXT}`}>
            <button type="button" aria-label="Close" onClick={() => setDlg(null)} className={`absolute right-2.5 top-2.5 grid h-10 w-10 place-items-center rounded-full ${MUTED} hover:${SURF2}`}><Ic n="close" /></button>

            {dlg.kind === "login" && <LoginForm onDone={() => setDlg({ kind: "done", title: "Login works as a demo", lines: ["Connect this form to your sign-in service so retailers can open their wallet and reports."] })} />}

            {dlg.kind === "confirm" && (
              <>
                <h2 id="dlgTitle" className="pr-9 text-2xl font-bold">{dlg.title}</h2>
                <dl className="mt-3.5">
                  {dlg.rows.map(([k, v]) => (
                    <div key={k} className={`flex justify-between gap-4 border-b py-2.5 ${LINE}`}><dt className={MUTED}>{k}</dt><dd className="break-words text-right font-semibold">{v}</dd></div>
                  ))}
                </dl>
                <div className="flex items-baseline justify-between pb-[18px] pt-3.5 font-bold"><span>You pay</span><strong className="text-[1.6rem]">{inr(dlg.total)}</strong></div>
                <div className="grid grid-cols-[1fr_1.3fr] gap-2.5">
                  <button type="button" className={GHOST} onClick={() => setDlg(null)}>Change details</button>
                  <button type="button" className={PRIMARY} onClick={pay}>Pay {inr(dlg.total)}</button>
                </div>
              </>
            )}

            {dlg.kind === "done" && (
              <div>
                <div className="mb-3.5 grid h-[52px] w-[52px] place-items-center rounded-full bg-[#17794A] text-white"><Ic n="check" className="h-7 w-7" sw={2.6} /></div>
                <h2 id="dlgTitle" className="pr-9 text-2xl font-bold">{dlg.title}</h2>
                {dlg.lines.map((l) => <p key={l} className="mt-2">{l}</p>)}
                {dlg.txn && <p className="mt-2">Transaction ID <span className="font-mono font-semibold">{dlg.txn}</span></p>}
                <p className={`mb-[18px] mt-3.5 rounded-[10px] px-3.5 py-3 text-[.92rem] ${SURF2} ${MUTED}`}>This is a template, so no money moved. Connect your payment gateway and your recharge or transfer API provider to go live.</p>
                <button type="button" className={`${PRIMARY} w-full`} onClick={finish}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
