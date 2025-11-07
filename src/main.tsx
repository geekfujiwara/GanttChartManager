import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import { TestPage } from './pages/TestPage.tsx'
import PowerProvider from './PowerProvider.tsx'
import './index.css'

// URLパラメータでテストページを表示
const urlParams = new URLSearchParams(window.location.search);
const showTestPage = urlParams.get('test') === 'systemusers';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PowerProvider>
      {showTestPage ? <TestPage /> : <App />}
    </PowerProvider>
  </StrictMode>,
)