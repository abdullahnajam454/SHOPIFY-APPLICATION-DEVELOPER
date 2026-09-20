import { Link } from "react-router-dom";

function Dashboard() {
  const stats = [
    {
      title: "Total Products",
      value: "0",
      description: "All products in your store",
    },
    {
      title: "Active",
      value: "0",
      description: "Currently active products",
    },
    {
      title: "Draft",
      value: "0",
      description: "Products in draft status",
    },
    {
      title: "Archived",
      value: "0",
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
              {stat.value}
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