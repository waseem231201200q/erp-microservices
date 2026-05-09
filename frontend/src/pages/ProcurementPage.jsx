import { useEffect, useState } from "react";
import {
  fetchSuppliers,
  createSupplier,
  fetchPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
  fetchProducts,
} from "../api";

export default function ProcurementPage({ userRole }) {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    code: "",
    name: "",
    email: "",
    phone: "",
    leadTimeDays: "7",
  });
  const [poForm, setPoForm] = useState({
    supplierCode: "",
    productId: "",
    quantity: "1",
    unitPrice: "0",
  });

  const loadAll = async () => {
    const [suppliersData, poData, productsData] = await Promise.all([
      fetchSuppliers(),
      fetchPurchaseOrders(),
      fetchProducts(),
    ]);
    setSuppliers(suppliersData);
    setPurchaseOrders(poData);
    setProducts(productsData);
  };

  useEffect(() => {
    loadAll().catch((err) =>
      setError(err.response?.data?.message || err.message || "Failed to load procurement"),
    );
  }, []);

  const createSupplierSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await createSupplier({
        ...supplierForm,
        leadTimeDays: Number(supplierForm.leadTimeDays || 0),
      });
      setSuccess("Supplier created.");
      setSupplierForm({
        code: "",
        name: "",
        email: "",
        phone: "",
        leadTimeDays: "7",
      });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Create supplier failed");
    }
  };

  const createPOSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await createPurchaseOrder({
        supplierCode: poForm.supplierCode,
        items: [
          {
            productId: poForm.productId,
            quantity: Number(poForm.quantity),
            unitPrice: Number(poForm.unitPrice),
          },
        ],
      });
      setSuccess("Purchase order created.");
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Create PO failed");
    }
  };

  const receivePO = async (id) => {
    try {
      await receivePurchaseOrder(id);
      setSuccess("Purchase order received, stock updated.");
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Receive PO failed");
    }
  };

  if (!["admin", "inventory", "sales"].includes(userRole)) {
    return <p className="error">Your role cannot access procurement.</p>;
  }

  return (
    <div>
      <h2>Procurement</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <section className="form-card">
        <h3>Add Supplier</h3>
        <form onSubmit={createSupplierSubmit}>
          <label>
            Code
            <input
              value={supplierForm.code}
              onChange={(event) =>
                setSupplierForm((prev) => ({ ...prev, code: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Name
            <input
              value={supplierForm.name}
              onChange={(event) =>
                setSupplierForm((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Email
            <input
              value={supplierForm.email}
              onChange={(event) =>
                setSupplierForm((prev) => ({ ...prev, email: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Phone
            <input
              value={supplierForm.phone}
              onChange={(event) =>
                setSupplierForm((prev) => ({ ...prev, phone: event.target.value }))
              }
              required
            />
          </label>
          <button type="submit">Create Supplier</button>
        </form>
      </section>

      <section className="form-card">
        <h3>Create Purchase Order</h3>
        <form onSubmit={createPOSubmit}>
          <label>
            Supplier
            <select
              value={poForm.supplierCode}
              onChange={(event) =>
                setPoForm((prev) => ({ ...prev, supplierCode: event.target.value }))
              }
              required
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier.code}>
                  {supplier.name} ({supplier.code})
                </option>
              ))}
            </select>
          </label>
          <label>
            Product
            <select
              value={poForm.productId}
              onChange={(event) =>
                setPoForm((prev) => ({ ...prev, productId: event.target.value }))
              }
              required
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.id})
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity
            <input
              type="number"
              min="1"
              value={poForm.quantity}
              onChange={(event) =>
                setPoForm((prev) => ({ ...prev, quantity: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Unit Price
            <input
              type="number"
              step="0.01"
              min="0"
              value={poForm.unitPrice}
              onChange={(event) =>
                setPoForm((prev) => ({ ...prev, unitPrice: event.target.value }))
              }
              required
            />
          </label>
          <button type="submit">Create Purchase Order</button>
        </form>
      </section>

      <section>
        <h3>Purchase Orders</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((po) => (
              <tr key={po._id}>
                <td>{po._id}</td>
                <td>{po.supplierCode}</td>
                <td>{po.status}</td>
                <td>{Number(po.totalAmount || 0).toFixed(2)}</td>
                <td>
                  <button
                    type="button"
                    className="btn-inline"
                    disabled={po.status === "received"}
                    onClick={() => receivePO(po._id)}
                  >
                    Receive
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
