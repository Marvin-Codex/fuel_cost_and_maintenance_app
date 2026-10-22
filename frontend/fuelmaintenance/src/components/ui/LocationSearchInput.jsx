/** Text input with place-search suggestions (OSM Nominatim via the
 *  same-origin /osm-geocode proxy).
 *
 *  - Emits synthetic events ({ target: { name, value } }) on typing so it
 *    works with existing `updateForm`-style handlers unchanged.
 *  - `onSelect({ lat, lng, label })` fires when the user picks a suggestion
 *    (used to place a pin on the map).
 *  - The suggestion panel renders in a portal on <body> and is positioned
 *    with `fixed`. It used to live inside the input's own container, where
 *    an ancestor with `overflow: hidden` (the live-trip panel) clipped the
 *    list in half — a z-index bump cannot escape an overflow clip.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './LocationSearchInput.css'

/** Nominatim caps usable results — five reads as a shortlist, not a feed. */
const MAX_RESULTS = 5

/** Friendly labels for the place types Nominatim returns. */
const KIND_LABELS = {
  city: 'City',
  town: 'Town',
  village: 'Village',
  hamlet: 'Village',
  suburb: 'Area',
  borough: 'Area',
  ward: 'Area',
  neighbourhood: 'Area',
  locality: 'Area',
  county: 'District',
  state: 'Region',
  country: 'Country',
  road: 'Road',
  residential: 'Street',
  motorway: 'Highway',
  trunk: 'Highway',
  footway: 'Path',
  path: 'Path',
  pedestrian: 'Path',
  track: 'Track',
  house: 'Building',
  building: 'Building',
  shop: 'Shop',
  amenity: 'Place',
  tourism: 'Place',
  office: 'Place',
  park: 'Place',
}

/** Human label for a suggestion's place type (falls back to the category). */
function kindLabel(item) {
  const type = String(item.type || '').toLowerCase()
  if (KIND_LABELS[type]) return KIND_LABELS[type]
  const category = String(item.category || '').toLowerCase()
  return KIND_LABELS[category] || ''
}

/** Wrap the part of `text` that matches the query in a <mark>. */
function highlightMatch(text, query) {
  const needle = String(query || '').trim()
  if (!needle) return text
  const at = text.toLowerCase().indexOf(needle.toLowerCase())
  if (at === -1) return text
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + needle.length)}</mark>
      {text.slice(at + needle.length)}
    </>
  )
}

export default function LocationSearchInput({
  name,
  value,
  onChange,
  onSelect,
  placeholder = 'Type to search a place…',
  required = false,
  id,
}) {
  const [items, setItems] = useState([])
  const [focused, setFocused] = useState(false)
  const [busy, setBusy] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [anchor, setAnchor] = useState(null)
  const boxRef = useRef(null)
  const inputRef = useRef(null)
  const panelRef = useRef(null)
  const lastChosenRef = useRef('')
  const listId = `loc-search-list-${useId().replace(/:/g, '')}`

  // Debounced place search (400ms — stays under Nominatim's 1 req/sec).
  useEffect(() => {
    const query = String(value || '').trim()
    if (query.length < 3 || query === lastChosenRef.current) {
      setItems([])
      setBusy(false)
      return undefined
    }
    setBusy(true)
    setActiveIndex(-1)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/osm-geocode/search?format=jsonv2&limit=${MAX_RESULTS}&q=${encodeURIComponent(query)}`)
        if (!res.ok) {
          setItems([])
          return
        }
        const data = await res.json()
        const found = data.map((d) => {
          const parts = String(d.display_name || '').split(',').map((part) => part.trim()).filter(Boolean)
          const primary = String(d.name || parts[0] || '').trim()
          // Nominatim repeats the primary name as the first display segment
          // (e.g. "Kampala, Kampala, Uganda") — drop that duplicate.
          const rest = parts[0] === primary ? parts.slice(1) : parts
          return {
            label: d.display_name,
            primary: primary || parts[0] || '',
            secondary: rest.join(' · '),
            kind: kindLabel(d),
            lat: Number(d.lat),
            lng: Number(d.lon),
          }
        }).filter((item) => item.primary)
        setItems(found.slice(0, MAX_RESULTS))
      } catch {
        setItems([])
      } finally {
        setBusy(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [value])

  // Close the dropdown when clicking outside the input or the portal panel.
  useEffect(() => {
    function handleClickOutside(event) {
      const target = event.target
      if (boxRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setFocused(false)
      setActiveIndex(-1)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Track the input's viewport rect so the portalled panel can be anchored
  // to it, flipping above the field when there is no room below. Driven by
  // events (focus/scroll/resize) rather than a render-time effect.
  const updateAnchor = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const flip = spaceBelow < 320 && rect.top > spaceBelow
    // The panel may be wider than a half-width form field, but never past
    // the viewport edges.
    const maxWidth = window.innerWidth - 24
    const width = Math.min(Math.max(rect.width, 280), maxWidth)
    const left = Math.min(Math.max(12, rect.left), Math.max(12, window.innerWidth - width - 12))
    setAnchor({
      left,
      width,
      placement: flip ? 'above' : 'below',
      top: flip ? undefined : rect.bottom + 4,
      bottom: flip ? window.innerHeight - rect.top + 4 : undefined,
    })
  }, [])

  // Keep the panel glued to the input while the page scrolls or resizes.
  useEffect(() => {
    if (!focused) return undefined
    window.addEventListener('scroll', updateAnchor, true)
    window.addEventListener('resize', updateAnchor)
    return () => {
      window.removeEventListener('scroll', updateAnchor, true)
      window.removeEventListener('resize', updateAnchor)
    }
  }, [focused, updateAnchor])

  function emit(text) {
    onChange({ target: { name, value: text } })
  }

  function choose(item) {
    // Short label: first two segments (street, area) keep the field readable.
    const shortLabel = item.label.split(',').slice(0, 2).join(',').trim()
    lastChosenRef.current = shortLabel
    emit(shortLabel)
    setItems([])
    setFocused(false)
    setActiveIndex(-1)
    setAnchor(null)
    if (onSelect) onSelect({ lat: item.lat, lng: item.lng, label: shortLabel })
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setFocused(false)
      setActiveIndex(-1)
      setAnchor(null)
      return
    }
    if (!items.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % items.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? items.length - 1 : index - 1))
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      choose(items[activeIndex])
    }
  }

  const open = focused && items.length > 0

  return (
    <div className="loc-search" ref={boxRef}>
      <input
        id={id}
        ref={inputRef}
        name={name}
        type="text"
        className="loc-search-input"
        placeholder={placeholder}
        value={value}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        onChange={(event) => { lastChosenRef.current = ''; emit(event.target.value) }}
        onFocus={() => { setFocused(true); updateAnchor() }}
        onKeyDown={handleKeyDown}
      />
      {focused && busy && <span className="loc-search-busy">Searching…</span>}
      {open && anchor && createPortal(
        <ul
          className={`loc-search-list loc-search-list--${anchor.placement}`}
          role="listbox"
          id={listId}
          ref={panelRef}
          style={{ left: anchor.left, top: anchor.top, bottom: anchor.bottom, width: anchor.width }}
        >
          {items.map((item, index) => (
            <li
              key={`${item.lat}-${item.lng}-${index}`}
              role="option"
              id={`${listId}-${index}`}
              aria-selected={index === activeIndex}
              className={index === activeIndex ? 'active' : ''}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(item)}
            >
              <span className="loc-search-name">
                {highlightMatch(item.primary, value)}
              </span>
              {item.kind && <span className="loc-search-kind">{item.kind}</span>}
              {item.secondary && (
                <span className="loc-search-context">{highlightMatch(item.secondary, value)}</span>
              )}
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </div>
  )
}