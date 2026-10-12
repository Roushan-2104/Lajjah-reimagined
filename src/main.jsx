import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

const Lab = lazy(() => import('./Lab.jsx'))
if (location.search.includes('capture')) document.documentElement.classList.add('capture')
const isLab = import.meta.env.DEV && location.hash === '#lab'

createRoot(document.getElementById('root')).render(
  <StrictMode>{isLab ? <Suspense fallback={null}><Lab /></Suspense> : <App />}</StrictMode>
)
