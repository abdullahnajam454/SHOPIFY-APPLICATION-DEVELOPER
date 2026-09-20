import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import apiFetch from "../services/api";

function ProductDetails() {
    const { id } = useParams();

    const [product, setProduct] = useState(null);
    const [activities, setActivities] = useState([]);

    const [loading, setLoading] = useState(true);
    const [activitiesLoading, setActivitiesLoading] = useState(true);

    const [error, setError] = useState("");

    const fetchProduct = async () => {
        try {
            setLoading(true);
            setError("");

            const productId = decodeURIComponent(id);

            const data = await apiFetch(
                `/api/products/${encodeURIComponent(productId)}`
            );

            setProduct(data.product);
        } catch (error) {
            console.error(error);

            setError(
                error.message || "Failed to load product"
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async () => {
        try {
            setActivitiesLoading(true);

            const productId = decodeURIComponent(id);

            const data = await apiFetch(
                `/api/products/${encodeURIComponent(productId)}/activities`
            );

            setActivities(data.activities || []);
        } catch (error) {
            console.error(
                "Failed to load activities:",
                error
            );
        } finally {
            setActivitiesLoading(false);
        }
    };

    const inventory =
        product?.variants?.nodes?.reduce(
            (total, variant) =>
                total + (variant.inventoryQuantity || 0),
            0
        ) || 0;

    useEffect(() => {
        fetchProduct();
        fetchActivities();
    }, [id]);

    if (loading) {
        return (
            <div className="rounded-xl border bg-white p-10 text-center">
                <p className="text-sm text-gray-500">
                    Loading product...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Link
                    to="/products"
                    className="text-sm font-medium text-gray-700 hover:underline"
                >
                    ← Back to Products
                </Link>

                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="rounded-xl border bg-white p-10 text-center">
                <p className="text-sm text-gray-500">
                    Product not found.
                </p>
            </div>
        );
    }

    const variant = product.variants?.nodes?.[0];

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        to="/products"
                        className="text-sm text-gray-500 hover:underline"
                    >
                        ← Back to Products
                    </Link>

                    <h1 className="mt-2 text-2xl font-semibold text-gray-900">
                        {product.title}
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Product details
                    </p>
                </div>

                <Link
                    to={`/products/${encodeURIComponent(product.id)}/edit`}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    Edit Product
                </Link>
            </div>

            {/* Product Information */}
            <div className="grid gap-6 lg:grid-cols-3">

                {/* Product Image */}
                <div className="rounded-xl border bg-white p-6">
                    {product.featuredImage?.url ? (
                        <img
                            src={product.featuredImage.url}
                            alt={
                                product.featuredImage.altText ||
                                product.title
                            }
                            className="w-full rounded-lg object-cover"
                        />
                    ) : (
                        <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
                            No image
                        </div>
                    )}
                </div>

                {/* Product Information */}
                <div className="rounded-xl border bg-white p-6 lg:col-span-2">

                    <h2 className="text-lg font-semibold text-gray-900">
                        Product Information
                    </h2>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">

                        {/* Title */}
                        <div>
                            <p className="text-sm text-gray-500">
                                Title
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {product.title || "—"}
                            </p>
                        </div>

                        {/* Status */}
                        <div>
                            <p className="text-sm text-gray-500">
                                Status
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {product.status || "—"}
                            </p>
                        </div>

                        {/* SKU */}
                        <div>
                            <p className="text-sm text-gray-500">
                                SKU
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {variant?.sku || "—"}
                            </p>
                        </div>

                        {/* Price */}
                        <div>
                            <p className="text-sm text-gray-500">
                                Price
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {variant?.price
                                    ? `$${variant.price}`
                                    : "—"}
                            </p>
                        </div>

                        {/* Inventory */}
                        <div>
                            <p className="text-sm text-gray-500">
                                Inventory
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {inventory}
                            </p>
                        </div>

                        {/* Product ID */}
                        <div>
                            <p className="text-sm text-gray-500">
                                Product ID
                            </p>

                            <p className="mt-1 break-all text-sm text-gray-600">
                                {product.id}
                            </p>
                        </div>

                    </div>

                    {/* Description */}
                    <div className="mt-6 border-t pt-6">

                        <p className="text-sm text-gray-500">
                            Description
                        </p>

                        <div
                            className="mt-2 text-sm leading-6 text-gray-700"
                            dangerouslySetInnerHTML={{
                                __html:
                                    product.descriptionHtml ||
                                    "<p>No description available.</p>",
                            }}
                        />

                    </div>

                </div>

            </div>

            {/* Activity History */}
            <div className="rounded-xl border bg-white p-6">

                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Activity History
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Changes and Shopify webhook events for this product
                        </p>
                    </div>

                    {!activitiesLoading && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            {activities.length}{" "}
                            {activities.length === 1
                                ? "activity"
                                : "activities"}
                        </span>
                    )}
                </div>

                {/* Loading */}
                {activitiesLoading ? (
                    <div className="mt-6 rounded-lg bg-gray-50 p-6 text-center">
                        <p className="text-sm text-gray-500">
                            Loading activities...
                        </p>
                    </div>
                ) : activities.length === 0 ? (

                    /* No Activities */
                    <div className="mt-6 rounded-lg bg-gray-50 p-6 text-center">
                        <p className="text-sm text-gray-500">
                            No activity found for this product.
                        </p>
                    </div>

                ) : (

                    /* Activities */
                    <div className="mt-6 space-y-4">

                        {activities.map((activity) => (

                            <div
                                key={activity._id}
                                className="rounded-lg border p-4"
                            >

                                {/* Activity Header */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {activity.action === "UPDATE"
                                                ? "Product Updated"
                                                : activity.action === "WEBHOOK_UPDATE"
                                                    ? "Shopify Webhook Update"
                                                    : activity.action}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                            {new Date(
                                                activity.createdAt
                                            ).toLocaleString()}
                                        </p>
                                    </div>

                                    <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                        {activity.action}
                                    </span>

                                </div>

                                {/* UPDATE activity */}
                                {activity.action === "UPDATE" &&
                                    activity.oldValue &&
                                    activity.newValue && (

                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">

                                            {/* Previous */}
                                            <div>
                                                <p className="text-xs font-medium text-gray-500">
                                                    Previous
                                                </p>

                                                <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                                                    {JSON.stringify(
                                                        activity.oldValue,
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            </div>

                                            {/* Updated */}
                                            <div>
                                                <p className="text-xs font-medium text-gray-500">
                                                    Updated
                                                </p>

                                                <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                                                    {JSON.stringify(
                                                        activity.newValue,
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            </div>

                                        </div>
                                    )}

                                {/* WEBHOOK_UPDATE activity */}
                                {activity.action === "WEBHOOK_UPDATE" &&
                                    activity.newValue && (

                                        <div className="mt-4">

                                            <p className="text-xs font-medium text-gray-500">
                                                Shopify Event
                                            </p>

                                            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                                                {JSON.stringify(
                                                    activity.newValue,
                                                    null,
                                                    2
                                                )}
                                            </pre>

                                        </div>
                                    )}

                            </div>

                        ))}

                    </div>
                )}

            </div>

        </div>
    );
}

export default ProductDetails;