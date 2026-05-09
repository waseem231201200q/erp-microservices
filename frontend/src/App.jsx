import { Routes, Route, NavLink } from "react-router-dom";
import CustomersPage from "./pages/CustomersPage";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import InvoicesPage from "./pages/InvoicesPage";

const navClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>ERP Microservices</h1>
        <nav>
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
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<CustomersPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
        </Routes>
      </main>
    </div>
  );
}
