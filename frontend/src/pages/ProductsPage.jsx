import { useEffect, useState } from "react";
import { fetchProducts, createProduct } from "../api";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    category: "",
    price: "",
    quantityInStock: "",
    supplier: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !formData.id ||
      !formData.name ||
      !formData.category ||
      !formData.price ||
      !formData.supplier
    ) {
      setError("ID, Name, Category, Price, and Supplier are required");
      return;
    }

    try {
      await createProduct({
        ...formData,
        price: parseFloat(formData.price),
        quantityInStock: parseInt(formData.quantityInStock) || 0,
      });
      setSuccess("Product created successfully!");
      setFormData({
        id: "",
        name: "",
        category: "",
        price: "",
        quantityInStock: "",
        supplier: "",
      });
      loadProducts(); // Refresh the list
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create product",
      );
    }
  };

  return (
    <div>
      <h2>Products</h2>

      <section className="form-card">
        <h3>Add New Product</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Product ID *
            <input
              type="text"
              name="id"
              value={formData.id}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Name *
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Category *
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select category</option>
              <option value="Ordinateurs">Ordinateurs</option>
              <option value="Téléphones">Téléphones</option>
              <option value="Tablettes">Tablettes</option>
              <option value="Accessoires">Accessoires</option>
              <option value="Audio">Audio</option>
              <option value="TV & Écrans">TV & Écrans</option>
              <option value="Stockage">Stockage</option>
              <option value="Réseau">Réseau</option>
              <option value="Autre">Autre</option>
            </select>
          </label>
          <label>
            Price *
            <input
              type="number"
              step="0.01"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Quantity in Stock
            <input
              type="number"
              name="quantityInStock"
              value={formData.quantityInStock}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Supplier *
            <input
              type="text"
              name="supplier"
              value={formData.supplier}
              onChange={handleInputChange}
              required
            />
          </label>
          <button type="submit">Add Product</button>
        </form>
        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section>
        <h3>Product List</h3>
        {loading && <p>Loading products...</p>}
        {!loading && !error && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Supplier</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id || product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.price}</td>
                  <td>{product.quantityInStock}</td>
                  <td>{product.supplier || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
