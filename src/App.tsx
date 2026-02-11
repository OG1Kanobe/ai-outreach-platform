import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'; // Add these
import { SignIn } from './pages/SignIn';
import { Dashboard } from './pages/Dashboard';
import { Layout } from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      {/* 1. Show this while checking if the user is logged in */}
      <AuthLoading>
        <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-accent-blue">
          Loading Security Protocol...
        </div>
      </AuthLoading>

      <Routes>
        {/* 2. Only show Sign In if the user is NOT logged in */}
        <Route path="/signin" element={
          <Unauthenticated>
            <SignIn />
          </Unauthenticated>
        } />

        {/* 3. Only show the App if the user IS logged in */}
        <Route path="/" element={
          <Authenticated>
            <Layout />
          </Authenticated>
        }>
          <Route index element={<Dashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


/*BYPASS AUTH WITH THIS CODE: import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignIn } from './pages/SignIn';
import { Dashboard } from './pages/Dashboard';
import { Layout } from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        { We are bypassing Auth guards so you can actually see the UI *}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
        </Route>
        
        {/* Directly accessible for testing *}
        <Route path="/signin" element={<SignIn />} />
        
        {/* Catch-all: redirect to home *}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;*/