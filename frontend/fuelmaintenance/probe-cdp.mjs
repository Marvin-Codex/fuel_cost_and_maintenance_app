/* Temporary CDP probe: launches Edge headless, drives the LocationSearchInput
   probe page and reports the suggestion panel's geometry + computed styles.
   Delete after verification. */
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9222
const URL = 'http://localhost:5173/probe.html'

const child = spawn(EDGE, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--user-data-dir=' + process.env.TEMP + '\\cdp-probe-' + process.pid,
  'about:blank',
], { stdio: 'ignore' })

async function waitForTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const targets = await res.json()
      const page = targets.find((t) => t.type === 'page')
      if (page) return page
    } catch { /* not up yet */ }
    await delay(300)
  }
  throw new Error('CDP target never appeared')
}

const target = await waitForTarget()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})

let id = 0
const pending = new Map()
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
  }
}

function send(method, params = {}) {
  const msgId = ++id
  ws.send(JSON.stringify({ id: msgId, method, params }))
  return new Promise((resolve, reject) => pending.set(msgId, { resolve, reject }))
}

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails))
  return res.result.value
}

await send('Page.enable')
await send('Runtime.enable')
const consoleErrors = []
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data)
  if (msg.method === 'Runtime.exceptionThrown') {
    consoleErrors.push('EXCEPTION: ' + (msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text))
  }
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    consoleErrors.push('CONSOLE: ' + msg.params.args.map((a) => a.value || a.description).join(' '))
  }
})
await send('Page.navigate', { url: URL })

// Wait for the React app to actually mount before probing.
let mounted = false
for (let i = 0; i < 40; i++) {
  mounted = await evaluate(`(() => {
    return !!(document.querySelector('.loc-search-input') && document.querySelector('input[name="old_start_location"]'))
  })()`).catch(() => false)
  if (mounted) break
  await delay(300)
}
if (!mounted) {
  console.log('PAGE ERRORS:', JSON.stringify(consoleErrors, null, 2))
  console.log('BODY:', await evaluate('document.body.innerHTML.slice(0, 600)'))
  throw new Error('probe page did not mount')
}
await delay(500)
if (consoleErrors.length) {
  console.log('PAGE ERRORS:', JSON.stringify(consoleErrors, null, 2))
}

// Type into the first field using trusted input events (React ignores
// untrusted synthetic 'input' events for controlled inputs).
await evaluate(`(() => {
  window.__fetchCalls = []
  const input = document.querySelector('.loc-search-input')
  input.focus()
  return true
})()`)
await send('Input.insertText', { text: 'Kampala' })
await delay(1500)

const report = await evaluate(`(async () => {
  const input = document.querySelector('.loc-search-input')
  if (!input) return { error: 'input not found', html: document.body.innerHTML.slice(0, 400) }

  await new Promise((r) => setTimeout(r, 300))

  const list = document.querySelector('.loc-search-list')
  if (!list) {
    return {
      error: 'suggestion panel not rendered',
      inputValue: input.value,
      activeEl: document.activeElement ? document.activeElement.tagName + '.' + document.activeElement.className : null,
      ariaExpanded: input.getAttribute('aria-expanded'),
      busy: !!document.querySelector('.loc-search-busy'),
      fetchCalls: window.__fetchCalls,
      bodyChildren: [...document.body.children].map((c) => c.tagName + '#' + c.id),
    }
  }

  const li = list.querySelector('li')
  const name = list.querySelector('.loc-search-name')
  const kind = list.querySelector('.loc-search-kind')
  const ctx = list.querySelector('.loc-search-context')
  const listStyle = getComputedStyle(list)
  const nameStyle = name ? getComputedStyle(name) : null

  // Is the panel actually reachable (not clipped away by an ancestor)?
  const rect = list.getBoundingClientRect()
  const midX = rect.left + rect.width / 2
  const midY = rect.top + rect.height / 2
  const hit = document.elementFromPoint(midX, midY)
  const hitInPanel = hit ? list.contains(hit) || list === hit : false

  // What is the clipping ancestor situation?
  const panel = document.querySelector('.current-trip-panel')
  const panelStyle = panel ? getComputedStyle(panel) : null
  const inputRect = input.getBoundingClientRect()

  return {
    inBody: list.parentElement === document.body,
    position: listStyle.position,
    zIndex: listStyle.zIndex,
    maxHeight: listStyle.maxHeight,
    fontSizeName: nameStyle ? nameStyle.fontSize : null,
    fontSizeKind: kind ? getComputedStyle(kind).fontSize : null,
    fontSizeCtx: ctx ? getComputedStyle(ctx).fontSize : null,
    optionCount: list.querySelectorAll('li').length,
    hasKind: !!kind,
    hasContext: !!ctx,
    markCount: list.querySelectorAll('mark').length,
    rect: { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height },
    inputRect: { top: inputRect.top, bottom: inputRect.bottom, left: inputRect.left, width: inputRect.width },
    viewport: { w: innerWidth, h: innerHeight },
    panelOverflow: panelStyle ? panelStyle.overflow : null,
    visibleAtCenter: hitInPanel,
    hitTag: hit ? hit.tagName + '.' + hit.className : null,
    listText: li ? li.innerText.replace(/\\n/g, ' | ') : null,
  }
})()`)

console.log(JSON.stringify(report, null, 2))

// Second phase: keyboard navigation.
const kb = await evaluate(`(async () => {
  const input = document.querySelector('.loc-search-input')
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
  await new Promise((r) => setTimeout(r, 200))
  const active = document.querySelector('.loc-search-list li.active')
  return {
    activeExists: !!active,
    activeText: active ? active.innerText.replace(/\\n/g, ' | ') : null,
    ariaActiveDescendant: input.getAttribute('aria-activedescendant'),
    ariaExpanded: input.getAttribute('aria-expanded'),
  }
})()`)
console.log('KEYBOARD:', JSON.stringify(kb, null, 2))

// Third phase: compare the FIXED dropdown against the ORIGINAL one to prove
// the old one was clipped by the ancestor's `overflow: hidden`.
// Open the OLD component's dropdown too. The old component closes on
// outside mousedown, so we stop it from closing by typing into it first,
// then re-open the NEW one by focusing its input again.
await evaluate(`(() => {
  const oldInput = document.querySelector('input[name="old_start_location"]')
  oldInput.focus()
  return true
})()`)
await send('Input.insertText', { text: 'Kampala' })
await delay(1200)

// Re-focus the NEW input and re-trigger it so both panels exist at once.
await evaluate(`(() => {
  const newInput = document.querySelector('.loc-search-input')
  newInput.focus()
  return true
})()`)
await delay(800)

const comparison = await evaluate(`(() => {
  const lists = [...document.querySelectorAll('.loc-search-list, .old-loc-list')]
  const out = []
  for (const list of lists) {
    const rect = list.getBoundingClientRect()
    const midX = rect.left + rect.width / 2
    const midY = rect.top + rect.height / 2
    const hit = document.elementFromPoint(midX, midY)
    const inPanel = hit ? list.contains(hit) || list === hit : false
    // Find the clipping ancestor chain.
    const clipper = (() => {
      let node = list.parentElement
      while (node && node !== document.body) {
        const ov = getComputedStyle(node).overflow
        if (ov === 'hidden' || ov === 'clip' || ov === 'auto' || ov === 'scroll') {
          const r = node.getBoundingClientRect()
          return { cls: node.className, overflow: ov, bottom: r.bottom, top: r.top }
        }
        node = node.parentElement
      }
      return null
    })()
    out.push({
      variant: list.classList.contains('old-loc-list') ? 'OLD (pre-fix)' : 'NEW (fixed)',
      position: getComputedStyle(list).position,
      parentIsBody: list.parentElement === document.body,
      listBottom: rect.bottom,
      visibleAtCenter: inPanel,
      hitTag: hit ? hit.tagName + '.' + hit.className : null,
      clipper,
      // Is the list bottom cut off by the clipper's bottom edge?
      cutOffByClipper: clipper ? rect.bottom > clipper.bottom : false,
      optionCount: list.querySelectorAll('li').length,
      nameFontSize: (() => {
        const n = list.querySelector('b, .loc-search-name')
        return n ? getComputedStyle(n).fontSize : null
      })(),
    })
  }
  return out
})()`)
console.log('COMPARISON:', JSON.stringify(comparison, null, 2))

// Fourth phase: screenshots for visual confirmation.
const shot = await send('Page.captureScreenshot', { format: 'png' })
const fs = await import('node:fs')
fs.writeFileSync('probe-new.png', Buffer.from(shot.data, 'base64'))

ws.close()
child.kill()
process.exit(0)
