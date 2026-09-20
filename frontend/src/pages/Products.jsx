import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import apiFetch from "../services/api";

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await apiFetch("/api/products");

            setProducts(data.products || []);
        } catch (error) {
            console.error(error);

            setError(
                error.message || "Failed to load products"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return (
        <div className="space-y-6">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Products
                    </h1>

                    <p className="text-sm text-gray-500">
                        Manage your Shopify products
                    </p>
                </div>

                <Link
                    to="/products/new"
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    Add Product
                </Link>
            </div>


            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}


            {/* Loading */}
            {loading ? (
                <div className="rounded-xl border bg-white p-10 text-center">
                    <p className="text-sm text-gray-500">
                        Loading products...
                    </p>
                </div>
            ) : products.length === 0 ? (

                /* Empty state */
                <div className="rounded-xl border bg-white p-10 text-center">
                    <h2 className="text-lg font-medium text-gray-900">
                        No products found
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Your Shopify store does not have any products yet.
                    </p>
                </div>

            ) : (

                /* Products table */
                <div className="overflow-hidden rounded-xl border bg-white">

                    <table className="w-full text-left text-sm">

                        <thead className="border-b bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 font-medium">
                                    Product
                                </th>

                                <th className="px-6 py-4 font-medium">
                                    SKU
                                </th>

                                <th className="px-6 py-4 font-medium">
                                    Price
                                </th>

                                <th className="px-6 py-4 font-medium">
                                    Inventory
                                </th>

                                <th className="px-6 py-4 font-medium">
                                    Status
                                </th>

                                <th className="px-6 py-4 font-medium">
                                    Action
                                </th>
                            </tr>
                        </thead>


                        <tbody className="divide-y">

                            {products.map((product) => {

                                const variant =
                                    product.variants?.nodes?.[0];

                                const inventory =
                                    product.variants?.nodes?.reduce(
                                        (total, item) =>
                                            total +
                                            (item.inventoryQuantity || 0),
                                        0
                                    ) || 0;

                                return (
                                    <tr key={product.id}>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">

                                                {product.featuredImage?.url ? (
                                                    <img
                                                        src={
                                                            product.featuredImage.url
                                                        }
                                                        alt={
                                                            product.featuredImage.altText ||
                                                            product.title
                                                        }
                                                        className="h-12 w-12 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                                                        No image
                                                    </div>
                                                )}

                                                <div>
                                                    <Link
                                                        to={`/products/${encodeURIComponent(
                                                            product.id
                                                        )}`}
                                                        className="font-medium text-gray-900 hover:underline"
                                                    >
                                                        {product.title}
                                                    </Link>
                                                </div>

                                            </div>
                                        </td>


                                        <td className="px-6 py-4 text-gray-600">
                                            {variant?.sku || "—"}
                                        </td>


                                        <td className="px-6 py-4 text-gray-600">
                                            {variant?.price
                                                ? `$${variant.price}`
                                                : "—"}
                                        </td>


                                        <td className="px-6 py-4 text-gray-600">
                                            {inventory}
                                        </td>


                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                                                {product.status}
                                            </span>
                                        </td>


                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/products/${encodeURIComponent(
                                                    product.id
                                                )}`}
                                                className="font-medium text-gray-900 hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>

                                    </tr>
                                );
                            })}

                        </tbody>

                    </table>

                </div>
            )}

        </div>
    );
}

export default Products;