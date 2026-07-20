"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Landmark, ShieldAlert, ShieldCheck } from "lucide-react";
import { parseUnits } from "viem";

import { WalletAuth, type WalletAuthSession } from "@/components/WalletAuth";
import {
  formatAdminUsdc, getAdminOverview, getAdminPolicies, getAdminPolicy, policyStatus, reportAdminDeath,
  shortAddress, transferAdminOwnership, withdrawAdminFee,
  type AdminOverview, type AdminPolicy, type AdminPolicyDetail, type AdminContractKey
} from "@/lib/web3/admin";

type View = "home" | "policies" | "policy" | "fees" | "ownership";

const adminSessionStorageKey = "riska.admin-wallet-session";
const card = "rounded-2xl border border-[#293446] bg-[#101722] p-5 shadow-[0_14px_36px_rgba(0,0,0,.18)]";
const button = "rounded-xl bg-[#5868ea] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6f7efa] disabled:cursor-not-allowed disabled:opacity-50";

function date(timestamp: number) {
  return timestamp ? new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(timestamp * 1000) : "—";
}

function readAdminSession(): WalletAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(adminSessionStorageKey);
    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw) as WalletAuthSession;
    return session?.status === "connected" && session.address ? session : null;
  } catch {
    return null;
  }
}

export function AdminConsole({ view, policyId }: { view: View; policyId?: string }) {
  const [session, setSession] = useState<WalletAuthSession | null>(() => readAdminSession());
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (session) {
      window.sessionStorage.setItem(adminSessionStorageKey, JSON.stringify(session));
    } else {
      window.sessionStorage.removeItem(adminSessionStorageKey);
    }
  }, [session]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setOverview(await getAdminOverview(session?.address));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo consultar el protocolo.");
    } finally { setLoading(false); }
  }, [session?.address]);

  useEffect(() => { void refresh(); }, [refresh]);

  return <main className="min-h-screen bg-[#080b10] px-4 py-8 pb-28 text-[#f5f7fb] md:px-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-[#293446] pb-6 md:flex-row md:items-center">
        <div><Link href="/" className="mb-3 inline-flex items-center gap-2 text-sm text-[#aeb8ff]"><ArrowLeft className="h-4 w-4" /> Riska</Link><p className="text-xs font-bold uppercase tracking-[.24em] text-[#95a3bc]">Protocol control</p><h1 className="mt-1 text-3xl font-bold">Administración</h1></div>
        <div className="min-w-[280px]"><WalletAuth initialSession={session} onSessionChange={setSession} showWorldIdGate={false} variant="light" /></div>
      </header>

      {message && <p className="rounded-xl border border-amber-400/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{message}</p>}
      {loading ? <p className="text-sm text-[#a7b0c2]">Consultando contratos…</p> : overview && <>
        <AccessState overview={overview} address={session?.address} />
        {overview.authorized && <nav className="flex flex-wrap gap-2" aria-label="Administración">
          <Nav href="/admin" selected={view === "home"}>Resumen</Nav><Nav href="/admin/policies" selected={view === "policies" || view === "policy"}>Pólizas</Nav><Nav href="/admin/fees" selected={view === "fees"}>Fees</Nav><Nav href="/admin/ownership" selected={view === "ownership"}>Ownership</Nav>
        </nav>}
        {overview.authorized && view === "home" && <AdminHome overview={overview} />}
        {overview.authorized && view === "policies" && <PolicyList />}
        {overview.authorized && view === "policy" && policyId && <PolicyDetail policyId={policyId} account={session!.address} />}
        {overview.authorized && view === "fees" && <Fees overview={overview} account={session!.address} onComplete={refresh} />}
        {overview.authorized && view === "ownership" && <Ownership overview={overview} account={session!.address} onComplete={refresh} />}
      </>}
    </div>
  </main>;
}

function AccessState({ overview, address }: { overview: AdminOverview; address?: string }) {
  if (overview.authorized) return <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-100"><ShieldCheck className="h-5 w-5" /><span>Wallet autorizada: {shortAddress(address!)}</span></div>;
  return <section className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-5"><div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 text-rose-300" /><div><h2 className="font-semibold">Acceso restringido</h2><p className="mt-1 text-sm text-[#d9c1c8]">Conecta la wallet propietaria de los tres contratos para habilitar el panel.</p></div></div><div className="mt-4 grid gap-2 text-xs text-[#d6dce8] md:grid-cols-3">{Object.entries(overview.owners).map(([name, owner]) => <div className="rounded-lg bg-black/20 p-3" key={name}><span className="block capitalize text-[#9caac0]">{name.replace(/([A-Z])/g, " $1")}</span>{shortAddress(owner)}</div>)}</div></section>;
}

function Nav({ href, selected, children }: { href: string; selected: boolean; children: React.ReactNode }) { return <Link className={`rounded-xl px-4 py-2 text-sm font-semibold ${selected ? "bg-[#5868ea] text-white" : "bg-[#182231] text-[#c4cddd] hover:bg-[#202d3f]"}`} href={href}>{children}</Link>; }

function AdminHome({ overview }: { overview: AdminOverview }) { return <section className="grid gap-4 md:grid-cols-3"><Metric label="Pólizas emitidas" value={String(overview.policyCount)} /><Metric label="Fees de cierre/fallecimiento" value={formatAdminUsdc(overview.protocolReserveBalance)} /><Metric label="Fees de rendimiento" value={formatAdminUsdc(overview.protocolYieldReserveBalance)} /></section>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className={card}><p className="text-sm text-[#a7b0c2]">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }

function PolicyList() {
  const [page, setPage] = useState(0); const [data, setData] = useState<{ policies: AdminPolicy[]; policyCount: number } | null>(null); const [error, setError] = useState<string | null>(null);
  useEffect(() => { setData(null); void getAdminPolicies(page).then(setData).catch((e) => setError(e instanceof Error ? e.message : "No se pudieron cargar las pólizas.")); }, [page]);
  if (error) return <p className="text-rose-200">{error}</p>; if (!data) return <p className="text-sm text-[#a7b0c2]">Cargando pólizas…</p>;
  return <section className={card}><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold">Pólizas</h2><p className="text-sm text-[#a7b0c2]">{data.policyCount} emitidas</p></div></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-[#293446] text-[#a7b0c2]"><tr><th className="p-3">ID</th><th className="p-3">Titular</th><th className="p-3">Estado</th><th className="p-3">Principal</th><th className="p-3">Fallecimiento</th><th /></tr></thead><tbody>{data.policies.map((policy) => <tr className="border-b border-[#202a38]" key={policy.id}><td className="p-3 font-semibold">#{policy.id}</td><td className="p-3">{shortAddress(policy.holder)}</td><td className="p-3">{policyStatus[policy.status] ?? "Unknown"}</td><td className="p-3">{formatAdminUsdc(policy.principal)}</td><td className="p-3">{policy.deathReported ? "Reportado" : "—"}</td><td className="p-3"><Link className="text-[#aeb8ff]" href={`/admin/policy/${policy.id}`}>Ver</Link></td></tr>)}</tbody></table></div><div className="mt-5 flex items-center justify-between"><button className={button} disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button><span className="text-sm text-[#a7b0c2]">Página {page + 1}</span><button className={button} disabled={(page + 1) * 20 >= data.policyCount} onClick={() => setPage(page + 1)}>Siguiente</button></div></section>;
}

function PolicyDetail({ policyId, account }: { policyId: string; account: string }) {
  const [policy, setPolicy] = useState<AdminPolicyDetail | null>(null); const [message, setMessage] = useState<string | null>(null); const [working, setWorking] = useState(false);
  const refresh = useCallback(() => getAdminPolicy(policyId).then(setPolicy).catch((e) => setMessage(e instanceof Error ? e.message : "No se pudo cargar la póliza.")), [policyId]); useEffect(() => { void refresh(); }, [refresh]);
  async function report() { if (!window.confirm(`¿Reportar fallecimiento de la póliza #${policyId}?`)) return; setWorking(true); setMessage(null); try { const hash = await reportAdminDeath(policyId, account); setMessage(`Reporte confirmado: ${hash}`); await refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : "La transacción falló."); } finally { setWorking(false); } }
  if (!policy) return <p className="text-sm text-[#a7b0c2]">Cargando póliza…</p>;
  return <section className="space-y-5"><Link className="text-sm text-[#aeb8ff]" href="/admin/policies">← Todas las pólizas</Link>{message && <p className="rounded-xl bg-[#172335] p-3 text-sm">{message}</p>}<div className={card}><div className="flex flex-wrap justify-between gap-4"><div><p className="text-sm text-[#a7b0c2]">Póliza #{policy.id}</p><h2 className="text-2xl font-bold">{shortAddress(policy.holder)}</h2></div><span className="rounded-full bg-[#20295b] px-3 py-1 text-sm text-[#c7ceff]">{policyStatus[policy.status]}</span></div><div className="mt-5 grid gap-4 sm:grid-cols-3"><Metric label="Principal" value={formatAdminUsdc(policy.principal)} /><Metric label="Abierta" value={date(policy.openedAt)} /><Metric label="Pagos" value={String(policy.payoutsMade)} /></div></div><div className={card}><h3 className="font-bold">Beneficiarios</h3><ul className="mt-3 space-y-2 text-sm">{policy.beneficiaries.map((beneficiary) => <li className="flex justify-between rounded-lg bg-black/15 p-3" key={beneficiary.account}><span>{beneficiary.account}</span><span>{beneficiary.shareBps / 100}%</span></li>)}</ul></div><div className={card}><h3 className="font-bold">Aviso de fallecimiento</h3><p className="mt-2 text-sm text-[#a7b0c2]">{policy.death.active ? `Reportado por ${shortAddress(policy.death.reporter)}. Reclamable: ${date(policy.death.claimableAt)}` : "Sin aviso activo."}</p><button className={`${button} mt-4`} disabled={working || policy.death.active} onClick={() => void report()}>{working ? "Confirmando…" : "Reportar fallecimiento"}</button></div></section>;
}

function Fees({ overview, account, onComplete }: { overview: AdminOverview; account: string; onComplete: () => Promise<void> }) {
  const [recipient, setRecipient] = useState(account); const [amount, setAmount] = useState(""); const [kind, setKind] = useState<"reserve" | "yield">("reserve"); const [message, setMessage] = useState<string | null>(null); const [working, setWorking] = useState(false); const balance = kind === "reserve" ? overview.protocolReserveBalance : overview.protocolYieldReserveBalance;
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!window.confirm(`¿Retirar ${amount} USDC?`)) return; setWorking(true); try { const units = parseUnits(amount, 6); if (units > balance) throw new Error("El monto excede la reserva disponible."); const hash = await withdrawAdminFee(kind, recipient, units, account); setMessage(`Retiro confirmado: ${hash}`); await onComplete(); } catch (e) { setMessage(e instanceof Error ? e.message : "No se pudo retirar la fee."); } finally { setWorking(false); } }
  return <section className={card}><h2 className="text-xl font-bold">Retirar fees</h2><p className="mt-1 text-sm text-[#a7b0c2]">La operación conserva la liquidez necesaria para el principal de las pólizas.</p>{message && <p className="mt-4 rounded-lg bg-[#172335] p-3 text-sm">{message}</p>}<form className="mt-5 max-w-xl space-y-4" onSubmit={submit}><label className="block text-sm">Tipo<select className="mt-1 w-full rounded-xl border border-[#344055] bg-[#0b111a] p-3" value={kind} onChange={(e) => setKind(e.target.value as "reserve" | "yield")}><option value="reserve">Cierre y fallecimiento — {formatAdminUsdc(overview.protocolReserveBalance)}</option><option value="yield">Rendimiento — {formatAdminUsdc(overview.protocolYieldReserveBalance)}</option></select></label><label className="block text-sm">Destinatario<input className="mt-1 w-full rounded-xl border border-[#344055] bg-[#0b111a] p-3" value={recipient} onChange={(e) => setRecipient(e.target.value)} /></label><label className="block text-sm">Monto (USDC)<input className="mt-1 w-full rounded-xl border border-[#344055] bg-[#0b111a] p-3" min="0" step="0.000001" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></label><button className={button} disabled={working} type="submit">{working ? "Confirmando…" : "Retirar"}</button></form></section>;
}

function Ownership({ overview, account, onComplete }: { overview: AdminOverview; account: string; onComplete: () => Promise<void> }) { return <section className="grid gap-4 md:grid-cols-3">{(Object.keys(overview.owners) as AdminContractKey[]).map((contract) => <OwnershipCard key={contract} contract={contract} owner={overview.owners[contract]} account={account} onComplete={onComplete} />)}</section>; }
function OwnershipCard({ contract, owner, account, onComplete }: { contract: AdminContractKey; owner: string; account: string; onComplete: () => Promise<void> }) { const [recipient, setRecipient] = useState(""); const [message, setMessage] = useState<string | null>(null); const [working, setWorking] = useState(false); async function submit(event: React.FormEvent) { event.preventDefault(); if (!window.confirm(`¿Transferir ownership de ${contract} a ${recipient}? Esta acción no se puede deshacer desde esta wallet.`)) return; setWorking(true); try { const hash = await transferAdminOwnership(contract, recipient, account); setMessage(`Transferencia confirmada: ${hash}`); await onComplete(); } catch (e) { setMessage(e instanceof Error ? e.message : "No se pudo transferir ownership."); } finally { setWorking(false); } } return <article className={card}><Landmark className="h-5 w-5 text-[#aeb8ff]" /><h2 className="mt-3 font-bold">{contract.replace(/([A-Z])/g, " $1")}</h2><p className="mt-1 text-sm text-[#a7b0c2]">Owner: {shortAddress(owner)}</p>{message && <p className="mt-3 break-all text-xs text-[#d7def0]">{message}</p>}<form className="mt-4 space-y-3" onSubmit={submit}><input aria-label={`Nuevo owner de ${contract}`} className="w-full rounded-xl border border-[#344055] bg-[#0b111a] p-3 text-sm" placeholder="0x…" value={recipient} onChange={(e) => setRecipient(e.target.value)} /><button className={button} disabled={working} type="submit">{working ? "Confirmando…" : "Transferir ownership"}</button></form></article>; }
