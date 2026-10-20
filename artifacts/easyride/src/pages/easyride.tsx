import { useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity, ArrowDownLeft, ArrowRight, ArrowUpRight, Bike, CheckCircle2,
  CircleAlert, Clock3, Compass, CreditCard, Gauge, MapPin, Menu, Plus,
  Settings2, ShieldCheck, Wrench,
} from "lucide-react";
import type {
  EasyRideActivity, EasyRideBicycle, EasyRideMaintenance, EasyRideRental, EasyRideState,
  EasyRideStation,
} from "@workspace/api-client-react";
import { useEasyRide } from "@/hooks/use-easyride";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const when = () => new Date().toISOString();
const niceDate = (value?: string | null) => value ? new Date(value).toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" }) : "—";
const money = (amount: number, currency: string) => `${currency} ${Number(amount || 0).toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;
const textCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function BikeSketch({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 230 125" fill="none" aria-hidden="true">
    <path d="M34 92a25 25 0 1 0 50 0 25 25 0 0 0-50 0Zm111 0a25 25 0 1 0 50 0 25 25 0 0 0-50 0Z" stroke="currentColor" strokeWidth="3"/>
    <path d="m59 92 31-46 26 46H59l17-26h39m0 0 25 26m-25-26 16-24h17m-71 4h18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M88 43h14m47-5h14" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
    <path d="M14 22c17-8 28-4 36 1m131 77c13 2 23-1 34-8" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 5" strokeLinecap="round"/>
  </svg>;
}

function Logo() {
  return <Link href="/" className="flex items-center gap-3 no-underline" data-testid="link-home">
    <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#214f46] text-[#d5e7bc]"><Bike size={22} strokeWidth={2.2}/></span>
    <span className="leading-tight"><span className="block font-[var(--app-font-serif)] text-[19px] font-bold tracking-[-.06em]">easyride</span><span className="mono block text-[9px] uppercase tracking-[.18em] text-[#71827a]">Makerere routes</span></span>
  </Link>;
}

function Topbar({ active }: { active: string }) {
  const [open, setOpen] = useState(false);
  const links = [{ href: "/", label: "Find a ride" }, { href: "/rentals", label: "My rentals" }, { href: "/operator", label: "Operations" }];
  return <header className="relative z-10 border-b border-[#214f46]/10 bg-[#f7f5ed]/90">
    <div className="mx-auto flex max-w-[1320px] items-center justify-between px-5 py-3.5 md:px-8">
      <Logo/>
      <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
        {links.map((item) => <Link key={item.href} href={item.href} data-testid={`link-nav-${item.href === "/" ? "home" : item.href.slice(1)}`} className={`nav-link rounded-full px-4 py-2 text-[13px] font-semibold no-underline ${active === item.href ? "bg-[#e6ece2] text-[#245b4f]" : "text-[#61736b] hover:bg-[#ecebe2] hover:text-[#214f46]"}`}>{item.label}</Link>)}
      </nav>
      <div className="hidden items-center gap-2 text-right sm:flex"><span className="h-2 w-2 rounded-full bg-[#739f6d]"></span><span className="text-xs font-semibold text-[#5a7167]">Main Campus · Kampala</span></div>
      <button onClick={() => setOpen(!open)} aria-label="Toggle navigation" data-testid="button-menu" className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9eee5] text-[#24584d] md:hidden"><Menu size={19}/></button>
    </div>
    {open && <nav className="grid gap-1 border-t border-[#214f46]/10 px-5 py-3 md:hidden">{links.map((item) => <Link key={item.href} onClick={() => setOpen(false)} href={item.href} className="rounded-xl px-3 py-3 text-sm font-semibold text-[#214f46] no-underline hover:bg-[#e9eee5]">{item.label}</Link>)}</nav>}
  </header>;
}

function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "green" | "amber" | "red" | "neutral" }) {
  const styles = { green: "bg-[#e5f0e3] text-[#35674c]", amber: "bg-[#f7ecd4] text-[#95651d]", red: "bg-[#f7e4df] text-[#a34b3b]", neutral: "bg-[#ecece5] text-[#67766d]" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.09em] ${styles[tone]}`}>{children}</span>;
}

function PageTitle({ eyebrow, title, detail, side }: { eyebrow: string; title: string; detail: string; side?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-[#6b8276]">{eyebrow}</p><h1 className="display text-[clamp(2.35rem,5vw,4rem)] font-semibold leading-[.98] text-[#183c38]">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#68776e]">{detail}</p></div>{side}</div>;
}

function BikeCardArt() {
  return <div className="relative flex h-[130px] items-center justify-center overflow-hidden rounded-[20px] bg-[#dce8d8] text-[#22584e]">
    <div className="absolute -left-4 -top-8 h-28 w-28 rounded-full border border-[#447966]/20"></div><div className="absolute right-4 top-4 h-20 w-20 rounded-full border border-[#447966]/25"></div>
    <BikeSketch className="relative z-[1] w-[230px] rotate-[-4deg]"/>
    <span className="mono absolute bottom-3 left-4 text-[9px] uppercase tracking-[.18em] text-[#467468]">two wheels, your way</span>
    <span className="absolute right-4 top-3 rounded-full bg-[#f6f3e9] px-2.5 py-1 text-[10px] font-bold text-[#3b715d]">PEDAL POWER</span>
  </div>;
}

function SkeletonPage() {
  return <main className="mx-auto max-w-[1320px] px-5 py-10 md:px-8"><div className="h-3 w-28 animate-pulse rounded bg-[#dce4d8]"/><div className="mt-4 h-12 w-2/3 animate-pulse rounded bg-[#e4e8dd]"/><div className="mt-8 grid gap-5 md:grid-cols-3">{[0,1,2].map(x => <div key={x} className="panel h-52 animate-pulse bg-[#eeeee5]"/>)}</div></main>;
}

function MissingState({ error, retry }: { error?: unknown; retry: () => void }) {
  return <main className="mx-auto grid min-h-[65vh] max-w-xl place-items-center px-6 text-center"><div className="panel p-8"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f4e8d8] text-[#986d35]"><CircleAlert/></span><h1 className="display mt-4 text-3xl">We can’t reach the ride board.</h1><p className="mt-2 text-sm leading-6 text-[#68776e]">{error ? "The saved service records didn’t load. Check your connection and try again." : "There are no service records available yet."}</p><button onClick={retry} className="btn-primary mt-5 rounded-full px-5 py-2.5 text-sm font-semibold" data-testid="button-retry">Try again</button></div></main>;
}

function StationCard({ station, bicycles, rate, currency, onRent }: { station: EasyRideStation; bicycles: EasyRideBicycle[]; rate: number; currency: string; onRent: () => void }) {
  const available = bicycles.filter(b => b.stationId === station.id && b.status === "available" && b.condition !== "faulty");
  const verified = bicycles.reduce((latest, bike) => bike.stationId === station.id && bike.lastChecked > latest ? bike.lastChecked : latest, "");
  return <article className={`panel group relative overflow-hidden p-5 ${!station.active ? "opacity-60" : ""}`} data-testid={`card-station-${station.id}`}>
    <div className="mb-4 flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e7eee1] text-[#34725f]"><MapPin size={19}/></span><Tag tone={station.active ? "green" : "neutral"}>{station.active ? "Open" : "Paused"}</Tag></div>
    <p className="mono text-[10px] uppercase tracking-[.14em] text-[#819087]">{station.area}</p><h3 className="display mt-1 text-[23px] font-semibold leading-tight">{station.name}</h3><p className="mt-2 text-xs text-[#768078]">{station.landmark}</p>
    <div className="mt-5 flex items-end justify-between border-t border-[#214f46]/10 pt-4"><div><p className="text-3xl font-semibold tracking-[-.06em]">{available.length}<span className="ml-1 text-sm font-medium text-[#748078]">bikes</span></p><p className="mt-1 text-[10px] text-[#7a847b]">{verified ? `Last recorded ${niceDate(verified)}` : "No bicycle check recorded"}</p></div><button disabled={!station.active || !available.length} onClick={onRent} className="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-35" data-testid={`button-rent-${station.id}`}>Choose <ArrowRight size={14}/></button></div>
    <p className="mt-3 text-[10px] text-[#839087]">From {money(rate, currency)} / hour</p>
  </article>;
}

function Discovery({ state }: { state: EasyRideState }) {
  const [, navigate] = useLocation();
  const bikes = state.bicycles;
  const activeStations = state.stations.filter(s => s.active);
  const availableCount = bikes.filter(b => b.status === "available" && b.condition !== "faulty").length;
  return <main className="mx-auto max-w-[1320px] px-5 pb-16 pt-8 md:px-8 md:pt-12">
    <section className="relative overflow-hidden rounded-[26px] bg-[#214f46] px-6 py-9 text-[#f7f5ed] md:px-12 md:py-14">
      <div className="relative z-[1] max-w-[660px]"><p className="mono text-[10px] uppercase tracking-[.22em] text-[#b9d7a0]">Makerere in motion</p><h1 className="display mt-4 text-[clamp(3rem,7vw,6.6rem)] font-semibold leading-[.88] tracking-[-.065em]">The short way<br/><span className="text-[#cbe5a8]">is on two wheels.</span></h1><p className="mt-5 max-w-md text-sm leading-6 text-[#deeadf]/80">A bicycle for the quick run across campus, down to Kikoni, or over to Wandegeya. Check the board, choose a pickup, and go.</p><div className="mt-7 flex flex-wrap items-center gap-3"><button onClick={() => navigate("/rentals")} className="inline-flex items-center gap-2 rounded-full bg-[#d4e8b4] px-5 py-3 text-sm font-bold text-[#214f46] hover:bg-[#e1f0c9]" data-testid="button-start-ride">Start a ride <ArrowRight size={16}/></button><span className="rounded-full border border-white/20 px-4 py-2.5 text-xs text-white/80">{availableCount} bicycles recorded available</span></div></div>
      <BikeSketch className="bike-doodle !right-4 !top-1/2 !bottom-auto !w-[390px] -translate-y-1/2 text-[#c3dfa1] opacity-40"/>
      <span className="mono absolute bottom-4 right-6 hidden text-[9px] uppercase tracking-[.16em] text-[#c6d8c7]/50 md:block">01 / 03 · campus loops</span>
    </section>
    <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="mono text-[10px] uppercase tracking-[.2em] text-[#6e8278]">Pickup board</p><h2 className="display mt-1 text-3xl font-semibold">Where to pick up</h2></div><div className="flex items-center gap-2 rounded-xl bg-[#e9eee5] px-3 py-2.5 text-xs text-[#526e60]"><Clock3 size={15}/><span>Latest recorded availability · not live tracking</span></div></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{activeStations.length ? activeStations.map(station => <StationCard key={station.id} station={station} bicycles={bikes} rate={state.config.hourlyRate} currency={state.config.currency} onRent={() => navigate(`/rentals?station=${station.id}`)}/>) : <div className="panel col-span-full px-6 py-12 text-center"><Compass className="mx-auto text-[#73917f]"/><h3 className="display mt-3 text-2xl">No pickup points are open right now.</h3><p className="mt-2 text-sm text-[#718078]">Try again later or check with the service team.</p></div>}</div>
    <section className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <div className="panel flex flex-col justify-between gap-5 overflow-hidden p-6 md:flex-row md:items-center md:p-8"><div><p className="mono text-[10px] uppercase tracking-[.18em] text-[#73867c]">Clear price, no surprises</p><h2 className="display mt-2 text-3xl font-semibold">A simple hourly rate.</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#6a776f]">The current configured rate is charged by the hour. Your final amount is worked out when the bicycle is returned.</p><div className="mono mt-5 inline-flex items-baseline gap-2 rounded-xl bg-[#f0eedf] px-4 py-3"><span className="text-2xl font-bold">{money(state.config.hourlyRate, state.config.currency)}</span><span className="text-[10px] uppercase tracking-wider text-[#667970]">per hour</span></div></div><BikeCardArt/></div>
      <div className="relative overflow-hidden rounded-[18px] bg-[#e8e6d7] p-6 md:p-8"><p className="mono text-[10px] uppercase tracking-[.18em] text-[#768376]">Before you roll</p><h2 className="display mt-2 max-w-sm text-[28px] font-semibold leading-tight">Recorded condition is your first check.</h2><p className="mt-3 max-w-sm text-sm leading-6 text-[#6d786f]">Availability reflects the latest recorded status, not physical verification. Check the bicycle yourself before leaving. Report a fault to the operator.</p><div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#476e58]"><ShieldCheck size={16}/> No live tracking or sensor data</div><BikeSketch className="bike-doodle text-[#537b61]"/></div>
    </section>
  </main>;
}

function Rentals({ state, save }: { state: EasyRideState; save: (state: EasyRideState) => void }) {
  const params = new URLSearchParams(window.location.search);
  const [stationId, setStationId] = useState(params.get("station") || "");
  const [customerName, setCustomerName] = useState("");
  const [bicycleId, setBicycleId] = useState("");
  const [returnId, setReturnId] = useState("");
  const [returnCondition, setReturnCondition] = useState<EasyRideBicycle["condition"] | "">("");
  const [returnNotes, setReturnNotes] = useState("");
  const active = state.rentals.filter(r => r.status === "active");
  const availableBikes = state.bicycles.filter(b => b.status === "available" && b.condition !== "faulty" && (!stationId || b.stationId === stationId));
  const selectedStation = state.stations.find(s => s.id === stationId);
  const addActivity = (activity: EasyRideActivity) => [activity, ...state.activity].slice(0, 100);
  const start = () => {
    const bike = state.bicycles.find(b => b.id === bicycleId);
    const station = state.stations.find(s => s.id === stationId);
    if (!bike || !station || !customerName.trim()) return;
    const rental: EasyRideRental = { id: uid(), customerName: customerName.trim(), bicycleId: bike.id, bicycleCode: bike.code, pickupStationId: station.id, startedAt: when(), returnedAt: null, durationMinutes: null, amount: 0, paymentStatus: "pending", status: "active", returnCondition: null, returnNotes: null };
    save({ ...state, bicycles: state.bicycles.map(b => b.id === bike.id ? { ...b, status: "rented" } : b), rentals: [rental, ...state.rentals], activity: addActivity({ id: uid(), message: `${bike.code} rented by ${customerName.trim()} at ${station.name}`, createdAt: when(), kind: "rental" }) });
    setCustomerName(""); setBicycleId("");
  };
  const confirmReturn = (rental: EasyRideRental) => {
    if (!returnCondition) return;
    const now = new Date();
    const started = new Date(rental.startedAt);
    const duration = Math.max(1, Math.ceil((now.getTime() - started.getTime()) / 60000));
    const amount = Math.ceil(duration / 60) * state.config.hourlyRate;
    const bike = state.bicycles.find(b => b.id === rental.bicycleId);
    const stationName = state.stations.find(s => s.id === rental.pickupStationId)?.name || "station";
    const note = returnNotes.trim();
    const needsMaintenance = returnCondition === "faulty" || note.length > 0;
    const maintenanceRecord: EasyRideMaintenance | null = needsMaintenance ? {
      id: uid(),
      bicycleId: rental.bicycleId,
      bicycleCode: rental.bicycleCode,
      stationName,
      issue: note || "Fault found during return check",
      reportedAt: now.toISOString(),
      status: "open",
      repairCost: 0,
    } : null;
    const activity: EasyRideActivity[] = [
      { id: uid(), message: `${rental.bicycleCode} returned to ${stationName} · ${money(amount, state.config.currency)} due`, createdAt: now.toISOString(), kind: "return" },
      ...(maintenanceRecord ? [{ id: uid(), message: `${rental.bicycleCode} held for maintenance after return check`, createdAt: now.toISOString(), kind: "maintenance" as const }] : []),
      ...state.activity,
    ].slice(0, 100);
    save({
      ...state,
      rentals: state.rentals.map(r => r.id === rental.id ? { ...r, status: "completed", returnedAt: now.toISOString(), durationMinutes: duration, amount, paymentStatus: "pending", returnCondition, returnNotes: note || null } : r),
      bicycles: state.bicycles.map(b => b.id === rental.bicycleId ? { ...b, status: needsMaintenance ? "maintenance" : "available", condition: needsMaintenance ? "faulty" : returnCondition, stationId: rental.pickupStationId, lastChecked: now.toISOString() } : b),
      maintenance: maintenanceRecord ? [maintenanceRecord, ...state.maintenance] : state.maintenance,
      activity,
    });
    setReturnId(""); setReturnCondition(""); setReturnNotes("");
  };
  return <main className="mx-auto max-w-[1320px] px-5 pb-16 pt-8 md:px-8 md:pt-12">
    <PageTitle eyebrow="Rider desk / 02" title="Make the trip yours." detail="Start a rental with a recorded pickup point and bicycle. On return, we record the duration and amount due. Payment status is handled by the service team."/>
    <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
      <section className="panel h-fit p-5 md:p-7"><div className="flex items-center justify-between"><div><p className="mono text-[10px] uppercase tracking-[.18em] text-[#72867b]">Quick start</p><h2 className="display mt-1 text-2xl font-semibold">Record a ride</h2></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5eee0] text-[#397866]"><ArrowUpRight size={19}/></span></div>
        <label className="mt-5 block text-xs font-semibold text-[#51675c]">Rider name<input className="field mt-1.5" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Name for the rental record" data-testid="input-rider-name"/></label>
        <label className="mt-4 block text-xs font-semibold text-[#51675c]">Pickup point<select className="field mt-1.5" value={stationId} onChange={e => { setStationId(e.target.value); setBicycleId(""); }} data-testid="select-pickup-station"><option value="">Choose a station</option>{state.stations.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name} · {s.area}</option>)}</select></label>
        <label className="mt-4 block text-xs font-semibold text-[#51675c]">Recorded available bicycle<select className="field mt-1.5" value={bicycleId} onChange={e => setBicycleId(e.target.value)} data-testid="select-bicycle"><option value="">Choose a bicycle</option>{availableBikes.map(b => <option key={b.id} value={b.id}>{b.code} · {b.type} · {textCase(b.condition)} condition</option>)}</select></label>
        <div className="mt-4 rounded-xl bg-[#f0eedf] p-3 text-xs leading-5 text-[#68776e]"><span className="font-bold text-[#335b4c]">{money(state.config.hourlyRate, state.config.currency)} / hour</span> · billed by each started hour. This board is the latest recorded status, not live tracking; confirm the bicycle is physically present and safe.</div>
        {selectedStation && !availableBikes.length && <p className="mt-3 text-xs text-[#a34b3b]">No recorded available bicycles at this pickup point. Try another station.</p>}
        <button disabled={!customerName.trim() || !stationId || !bicycleId} onClick={start} className="btn-primary mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-begin-rental">Start rental <ArrowRight size={16}/></button>
      </section>
      <section className="space-y-4"><div className="flex items-end justify-between"><div><p className="mono text-[10px] uppercase tracking-[.18em] text-[#72867b]">Your rides</p><h2 className="display mt-1 text-2xl font-semibold">Active rentals <span className="text-[#8a9b8f]">({active.length})</span></h2></div><span className="text-xs text-[#748078]">Return confirmation required</span></div>
        {active.length ? active.map(r => {
          const station = state.stations.find(s => s.id === r.pickupStationId);
          return <article key={r.id} className="panel p-5" data-testid={`card-active-rental-${r.id}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><Tag tone="green">On trip</Tag><h3 className="display mt-3 text-2xl font-semibold">{r.bicycleCode}</h3><p className="mt-1 text-xs text-[#748078]">Rider {r.customerName} · picked up at {station?.name || "station"}</p></div><p className="mono text-[10px] leading-5 text-[#748078]">STARTED<br/>{niceDate(r.startedAt)}</p></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#214f46]/10 pt-4"><p className="text-xs text-[#6f7a72]">Amount due is calculated when the return is recorded.</p><button onClick={() => { setReturnId(r.id); setReturnCondition(""); setReturnNotes(""); }} className="btn-quiet inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold" data-testid={`button-return-${r.id}`}>Record return <ArrowDownLeft size={15}/></button></div>{returnId === r.id && <div className="mt-4 rounded-xl border border-[#d2c998] bg-[#f7f2de] p-4"><p className="text-sm font-bold">Check bicycle condition before closing</p><p className="mt-1 text-xs text-[#6a776e]">A faulty or damaged bicycle is held out of service and added to the maintenance log.</p><label className="mt-3 block text-xs font-semibold text-[#51675c]">Condition on return<select className="field mt-1.5" value={returnCondition} onChange={e => setReturnCondition(e.target.value as EasyRideBicycle["condition"] | "")} data-testid={`select-return-condition-${r.id}`}><option value="">Choose condition</option>{["excellent","good","fair","faulty"].map(condition => <option key={condition} value={condition}>{textCase(condition)}</option>)}</select></label><label className="mt-3 block text-xs font-semibold text-[#51675c]">Fault or damage notes<textarea className="field mt-1.5 min-h-20 resize-y" value={returnNotes} onChange={e => setReturnNotes(e.target.value)} placeholder="Describe any damage or issue found" data-testid={`input-return-notes-${r.id}`}/></label><div className="mt-3 flex flex-wrap gap-2"><button disabled={!returnCondition} onClick={() => confirmReturn(r)} className="btn-primary rounded-lg px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40" data-testid={`button-confirm-return-${r.id}`}>Confirm return</button><button onClick={() => { setReturnId(""); setReturnCondition(""); setReturnNotes(""); }} className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-[#5e6d64]" data-testid="button-cancel-return">Keep rental active</button></div></div>}</article>;
        }) : <div className="panel px-6 py-10 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e7eee1] text-[#427665]"><Bike/></span><h3 className="display mt-3 text-2xl">No active rentals.</h3><p className="mt-1 text-sm text-[#748078]">Pick a recorded available bicycle to begin.</p></div>}
        <div className="panel p-5"><h3 className="text-sm font-bold">Recent completed trips</h3>{state.rentals.filter(r => r.status === "completed").slice(0, 4).length ? <div className="mt-3 divide-y divide-[#214f46]/10">{state.rentals.filter(r => r.status === "completed").slice(0, 4).map(r => <div key={r.id} className="flex items-center justify-between py-3 text-xs"><span><b>{r.bicycleCode}</b><span className="ml-2 text-[#7d877e]">{r.customerName} · {r.durationMinutes ?? "—"} min</span></span><span className="font-semibold">{money(r.amount, state.config.currency)} <Tag tone={r.paymentStatus === "paid" ? "green" : "amber"}>{r.paymentStatus}</Tag></span></div>)}</div> : <p className="mt-2 text-xs text-[#7d877e]">Completed rentals appear here after a return.</p>}</div>
      </section>
    </div>
  </main>;
}

type OperatorTab = "overview" | "fleet" | "records" | "care" | "settings";
function Stat({ label, value, note, icon: Icon }: { label: string; value: string | number; note: string; icon: typeof Bike }) {
  return <div className="panel p-5"><div className="flex items-start justify-between"><span className="mono text-[9px] uppercase tracking-[.16em] text-[#75867c]">{label}</span><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8eee3] text-[#467763]"><Icon size={16}/></span></div><p className="display mt-3 text-3xl font-semibold">{value}</p><p className="mt-1 text-[10px] text-[#7b857d]">{note}</p></div>;
}
function Operator({ state, save, saving }: { state: EasyRideState; save: (state: EasyRideState) => void; saving: boolean }) {
  const [tab, setTab] = useState<OperatorTab>("overview");
  const [stationName, setStationName] = useState("");
  const [stationArea, setStationArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [configName, setConfigName] = useState(state.config.serviceName);
  const [configArea, setConfigArea] = useState(state.config.serviceArea);
  const [rate, setRate] = useState(String(state.config.hourlyRate));
  const [dailyCost, setDailyCost] = useState(String(state.config.operatingCostPerDay));
  const [currency, setCurrency] = useState(state.config.currency);
  const [repairCostDrafts, setRepairCostDrafts] = useState<Record<string, string>>(
    () => Object.fromEntries(state.maintenance.map(item => [item.id, String(item.repairCost)])),
  );
  const [issueBike, setIssueBike] = useState("");
  const [issueText, setIssueText] = useState("");
  const [filter, setFilter] = useState("");
  const active = state.rentals.filter(r => r.status === "active");
  const completed = state.rentals.filter(r => r.status === "completed");
  const income = completed.filter(r => r.paymentStatus === "paid").reduce((sum, r) => sum + r.amount, 0);
  const pending = completed.filter(r => r.paymentStatus === "pending").reduce((sum, r) => sum + r.amount, 0);
  const repairSpend = state.maintenance.reduce((sum, item) => sum + item.repairCost, 0);
  const breakEvenRides = state.config.operatingCostPerDay > 0 && state.config.hourlyRate > 0
    ? Math.ceil(state.config.operatingCostPerDay / state.config.hourlyRate)
    : null;
  const bikesAvailable = state.bicycles.filter(b => b.status === "available").length;
  const broken = state.bicycles.filter(b => b.condition === "faulty" || b.status === "maintenance").length;
  const tabs: { id: OperatorTab; label: string; icon: typeof Bike }[] = [{ id: "overview", label: "Overview", icon: Activity }, { id: "fleet", label: "Fleet & stations", icon: Bike }, { id: "records", label: "Rental records", icon: CreditCard }, { id: "care", label: "Faults & care", icon: Wrench }, { id: "settings", label: "Service settings", icon: Settings2 }];
  const updateBike = (bikeId: string, updates: Partial<EasyRideBicycle>) => save({ ...state, bicycles: state.bicycles.map(b => b.id === bikeId ? { ...b, ...updates } : b) });
  const setPayment = (rental: EasyRideRental) => save({ ...state, rentals: state.rentals.map(r => r.id === rental.id ? { ...r, paymentStatus: r.paymentStatus === "paid" ? "pending" : "paid" } : r), activity: [{ id: uid(), message: `Payment for ${rental.bicycleCode} marked ${rental.paymentStatus === "paid" ? "pending" : "paid"} · ${money(rental.amount, state.config.currency)}`, createdAt: when(), kind: "payment" as const }, ...state.activity].slice(0, 100) });
  const reportFault = () => {
    const bike = state.bicycles.find(b => b.id === issueBike);
    if (!bike || !issueText.trim()) return;
    const station = state.stations.find(s => s.id === bike.stationId);
    const record: EasyRideMaintenance = { id: uid(), bicycleId: bike.id, bicycleCode: bike.code, stationName: station?.name || "Off station", issue: issueText.trim(), reportedAt: when(), status: "open", repairCost: 0 };
    save({ ...state, bicycles: state.bicycles.map(b => b.id === bike.id ? { ...b, condition: "faulty", status: "maintenance" } : b), maintenance: [record, ...state.maintenance], activity: [{ id: uid(), message: `${bike.code} fault reported: ${issueText.trim()}`, createdAt: when(), kind: "maintenance" as const }, ...state.activity].slice(0, 100) });
    setIssueText(""); setIssueBike("");
  };
  const addStation = () => {
    if (!stationName.trim() || !stationArea.trim()) return;
    const station: EasyRideStation = { id: uid(), name: stationName.trim(), area: stationArea.trim(), landmark: landmark.trim() || "Landmark not recorded", active: true };
    save({ ...state, stations: [...state.stations, station], activity: [{ id: uid(), message: `Pickup point added: ${station.name}`, createdAt: when(), kind: "station" as const }, ...state.activity].slice(0, 100) });
    setStationName(""); setStationArea(""); setLandmark("");
  };
  const saveConfig = () => {
    const hourlyRate = Number(rate);
    const operatingCostPerDay = Number(dailyCost);
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0 || !Number.isFinite(operatingCostPerDay) || operatingCostPerDay < 0) return;
    save({ ...state, config: { serviceName: configName.trim() || state.config.serviceName, serviceArea: configArea.trim() || state.config.serviceArea, hourlyRate, operatingCostPerDay, currency: currency.trim() || state.config.currency } });
  };
  const saveRepairCost = (maintenanceId: string) => {
    const repairCost = Number(repairCostDrafts[maintenanceId]);
    if (!Number.isFinite(repairCost) || repairCost < 0) return;
    save({ ...state, maintenance: state.maintenance.map(item => item.id === maintenanceId ? { ...item, repairCost } : item) });
  };
  const filteredRentals = state.rentals.filter(r => `${r.customerName} ${r.bicycleCode}`.toLowerCase().includes(filter.toLowerCase()));
  return <main className="mx-auto max-w-[1320px] px-5 pb-16 pt-8 md:px-8 md:pt-12">
    <PageTitle eyebrow="Service desk / Operations" title="Keep every wheel turning." detail="Accurate pickup, rental, return, payment and fault records help the service stay useful and sustainable." side={<div className={`mono rounded-full px-3 py-2 text-[10px] ${saving ? "bg-[#f7ecd4] text-[#95651d]" : "bg-[#e6eee2] text-[#4b7258]"}`} data-testid="status-save">{saving ? "SAVING RECORDS…" : "RECORDS IN SYNC"}</div>}/>
    <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-[#e9e9df] p-1.5">{tabs.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${tab === item.id ? "bg-[#214f46] text-[#f7f5ed] shadow-sm" : "text-[#6c7a70] hover:bg-[#f3f1e8]"}`} data-testid={`button-operator-tab-${item.id}`}><item.icon size={15}/>{item.label}</button>)}</div>
    {tab === "overview" && <div className="enter space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Bicycle fleet" value={state.bicycles.length} note={`${bikesAvailable} recorded available`} icon={Bike}/><Stat label="On active rentals" value={active.length} note="Riders currently checked out" icon={ArrowUpRight}/><Stat label="Recorded income" value={money(income, state.config.currency)} note={`${completed.filter(r => r.paymentStatus === "paid").length} paid completed trips`} icon={CreditCard}/><Stat label="Attention needed" value={broken} note={`${state.maintenance.filter(m => m.status !== "resolved").length} open maintenance records`} icon={Wrench}/></div>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><section className="panel p-5 md:p-7"><div className="flex items-start justify-between"><div><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Service pulse</p><h2 className="display mt-1 text-2xl font-semibold">Usage & recorded income</h2></div><Gauge className="text-[#48806a]"/></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#e7eee2] p-4"><p className="text-xs text-[#68786e]">Completed rentals</p><p className="display mt-2 text-3xl font-semibold">{completed.length}</p><p className="mt-1 text-[10px] text-[#78857c]">{completed.reduce((sum, r) => sum + (r.durationMinutes || 0), 0).toLocaleString()} recorded minutes used</p></div><div className="rounded-xl bg-[#f5ead5] p-4"><p className="text-xs text-[#78694e]">Pending collection</p><p className="display mt-2 text-3xl font-semibold">{money(pending, state.config.currency)}</p><p className="mt-1 text-[10px] text-[#877c69]">{completed.filter(r => r.paymentStatus === "pending").length} completed trips unpaid</p></div></div><div className="mt-5 flex items-center justify-between border-t border-[#214f46]/10 pt-4 text-xs"><span className="text-[#78847b]">Active pickup points</span><b>{state.stations.filter(s => s.active).length} / {state.stations.length}</b><span className="text-[#78847b]">Rate</span><b>{money(state.config.hourlyRate, state.config.currency)} / hr</b></div></section>
        <section className="panel p-5 md:p-7"><div className="flex items-center justify-between"><div><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Latest entries</p><h2 className="display mt-1 text-2xl font-semibold">Activity book</h2></div><Activity size={19} className="text-[#48806a]"/></div><div className="mt-4 space-y-3">{state.activity.slice(0, 6).length ? state.activity.slice(0, 6).map(item => <div key={item.id} className="flex gap-3 border-b border-[#214f46]/8 pb-3 last:border-0"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#73a181]"></span><div className="min-w-0 flex-1"><p className="text-xs leading-5 text-[#4d6357]">{item.message}</p><p className="mono mt-1 text-[9px] uppercase tracking-wider text-[#97a097]">{textCase(item.kind)} · {niceDate(item.createdAt)}</p></div></div>) : <p className="rounded-xl bg-[#f1f0e7] p-5 text-center text-xs text-[#7a857c]">New service activity appears here when a record is saved.</p>}</div></section></div>
      <div className="grid gap-5 lg:grid-cols-2"><section className="panel p-5"><h3 className="text-sm font-bold">Latest bicycle status</h3><div className="mt-3 space-y-2">{state.bicycles.slice(0, 5).map(b => <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f2f0e7] px-3 py-2.5"><div><span className="font-bold text-sm">{b.code}</span><span className="ml-2 text-xs text-[#7b857d]">{b.type}</span></div><div className="flex items-center gap-2"><Tag tone={b.condition === "faulty" ? "red" : b.status === "available" ? "green" : b.status === "maintenance" ? "amber" : "neutral"}>{textCase(b.status)}</Tag><span className="hidden text-[10px] text-[#8a938a] sm:inline">{textCase(b.condition)} · checked {niceDate(b.lastChecked)}</span></div></div>)}</div></section><section className="relative overflow-hidden rounded-[18px] bg-[#dce8d8] p-5"><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Sustainability view</p><h3 className="display mt-1 text-2xl font-semibold">A record is a service asset.</h3><p className="mt-2 max-w-md text-xs leading-5 text-[#63786b]">Rental duration and payment status help the team understand usage and income. Fault records keep bicycles out of circulation until checked. Maintenance costs are not tracked in this record set.</p><BikeSketch className="bike-doodle text-[#397866]"/></section></div>
    </div>}
    {tab === "fleet" && <div className="enter grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><section className="panel p-5 md:p-7"><div className="flex items-end justify-between"><div><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Fleet register</p><h2 className="display mt-1 text-2xl font-semibold">Bicycles</h2></div><span className="text-xs text-[#718078]">{state.bicycles.length} records</span></div><div className="mt-4 space-y-3">{state.bicycles.length ? state.bicycles.map(b => <div key={b.id} className="rounded-xl border border-[#214f46]/10 p-4" data-testid={`row-bike-${b.id}`}><div className="flex flex-wrap items-center justify-between gap-2"><div><b className="text-sm">{b.code}</b><span className="ml-2 text-xs text-[#758178]">{b.type}</span></div><Tag tone={b.status === "available" ? "green" : b.status === "maintenance" ? "amber" : "neutral"}>{textCase(b.status)}</Tag></div><div className="mt-3 grid gap-2 sm:grid-cols-3"><label className="text-[10px] font-semibold text-[#738078]">Condition<select className="field mt-1 !py-2 text-xs" value={b.condition} onChange={e => updateBike(b.id, { condition: e.target.value as EasyRideBicycle["condition"], status: e.target.value === "faulty" ? "maintenance" : b.status === "maintenance" ? "available" : b.status })} data-testid={`select-condition-${b.id}`}>{["excellent","good","fair","faulty"].map(x => <option key={x} value={x}>{textCase(x)}</option>)}</select></label><label className="text-[10px] font-semibold text-[#738078]">Recorded status<select className="field mt-1 !py-2 text-xs" value={b.status} onChange={e => updateBike(b.id, { status: e.target.value as EasyRideBicycle["status"] })} data-testid={`select-status-${b.id}`}>{["available","rented","maintenance"].map(x => <option key={x} value={x}>{textCase(x)}</option>)}</select></label><label className="text-[10px] font-semibold text-[#738078]">Station<select className="field mt-1 !py-2 text-xs" value={b.stationId || ""} onChange={e => updateBike(b.id, { stationId: e.target.value || null })} data-testid={`select-bike-station-${b.id}`}><option value="">Off station</option>{state.stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div><p className="mt-2 text-[10px] text-[#89938a]">Last recorded check: {niceDate(b.lastChecked)} · update only after physical verification.</p></div>) : <p className="py-10 text-center text-sm text-[#7b857c]">No bicycles recorded yet.</p>}</div></section>
      <section className="space-y-5"><div className="panel p-5 md:p-7"><div><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Pickup network</p><h2 className="display mt-1 text-2xl font-semibold">Stations</h2></div><div className="mt-4 space-y-3">{state.stations.map(s => <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f0efe6] p-3"><div><b className="text-sm">{s.name}</b><p className="mt-1 text-[10px] text-[#7a857b]">{s.area} · {s.landmark}</p></div><button onClick={() => save({ ...state, stations: state.stations.map(st => st.id === s.id ? { ...st, active: !st.active } : st) })} className={`rounded-full px-3 py-2 text-[10px] font-bold ${s.active ? "bg-[#e5f0e3] text-[#35674c]" : "bg-[#e8e8e1] text-[#6a766e]"}`} data-testid={`button-toggle-station-${s.id}`}>{s.active ? "Open · pause" : "Paused · open"}</button></div>)}</div></div>
      <div className="panel p-5 md:p-7"><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Expand the network</p><h3 className="display mt-1 text-2xl font-semibold">Add a pickup point</h3><div className="mt-4 grid gap-3"><input className="field" placeholder="Station name" value={stationName} onChange={e => setStationName(e.target.value)} data-testid="input-station-name"/><input className="field" placeholder="Area (e.g. Kikoni)" value={stationArea} onChange={e => setStationArea(e.target.value)} data-testid="input-station-area"/><input className="field" placeholder="Landmark" value={landmark} onChange={e => setLandmark(e.target.value)} data-testid="input-station-landmark"/></div><button disabled={!stationName.trim() || !stationArea.trim()} onClick={addStation} className="btn-primary mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-40" data-testid="button-add-station"><Plus size={15}/> Add station</button></div></section></div>}
    {tab === "records" && <section className="panel enter p-5 md:p-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Record keeping</p><h2 className="display mt-1 text-2xl font-semibold">Rentals, returns & payments</h2><p className="mt-1 text-xs text-[#718078]">Payment status and amount only; no payment details are stored.</p></div><input className="field max-w-xs" placeholder="Find rider or bicycle…" value={filter} onChange={e => setFilter(e.target.value)} data-testid="input-rental-search"/></div>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b border-[#214f46]/15 text-[10px] uppercase tracking-wider text-[#819087]"><th className="pb-3">Rider / bicycle</th><th className="pb-3">Pickup</th><th className="pb-3">Started / returned</th><th className="pb-3">Duration</th><th className="pb-3">Amount</th><th className="pb-3">Rental status</th><th className="pb-3">Payment</th></tr></thead><tbody>{filteredRentals.map(r => <tr key={r.id} className="border-b border-[#214f46]/8" data-testid={`row-rental-${r.id}`}><td className="py-3"><b>{r.customerName}</b><p className="mt-1 text-[10px] text-[#78847b]">{r.bicycleCode}</p></td><td className="py-3">{state.stations.find(s => s.id === r.pickupStationId)?.name || "—"}</td><td className="py-3 text-[10px] leading-5">{niceDate(r.startedAt)}<br/>{r.returnedAt ? niceDate(r.returnedAt) : "Not returned"}</td><td className="py-3">{r.durationMinutes == null ? "—" : `${r.durationMinutes} min`}</td><td className="py-3 font-semibold">{money(r.amount, state.config.currency)}</td><td className="py-3"><Tag tone={r.status === "active" ? "green" : "neutral"}>{r.status}</Tag></td><td className="py-3">{r.status === "completed" ? <button onClick={() => setPayment(r)} className="rounded-full" data-testid={`button-payment-${r.id}`}><Tag tone={r.paymentStatus === "paid" ? "green" : "amber"}>{r.paymentStatus} · change</Tag></button> : <Tag tone="neutral">Not due</Tag>}</td></tr>)}</tbody></table>{!filteredRentals.length && <p className="py-10 text-center text-sm text-[#7b857c]">No rental records match that search.</p>}</div>
      <div className="mt-5 flex flex-wrap gap-3"><div className="rounded-xl bg-[#e7eee2] px-4 py-3"><span className="text-[10px] text-[#708075]">Collected</span><p className="mt-1 font-bold">{money(income, state.config.currency)}</p></div><div className="rounded-xl bg-[#f5ead5] px-4 py-3"><span className="text-[10px] text-[#82765f]">Pending</span><p className="mt-1 font-bold">{money(pending, state.config.currency)}</p></div></div></section>}
    {tab === "care" && <div className="enter grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><section className="panel h-fit p-5 md:p-7"><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Protect the fleet</p><h2 className="display mt-1 text-2xl font-semibold">Report a fault</h2><p className="mt-2 text-xs leading-5 text-[#758078]">Reporting a fault marks the bicycle faulty and moves it into maintenance status.</p><label className="mt-4 block text-xs font-semibold text-[#51675c]">Bicycle<select className="field mt-1.5" value={issueBike} onChange={e => setIssueBike(e.target.value)} data-testid="select-fault-bike"><option value="">Choose bicycle</option>{state.bicycles.map(b => <option key={b.id} value={b.id}>{b.code} · {b.type}</option>)}</select></label><label className="mt-4 block text-xs font-semibold text-[#51675c]">Issue details<textarea className="field mt-1.5 min-h-[92px] resize-y" value={issueText} onChange={e => setIssueText(e.target.value)} placeholder="Describe what the operator observed" data-testid="input-fault-issue"/></label><button disabled={!issueBike || !issueText.trim()} onClick={reportFault} className="btn-primary mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold disabled:opacity-40" data-testid="button-report-fault"><Wrench size={15}/> Record fault</button></section>
      <section className="panel p-5 md:p-7"><div className="flex items-end justify-between"><div><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Workshop log</p><h2 className="display mt-1 text-2xl font-semibold">Maintenance records</h2></div><Tag tone="amber">{state.maintenance.filter(m => m.status !== "resolved").length} open</Tag></div><div className="mt-4 space-y-3">{state.maintenance.length ? state.maintenance.map(m => <div key={m.id} className="rounded-xl border border-[#214f46]/10 p-4" data-testid={`row-maintenance-${m.id}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><b className="text-sm">{m.bicycleCode}</b><Tag tone={m.status === "resolved" ? "green" : m.status === "in_progress" ? "amber" : "red"}>{textCase(m.status)}</Tag></div><p className="mt-2 text-xs text-[#586e61]">{m.issue}</p><p className="mt-1 text-[10px] text-[#89938a]">{m.stationName} · reported {niceDate(m.reportedAt)}</p></div><select className="field max-w-[160px] !py-2 text-xs" value={m.status} onChange={e => { const status = e.target.value as EasyRideMaintenance["status"]; const resolved = status === "resolved"; save({ ...state, maintenance: state.maintenance.map(item => item.id === m.id ? { ...item, status } : item), bicycles: resolved ? state.bicycles.map(b => b.id === m.bicycleId ? { ...b, status: "available", condition: "good", lastChecked: when() } : b) : state.bicycles, activity: [{ id: uid(), message: `${m.bicycleCode} maintenance marked ${textCase(status)}`, createdAt: when(), kind: "maintenance" as const }, ...state.activity].slice(0, 100) }); }} data-testid={`select-maintenance-status-${m.id}`}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved · checked</option></select></div></div>) : <div className="rounded-xl bg-[#f1f0e7] px-6 py-12 text-center"><CheckCircle2 className="mx-auto text-[#6c9a74]"/><p className="mt-3 text-sm font-semibold">No maintenance issues recorded.</p><p className="mt-1 text-xs text-[#849087]">Faults logged by the team will appear here.</p></div>}</div><p className="mt-4 text-[10px] leading-5 text-[#849087]">Mark resolved only after the bicycle is physically checked. No repair cost fields are available in the current record set.</p></section></div>}
    {tab === "settings" && <div className="enter grid gap-5 lg:grid-cols-2"><section className="panel p-5 md:p-7"><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Service profile</p><h2 className="display mt-1 text-2xl font-semibold">Location & pricing</h2><p className="mt-2 text-xs leading-5 text-[#758078]">These details appear to riders as the service’s current settings.</p><label className="mt-4 block text-xs font-semibold text-[#51675c]">Service name<input className="field mt-1.5" value={configName} onChange={e => setConfigName(e.target.value)} data-testid="input-config-name"/></label><label className="mt-4 block text-xs font-semibold text-[#51675c]">Service area<input className="field mt-1.5" value={configArea} onChange={e => setConfigArea(e.target.value)} data-testid="input-config-area"/></label><div className="mt-4 grid grid-cols-[1fr_130px] gap-3"><label className="text-xs font-semibold text-[#51675c]">Hourly rate<input type="number" min="0" step="100" className="field mt-1.5" value={rate} onChange={e => setRate(e.target.value)} data-testid="input-config-rate"/></label><label className="text-xs font-semibold text-[#51675c]">Currency<input className="field mt-1.5" value={currency} onChange={e => setCurrency(e.target.value)} data-testid="input-config-currency"/></label></div><button onClick={saveConfig} disabled={!rate || Number(rate) < 0} className="btn-primary mt-5 rounded-xl px-5 py-3 text-xs font-bold disabled:opacity-40" data-testid="button-save-config">Save service settings</button></section>
      <section className="relative overflow-hidden rounded-[18px] bg-[#e8e6d7] p-6 md:p-8"><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Operating principle</p><h2 className="display mt-2 max-w-sm text-3xl font-semibold leading-tight">Clear records make a more dependable ride.</h2><p className="mt-3 max-w-md text-sm leading-6 text-[#68776e]">Station availability and bicycle condition are only as current as the latest recorded check. This product does not track bicycles live. Keep the board honest by recording a physical check when you update status.</p><div className="mt-5 rounded-xl bg-[#f7f5ed]/75 p-4"><div className="flex items-center gap-2 text-xs font-bold text-[#3c6654]"><ShieldCheck size={16}/> Privacy by design</div><p className="mt-2 text-xs leading-5 text-[#6f7a71]">Rental records store rider name, bicycle, time and amount. Payment details are not collected here.</p></div><BikeSketch className="bike-doodle text-[#567d66]"/></section></div>}
  </main>;
}

export default function EasyRidePage() {
  const { state, loading, error, retry, save, saving } = useEasyRide();
  const [path] = useLocation();
  const activePath = path.startsWith("/operator") ? "/operator" : path.startsWith("/rentals") ? "/rentals" : "/";
  const page = useMemo(() => {
    if (!state || loading || error) return null;
    if (activePath === "/rentals") return <Rentals state={state} save={save}/>;
    if (activePath === "/operator") return <Operator state={state} save={save} saving={saving}/>;
    return <Discovery state={state}/>;
  }, [state, loading, error, activePath, save, saving]);
  return <div className="page-shell grain min-h-[100dvh]"><Topbar active={activePath}/>{loading ? <SkeletonPage/> : error || !state ? <MissingState error={error} retry={retry}/> : page}<footer className="border-t border-[#214f46]/10 px-5 py-6 text-center text-[10px] text-[#849087]"><span className="font-semibold text-[#536f60]">{state?.config.serviceName || "EasyRide"}</span> · Latest recorded status only · No live tracking · Kampala, Uganda</footer></div>;
}
