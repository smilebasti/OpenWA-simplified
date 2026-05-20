import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import { RoleProvider, useRole, type UserRole } from './hooks/useRole';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Sessions = lazy(() => import('./pages/Sessions').then(m => ({ default: m.Sessions })));
const ApiKeys = lazy(() => import('./pages/ApiKeys').then(m => ({ default: m.ApiKeys })));
const MessageTester = lazy(() => import('./pages/MessageTester').then(m => ({ default: m.MessageTester })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

function AppContent() {
  const savedKey = sessionStorage.getItem('openwa_api_key');
  const [isAuthenticated, setIsAuthenticated] = useState(!!savedKey);
  const [, setApiKey] = useState(savedKey || '');
  const { setRole, role } = useRole();

  const handleLogin = async (key: string) => {
    setApiKey(key);
    sessionStorage.setItem('openwa_api_key', key);

    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'X-API-Key': key },
      });
      if (response.ok) {
        const data = await response.json();
        setRole(data.role as UserRole);
      }
    } catch {
      setRole('viewer');
    }

    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setApiKey('');
    setIsAuthenticated(false);
    setRole(null);
    sessionStorage.removeItem('openwa_api_key');
  };

  useEffect(() => {
    if (!savedKey) return;

    fetch('/api/auth/validate', {
      method: 'POST',
      headers: { 'X-API-Key': savedKey },
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid && data.role) {
          setRole(data.role as UserRole);
        }
      })
      .catch(() => {});
  }, [savedKey, setRole]);

  const loadingFallback = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Loader2 className="animate-spin" size={32} />
    </div>
  );

  if (!isAuthenticated) {
    return <Suspense fallback={loadingFallback}><Login onLogin={handleLogin} /></Suspense>;
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={loadingFallback}>
          <Routes>
            <Route path="/" element={<Layout onLogout={handleLogout} userRole={role} />}>
              <Route index element={<Sessions />} />
              <Route path="sessions" element={<Sessions />} />
              {role === 'admin' && <Route path="api-keys" element={<ApiKeys />} />}
              <Route path="message-tester" element={<MessageTester />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RoleProvider>
          <AppContent />
        </RoleProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
