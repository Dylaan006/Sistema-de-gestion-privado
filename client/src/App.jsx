import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Products from './pages/Products';
import StockMovements from './pages/StockMovements';
import POS from './pages/POS';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Clients from './pages/Clients';
import OrganizationSettings from './pages/OrganizationSettings';
import Users from './pages/Users';

// ... inside Routes (Removing stray comment/code)

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="stock-history" element={<StockMovements />} />
        <Route path="sales" element={<Sales />} />
        <Route path="pos" element={<POS />} />
        <Route path="clients" element={<Clients />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<OrganizationSettings />} />
      </Route>
    </Routes>
  );
}
