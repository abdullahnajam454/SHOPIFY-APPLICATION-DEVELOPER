import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import apiFetch from "../services/api";

function CreateProduct() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: "",
        description: "",
        status: "ACTIVE",
        productType: "",
        vendor: "",
        price: "",
        sku: "",
        inventory: "",
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [image, setImage] = useState(null);

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            setImage(null);
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("Image must be smaller than 10 MB");
            return;
        }

        setError("");
        setImage(file);
    };

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

            const data = await apiFetch("/api/products", {
                method: "POST",
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    status: form.status,
                    productType: form.productType,
                    vendor: form.vendor,
                    price: form.price,
                    sku: form.sku,
                    inventory: form.inventory,
                }),
            });

            console.log("Created product:", data);

            if (image && data.product?.id) {
                const imageData = await new Promise((resolve, reject) => {
                    const reader = new FileReader();

                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(
                        new Error("Could not read the product image")
                    );

                    reader.readAsDataURL(image);
                });

                await apiFetch(
                    `/api/products/${encodeURIComponent(data.product.id)}/images`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            imageData,
                            filename: image.name,
                            alt: form.title,
                        }),
                    }
                );
            }

            navigate("/products");
        } catch (error) {
            console.error(error);

            setError(
                error.message || "Failed to create product"
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6">

            {/* Header */}
            <div>
                <Link
                    to="/products"
                    className="text-sm text-gray-500 hover:underline"
                >
                    ← Back to Products
                </Link>

                <h1 className="mt-2 text-2xl font-semibold text-gray-900">
                    Add Product
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Create a new product in your Shopify store
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-xl border bg-white p-6"
            >

                {/* Product Title */}
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
                        placeholder="Enter product title"
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
                        placeholder="Enter product description"
                        rows="6"
                        className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                    />
                </div>

                {/* Product Image */}
                <div>
                    <label
                        htmlFor="image"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Product Image
                    </label>

                    <input
                        id="image"
                        name="image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageChange}
                        className="w-full rounded-lg border px-4 py-3 text-sm"
                    />

                    {image && (
                        <p className="mt-2 text-sm text-gray-500">
                            {image.name}
                        </p>
                    )}
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
                        <option value="ACTIVE">
                            Active
                        </option>

                        <option value="DRAFT">
                            Draft
                        </option>

                        <option value="ARCHIVED">
                            Archived
                        </option>
                    </select>
                </div>

                {/* Product Type */}
                <div>
                    <label
                        htmlFor="productType"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Product Type
                    </label>

                    <input
                        id="productType"
                        name="productType"
                        type="text"
                        value={form.productType}
                        onChange={handleChange}
                        placeholder="Example: Electronics"
                        className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                    />
                </div>

                {/* Vendor */}
                <div>
                    <label
                        htmlFor="vendor"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Vendor
                    </label>

                    <input
                        id="vendor"
                        name="vendor"
                        type="text"
                        value={form.vendor}
                        onChange={handleChange}
                        placeholder="Example: Tech Store"
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
                        placeholder="Example: 99.99"
                        className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                    />
                </div>

                {/* SKU */}
                <div>
                    <label
                        htmlFor="sku"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        SKU
                    </label>

                    <input
                        id="sku"
                        name="sku"
                        type="text"
                        value={form.sku}
                        onChange={handleChange}
                        placeholder="Example: HEADPHONE-001"
                        className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                    />
                </div>

                {/* Inventory */}
                <div>
                    <label
                        htmlFor="inventory"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Inventory
                    </label>

                    <input
                        id="inventory"
                        name="inventory"
                        type="number"
                        min="0"
                        value={form.inventory}
                        onChange={handleChange}
                        placeholder="Example: 50"
                        className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                    />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 border-t pt-6">

                    <Link
                        to="/products"
                        className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving
                            ? "Creating..."
                            : "Create Product"}
                    </button>

                </div>
            </form>
        </div>
    );
}

export default CreateProduct;