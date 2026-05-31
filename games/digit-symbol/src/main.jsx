import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import DigitSymbolGame from './DigitSymbolGame.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DigitSymbolGame />
  </StrictMode>,
)