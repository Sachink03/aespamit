import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PATHS } from "../../routes/paths"
/* ================= SETTINGS (replace with API data) ================= */
const CONFIG = {
  brand: "PayNest",
  user: { name: "Rajesh Kumar", id: "RT20481", kyc: true, balance: 56.45 },
  commissionToday: 0,
  stats: [
    { label: "Mobile recharge", value: 1240, icon: "phone" },
    { label: "Money transfer", value: 18500, icon: "send" },
    { label: "AEPS withdrawal", value: 9000, icon: "finger" },
    { label: "Bill payment", value: 3150, icon: "bill" },
  ],
  services: [
    { id: "aeps", label: "AEPS withdraw", icon: "finger", isNew: true },
    { id: "aepsBal", label: "AEPS balance enquiry", icon: "wallet" },
    { id: "send", label: "Money transfer", icon: "send" },
    { id: "mobile", label: "Mobile recharge", icon: "phone" },
    { id: "dth", label: "DTH recharge", icon: "tv" },
    { id: "bill", label: "Bill payment", icon: "bill" },
    { id: "fastag", label: "FASTag", icon: "car" },
    { id: "load", label: "Load money", icon: "plus" },
    { id: "pass", label: "Passbook", icon: "book" },
    { id: "kyc", label: "KYC centre", icon: "shield", isNew: true },
  ],
  menu: [
    ["Dashboard", "home"], ["Services", "grid"], ["Load money", "plus"], ["Account history", "book"],
    ["Service report", "chart"], ["Commission slab", "percent"], ["Profile", "user"], ["Help and support", "help"],
  ],
  activity: [
    { svc: "AEPS", remark: "Cash withdrawal, SBI, Aadhaar xxxx4821", amt: 2000, dir: "in", date: "30-09-2026 10:17 AM" },
    { svc: "Transfer", remark: "IMPS to Sunita Devi, account xxxx2196. Fee 25", amt: 5000, dir: "out", date: "30-09-2026 09:52 AM" },
    { svc: "Recharge", remark: "Jio prepaid 98xxxxx214. Commission 7.48", amt: 299, dir: "out", date: "29-09-2026 06:30 PM" },
    { svc: "Wallet", remark: "Wallet loaded by UPI", amt: 10000, dir: "in", date: "29-09-2026 11:05 AM" },
    { svc: "Bill", remark: "UHBVN electricity, consumer xxxx7781", amt: 1840, dir: "out", date: "28-09-2026 04:12 PM" },
  ],
};

const inr = (n) => "\u20B9" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: n % 1 ? 2 : 0 });

/* ================= STYLE TOKENS (same as landing page) ================= */
const TXT = "text-[#191B45] dark:text-[#EEEFFC]";
const MUTED = "text-[#4B4E7A] dark:text-[#A8ABD8]";
const LINE = "border-[#D8DBEE] dark:border-[#2C3068]";
const SURF = "bg-white dark:bg-[#171A47]";
const SURF2 = "bg-[#ECEEF8] dark:bg-[#20245A]";
const BTN = "inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border-[1.5px] px-4 py-2 font-semibold transition focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#2F33A8] dark:focus-visible:outline-[#A9ACFF]";
const PRIMARY = `${BTN} border-transparent bg-[#2F33A8] text-white hover:brightness-110 dark:bg-[#D6F04A] dark:text-[#191B45]`;
const GHOST = `${BTN} ${LINE} ${TXT} bg-transparent hover:border-current`;
const CARD = `rounded-2xl border ${LINE} ${SURF} p-5`;
const H3 = "text-[1.15rem] font-bold tracking-tight";

const ICONS = {
  home: ["M3 11 12 3l9 8", "M5 10v10h14V10"],
  grid: ["M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"],
  plus: ["M12 5v14M5 12h14"],
  book: ["M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z", "M5 17a3 3 0 0 1 3-3h11"],
  chart: ["M5 20V10M12 20V4M19 20v-7"],
  percent: ["M6 18 18 6", "M8 9a1.5 1.5 0 1 0 0-.01M16 17a1.5 1.5 0 1 0 0-.01"],
  user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21a8 8 0 0 1 16 0"],
  help: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M9.5 9.5a2.5 2.5 0 1 r1 3.5 2.3c-.6.3-1 .8-1 1.5M12 17h.01"],
  logout: ["M9 4H5v16h4", "M16 8l4 4-4 4M20 12H9"],
  menu: ["M4 7h16M4 12h16M4 17h16"],
  close: ["M6 6l12 12M18 6 6 18"],
  search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z", "m20 20-4-4"],
  phone: ["M9.5 2.5h5A2.5 2.5 0 0 1 17 5v14a2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 7 19V5a2.5 2.5 0 0 1 2.5-2.5z", "M11 18.5h2"],
  tv: ["M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "M8 21h8M12 17v4"],
  send: ["M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"],
  bill: ["M6 3h12v18l-3-2-3 2-3-2-3 2z", "M9 8h6M9 12h6"],
  wallet: ["M4 7h15a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12", "M16 14h2"],
  finger: ["M12 3a7 7 0 0 0-7 7v2", "M19 12v-2a7 7 0 0 0-5-6.7", "M8 14v-3a4 4 0 0 1 8 0v3c0 3 1 5 2 6", "M12 11v4c0 2-.5 4-1.5 6", "M8 18c.3-1 .5-2 .5-4"],
  car: ["M5 16v-4l2-5h10l2 5v4", "M3 16h18v3H3zM7.5 13h.01M16.5 13h.01"],
  shield: ["M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z", "m9 12 2 2 4-4"],
  check: ["m5 12.5 4.5 4.5L19 7.5"],
  alert: ["M12 8v5M12 16.5v.01", "M12 3 2.5 20h19z"],
};
const Ic = ({ n, className = "h-[22px] w-[22px]", sw = 1.8 }) => (
  <svg viewBox="0 0 24 24" className={`flex-none ${className}`} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[n].map((p, i) => <path key={i} d={p} />)}
  </svg>
);

function Sidebar({ active, setActive, onLogout, className = "" }) { 
  const navigate = useNavigate();
  const u = CONFIG.user;
  return (
    <aside className={`flex h-full w-[264px] flex-col bg-[#22258C] text-[#CDCFF3] dark:bg-[#14173F] ${className}`}>
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5 text-[1.3rem] font-bold text-white">
        <svg width="32" height="32" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="10" fill="#D6F04A" /><path d="M9 13h15l-3.5-3.5M25 21H10l3.5 3.5" fill="none" stroke="#191B45" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {CONFIG.brand}
      </div>
      <div className="mx-4 mb-3 rounded-2xl bg-white/10 p-4" onClick={() => navigate(PATHS.wallet)}>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[#D6F04A] text-lg font-bold text-[#191B45]">{u.name[0]}</span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{u.name}</p>
            <p className="flex items-center gap-1 text-[.85rem]">{u.id}{u.kyc && <span className="inline-flex items-center gap-1 text-[#D6F04A]"><Ic n="check" className="h-3.5 w-3.5" sw={2.6} />KYC done</span>}</p>
          </div>
        </div>
        <p className="mt-3 text-[.85rem]">Wallet balance</p>
        <p className="text-[1.5rem] font-bold text-white">{inr(u.balance)}</p>
      </div>
      <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3 pb-3">
        {CONFIG.menu.map(([t, ic]) => (
          <button key={t} type="button" onClick={() => setActive(t)} aria-current={active === t ? "page" : undefined}
            className={`mb-0.5 flex min-h-[44px] w-full items-center gap-3 rounded-[10px] px-3 text-left font-medium focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#D6F04A] ${active === t ? "bg-[#D6F04A] text-[#191B45]" : "hover:bg-white/10 hover:text-white"}`}>
            <Ic n={ic} className="h-5 w-5" />{t}
          </button>
        ))}
      </nav>
      <button type="button" onClick={onLogout} className="m-3 flex min-h-[44px] items-center gap-3 rounded-[10px] px-3 font-medium hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#D6F04A]">
        <Ic n="logout" className="h-5 w-5" />Log out
      </button>
    </aside>
  );
}

export default function RetailerDashboard() {
   const navigate = useNavigate();
  const [active, setActive] = useState("Dashboard");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [range, setRange] = useState("7");
  const [todayAuth, setTodayAuth] = useState(false);
  const [picked, setPicked] = useState(null);
  const { logout: authLogout } = useAuth();
  const services = CONFIG.services.filter((s) => s.label.toLowerCase().includes(q.trim().toLowerCase()));
  const total = CONFIG.stats.reduce((a, s) => a + s.value, 0);
 const logout = async () => {
  try {
    await authLogout();
    navigate("/");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
    const pick = (s) => {
      if (s.id === "aeps" || s.id === "aepsBal") {
        navigate(PATHS.aeps);
        return;
      }
      setPicked(s);
    };

  return (
    <div className={`min-h-screen bg-[#F5F6FB] text-[16px] leading-[1.55] dark:bg-[#0E1030] ${TXT}`}>
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 hidden lg:block"><Sidebar active={active} setActive={setActive} onLogout={logout} /></div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
          <div className="absolute inset-0 bg-[#0A0C28]/60" onClick={() => setOpen(false)} />
          <div className="relative h-full w-[264px]" role="dialog" aria-modal="true" aria-label="Menu">
            <Sidebar active={active} setActive={(t) => { setActive(t); setOpen(false); }} onLogout={logout} />
          </div>
        </div>
      )}

      <div className="lg:pl-[264px]">
        {/* Top bar */}
        <header className={`sticky top-0 z-20 flex items-center gap-3 border-b px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top,0px))] sm:px-6 ${LINE} ${SURF}`}>
          <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className={`${GHOST} !min-h-10 !px-2.5 lg:hidden`}><Ic n="menu" /></button>
          <div className="relative max-w-[440px] flex-1">
            <label htmlFor="qs" className="sr-only">Search services</label>
            <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${MUTED}`}><Ic n="search" className="h-5 w-5" /></span>
            <input id="qs" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services"
              className={`min-h-[44px] w-full rounded-full border-[1.5px] bg-[#F5F6FB] py-2 pl-10 pr-4 dark:bg-[#0E1030] ${LINE} ${TXT} focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#2F33A8] dark:focus-visible:outline-[#A9ACFF]`} />
          </div>
          <div className="ml-auto hidden text-right sm:block">
            <p className="text-[.82rem] leading-tight text-[#4B4E7A] dark:text-[#A8ABD8]">Wallet</p>
            <p className="font-bold">{inr(CONFIG.user.balance)}</p>
          </div>
          <button type="button" onClick={() => setActive("Load money")} className={`${PRIMARY} !min-h-10 ml-auto sm:ml-0`}>Load money</button>
        </header>

        <main className="mx-auto max-w-[1160px] px-4 py-6 sm:px-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[clamp(1.6rem,3vw,2.1rem)] font-bold leading-tight tracking-tight">Hello, {CONFIG.user.name.split(" ")[0]}</h1>
              <p className={MUTED}>Here is how your counter did in the last {range} days.</p>
            </div>
            <div role="group" aria-label="Date range" className={`flex gap-1 rounded-xl p-1 ${SURF2}`}>
              {["7", "30"].map((d) => (
                <button key={d} type="button" aria-pressed={range === d} onClick={() => setRange(d)}
                  className={`min-h-9 rounded-lg px-3 text-[.92rem] font-semibold ${range === d ? `${SURF} shadow` : MUTED}`}>{d} days</button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <section aria-label="Service statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {CONFIG.stats.map((s) => {
              const v = range === "7" ? s.value : s.value * 3.6;
              return (
                <div key={s.label} className={`flex items-center gap-4 ${CARD}`}>
                  <span className={`grid h-12 w-12 flex-none place-items-center rounded-full text-[#2F33A8] dark:text-[#D6F04A] ${SURF2}`}><Ic n={s.icon} /></span>
                  <div><p className={`text-[.92rem] ${MUTED}`}>{s.label}</p><p className="text-[1.4rem] font-bold leading-tight">{inr(Math.round(v))}</p></div>
                </div>
              );
            })}
          </section>

          <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1fr_340px]">
            <div className="grid gap-6">
              {/* Services */}
              <section className={CARD} aria-labelledby="svcH">
                <h2 id="svcH" className={`${H3} mb-4`}>Services</h2>
                {services.length === 0 && <p className={MUTED}>No service matches "{q}". Try a shorter word.</p>}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {services.map((s) => (
                    <button key={s.id} type="button" onClick={() => pick(s)}
                      className={`relative flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] p-3 text-center text-[.95rem] font-semibold hover:border-[#2F33A8] dark:hover:border-[#A9ACFF] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#2F33A8] dark:focus-visible:outline-[#A9ACFF] ${LINE} ${picked?.id === s.id ? SURF2 : ""}`}>
                      {s.isNew && <span className="absolute right-2 top-2 rounded-full bg-[#17794A] px-2 py-0.5 text-[.72rem] font-bold text-white">New</span>}
                      <span className="text-[#2F33A8] dark:text-[#D6F04A]"><Ic n={s.icon} className="h-7 w-7" /></span>
                      {s.label}
                    </button>
                  ))}
                </div>
                {picked && (
                  <p role="status" className={`mt-4 rounded-[10px] px-3.5 py-3 text-[.93rem] ${SURF2} ${MUTED}`}>
                    You chose <strong className={TXT}>{picked.label}</strong>. Connect this tile to its form or route, for example navigate("/{picked.id}").
                  </p>
                )}
              </section>

              {/* Activity */}
              <section className={CARD} aria-labelledby="actH">
                <div className="mb-3 flex items-center justify-between">
                  <h2 id="actH" className={H3}>Last 5 account activities</h2>
                  <button type="button" className="font-semibold text-[#2F33A8] hover:underline dark:text-[#D6F04A]" onClick={() => setActive("Account history")}>View all</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-left">
                    <thead>
                      <tr className={`${SURF2} ${MUTED} text-[.88rem]`}>
                        {["Service", "Remark", "Amount", "Date"].map((h) => <th key={h} scope="col" className="px-3 py-2.5 font-semibold first:rounded-l-lg last:rounded-r-lg">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {CONFIG.activity.map((a, i) => (
                        <tr key={i} className={`border-b last:border-0 ${LINE}`}>
                          <td className="px-3 py-3 font-semibold">{a.svc}</td>
                          <td className={`px-3 py-3 ${MUTED}`}>{a.remark}</td>
                          <td className={`whitespace-nowrap px-3 py-3 font-bold ${a.dir === "in" ? "text-[#17794A] dark:text-[#5FD497]" : "text-[#B3261E] dark:text-[#FF8A80]"}`}>{a.dir === "in" ? "+" : "\u2212"}{inr(a.amt)}</td>
                          <td className={`whitespace-nowrap px-3 py-3 text-[.9rem] ${MUTED}`}>{a.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* Right column */}
            <div className="grid gap-6">
              <section className="relative overflow-hidden rounded-2xl bg-[#22258C] p-5 text-white dark:bg-[#14173F]" aria-label="Commission">
                <div className="pointer-events-none absolute inset-0 bg-[repeating-radial-gradient(circle_at_95%_5%,transparent_0_16px,rgba(255,255,255,.055)_16px_17px)]" />
                <p className="relative text-[#CDCFF3]">Commission earned today</p>
                <p className="relative mt-1 text-[2.3rem] font-bold leading-none">{inr(CONFIG.commissionToday)}</p>
                <p className="relative mt-3 text-[.92rem] text-[#CDCFF3]">Total volume in {range} days: {inr(Math.round(total * (range === "7" ? 1 : 3.6)))}</p>
                <button type="button" onClick={() => setActive("Commission slab")} className="relative mt-4 inline-flex min-h-[44px] items-center rounded-[10px] bg-[#D6F04A] px-4 font-semibold text-[#191B45] hover:brightness-95 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white">See my commission slab</button>
              </section>

              <section className={CARD} aria-labelledby="authH">
                <h2 id="authH" className={`${H3} mb-3`}>AEPS two-factor authentication</h2>
                <p className={`mb-4 text-[.93rem] ${MUTED}`}>You must pass authentication once every day before you can withdraw cash.</p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="flex items-center gap-3 rounded-xl bg-[#17794A] px-4 py-3 font-semibold text-white"><Ic n="check" sw={2.4} />Merchant registered</div>
                  <button type="button" aria-pressed={todayAuth} onClick={() => setTodayAuth(true)} disabled={todayAuth}
                    className={`flex min-h-[52px] items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#2F33A8] ${todayAuth ? "bg-[#17794A] text-white" : "bg-[#B3261E] text-white hover:brightness-110"}`}>
                    <Ic n={todayAuth ? "check" : "alert"} sw={2.2} />{todayAuth ? "Today's auth done" : "Authenticate for today"}
                  </button>
                </div>
                {!todayAuth && <p className={`mt-3 text-[.88rem] ${MUTED}`}>Tap the red button, then scan your fingerprint on the device.</p>}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
