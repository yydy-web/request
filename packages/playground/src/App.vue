<script setup lang="ts">
import { clearRequestCache, RequestCacheInspector } from '@yy-web/request-tools'
import { computed, reactive, ref } from 'vue'
import { axiosRequest, fetchRequest, limitedRequest } from './request'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface LogEntry {
  id: number
  method: Method
  chain: string
  transport: string
  status: 'pending' | 'ok' | 'error'
  detail?: string
  ms?: number
  at: string
}

const transport = ref<'axios' | 'fetch'>('axios')
const current = computed(() => (transport.value === 'axios' ? axiosRequest : fetchRequest))
const c = () => current.value

const logs = ref<LogEntry[]>([])
const fileInput = ref<HTMLInputElement>()
let seq = 0

function format(value: unknown) {
  if (value == null)
    return String(value)
  if (typeof value === 'string')
    return value
  try {
    return JSON.stringify(value, null, 2)
  }
  catch {
    return String(value)
  }
}

async function run(method: Method, chain: string, fn: () => Promise<unknown>) {
  const entry = reactive<LogEntry>({
    id: ++seq,
    method,
    chain,
    transport: transport.value,
    status: 'pending',
    at: new Date().toLocaleTimeString(),
  })
  logs.value.unshift(entry)
  const start = performance.now()
  try {
    entry.detail = format(await fn())
    entry.status = 'ok'
  }
  catch (error: any) {
    entry.detail = error?.message ? String(error.message) : format(error)
    entry.status = 'error'
  }
  finally {
    entry.ms = Math.round(performance.now() - start)
  }
}

function pickFile(): File {
  const picked = fileInput.value?.files?.[0]
  if (picked)
    return picked
  return new File([new Blob(['playground file content'])], 'playground.txt', { type: 'text/plain' })
}

interface Action { label: string, method: Method, chain: string, fn: () => void }
interface Group { title: string, hint: string, actions: Action[] }

const groups = computed<Group[]>(() => [
  {
    title: 'Read',
    hint: 'GET in every shape',
    actions: [
      { label: 'plain', method: 'GET', chain: `setPath('/api/info').get()`, fn: () => run('GET', `setPath('/api/info').get()`, () => c().setPath('/api/info').get()) },
      { label: 'params', method: 'GET', chain: `.get({ id: 1, role: 'admin' })`, fn: () => run('GET', `setPath('/api/user').get({ id: 1, role: 'admin' })`, () => c().setPath('/api/user').get({ id: 1, role: 'admin' })) },
      { label: 'carry', method: 'GET', chain: `setPath('/api/user/{id}').carry(42).get()`, fn: () => run('GET', `setPath('/api/user/{id}').carry(42).get()`, () => c().setPath('/api/user/{id}').carry(42).get()) },
      { label: 'dataCallback', method: 'GET', chain: `.get({ id: 7 }, false, transform)`, fn: () => run('GET', `setPath('/api/user').get({ id: 7 }, false, transform)`, () => c().setPath('/api/user').get({ id: 7 }, false, (d: any) => ({ wrapped: d }))) },
    ],
  },
  {
    title: 'Write',
    hint: 'mutations & files',
    actions: [
      { label: 'post', method: 'POST', chain: `setPath('/api/user').post({ name: 'ada' })`, fn: () => run('POST', `setPath('/api/user').post({ name: 'ada' })`, () => c().setPath('/api/user').post({ name: 'ada' })) },
      { label: 'put', method: 'PUT', chain: `.carry(42).put({ name: 'lin' })`, fn: () => run('PUT', `setPath('/api/user/{id}').carry(42).put({ name: 'lin' })`, () => c().setPath('/api/user/{id}').carry(42).put({ name: 'lin' })) },
      { label: 'del', method: 'DELETE', chain: `setPath('/api/user/{id}').carry(42).del()`, fn: () => run('DELETE', `setPath('/api/user/{id}').carry(42).del()`, () => c().setPath('/api/user/{id}').carry(42).del()) },
      { label: 'upload', method: 'POST', chain: `setPath('/api/upload').upload(file)`, fn: () => run('POST', `setPath('/api/upload').upload(file, { source })`, () => c().setPath('/api/upload').upload(pickFile(), { source: 'playground' })) },
      { label: 'downLoad', method: 'GET', chain: `setPath('/api/download').downLoad()`, fn: () => run('GET', `setPath('/api/download').downLoad()`, () => c().setPath('/api/download').downLoad()) },
    ],
  },
  {
    title: 'Cache & flow',
    hint: 'caching, dedup, limits',
    actions: [
      { label: 'cached', method: 'GET', chain: `setPath('/api/info').get(true)`, fn: () => run('GET', `setPath('/api/info').get(true)`, () => c().setPath('/api/info').get(true)) },
      { label: 'dedup ×5', method: 'GET', chain: `5 concurrent .get(true) → 1 request`, fn: dedup },
      { label: 'limit 2', method: 'GET', chain: `6 requests · maxConcurrentNum: 2`, fn: concurrency },
      { label: 'cancelRepeat', method: 'GET', chain: `.forceCancelRepeat().get() ×2`, fn: cancelRepeat },
      { label: 'error 500', method: 'GET', chain: `setPath('/api/error').get()`, fn: () => run('GET', `setPath('/api/error').get()`, () => c().setPath('/api/error').get()) },
      { label: 'fill cache', method: 'GET', chain: `50 cached .get(true)`, fn: fillCache },
    ],
  },
])

function dedup() {
  return run('GET', '5× concurrent setPath(\'/api/info\').get(true)', async () => {
    clearRequestCache()
    const results = await Promise.all(
      Array.from({ length: 5 }, () => c().setPath('/api/info?delay=300').get(true)),
    )
    return `${results.length} callers · 1 network request`
  })
}

function concurrency() {
  return run('GET', '6 requests · maxConcurrentNum: 2', async () => {
    const start = performance.now()
    await Promise.all(
      Array.from({ length: 6 }, (_, i) => limitedRequest.setPath(`/api/info?delay=300&i=${i}`).get()),
    )
    return `drained in ${Math.round(performance.now() - start)}ms · 3 waves of 2`
  })
}

function cancelRepeat() {
  return run('GET', 'forceCancelRepeat() ×2 → first aborted', async () => {
    const first = c().setPath('/api/info?delay=600').forceCancelRepeat().get()
    const second = c().setPath('/api/info?delay=600').forceCancelRepeat().get()
    const [a, b] = await Promise.allSettled([first, second])
    return `first: ${a.status} · second: ${b.status}`
  })
}

function fillCache() {
  return run('GET', '50× setPath(`/api/user?id=n`).get(true)', async () => {
    await Promise.all(
      Array.from({ length: 50 }, (_, i) => c().setPath(`/api/user?id=${i}`).get(true)),
    )
    return 'populated 50 cache entries'
  })
}

function clearLogs() {
  logs.value = []
}

// --- telemetry ------------------------------------------------------------
const settled = computed(() => logs.value.filter(l => l.status !== 'pending' && l.ms != null))
const okCount = computed(() => settled.value.filter(l => l.status === 'ok').length)
const errCount = computed(() => settled.value.filter(l => l.status === 'error').length)
const avgMs = computed(() => {
  if (!settled.value.length)
    return 0
  return Math.round(settled.value.reduce((sum, l) => sum + (l.ms || 0), 0) / settled.value.length)
})
const maxMs = computed(() => Math.max(400, ...settled.value.map(l => l.ms || 0)))
function meterPct(ms?: number) {
  if (ms == null)
    return 0
  return Math.min(100, Math.round((ms / maxMs.value) * 100))
}
</script>

<template>
  <div class="bench">
    <header class="masthead">
      <div class="grid-bg" aria-hidden="true" />
      <div class="mast-top">
        <div class="brand">
          <span class="mark">⌁</span>
          <div>
            <h1>@yy-web/request</h1>
            <p>request bench — fire every capability, read the wire</p>
          </div>
        </div>
        <label class="transport" :data-on="transport">
          <span class="t-label">transport</span>
          <span class="t-track" role="group">
            <button :class="{ on: transport === 'axios' }" @click="transport = 'axios'">axios</button>
            <button :class="{ on: transport === 'fetch' }" @click="transport = 'fetch'">fetch</button>
          </span>
        </label>
      </div>

      <code class="thesis">
        <span class="kw">request</span>.<span class="fn">setPath</span>(<span class="str">'/api/user/{id}'</span>).<span class="fn">carry</span>(<span class="num">42</span>).<span class="fn">get</span>()
      </code>

      <dl class="telemetry">
        <div><dt>requests</dt><dd>{{ logs.length }}</dd></div>
        <div class="ok"><dt>ok</dt><dd>{{ okCount }}</dd></div>
        <div class="err"><dt>errors</dt><dd>{{ errCount }}</dd></div>
        <div><dt>avg latency</dt><dd>{{ avgMs }}<small>ms</small></dd></div>
      </dl>
    </header>

    <div class="bench-grid">
      <aside class="console">
        <section v-for="group in groups" :key="group.title" class="panel">
          <header class="panel-head">
            <h2>{{ group.title }}</h2>
            <span>{{ group.hint }}</span>
          </header>
          <div class="keys">
            <button
              v-for="action in group.actions"
              :key="action.label"
              class="key"
              :data-method="action.method"
              :title="action.chain"
              @click="action.fn"
            >
              <span class="k-method">{{ action.method }}</span>
              <span class="k-label">{{ action.label }}</span>
            </button>
          </div>
        </section>

        <section class="panel">
          <header class="panel-head">
            <h2>Upload</h2>
            <span>optional file</span>
          </header>
          <input ref="fileInput" type="file" class="file">
          <p class="note">No file selected → a generated <code>playground.txt</code> is sent.</p>
        </section>
      </aside>

      <section class="wire">
        <header class="wire-head">
          <h2>Wire</h2>
          <span class="legend">
            <i class="dot ok" /> ok
            <i class="dot err" /> error
            <i class="dot pend" /> in&#8202;flight
          </span>
          <button class="clear" @click="clearLogs">clear</button>
        </header>

        <ol class="lanes">
          <li v-for="entry in logs" :key="entry.id" class="lane" :class="entry.status" :data-method="entry.method">
            <span class="l-method">{{ entry.method }}</span>
            <code class="l-chain">{{ entry.chain }}</code>
            <span class="l-meter">
              <span class="track">
                <span class="fill" :class="{ live: entry.status === 'pending' }" :style="{ width: `${meterPct(entry.ms)}%` }" />
              </span>
              <span class="ms">{{ entry.ms != null ? `${entry.ms}ms` : '···' }}</span>
            </span>
            <span class="l-tx">{{ entry.transport }}</span>
            <pre v-if="entry.detail" class="l-detail">{{ entry.detail }}</pre>
          </li>
          <li v-if="!logs.length" class="lane empty">
            Idle. Trigger an action on the left to trace it here.
          </li>
        </ol>
      </section>
    </div>

    <RequestCacheInspector />
  </div>
</template>

<style scoped>
.bench {
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 24px 96px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* ---- masthead ---------------------------------------------------------- */
.masthead {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-lg);
  padding: 26px 26px 22px;
  background:
    radial-gradient(120% 140% at 100% 0%, rgba(185, 140, 255, 0.16), transparent 55%),
    linear-gradient(180deg, var(--ink-3), var(--ink-2));
}

.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--line) 1px, transparent 1px),
    linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: radial-gradient(120% 120% at 100% 0%, #000 10%, transparent 70%);
  pointer-events: none;
}

.mast-top {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  gap: 14px;
  align-items: center;
}

.mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 22px;
  color: var(--ink);
  background: var(--brand);
  box-shadow: 0 8px 28px rgba(185, 140, 255, 0.4);
}

.brand h1 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
}

.brand p {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.transport {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.t-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--faint);
}

.t-track {
  display: inline-flex;
  padding: 4px;
  gap: 4px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  background: rgba(0, 0, 0, 0.28);
}

.t-track button {
  border: none;
  cursor: pointer;
  padding: 6px 16px;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  transition: color 0.15s, background 0.15s;
}

.t-track button.on {
  background: var(--brand);
  color: var(--ink);
  font-weight: 600;
}

.thesis {
  position: relative;
  display: block;
  margin-top: 22px;
  font-family: var(--font-mono);
  font-size: clamp(0.95rem, 2.6vw, 1.45rem);
  letter-spacing: -0.01em;
  color: var(--text);
}

.thesis .kw { color: var(--brand); }
.thesis .fn { color: var(--get); }
.thesis .str { color: var(--put); }
.thesis .num { color: var(--post); }

.telemetry {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
  margin: 22px 0 0;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}

.telemetry div {
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
}

.telemetry dt {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--faint);
}

.telemetry dd {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.6rem;
  line-height: 1;
}

.telemetry dd small {
  font-size: 0.8rem;
  color: var(--muted);
  margin-left: 2px;
}

.telemetry .ok dd { color: var(--get); }
.telemetry .err dd { color: var(--del); }

/* ---- layout ------------------------------------------------------------ */
.bench-grid {
  display: grid;
  grid-template-columns: minmax(260px, 340px) 1fr;
  gap: 22px;
  align-items: start;
}

.console {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--ink-2);
  padding: 16px;
}

.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-head h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
}

.panel-head span {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  color: var(--faint);
}

.keys {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.key {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 7px 12px 7px 8px;
  border-radius: 10px;
  border: 1px solid var(--line-strong);
  background: var(--ink-3);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 0.84rem;
  transition: transform 0.08s, border-color 0.15s, box-shadow 0.15s;
}

.key:hover {
  border-color: var(--m, var(--brand));
  box-shadow: inset 0 0 0 1px var(--m, var(--brand));
}

.key:active {
  transform: translateY(1px);
}

.k-method {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 2px 5px;
  border-radius: 5px;
  color: var(--ink);
  background: var(--m, var(--brand));
}

.key[data-method='GET'] { --m: var(--get); }
.key[data-method='POST'] { --m: var(--post); }
.key[data-method='PUT'] { --m: var(--put); }
.key[data-method='DELETE'] { --m: var(--del); }

.file {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--muted);
}

.file::file-selector-button {
  margin-right: 10px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--line-strong);
  background: var(--ink-3);
  color: var(--text);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.76rem;
}

.note {
  margin: 12px 0 0;
  font-size: 0.76rem;
  color: var(--muted);
  line-height: 1.5;
}

.note code {
  font-family: var(--font-mono);
  color: var(--brand);
}

/* ---- wire log (signature) --------------------------------------------- */
.wire {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: linear-gradient(180deg, var(--ink-2), var(--ink));
  overflow: hidden;
  min-height: 420px;
}

.wire-head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--line);
}

.wire-head h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
}

.legend {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--muted);
}

.legend .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  display: inline-block;
}

.dot.ok { background: var(--get); }
.dot.err { background: var(--del); }
.dot.pend { background: var(--put); }

.clear {
  margin-left: auto;
  cursor: pointer;
  border: 1px solid var(--line-strong);
  background: transparent;
  color: var(--muted);
  border-radius: 8px;
  padding: 5px 12px;
  font-family: var(--font-mono);
  font-size: 0.74rem;
}

.lanes {
  list-style: none;
  margin: 0;
  padding: 6px;
  max-height: 560px;
  overflow-y: auto;
}

.lane {
  display: grid;
  grid-template-columns: 58px 1fr 150px 52px;
  align-items: center;
  gap: 14px;
  padding: 11px 12px;
  border-radius: 10px;
  border-left: 2px solid transparent;
}

.lane:nth-child(odd) {
  background: rgba(236, 233, 244, 0.025);
}

.lane.ok { border-left-color: var(--get); }
.lane.error { border-left-color: var(--del); }
.lane.pending { border-left-color: var(--put); }

.l-method {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 700;
  text-align: center;
  padding: 3px 0;
  border-radius: 5px;
  color: var(--ink);
  background: var(--lm, var(--muted));
}

.lane[data-method='GET'] { --lm: var(--get); }
.lane[data-method='POST'] { --lm: var(--post); }
.lane[data-method='PUT'] { --lm: var(--put); }
.lane[data-method='DELETE'] { --lm: var(--del); }

.l-chain {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.l-meter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.track {
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: rgba(236, 233, 244, 0.08);
  overflow: hidden;
}

.fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--lm, var(--brand));
  transition: width 0.3s ease;
}

.fill.live {
  width: 40% !important;
  background: linear-gradient(90deg, transparent, var(--put), transparent);
  animation: sweep 1.1s linear infinite;
}

.ms {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--muted);
  min-width: 42px;
  text-align: right;
}

.l-tx {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  color: var(--faint);
  text-align: right;
}

.l-detail {
  grid-column: 1 / -1;
  margin: 10px 0 2px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.32);
  border: 1px solid var(--line);
  color: #cdc8dd;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow: auto;
}

.lane.empty {
  display: block;
  text-align: center;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 0.82rem;
  padding: 60px 12px;
}

@keyframes sweep {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(320%); }
}

/* ---- responsive -------------------------------------------------------- */
@media (max-width: 860px) {
  .bench-grid {
    grid-template-columns: 1fr;
  }
  .lane {
    grid-template-columns: 50px 1fr;
    grid-template-areas:
      'method chain'
      'meter meter'
      'detail detail';
  }
  .l-method { grid-area: method; }
  .l-chain { grid-area: chain; }
  .l-meter { grid-area: meter; }
  .l-tx { display: none; }
  .l-detail { grid-area: detail; }
}

@media (prefers-reduced-motion: reduce) {
  .fill,
  .fill.live {
    transition: none;
    animation: none;
  }
}
</style>
