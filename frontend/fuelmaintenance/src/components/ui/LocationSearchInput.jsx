/** Text input with place-search suggestions (OSM Nominatim via the
 *  same-origin /osm-geocode proxy).
 *
 *  - Emits synthetic events ({ target: { name, value } }) on typing so it
 *    works with existing `updateForm`-style handlers unchanged.
 *  - `onSelect({ lat, lng, label })` fires when the user picks a suggestion
 *    (used to place a pin on the map).
 */
import { useEffect, useRef, useState } from 'react'
import './LocationSearchInput.css'

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
  const boxRef = useRef(null)
  const lastChosenRef = useRef('')

  // Debounced place search (400ms — stays under Nominatim's 1 req/sec).
  useEffect(() => {
    const query = String(value || '').trim()
    if (query.length < 3 || query === lastChosenRef.current) {
      setItems([])
      setBusy(false)
      return undefined
    }
    setBusy(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/osm-geocode/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`)
        if (!res.ok) {
          setItems([])
          return
        }
        const data = await res.json()
        const found = data.map((d) => ({
          label: d.display_name,
          lat: Number(d.lat),
          lng: Number(d.lon),
        }))
        setItems(found)
      } catch {
        setItems([])
      } finally {
        setBusy(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [value])

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function handleClickOutside(event) {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    if (onSelect) onSelect({ lat: item.lat, lng: item.lng, label: shortLabel })
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') setFocused(false)
  }

  const open = focused && items.length > 0

  return (
    <div className="loc-search" ref={boxRef}>
      <input
        id={id}
        name={name}
        type="text"
        className="loc-search-input"
        placeholder={placeholder}
        value={value}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        onChange={(event) => { lastChosenRef.current = ''; emit(event.target.value) }}
        onFocus={() => setFocused(true)}
        onKeyDown={handleKeyDown}
      />
      {focused && busy && <span className="loc-search-busy">Searching…</span>}
      {open && (
        <ul className="loc-search-list" role="listbox">
          {items.map((item, index) => (
            <li key={`${item.lat}-${item.lng}-${index}`} role="option" tabIndex={0}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(item)}
                onKeyDown={(e) => { if (e.key === 'Enter') choose(item) }}>
              <b>{item.label.split(',')[0]}</b>
              <span>{item.label.split(',').slice(1).join(',').trim()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}