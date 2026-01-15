
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/Layout/Layout';

// Pages
import DashboardPage from './pages/DashboardPage';
import ImportPage from './pages/ImportPage';
import ClientsPage from './pages/ClientsPage';
import ReturnsPage from './pages/ReturnsPage';
import SettingsPage from './pages/SettingsPage';
import { LandingPage } from './pages/LandingPage';

// Correction: I need to know if Import/Clients/Returns are named or default.
// ImportPage.tsx: export const ImportPage ... export default ImportPage; (It has both usually or one. line 239 says export default ImportPage)
// ClientsPage.tsx: export const ClientsPage ... export default ClientsPage;
// ReturnsPage.tsx: export const ReturnsPage ... (no default at end?)
// DashboardPage.tsx: export const DashboardPage ... (I need to check)
// To be safe, I will import them as they were usage in App.tsx before? No, previously ImportPage was default.
// Let's standardise or be careful.

// Previous App.tsx:
// import DashboardPage from './pages/DashboardPage';
// import ImportPage from './pages/ImportPage';
// ...

// I'll check ImportPage.tsx again?
// Step 146: export const ImportPage ... export default ImportPage; (It has both)
// Step 165: ClientsPage ... export default ClientsPage; (Both)
// Step 156-ish?
// I'll just use the existing default exports where available.

function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Protected App Routes */}
          <Route path="/app" element={<Layout />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="clientes" element={<ClientsPage />} />
            <Route path="devoluciones" element={<ReturnsPage />} />
            <Route path="ajustes" element={<SettingsPage />} />
            {/* Redirect unknown inner routes to dashboard */}
            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DataProvider>
    </BrowserRouter>
  );
}

export default App;
