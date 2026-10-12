import { useState } from 'react'
import { Hero } from './components/Hero.jsx'
import { Story } from './components/Story.jsx'
import { Shop } from './components/Shop.jsx'
import { GlassCTA } from './components/GlassCTA.jsx'
import { insta, IG_URL } from './data.js'

const IMG = import.meta.env.BASE_URL + 'img/'

function Nav({ count }) {
  return (
    <nav className="nav" aria-label="Main">
      <a href="#top" className="nav-logo" aria-label="Lajjha home">
        <img src={`${IMG}logo-ivory.svg`} alt="" width="74" height="49" />
      </a>
      <ul className="nav-links label">
        <li><a href="#shop">Shop</a></li>
        <li><a href="#story">Story</a></li>
        <li><a href="#care">Care &amp; delivery</a></li>
      </ul>
      <a href="#shop" className="nav-bag label" aria-label={`Bag, ${count} items`}>Bag <span>{count}</span></a>
    </nav>
  )
}

function Instagram() {
  return (
    <section className="ig" aria-labelledby="ig-title">
      <div className="ig-head">
        <div>
          <p className="dev ig-dev" lang="hi">मख़मल पर</p>
          <h2 className="display ig-title" id="ig-title">On the velvet</h2>
        </div>
        <a className="label link" href={IG_URL} target="_blank" rel="noreferrer">@lajjhaofficial ↗</a>
      </div>
      <ul className="ig-grid">
        {insta.map(p => (
          <li key={p.img}>
            <img src={`${IMG}${p.img}.webp`} alt={p.caption} loading="lazy" decoding="async" />
            <p className="label ig-cap">{p.caption}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

const CARE = [
  ['हस्तनिर्मित', 'Handmade in Siliguri', 'Every piece is cut, chased, oxidised and strung in one studio in West Bengal.'],
  ['नकद', 'Cash on delivery', 'Pay at your door, or online by UPI and cards at checkout.'],
  ['बदलाव', '7-day exchange', 'Not right? Tell us within 7 days of delivery and we arrange a pickup.'],
  ['देखभाल', 'Caring for oxidised silver', 'Keep it dry, store it in the pouch, wipe with a soft cloth. The black is meant to stay.'],
]

const CTA_ITEMS = [
  { label: 'Shop the drop', href: '#shop' },
  { label: 'Join the secret drop', href: IG_URL },
]

function Closer() {
  return (
    <section className="closer" id="care" aria-labelledby="care-title">
      <h2 className="sr-only" id="care-title">Care and delivery</h2>
      <ul className="care">
        {CARE.map(([hi, t, d]) => (
          <li key={t}><p className="dev care-dev" lang="hi">{hi}</p><h3 className="care-t">{t}</h3><p>{d}</p></li>
        ))}
      </ul>
      <div className="cta-stage">
        <div className="cta-photos" aria-hidden="true">
          {['ig-bangla', 'ig-vira', 'ig-peacock', 'ig-rani'].map(id => <img key={id} src={`${IMG}${id}.webp`} alt="" />)}
        </div>
        <p className="cta-line"><span className="dev" lang="hi">लज्जा</span> <span className="display">means shy.<br />The silver didn’t get the memo.</span></p>
        <GlassCTA items={CTA_ITEMS} />
      </div>
      <footer className="footer label">
        <img src={`${IMG}logo-ivory.svg`} alt="Lajjha" width="64" height="42" />
        <span>German silver · Brass · 92.5 · Jadau</span>
        <span>Siliguri → India</span>
        <span>© 2026 Lajjha · Draft v0.4, not a live store</span>
      </footer>
    </section>
  )
}

export default function App() {
  const [bag, setBag] = useState([])
  const toggle = no => setBag(b => (b.includes(no) ? b.filter(x => x !== no) : [...b, no]))
  return (
    <div className="page">
      <a className="skip label" href="#shop">Skip to shop</a>
      <Nav count={bag.length} />
      <main>
        <Hero />
        <Story />
        <Shop bag={bag} onToggle={toggle} />
        <Instagram />
        <Closer />
      </main>
    </div>
  )
}
