import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import EmotionRecognitionGame from './EmotionRecognitionGame.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EmotionRecognitionGame />
  </StrictMode>,
)
