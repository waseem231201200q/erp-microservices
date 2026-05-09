import { Routes, Route, NavLink } from "react-router-dom";
import { useMemo, useState } from "react";
import CustomersPage from "./pages/CustomersPage";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import InvoicesPage from "./pages/InvoicesPage";
import DashboardPage from "./pages/DashboardPage";
import ProcurementPage from "./pages/ProcurementPage";
import LoginPage from "./pages/LoginPage";

const navClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

export default function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("erp_token");
    const userRaw = localStorage.getItem("erp_user");
    return token && userRaw ? { token, user: JSON.parse(userRaw) } : null;
  });

  const onLogin = (payload) => {
    localStorage.setItem("erp_token", payload.token);
    localStorage.setItem("erp_user", JSON.stringify(payload.user));
    setAuth(payload);
  };

  const onLogout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    setAuth(null);
  };

  const userRole = useMemo(() => auth?.user?.role || "", [auth]);

  if (!auth) {
    return <LoginPage onLogin={onLogin} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo" aria-hidden="true">
            ERP
          </span>
          <div className="sidebar-brand-text">
            <h1>Distribution</h1>
            <span className="sidebar-tagline">Operations console</span>
          </div>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-user-avatar" aria-hidden="true">
            {auth.user.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="sidebar-user-meta">
            <span className="sidebar-user-name">{auth.user.username}</span>
            <span className="sidebar-user-role">{auth.user.role}</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/customers" className={navClass}>
            Customers
          </NavLink>
          <NavLink to="/products" className={navClass}>
            Products
          </NavLink>
          <NavLink to="/orders" className={navClass}>
            Orders
          </NavLink>
          <NavLink to="/invoices" className={navClass}>
            Invoices
          </NavLink>
          <NavLink to="/procurement" className={navClass}>
            Procurement
          </NavLink>
        </nav>
        <button type="button" className="btn-logout" onClick={onLogout}>
          Sign out
        </button>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route
            path="/procurement"
            element={<ProcurementPage userRole={userRole} />}
          />
        </Routes>
      </main>
    </div>
  );
}
