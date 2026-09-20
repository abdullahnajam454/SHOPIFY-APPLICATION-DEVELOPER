import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import apiFetch from "../services/api";

function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: "",
        description: "",
        price: "",
        status: "ACTIVE",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const productId = decodeURIComponent(id);

    // Load product
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await apiFetch(
                    `/api/products/${encodeURIComponent(productId)}`
                );

                const product = data.product;
                const variant = product.variants?.nodes?.[0];

                setForm({
                    title: product.title || "",
                    description: product.descriptionHtml
                        ? product.descriptionHtml.replace(/<[^>]*>/g, "")
                        : "",
                    price: variant?.price || "",
                    status: product.status || "ACTIVE",
                });
            } catch (error) {
                console.error(error);

                setError(
                    error.message || "Failed to load product"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const data = await apiFetch(
                `/api/products/${encodeURIComponent(productId)}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        title: form.title,
                        description: form.description,
                        price: form.price,
                        status: form.status,
                    }),
                }
            );

            console.log("Updated product:", data);

            setSuccess("Product updated successfully.");

            setTimeout(() => {
                navigate(
                    `/products/${encodeURIComponent(productId)}`
                );
            }, 800);
        } catch (error) {
            console.error(error);

            setError(
                error.message || "Failed to update product"
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="rounded-xl border bg-white p-10 text-center">
                <p className="text-sm text-gray-500">
                    Loading product...
                </p>
            </div>
        );
    }

    if (error && !form.title) {
        return (
            <div className="space-y-4">
                <Link
                    to={`/products/${encodeURIComponent(productId)}`}
                    className="text-sm font-medium text-gray-700 hover:underline"
                >
                    ← Back to Product
                </Link>

                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <Link
                    to={`/products/${encodeURIComponent(productId)}`}
                    className="text-sm text-gray-500 hover:underline"
                >
                    ← Back to Product
                </Link>

                <h1 className="mt-2 text-2xl font-semibold text-gray-900">
                    Edit Product
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Update your Shopify product information
                </p>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    {success}
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-xl border bg-white p-6"
            >
                {/* Title */}
                <div>
                    <label
                        htmlFor="title"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Product Title
                    </label>

                    <input
                        id="title"
                        name="title"
                        type="text"
                        value={form.title}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                    />
                </div>

                {/* Description */}
                <div>
                    <label
                        htmlFor="description"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Description
                    </label>

                    <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows="6"
                        className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                    />
                </div>

                {/* Price */}
                <div>
                    <label
                        htmlFor="price"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Price
                    </label>

                    <input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                    />
                </div>

                {/* Status */}
                <div>
                    <label
                        htmlFor="status"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Status
                    </label>

                    <select
                        id="status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                    >
                        <option value="ACTIVE">Active</option>
                        <option value="DRAFT">Draft</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 border-t pt-6">
                    <Link
                        to={`/products/${encodeURIComponent(productId)}`}
                        className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditProduct;