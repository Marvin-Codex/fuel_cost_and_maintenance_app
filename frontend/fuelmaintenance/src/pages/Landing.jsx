import { Link } from 'react-router-dom'

const features = [
  ['Fuel cost tracking', 'Log fill-ups, prices and consumption. See cost per kilometre and efficiency trends for every vehicle.'],
  ['Maintenance & reminders', 'Keep service history organised with parts and costs, and get reminded before work is due.'],
  ['Trips & GPS history', 'Review trip distances, durations and fuel use with route summaries and trip-to-trip comparisons.'],
  ['Live telemetry', 'Connect an OBD-II adapter for engine readings, diagnostics and driving-behaviour insights.'],
  ['Offline-first PWA', 'Record fuel, trips and maintenance with zero connectivity. Everything syncs when you are back online.'],
  ['Fleet organizations', 'Invite your team with roles from owner to viewer, and unlock features through package subscriptions.'],
]

const steps = [
  ['1', 'Create your account', 'Sign up free in seconds. Your data stays scoped to you from the first login.'],
  ['2', 'Add your vehicles', 'Register number plates, fuel types and odometer readings for each vehicle you run.'],
  ['3', 'Track & save', 'Log fuel, review trips and service on time — and watch the cost per kilometre fall.'],
]

const modules = [
  ['Telemetry', 'Live engine monitoring', ['OBD-II operating conditions', 'Diagnostics & sensor health', 'Eco-driving behaviour score']],
  ['Fuel', 'Every litre accounted for', ['Tank status & estimated range', 'Consumption trends vs target', 'Fill-up history with UGX costs']],
  ['Trips', 'Journeys that teach', ['Current trip tracking', 'Trip history with engine stats', 'Today-vs-yesterday comparisons']],
  ['Services', 'Never miss maintenance', ['Vehicle health score', 'Upcoming service countdowns', 'Searchable service history']],
  ['System', 'Your garage office', ['Vehicle records & OBD status', 'Alerts, thresholds & preferences', 'Data export & backups']],
]

const packages = [
  ['Essentials', 'The core tools for confident vehicle ownership.', ['Vehicle records', 'Fuel and trip tracking', 'Maintenance history']],
  ['Fleet', 'Shared visibility for teams managing multiple vehicles.', ['Everything in Essentials', 'Organization roles', 'Package-based feature access']],
  ['Scale', 'Flexible access that grows with your organization.', ['Time-limited subscriptions', 'Centralized organization access', 'Built for expanding fleets']],
]

const offlinePoints = [
  ['Record anywhere', 'Log fuel, trips and maintenance with zero bars — the app never blocks on network.'],
  ['Sync when online', 'Queued records upload to the JWT-secured API and reconcile with server truth.'],
  ['Never lose work', 'IndexedDB storage on web and SQLite on mobile keep every entry safe on-device.'],
]

const faqs = [
  ['Is FuelMaintenance really offline-first?', 'Yes. Fuel, trip and maintenance entry works with no connection on both the web PWA and the mobile app. Calculations run server-side whenever a network call is possible, and local records sync once you are back online.'],
  ['Do I need an OBD-II adapter?', 'No. Telemetry, diagnostics and driving-behaviour views light up when you connect one, but fuel, trips and maintenance work fully without any hardware.'],
  ['How do organizations and roles work?', 'Create an organization, invite members as owner, admin, fleet manager, maintenance manager, driver or viewer, and grant dashboard features through package subscriptions.'],
  ['What do subscriptions control?', 'Plans bundle features into packages, and subscriptions open access only within their active window — so expanding fleets can scale access up or down per organization.'],
  ['Which vehicles and currencies are supported?', 'Any petrol, diesel, electric, hybrid or LPG vehicle with an odometer reading. Costs render in UGX by default with USD, EUR and GBP available in settings.'],
  ['Is my data private?', 'Every API endpoint requires JWT auth and is scoped to the authenticated user — clients never supply an owner id, and organizations isolate fleet data by role.'],
]

export default function Landing() {
  return (
    <main className="min-h-screen scroll-smooth overflow-hidden bg-slate-950 text-white" id="top">
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur" aria-label="Primary">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link to="/" className="text-lg font-bold tracking-tight">Fuel<span className="text-cyan-400">Maintenance</span></Link>
          <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a className="hover:text-white" href="#features">Features</a>
            <a className="hover:text-white" href="#how-it-works">How it works</a>
            <a className="hover:text-white" href="#modules">Modules</a>
            <a className="hover:text-white" href="#packages">Packages</a>
            <a className="hover:text-white" href="#faq">FAQ</a>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link className="rounded-lg px-4 py-2 text-slate-300 hover:text-white" to="/login">Sign in</Link>
            <Link className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300" to="/register">Get started</Link>
          </div>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-16 lg:grid-cols-2 lg:items-center lg:px-10 lg:pt-24" aria-labelledby="hero-title">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -right-24 top-40 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">Smarter vehicle ownership</p>
          <h1 id="hero-title" className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">Know where your vehicle costs are going.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">FuelMaintenance brings fuel costs, trips, and service records together so you can make better decisions for every vehicle you own — online or off.</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link className="rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300" to="/register">Create your free account</Link>
            <Link className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-white hover:border-slate-500" to="/login">I already have an account</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">Offline-first PWA</span>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">JWT-secured API</span>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">UGX-ready costs</span>
          </div>
        </div>
        <div className="relative rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-2xl shadow-blue-950/50">
          <div className="mb-8 flex items-center justify-between"><span className="text-sm font-semibold text-slate-300">VEHICLE OVERVIEW</span><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400">HEALTHY</span></div>
          <div className="mb-8 flex items-end justify-between"><div><p className="text-sm text-slate-400">Monthly fuel cost</p><strong className="text-4xl">UGX 320K</strong></div><span className="text-sm text-emerald-400">↓ 12% vs last month</span></div>
          <div className="h-32 rounded-xl bg-gradient-to-t from-cyan-400/20 to-transparent p-4"><div className="h-full border-b border-cyan-400/40 bg-[linear-gradient(135deg,transparent_45%,rgba(34,211,238,.7)_46%,transparent_48%,transparent_60%,rgba(34,211,238,.7)_61%,transparent_63%)]" /></div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-slate-800 p-4"><span className="text-slate-400">Efficiency</span><strong className="mt-1 block text-xl">7.8 L/100km</strong></div><div className="rounded-xl bg-slate-800 p-4"><span className="text-slate-400">Next service</span><strong className="mt-1 block text-xl">850 km</strong></div></div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400"><span className="rounded-md bg-slate-800 px-2 py-1">Telemetry</span><span className="rounded-md bg-slate-800 px-2 py-1">Fuel</span><span className="rounded-md bg-slate-800 px-2 py-1">Trips</span><span className="rounded-md bg-slate-800 px-2 py-1">Services</span><span className="rounded-md bg-slate-800 px-2 py-1">System</span></div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/60" aria-label="Key facts">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-10 text-center lg:grid-cols-4 lg:px-10">
          <div><strong className="text-3xl font-bold text-cyan-400">6</strong><p className="mt-2 text-sm text-slate-300">dashboard views, from overview to system</p></div>
          <div><strong className="text-3xl font-bold text-cyan-400">6</strong><p className="mt-2 text-sm text-slate-300">organization roles, owner to viewer</p></div>
          <div><strong className="text-3xl font-bold text-cyan-400">100%</strong><p className="mt-2 text-sm text-slate-300">offline-capable fuel &amp; trip logging</p></div>
          <div><strong className="text-3xl font-bold text-cyan-400">3</strong><p className="mt-2 text-sm text-slate-300">package tiers that grow with your fleet</p></div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 text-slate-900 lg:px-10" id="features">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Everything in one place</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">The tools every kilometre depends on.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">One account covers fuel, maintenance, trips, telemetry and team access — with offline support built in from day one.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{features.map(([title, description]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 h-3 w-12 rounded-full bg-cyan-400" /><h3 className="text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-slate-600">{description}</p></article>)}</div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-20 lg:px-10" id="how-it-works" aria-labelledby="how-title">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">How it works</p>
          <h2 id="how-title" className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">From signup to savings in three steps.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">{steps.map(([number, title, description]) => <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6"><span className="inline-grid h-10 w-10 place-items-center rounded-full bg-cyan-400 font-bold text-slate-950">{number}</span><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-slate-300">{description}</p></article>)}</div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link className="rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300" to="/register">Start step one free</Link>
            <Link className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-white hover:border-slate-500" to="/dashboard">Preview the dashboard</Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-100 px-6 py-20 text-slate-900 lg:px-10" id="modules" aria-labelledby="modules-title">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Inside the dashboard</p>
          <h2 id="modules-title" className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Five views, one confident operation.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">The same dashboard you log into every day — telemetry, fuel, trips, services and system, each tuned for the job.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{modules.map(([tab, headline, bullets]) => <article key={tab} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"><span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">{tab}</span><h3 className="mt-3 text-xl font-bold">{headline}</h3><ul className="mt-4 space-y-2.5 text-sm text-slate-700">{bullets.map((bullet) => <li key={bullet} className="flex gap-2"><span className="font-bold text-emerald-600">\u2713</span>{bullet}</li>)}</ul><Link className="mt-6 font-semibold text-blue-700 hover:text-blue-900" to="/register">Try {tab.toLowerCase()} free \u2192</Link></article>)}</div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-20 lg:px-10" id="offline" aria-labelledby="offline-title">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">Offline-first, always</p>
            <h2 id="offline-title" className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Works with no network. Syncs when there is one.</h2>
            <p className="mt-4 max-w-xl leading-7 text-slate-300">Airplane mode is a testable requirement, not a nice-to-have. Open the app, record fuel, trips and maintenance, and review your own data with zero connectivity — on web and mobile.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link className="rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300" to="/register">Try offline mode free</Link>
              <a className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-white hover:border-slate-500" href="#faq">How syncing works</a>
            </div>
          </div>
          <div className="grid gap-4">{offlinePoints.map(([title, description]) => <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6"><h3 className="text-lg font-bold text-cyan-300">{title}</h3><p className="mt-2 leading-7 text-slate-300">{description}</p></article>)}</div>
        </div>
      </section>

      <section className="bg-slate-100 px-6 py-20 text-slate-900 lg:px-10" id="packages">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Plans that fit your operation</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Choose the access your organization needs.</h2>
            <p className="mt-4 leading-7 text-slate-600">Features are delivered through organization packages and protected by role permissions. Active subscriptions keep access available only during the plan period.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">{packages.map(([title, description, items], index) => <article key={title} className={`flex flex-col rounded-2xl border p-6 ${index === 1 ? 'border-blue-600 bg-white shadow-xl shadow-blue-900/10' : 'border-slate-200 bg-white/70'}`}><div className="flex items-center justify-between"><h3 className="text-xl font-bold">{title}</h3>{index === 1 && <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-blue-800">POPULAR</span>}</div><p className="mt-3 leading-7 text-slate-600">{description}</p><ul className="mt-5 space-y-3 text-sm text-slate-700">{items.map((item) => <li key={item} className="flex gap-2"><span className="font-bold text-emerald-600">\u2713</span>{item}</li>)}</ul><Link className={`mt-6 rounded-xl px-5 py-2.5 text-center font-bold ${index === 1 ? 'bg-blue-700 text-white hover:bg-blue-800' : 'border border-slate-300 text-slate-900 hover:border-slate-500'}`} to="/register">Start with {title}</Link></article>)}</div>
          <p className="mt-8 text-sm text-slate-500">Package availability and feature access are managed for each organization. <Link className="font-semibold text-blue-700 hover:text-blue-900" to="/register">Create an account to get started.</Link></p>
        </div>
      </section>

      <section className="bg-white px-6 py-20 text-slate-900 lg:px-10" id="testimonials" aria-labelledby="stories-title">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Loved on the road</p>
          <h2 id="stories-title" className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Operators who stopped guessing.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-6"><div className="text-amber-500" aria-label="5 out of 5 stars">\u2605\u2605\u2605\u2605\u2605</div><blockquote className="mt-4 leading-7 text-slate-700">\u201CFuel logs finally match the pump receipts. We spotted one vehicle burning 12% more and fixed a dragging brake.\u201D</blockquote><figcaption className="mt-5 text-sm"><strong className="block">Brian M.</strong><span className="text-slate-500">Private owner · Kampala</span></figcaption></figure>
            <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-6"><div className="text-amber-500" aria-label="5 out of 5 stars">\u2605\u2605\u2605\u2605\u2605</div><blockquote className="mt-4 leading-7 text-slate-700">\u201CService reminders arrive before the odometer hits the limit. Our Hilux has not missed a service since.\u201D</blockquote><figcaption className="mt-5 text-sm"><strong className="block">Sarah N.</strong><span className="text-slate-500">Fleet manager · Entebbe</span></figcaption></figure>
            <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-6"><div className="text-amber-500" aria-label="5 out of 5 stars">\u2605\u2605\u2605\u2605\u2605</div><blockquote className="mt-4 leading-7 text-slate-700">\u201COffline logging is the killer feature. Drivers record fuel up-country with no signal, and it syncs later.\u201D</blockquote><figcaption className="mt-5 text-sm"><strong className="block">David O.</strong><span className="text-slate-500">Logistics lead · Jinja</span></figcaption></figure>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-20 lg:px-10" id="faq" aria-labelledby="faq-title">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">Questions, answered</p>
          <h2 id="faq-title" className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions.</h2>
          <div className="mt-10 space-y-4">{faqs.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5"><summary className="cursor-pointer list-none font-semibold marker:hidden [&::-webkit-details-marker]:hidden">{question}<span className="float-right text-cyan-400 transition group-open:rotate-45">+</span></summary><p className="mt-3 leading-7 text-slate-300">{answer}</p></details>)}</div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950 px-6 py-20 text-center lg:px-10" aria-labelledby="cta-title">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">Ready when you are</p>
          <h2 id="cta-title" className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Stop guessing. Start tracking every litre.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-blue-100">Join FuelMaintenance today — log your first fill-up in minutes and see exactly what each kilometre costs.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link className="rounded-xl bg-cyan-400 px-8 py-3.5 font-bold text-slate-950 hover:bg-cyan-300" to="/register">Create your free account</Link>
            <Link className="rounded-xl border border-white/30 px-8 py-3.5 font-semibold text-white hover:border-white/60" to="/login">Sign in</Link>
          </div>
          <p className="mt-6 text-sm text-blue-200">Free to start · No credit card · Works offline</p>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-14 text-sm text-slate-400 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div>
            <Link to="#top" className="text-lg font-bold tracking-tight text-white">Fuel<span className="text-cyan-400">Maintenance</span></Link>
            <p className="mt-4 max-w-xs leading-7">Fuel costs, trips and maintenance in one offline-first home for every vehicle you run.</p>
          </div>
          <nav aria-label="Product">
            <h3 className="font-bold uppercase tracking-widest text-slate-200">Product</h3>
            <ul className="mt-4 space-y-3"><li><a className="hover:text-white" href="#features">Features</a></li><li><a className="hover:text-white" href="#modules">Dashboard modules</a></li><li><a className="hover:text-white" href="#packages">Packages</a></li><li><a className="hover:text-white" href="#faq">FAQ</a></li></ul>
          </nav>
          <nav aria-label="Account">
            <h3 className="font-bold uppercase tracking-widest text-slate-200">Account</h3>
            <ul className="mt-4 space-y-3"><li><Link className="hover:text-white" to="/register">Create account</Link></li><li><Link className="hover:text-white" to="/login">Sign in</Link></li><li><Link className="hover:text-white" to="/dashboard">Open dashboard</Link></li></ul>
          </nav>
          <div>
            <h3 className="font-bold uppercase tracking-widest text-slate-200">Stay efficient</h3>
            <p className="mt-4 leading-7">Fuel-saving tips and product updates, once a month. No spam.</p>
            <form className="mt-4 flex gap-2" onSubmit={(event) => event.preventDefault()}>
              <label className="sr-only" htmlFor="newsletter-email">Email address</label>
              <input id="newsletter-email" type="email" required placeholder="you@example.com" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
              <button type="submit" className="rounded-lg bg-cyan-400 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-300">Join</button>
            </form>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-xs sm:flex-row">
          <p>FuelMaintenance · Keep moving with confidence.</p>
          <p>© 2026 FuelMaintenance. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
