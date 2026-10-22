/* Temporary: the ORIGINAL (pre-fix) LocationSearchInput, used to prove the
   old dropdown was clipped by an ancestor's `overflow: hidden`.
   Delete after verification. */
import { useEffect, useRef, useState } from 'react'
import './LocationSearchInputOld.css'

export default function LocationSearchInputOld({
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
    const shortLabel = item.label.split(',').slice(0, 2).join(',').trim()
    lastChosenRef.current = shortLabel
    emit(shortLabel)
    setItems([])
    setFocused(false)
    if (onSelect) onSelect({ lat: item.lat, lng: item.lng, label: shortLabel })
  }

  const open = focused && items.length > 0

  return (
    <div className="old-loc" ref={boxRef}>
      <input
        id={id}
        name={name}
        type="text"
        className="old-loc-input"
        placeholder={placeholder}
        value={value}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        onChange={(event) => { lastChosenRef.current = ''; emit(event.target.value) }}
        onFocus={() => setFocused(true)}
        onKeyDown={(event) => { if (event.key === 'Escape') setFocused(false) }}
      />
      {focused && busy && <span className="old-loc-busy">Searching…</span>}
      {open && (
        <ul className="old-loc-list" role="listbox">
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
