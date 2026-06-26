import { computed, defineComponent, h, onMounted, onUnmounted, shallowRef } from 'vue'
import { clearRequestCache, getRequestCacheSnapshot, subscribeRequestCache } from '../cache'

function formatCacheValue(value: unknown) {
  if (typeof value === 'string')
    return value

  try {
    return JSON.stringify(value, null, 2)
  }
  catch {
    return String(value)
  }
}

const panelStyle = {
  position: 'fixed',
  right: '16px',
  bottom: '16px',
  zIndex: '9999',
  width: 'min(360px, calc(100vw - 32px))',
  maxHeight: 'min(70vh, 560px)',
  overflow: 'hidden',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  borderRadius: '14px',
  background: 'rgba(15, 23, 42, 0.92)',
  color: '#e2e8f0',
  boxShadow: '0 20px 48px rgba(15, 23, 42, 0.35)',
  backdropFilter: 'blur(8px)',
  fontFamily: 'Inter, system-ui, sans-serif',
} as const

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '12px 14px',
  borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
} as const

const buttonStyle = {
  cursor: 'pointer',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  borderRadius: '8px',
  padding: '6px 10px',
  background: 'rgba(30, 41, 59, 0.95)',
  color: 'inherit',
  fontSize: '12px',
} as const

const bodyStyle = {
  padding: '12px 14px',
  maxHeight: '420px',
  overflowY: 'auto',
} as const

const searchInputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: '10px',
  background: 'rgba(15, 23, 42, 0.75)',
  color: '#e2e8f0',
  outline: 'none',
  fontSize: '12px',
} as const

const controlsStyle = {
  display: 'grid',
  gap: '8px',
  marginBottom: '12px',
} as const

const selectStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: '10px',
  background: 'rgba(15, 23, 42, 0.75)',
  color: '#e2e8f0',
  outline: 'none',
  fontSize: '12px',
} as const

const badgeStyle = {
  borderRadius: '999px',
  padding: '2px 8px',
  fontSize: '12px',
  background: 'rgba(59, 130, 246, 0.18)',
  color: '#bfdbfe',
} as const

const itemStyle = {
  marginBottom: '12px',
  border: '1px solid rgba(148, 163, 184, 0.15)',
  borderRadius: '10px',
  padding: '10px',
  background: 'rgba(30, 41, 59, 0.65)',
} as const

const itemHeaderStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '8px',
  marginBottom: '6px',
} as const

const itemTitleStyle = {
  color: '#f8fafc',
  fontSize: '12px',
  fontWeight: '600',
  wordBreak: 'break-all',
  flex: '1 1 auto',
} as const

const itemActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flex: '0 0 auto',
} as const

const miniButtonStyle = {
  ...buttonStyle,
  padding: '4px 8px',
} as const

const preStyle = {
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  color: '#cbd5e1',
  fontSize: '12px',
  lineHeight: '1.5',
} as const

async function copyToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }
  return false
}

/**
 * Floating cache inspector for the built-in @yy-web/request default store.
 * Mount it anywhere in a Vue app to watch cache entries update in real time.
 */
export const RequestCacheInspector = defineComponent({
  name: 'RequestCacheInspector',
  props: {
    title: {
      type: String,
      default: 'Request Cache',
    },
  },
  setup(props) {
    const entries = shallowRef(getRequestCacheSnapshot())
    const expanded = shallowRef(true)
    const updatedAt = shallowRef(Date.now())
    const search = shallowRef('')
    const collapsedKeys = shallowRef<Record<string, boolean>>({})
    const entryUpdatedAt = shallowRef<Record<string, number>>({})
    const sortBy = shallowRef<'updated-desc' | 'updated-asc' | 'key-asc' | 'key-desc'>('updated-desc')
    const copiedKey = shallowRef<string | null>(null)
    const copiedValueKey = shallowRef<string | null>(null)

    function syncEntryTimestamps(nextEntries: typeof entries.value, timestamp = Date.now()) {
      const nextMap: Record<string, number> = {}
      for (const entry of nextEntries)
        nextMap[entry.key] = entryUpdatedAt.value[entry.key] ?? timestamp
      entryUpdatedAt.value = nextMap
    }

    function refresh() {
      const nextEntries = getRequestCacheSnapshot()
      const now = Date.now()
      entries.value = nextEntries
      syncEntryTimestamps(nextEntries, now)
      updatedAt.value = now
    }

    function clear() {
      clearRequestCache()
      refresh()
    }

    function toggle() {
      expanded.value = !expanded.value
    }

    function toggleEntry(key: string) {
      collapsedKeys.value = {
        ...collapsedKeys.value,
        [key]: !collapsedKeys.value[key],
      }
    }

    async function copyKey(key: string) {
      const copied = await copyToClipboard(key)
      copiedKey.value = copied ? key : null
      if (copied) {
        setTimeout(() => {
          if (copiedKey.value === key)
            copiedKey.value = null
        }, 1500)
      }
    }

    async function copyValue(key: string, value: unknown) {
      const copied = await copyToClipboard(formatCacheValue(value))
      copiedValueKey.value = copied ? key : null
      if (copied) {
        setTimeout(() => {
          if (copiedValueKey.value === key)
            copiedValueKey.value = null
        }, 1500)
      }
    }

    const filteredEntries = computed(() => {
      const keyword = search.value.trim().toLowerCase()
      if (!keyword)
        return entries.value

      return entries.value.filter((entry) => {
        const valueText = formatCacheValue(entry.value).toLowerCase()
        return entry.key.toLowerCase().includes(keyword) || valueText.includes(keyword)
      })
    })

    const displayEntries = computed(() => {
      return [...filteredEntries.value].sort((left, right) => {
        switch (sortBy.value) {
          case 'updated-asc':
            return (entryUpdatedAt.value[left.key] ?? 0) - (entryUpdatedAt.value[right.key] ?? 0)
          case 'key-asc':
            return left.key.localeCompare(right.key)
          case 'key-desc':
            return right.key.localeCompare(left.key)
          case 'updated-desc':
          default:
            return (entryUpdatedAt.value[right.key] ?? 0) - (entryUpdatedAt.value[left.key] ?? 0)
        }
      })
    })

    const countLabel = computed(() => `${displayEntries.value.length} entries`)
    const updatedLabel = computed(() => new Date(updatedAt.value).toLocaleTimeString())

    let stop: (() => void) | undefined

    onMounted(() => {
      refresh()
      stop = subscribeRequestCache((event) => {
        entries.value = event.entries
        if (event.type === 'set') {
          entryUpdatedAt.value = {
            ...entryUpdatedAt.value,
            [event.key]: Date.now(),
          }
        }
        else {
          entryUpdatedAt.value = {}
        }
        updatedAt.value = Date.now()
      })
    })

    onUnmounted(() => {
      stop?.()
    })

    return () => h('aside', { style: panelStyle }, [
      h('div', { style: headerStyle }, [
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          },
        }, [
          h('strong', { style: { fontSize: '14px' } }, props.title),
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#94a3b8',
              fontSize: '12px',
            },
          }, [
            h('span', { style: badgeStyle }, countLabel.value),
            h('span', `Updated ${updatedLabel.value}`),
          ]),
        ]),
        h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          },
        }, [
          h('button', { type: 'button', style: buttonStyle, onClick: refresh }, 'Refresh'),
          h('button', { type: 'button', style: buttonStyle, onClick: clear }, 'Clear'),
          h('button', { type: 'button', style: buttonStyle, onClick: toggle }, expanded.value ? 'Hide' : 'Show'),
        ]),
      ]),
      expanded.value
        ? h('div', { style: bodyStyle }, [
            h('div', { style: controlsStyle }, [
              h('input', {
                value: search.value,
                type: 'text',
                placeholder: 'Search by key or value...',
                style: searchInputStyle,
                onInput: (event: Event) => {
                  search.value = (event.target as HTMLInputElement).value
                },
              }),
              h('select', {
                value: sortBy.value,
                style: selectStyle,
                onChange: (event: Event) => {
                  sortBy.value = (event.target as HTMLSelectElement).value as typeof sortBy.value
                },
              }, [
                h('option', { value: 'updated-desc' }, 'Sort: updated (newest)'),
                h('option', { value: 'updated-asc' }, 'Sort: updated (oldest)'),
                h('option', { value: 'key-asc' }, 'Sort: key (A-Z)'),
                h('option', { value: 'key-desc' }, 'Sort: key (Z-A)'),
              ]),
            ]),
            displayEntries.value.length
              ? displayEntries.value.map(entry => h('div', {
                  key: entry.key,
                  style: itemStyle,
                }, [
                  h('div', { style: itemHeaderStyle }, [
                    h('div', { style: itemTitleStyle }, entry.key),
                    h('div', { style: itemActionsStyle }, [
                      h(
                        'button',
                        {
                          type: 'button',
                          style: miniButtonStyle,
                          onClick: () => copyKey(entry.key),
                        },
                        copiedKey.value === entry.key ? 'Copied' : 'Copy key',
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          style: miniButtonStyle,
                          onClick: () => copyValue(entry.key, entry.value),
                        },
                        copiedValueKey.value === entry.key ? 'Copied' : 'Copy value',
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          style: miniButtonStyle,
                          onClick: () => toggleEntry(entry.key),
                        },
                        collapsedKeys.value[entry.key] ? 'Expand' : 'Collapse',
                      ),
                    ]),
                  ]),
                  collapsedKeys.value[entry.key]
                    ? null
                    : h('pre', { style: preStyle }, formatCacheValue(entry.value)),
                ]))
              : h('div', {
                  style: {
                    color: '#94a3b8',
                    fontSize: '13px',
                  },
                }, search.value
                  ? 'No matching cache entries.'
                  : 'No cache entries yet. Trigger a cached request to populate the panel.'),
          ])
        : null,
    ])
  },
})

export default RequestCacheInspector
