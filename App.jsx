import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { authenticate, loadState, saveState, STORAGE_KEY } from './data.js';
import { LoginScreen, WelcomeScreen } from './Auth.jsx';
import Workspace from './Workspace.jsx';

export default function App() {
  const [phase, setPhase] = useState('welcome');
  const [role, setRole] = useState('user');
  const [session, setSession] = useState(null);
  const [state, setState] = useState(loadState);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    function receiveLiveState(event) {
      if (event.key === STORAGE_KEY && event.newValue) setState(loadState());
    }
    window.addEventListener('storage', receiveLiveState);
    return () => window.removeEventListener('storage', receiveLiveState);
  }, []);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  useEffect(() => {
    const dark = state.settings.theme === 'dark' || (state.settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [state.settings.theme]);

  function login(email, password) {
    const account = authenticate(state.accounts, role, email, password);
    setSession(account);
    setPhase('workspace');
  }

  function logout() {
    setSession(null);
    setPhase('login');
  }

  return (
    <div className="app-root">
      {!online && (
        <div className="offline-bar" role="alert">
          <WifiOff size={17} /> Internet connection required. Scanning and pass changes are paused.
        </div>
      )}
      {phase === 'welcome' && <WelcomeScreen onContinue={() => setPhase('login')} />}
      {phase === 'login' && <LoginScreen role={role} setRole={setRole} onLogin={login} onBack={() => setPhase('welcome')} />}
      {phase === 'workspace' && session && (
        <Workspace session={session} state={state} setState={setState} online={online} onLogout={logout} />
      )}
    </div>
  );
}
