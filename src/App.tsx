import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react';
import { SignIn } from './pages/SignIn';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads'; // Import your actual files
import { EmailReview } from './pages/EmailReview';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Layout } from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <AuthLoading>
        <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-accent-blue">
          Loading Security Protocol...
        </div>
      </AuthLoading>

      <Routes>
        <Route path="/signin" element={
          <>
            <Unauthenticated><SignIn /></Unauthenticated>
            <Authenticated><Navigate to="/" replace /></Authenticated>
          </>
        } />

        {/* This is the heart of your navigation */}
        <Route path="/" element={
          <Authenticated>
            <Layout />
          </Authenticated>
        }>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="emails" element={<EmailReview />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;