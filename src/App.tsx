import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthActions } from '@convex-dev/auth/react';
import { Authenticated, Unauthenticated } from 'convex/react';
import { SignIn } from './pages/SignIn';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { EmailReview } from './pages/EmailReview';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Layout } from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/signin" element={
          <Unauthenticated>
            <SignIn />
          </Unauthenticated>
        } />

        {/* Protected routes */}
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

        {/* Redirect to signin if not authenticated */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
