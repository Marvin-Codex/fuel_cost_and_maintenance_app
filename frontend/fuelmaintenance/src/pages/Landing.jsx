import { Link } from 'react-router-dom'

const features = [
  ['Fuel visibility', 'Track fuel purchases, consumption, costs, and efficiency in one place.'],
  ['Maintenance planning', 'Keep service history organised and receive reminders before work is due.'],
  ['Vehicle insights', 'Understand how each vehicle is performing so every trip costs less.'],
]

export default function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link to="/" className="text-lg font-bold tracking-tight">Fuel<span className="text-cyan-400">Maintenance</span></Link>
        <div className="flex items-center gap-3 text-sm">
          <Link className="rounded-lg px-4 py-2 text-slate-300 hover:text-white" to="/login">Sign in</Link>
          <Link className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300" to="/register">Get started</Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl gap-14 px-6 pb-24 pt-16 lg:grid-cols-2 lg:items-center lg:px-10 lg:pt-24">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="relative">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">Smarter vehicle ownership</p>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">Know where your vehicle costs are going.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">FuelMaintenance brings fuel costs, trips, and service records together so you can make better decisions for every vehicle you own.</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link className="rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300" to="/register">Create your free account</Link>
            <Link className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-white hover:border-slate-500" to="/login">I already have an account</Link>
          </div>
        </div>
        <div className="relative rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-2xl shadow-blue-950/50">
          <div className="mb-8 flex items-center justify-between"><span className="text-sm font-semibold text-slate-300">VEHICLE OVERVIEW</span><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400">HEALTHY</span></div>
          <div className="mb-8 flex items-end justify-between"><div><p className="text-sm text-slate-400">Monthly fuel cost</p><strong className="text-4xl">UGX 320K</strong></div><span className="text-sm text-emerald-400">↓ 12% vs last month</span></div>
          <div className="h-32 rounded-xl bg-gradient-to-t from-cyan-400/20 to-transparent p-4"><div className="h-full border-b border-cyan-400/40 bg-[linear-gradient(135deg,transparent_45%,rgba(34,211,238,.7)_46%,transparent_48%,transparent_60%,rgba(34,211,238,.7)_61%,transparent_63%)]" /></div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-slate-800 p-4"><span className="text-slate-400">Efficiency</span><strong className="mt-1 block text-xl">7.8 L/100km</strong></div><div className="rounded-xl bg-slate-800 p-4"><span className="text-slate-400">Next service</span><strong className="mt-1 block text-xl">850 km</strong></div></div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 text-slate-900 lg:px-10"><div className="mx-auto max-w-7xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Everything in one place</p><div className="mt-4 grid gap-8 md:grid-cols-3">{features.map(([title, description]) => <article key={title} className="rounded-2xl border border-slate-200 p-6"><div className="mb-5 h-3 w-12 rounded-full bg-cyan-400" /><h2 className="text-xl font-bold">{title}</h2><p className="mt-3 leading-7 text-slate-600">{description}</p></article>)}</div></div></section>
      <footer className="bg-slate-950 px-6 py-8 text-center text-sm text-slate-400">FuelMaintenance · Keep moving with confidence.</footer>
    </main>
  )
}
