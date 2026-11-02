import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './lib/auth'
import { CACHE_BUSTER, CACHE_MAX_AGE, persister, queryClient, shouldPersist } from './lib/queryClient'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: CACHE_MAX_AGE,
          buster: CACHE_BUSTER,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => query.state.status === 'success' && shouldPersist(query.queryKey),
          },
        }}
      >
        {/* GitHub Pages는 서버 리라이트가 없어서 주소에 #을 쓰는 HashRouter를 쓴다. */}
        <HashRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </HashRouter>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
