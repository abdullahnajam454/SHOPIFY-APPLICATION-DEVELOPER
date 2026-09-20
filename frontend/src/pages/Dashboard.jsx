import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import apiFetch from "../services/api";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await apiFetch("/api/products");
        setProducts(data.products || []);
      } catch (requestError) {
        console.error(requestError);
        setError(
          requestError.message || "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const stats = [
    {
      title: "Total Products",
      value: products.length,
      description: "All products in your store",
    },
    {
      title: "Active",
      value: products.filter((product) => product.status === "ACTIVE").length,
      description: "Currently active products",
    },
    {
      title: "Draft",
      value: products.filter((product) => product.status === "DRAFT").length,
      description: "Products in draft status",
    },
    {
      title: "Archived",
      value: products.filter((product) => product.status === "ARCHIVED").length,
      description: "Archived products",
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor your Shopify products.
          </p>
        </div>

        <Link
          to="/products"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          View Products
        </Link>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">
              {stat.title}
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-900">
              {loading ? "..." : stat.value}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Recent product changes made through the app.
          </p>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500">
            No recent activity.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;