import { useMemo, useState } from "react";

/* ================= SETTINGS (replace with API data) ================= */
const CONFIG = {
  balances: { main: 56.45, aeps: 12480 },
  limits: { loadMin: 100, loadMax: 200000, moveMin: 100 },
  quick: [500, 1000, 5000, 10000],
  methods: [
    { id: "upi", label: "UPI", note: "Instant, no fee", rate: 0 },
    { id: "net", label: "Net banking", note: "Instant, no fee", rate: 0 },
    { id: "card", label: "Debit card", note: "Instant, 0.4% fee", rate: 0.004 },
    { id: "imps", label: "Bank transfer (IMPS/NEFT)", note: "Up to 30 minutes, no fee", rate: 0 },
  ],
  banks: [
    { id: "b1", label: "SBI xxxx4821, Rajesh Kumar" },
    { id: "b2", label: "HDFC xxxx7732, PayNest Services" },
  ],
  bankFee: (a) => (a <= 1000 ? 5 : a <= 25000 ? 10 : 15),
  ledger: [
    { id: 1, date: "30-09-2026 10:17 AM", type: "AEPS", remark: "Cash withdrawal, SBI, Aadhaar xxxx4821", amt: 2000, dir: "in", bal: 12480, status: "Success" },
    { id: 2, date: "30-09-2026 09:52 AM", type: "Transfer", remark: "IMPS to Sunita Devi, account xxxx2196. Fee 25", amt: 5000, dir: "out", bal: 56.45, status: "Success" },
    { id: 3, date: "29-09-2026 06:30 PM", type: "Recharge", remark: "Jio prepaid 98xxxxx214. Commission 7.48", amt: 299, dir: "out", bal: 5081.45, status: "Success" },
    { id: 4, date: "29-09-2026 11:05 AM", type: "Load money", remark: "Wallet loaded by UPI", amt: 10000, dir: "in", bal: 5380.45, status: "Success" },
    { id: 5, date: "28-09-2026 04:12 PM", type: "Bill", remark: "UHBVN electricity, consumer xxxx7781", amt: 1840, dir: "out", bal: 380.45, status: "Success" },
    { id: 6, date: "28-09-2026 01:40 PM", type: "Payout", remark: "AEPS wallet to SBI xxxx4821", amt: 8000, dir: "out", bal: 2220.45, status: "Pending" },
    { id: 7, date: "27-09-2026 05:20 PM", type: "Load money", remark: "Debit card load. Fee 40", amt: 10000, dir: "in", bal: 10220.45, status: "Failed" },
  ],
};

const inr = (n) => "\u20B9" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
const nowStamp = () => new Date().toLocaleString("en-GB", { hour12: true }).replace(",", "").replace(/\//g, "-").toUpperCase();

/* ================= STYLE TOKENS (same as dashboard) ================= */
const TXT = "text-[#191B45] dark:text-[#EEEFFC]";
const MUTED = "text-[#4B4E7A] dark:text-[#A8ABD8]";
const LINE = "border-[#D8DBEE] dark:border-[#2C3068]";
const SURF = "bg-white dark:bg-[#171A47]";
const SURF2 = "bg-[#ECEEF8] dark:bg-[#20245A]";
const BTN = "inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border-[1.5px] px-4 py-2 font-semibold transition focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#2F33A8] dark:focus-visible:outline-[#A9ACFF] disabled:cursor-not-allowed disabled:opacity-50";
const PRIMARY = `${BTN} border-transparent bg-[#2F33A8] text-white hover:brightness-110 dark:bg-[#D6F04A] dark:text-[#191B45]`;
const GHOST = `${BTN} ${LINE} ${TXT} bg-transparent hover:border-current`;
const CARD = `rounded-2xl border ${LINE} ${SURF} p-5`;
const H3 = "text-[1.15rem] font-bold tracking-tight";
const INPUT = `min-h-[44px] w-full rounded-[10px] border-[1.5px] bg-[#F5F6FB] px-3 py-2 dark:bg-[#0E1030] ${LINE} ${TXT} focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#2F33A8] dark:focus-visible:outline-[#A9ACFF]`;
const BADGE = {
  Success: "bg-[#17794A] text-white",
  Pending: "bg-[#B7791F] text-white",
  Failed: "bg-[#B3261E] text-white",
};

const Field = ({ id, label, hint, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block font-semibold">{label}</label>
    {children}
    {hint && <p className={`mt-1.5 text-[.88rem] ${MUTED}`}>{hint}</p>}
  </div>
);

const Row = ({ k, v, bold }) => (
  <div className="flex justify-between gap-4 py-1.5">
    <span className={MUTED}>{k}</span>
    <span className={bold ? "font-bold" : "font-semibold"}>{v}</span>
  </div>
);

function Segmented({ label, value, onChange, items }) {
  return (
    <div role="group" aria-label={label} className={`inline-flex gap-1 rounded-xl p-1 ${SURF2}`}>
      {items.map(([id, text]) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}
          className={`min-h-9 rounded-lg px-3 text-[.92rem] font-semibold focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#2F33A8] dark:focus-visible:outline-[#A9ACFF] ${value === id ? `${SURF} shadow` : MUTED}`}>{text}</button>
      ))}
    </div>
  );
}

export default function WalletPage() {
  const [bal, setBal] = useState(CONFIG.balances);
  const [ledger, setLedger] = useState(CONFIG.ledger);
  const [tab, setTab] = useState("load");
  const [notice, setNotice] = useState(null); // { ok, text }

  // Load money
  const [amt, setAmt] = useState("");
  const [method, setMethod] = useState("upi");

  // Move money (AEPS wallet -> bank or main wallet)
  const [mAmt, setMAmt] = useState("");
  const [dest, setDest] = useState("bank");
  const [bank, setBank] = useState(CONFIG.banks[0].id);
  const [pin, setPin] = useState("");

  // Ledger filters
  const [dir, setDir] = useState("all");
  const [q, setQ] = useState("");

  const { limits } = CONFIG;
  const loadAmt = Number(amt) || 0;
  const m = CONFIG.methods.find((x) => x.id === method);
  const loadFee = Math.round(loadAmt * m.rate * 100) / 100;

  const moveAmt = Number(mAmt) || 0;
  const moveFee = dest === "bank" && moveAmt ? CONFIG.bankFee(moveAmt) : 0;
  const moveTotal = moveAmt + moveFee;

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return ledger.filter((r) => (dir === "all" || r.dir === dir) && (!t || `${r.type} ${r.remark}`.toLowerCase().includes(t)));
  }, [ledger, dir, q]);

  const submitLoad = (e) => {
    e.preventDefault();
    if (loadAmt < limits.loadMin || loadAmt > limits.loadMax)
      return setNotice({ ok: false, text: `Enter an amount between ${inr(limits.loadMin)} and ${inr(limits.loadMax)}.` });
    // TODO: call your API here, then redirect to the payment gateway with the returned URL
    setNotice({ ok: true, text: `Payment request for ${inr(loadAmt + loadFee)} created via ${m.label}. Complete the payment to see ${inr(loadAmt)} in your wallet.` });
  };

  const submitMove = (e) => {
    e.preventDefault();
    if (moveAmt < limits.moveMin) return setNotice({ ok: false, text: `Minimum amount is ${inr(limits.moveMin)}.` });
    if (moveTotal > bal.aeps) return setNotice({ ok: false, text: `Not enough balance. You need ${inr(moveTotal)} but the AEPS wallet has ${inr(bal.aeps)}.` });
    if (!/^\d{4,6}$/.test(pin)) return setNotice({ ok: false, text: "Enter your 4 to 6 digit transaction PIN." });
    // TODO: call your payout API here and update balances from its response
    const toBank = dest === "bank";
    const bankLabel = CONFIG.banks.find((b) => b.id === bank).label.split(",")[0];
    setBal((b) => ({ aeps: b.aeps - moveTotal, main: toBank ? b.main : b.main + moveAmt }));
    setLedger((l) => [{
      id: Date.now(), date: nowStamp(), type: toBank ? "Payout" : "Wallet",
      remark: toBank ? `AEPS wallet to ${bankLabel}. Fee ${moveFee}` : "AEPS wallet to main wallet",
      amt: moveTotal, dir: "out", bal: bal.aeps - moveTotal, status: toBank ? "Pending" : "Success",
    }, ...l]);
    setNotice({ ok: true, text: toBank ? `Payout of ${inr(moveAmt)} sent to ${bankLabel}. It usually arrives within minutes.` : `${inr(moveAmt)} moved to your main wallet.` });
    setMAmt(""); setPin("");
  };

  return (
    <main className={`mx-auto max-w-[1160px] px-4 py-6 sm:px-6 text-[16px] leading-[1.55] ${TXT}`}>
      <div className="mb-5">
        <h1 className="text-[clamp(1.6rem,3vw,2.1rem)] font-bold leading-tight tracking-tight">Wallet</h1>
        <p className={MUTED}>Add money for recharges and transfers, and send your AEPS earnings to your bank.</p>
      </div>

      {/* Balances */}
      <section aria-label="Wallet balances" className="grid gap-4 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl bg-[#22258C] p-5 text-white dark:bg-[#14173F]">
          <div className="pointer-events-none absolute inset-0 bg-[repeating-radial-gradient(circle_at_95%_5%,transparent_0_16px,rgba(255,255,255,.055)_16px_17px)]" />
          <p className="relative text-[#CDCFF3]">Main wallet</p>
          <p className="relative mt-1 text-[2.3rem] font-bold leading-none">{inr(bal.main)}</p>
          <p className="relative mt-3 text-[.92rem] text-[#CDCFF3]">Used for recharge, bill payment and money transfer.</p>
          <button type="button" onClick={() => { setTab("load"); document.getElementById("amt")?.focus(); }}
            className="relative mt-4 inline-flex min-h-[44px] items-center rounded-[10px] bg-[#D6F04A] px-4 font-semibold text-[#191B45] hover:brightness-95 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white">Load money</button>
        </div>
        <div className={CARD}>
          <p className={MUTED}>AEPS wallet</p>
          <p className="mt-1 text-[2.3rem] font-bold leading-none">{inr(bal.aeps)}</p>
          <p className={`mt-3 text-[.92rem] ${MUTED}`}>Cash withdrawal earnings. Send this to your bank or move it to the main wallet.</p>
          <button type="button" onClick={() => setTab("move")} className={`${GHOST} mt-4`}>Send to bank or wallet</button>
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        {/* Action form */}
        <section className={CARD} aria-labelledby="actH">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="actH" className={H3}>{tab === "load" ? "Load money" : "Send AEPS money"}</h2>
            <Segmented label="Wallet action" value={tab} onChange={(t) => { setTab(t); setNotice(null); }} items={[["load", "Load money"], ["move", "AEPS payout"]]} />
          </div>

          {notice && (
            <p role={notice.ok ? "status" : "alert"} className={`mb-4 rounded-[10px] px-3.5 py-3 text-[.93rem] font-medium text-white ${notice.ok ? "bg-[#17794A]" : "bg-[#B3261E]"}`}>{notice.text}</p>
          )}

          {tab === "load" ? (
            <form onSubmit={submitLoad} className="grid gap-4" noValidate>
              <Field id="amt" label="Amount" hint={`Minimum ${inr(limits.loadMin)}, maximum ${inr(limits.loadMax)} per load.`}>
                <input id="amt" inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value.replace(/\D/g, ""))} placeholder="Enter amount" className={INPUT} />
              </Field>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
                {CONFIG.quick.map((v) => (
                  <button key={v} type="button" onClick={() => setAmt(String(v))} aria-pressed={loadAmt === v} className={`${GHOST} !min-h-10 ${loadAmt === v ? SURF2 : ""}`}>{inr(v)}</button>
                ))}
              </div>
              <fieldset>
                <legend className="mb-1.5 font-semibold">Payment method</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CONFIG.methods.map((x) => (
                    <label key={x.id} className={`flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-3 py-2 has-[:checked]:border-[#2F33A8] has-[:checked]:${SURF2} dark:has-[:checked]:border-[#D6F04A] ${LINE}`}>
                      <input type="radio" name="method" value={x.id} checked={method === x.id} onChange={() => setMethod(x.id)} className="h-4 w-4 accent-[#2F33A8]" />
                      <span><span className="block font-semibold">{x.label}</span><span className={`block text-[.85rem] ${MUTED}`}>{x.note}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className={`rounded-xl px-4 py-2 ${SURF2}`}>
                <Row k="Added to wallet" v={inr(loadAmt)} />
                <Row k="Fee" v={inr(loadFee)} />
                <Row k="You pay" v={inr(loadAmt + loadFee)} bold />
              </div>
              <button type="submit" className={`${PRIMARY} sm:w-fit`}>Continue to pay</button>
            </form>
          ) : (
            <form onSubmit={submitMove} className="grid gap-4" noValidate>
              <Field id="mdest" label="Send to">
                <select id="mdest" value={dest} onChange={(e) => setDest(e.target.value)} className={INPUT}>
                  <option value="bank">Bank account</option>
                  <option value="main">Main wallet (no fee)</option>
                </select>
              </Field>
              {dest === "bank" && (
                <Field id="mbank" label="Bank account">
                  <select id="mbank" value={bank} onChange={(e) => setBank(e.target.value)} className={INPUT}>
                    {CONFIG.banks.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                  </select>
                </Field>
              )}
              <Field id="mamt" label="Amount" hint={`Available in AEPS wallet: ${inr(bal.aeps)}`}>
                <input id="mamt" inputMode="numeric" value={mAmt} onChange={(e) => setMAmt(e.target.value.replace(/\D/g, ""))} placeholder="Enter amount" className={INPUT} />
              </Field>
              <Field id="mpin" label="Transaction PIN">
                <input id="mpin" type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="4 to 6 digits" className={`${INPUT} sm:max-w-[220px]`} />
              </Field>
              <div className={`rounded-xl px-4 py-2 ${SURF2}`}>
                <Row k="Amount received" v={inr(moveAmt)} />
                <Row k="Fee" v={inr(moveFee)} />
                <Row k="Deducted from AEPS wallet" v={inr(moveTotal)} bold />
              </div>
              <button type="submit" className={`${PRIMARY} sm:w-fit`}>{dest === "bank" ? "Send to bank" : "Move to main wallet"}</button>
            </form>
          )}
        </section>

        {/* Info column */}
        <section className={CARD} aria-labelledby="infoH">
          <h2 id="infoH" className={`${H3} mb-3`}>Good to know</h2>
          <ul className={`grid gap-3 text-[.93rem] ${MUTED}`}>
            <li>Loads by UPI and net banking reach your wallet instantly.</li>
            <li>Bank payouts cost {inr(CONFIG.bankFee(1000))} up to {inr(1000)}, {inr(CONFIG.bankFee(25000))} up to {inr(25000)}, and {inr(CONFIG.bankFee(50000))} above that.</li>
            <li>Moving money between your own wallets is free and instant.</li>
            <li>If a payment is debited but not credited, it is refunded within 3 working days.</li>
          </ul>
        </section>
      </div>

      {/* Ledger */}
      <section className={`${CARD} mt-6`} aria-labelledby="ledH">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="ledH" className={H3}>Wallet history</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented label="Filter by direction" value={dir} onChange={setDir} items={[["all", "All"], ["in", "Money in"], ["out", "Money out"]]} />
            <div>
              <label htmlFor="lq" className="sr-only">Search history</label>
              <input id="lq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search history" className={`${INPUT} !min-h-10 !rounded-full sm:w-[220px]`} />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className={`${SURF2} ${MUTED} text-[.88rem]`}>
                {["Date", "Service", "Remark", "Amount", "Status"].map((h) => <th key={h} scope="col" className="px-3 py-2.5 font-semibold first:rounded-l-lg last:rounded-r-lg">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={`border-b last:border-0 ${LINE}`}>
                  <td className={`whitespace-nowrap px-3 py-3 text-[.9rem] ${MUTED}`}>{r.date}</td>
                  <td className="px-3 py-3 font-semibold">{r.type}</td>
                  <td className={`px-3 py-3 ${MUTED}`}>{r.remark}</td>
                  <td className={`whitespace-nowrap px-3 py-3 font-bold ${r.dir === "in" ? "text-[#17794A] dark:text-[#5FD497]" : "text-[#B3261E] dark:text-[#FF8A80]"}`}>{r.dir === "in" ? "+" : "\u2212"}{inr(r.amt)}</td>
                  <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-0.5 text-[.8rem] font-bold ${BADGE[r.status]}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className={`py-6 text-center ${MUTED}`}>No entries match. Clear the search or switch the filter to All.</p>}
        </div>
      </section>
    </main>
  );
}
