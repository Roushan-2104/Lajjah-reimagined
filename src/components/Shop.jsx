import { useState } from 'react'
import { archive, inr } from '../data.js'
import { Viewer3D } from './Viewer3D.jsx'

const IMG = import.meta.env.BASE_URL + 'img/'
const FILTERS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'gs', label: 'German silver', test: p => p.metal.startsWith('German') },
  { id: 'ss', label: '92.5 sterling', test: p => p.metal.startsWith('92.5') },
  { id: '3d', label: 'In 3D', test: p => !!p.model },
]

export function Shop({ bag, onToggle }) {
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState(null)
  const items = archive.filter(FILTERS.find(f => f.id === filter).test)
  return (
    <section className="shop" id="shop" aria-labelledby="shop-title">
      <header className="shop-head">
        <div>
          <p className="dev shop-dev" lang="hi">संग्रह</p>
          <h2 className="display shop-title" id="shop-title">The drop</h2>
          <p className="shop-sub">Eleven pieces, made in small batches. Prices include taxes. Pieces marked 3D can be turned in your hand.</p>
        </div>
        <div className="chips" role="group" aria-label="Filter">
          {FILTERS.map(f => (
            <button key={f.id} type="button" className="chip label" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
      </header>

      <ul className="grid">
        {items.map(p => {
          const inBag = bag.includes(p.no)
          return (
            <li key={p.no} className="card">
              <div className="card-img">
                <img src={`${IMG}${p.img}-card.webp`} alt={`${p.name}, ${p.metal.toLowerCase()} ${p.kind.toLowerCase()}`} loading="lazy" decoding="async" width="720" height="900" />
                {p.model && <button type="button" className="card-3d label" onClick={() => setView(p.model)}>View in 3D</button>}
              </div>
              <div className="card-body">
                <p className="card-hi dev" lang="hi">{p.hi}</p>
                <h3 className="card-name">{p.name}</h3>
                <p className="card-meta">{p.metal} · {p.kind}</p>
                <div className="card-buy">
                  <span className="card-price">{inr(p.price)}</span>
                  <button type="button" className={'btn-add label' + (inBag ? ' is-in' : '')} onClick={() => onToggle(p.no)} aria-pressed={inBag}>
                    {inBag ? 'In bag ✓' : 'Add to bag'}
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <Viewer3D id={view} onClose={() => setView(null)} />
    </section>
  )
}
