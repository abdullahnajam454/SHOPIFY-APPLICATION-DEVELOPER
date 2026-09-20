const crypto = require("crypto");
const ProductActivity = require("../models/ProductActivity");

// --------------------------------------------------
// Helper: Convert Shopify product ID to GID
// --------------------------------------------------
const toProductGid = (id) => {
    if (!id) return null;

    if (String(id).startsWith("gid://shopify/Product/")) {
        return String(id);
    }

    return `gid://shopify/Product/${id}`;
};

// --------------------------------------------------
// Helper: Validate product fields
// --------------------------------------------------
const validateProductFields = ({ title, status, productType, vendor }) => {
    const errors = {};

    if (!title || !title.trim()) {
        errors.title = "Product title is required";
    }

    if (status && !["ACTIVE", "DRAFT", "ARCHIVED"].includes(status)) {
        errors.status = "Invalid product status";
    }

    if (productType !== undefined && typeof productType !== "string") {
        errors.productType = "Product type must be a string";
    }

    if (vendor !== undefined && typeof vendor !== "string") {
        errors.vendor = "Vendor must be a string";
    }

    return errors;
};

// --------------------------------------------------
// GET PRODUCTS
// --------------------------------------------------
const getProducts = async (req, res) => {
    try {
        const { shop, accessToken } = req.shopify;

        const query = `
            query GetProducts {
                products(first: 50) {
                    nodes {
                        id
                        title
                        description
                        status
                        productType
                        vendor
                        totalInventory
                        createdAt
                        updatedAt

                        variants(first: 10) {
                            nodes {
                                id
                                title
                                sku
                                price
                                inventoryQuantity
                                inventoryItem {
                                    id
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await fetch(
            `https://${shop}/admin/api/2026-07/graphql.json`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
                },
                body: JSON.stringify({ query }),
            }
        );

        const result = await response.json();
        console.log(
            "\n========== GET PRODUCTS RESPONSE =========="
        );

        console.log(
            JSON.stringify(result, null, 2)
        );

        if (result.errors) {
            console.error(
                "\n========== GET PRODUCTS SHOPIFY ERROR =========="
            );

            console.error(
                JSON.stringify(result.errors, null, 2)
            );

            return res.status(400).json({
                success: false,
                message: "Failed to fetch products",
                errors: result.errors,
            });
        }

        return res.json({
            success: true,
            products: result.data.products.nodes,
        });
    } catch (error) {
        console.error("Get products error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
        });
    }
};

// --------------------------------------------------
// CREATE PRODUCT
// --------------------------------------------------
const createProduct = async (req, res) => {
    try {
        const { shop, accessToken } = req.shopify;

        const {
            title,
            description = "",
            status = "ACTIVE",
            productType = "",
            vendor = "",
            price = 0,
            sku = "",
            inventory = 0,
        } = req.body;

        // ------------------------------------------
        // Validate fields
        // ------------------------------------------
        const validationErrors = validateProductFields({
            title,
            status,
            productType,
            vendor,
        });

        if (Object.keys(validationErrors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors,
            });
        }

        const numericPrice = Number(price);
        const numericInventory = Number(inventory);

        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be a non-negative number",
            });
        }

        if (
            !Number.isInteger(numericInventory) ||
            numericInventory < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Inventory must be a non-negative integer",
            });
        }

        // ------------------------------------------
        // Shopify GraphQL helper
        // ------------------------------------------
        const shopifyGraphQL = async (query, variables = {}) => {
            const response = await fetch(
                `https://${shop}/admin/api/2026-07/graphql.json`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Shopify-Access-Token": accessToken,
                    },
                    body: JSON.stringify({
                        query,
                        variables,
                    }),
                }
            );

            const data = await response.json();

            console.log("\n========== SHOPIFY GRAPHQL RESPONSE ==========");
            console.log(JSON.stringify(data, null, 2));

            if (!response.ok) {
                throw new Error(
                    `Shopify HTTP error: ${response.status}`
                );
            }

            if (data.errors) {
                throw new Error(
                    data.errors.map((e) => e.message).join(", ")
                );
            }

            return data;
        };

        // ------------------------------------------
        // 1. CREATE PRODUCT
        // ------------------------------------------
        const createMutation = `
            mutation ProductCreate($input: ProductInput!) {
                productCreate(input: $input) {
                    product {
                        id
                        title
                        status
                        descriptionHtml
                        productType
                        vendor

                        variants(first: 10) {
                            nodes {
                                id
                                title
                                price
                                sku

                                inventoryItem {
                                    id
                                }
                            }
                        }
                    }

                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const createVariables = {
            input: {
                title: title.trim(),
                descriptionHtml: description,
                status,
                productType,
                vendor,
            },
        };

        const createResponse = await shopifyGraphQL(
            createMutation,
            createVariables
        );

        const createPayload =
            createResponse.data.productCreate;

        if (createPayload.userErrors?.length) {
            console.error(
                "Product create userErrors:",
                createPayload.userErrors
            );

            return res.status(400).json({
                success: false,
                message: "Shopify product creation failed",
                errors: createPayload.userErrors,
            });
        }

        const product = createPayload.product;

        if (!product) {
            return res.status(500).json({
                success: false,
                message: "Shopify did not return the created product",
            });
        }

        console.log("\n========================================");
        console.log("PRODUCT CREATED");
        console.log("Product ID:", product.id);
        console.log("========================================");

        // ------------------------------------------
        // 2. GET DEFAULT VARIANT
        // ------------------------------------------
        let variant = product.variants?.nodes?.[0];

        if (!variant) {
            throw new Error(
                "Shopify product was created but no variant was returned"
            );
        }

        let inventoryItemId =
            variant.inventoryItem?.id;

        // ------------------------------------------
        // 3. UPDATE PRICE + SKU
        // ------------------------------------------
        const variantUpdateMutation = `
            mutation ProductVariantsBulkUpdate(
                $productId: ID!
                $variants: [ProductVariantsBulkInput!]!
            ) {
                productVariantsBulkUpdate(
                    productId: $productId
                    variants: $variants
                ) {
                    productVariants {
                        id
                        price
                        sku

                        inventoryItem {
                            id
                            tracked
                        }
                    }

                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const variantUpdateVariables = {
            productId: product.id,
            variants: [
                {
                    id: variant.id,
                    price: numericPrice.toFixed(2),
                    sku: sku || null,
                    inventoryItem: {
                        tracked: true,
                    },
                },
            ],
        };

        const variantUpdateResponse =
            await shopifyGraphQL(
                variantUpdateMutation,
                variantUpdateVariables
            );

        const variantUpdatePayload =
            variantUpdateResponse.data
                .productVariantsBulkUpdate;

        if (variantUpdatePayload.userErrors?.length) {
            console.error(
                "Variant update userErrors:",
                variantUpdatePayload.userErrors
            );

            throw new Error(
                variantUpdatePayload.userErrors
                    .map((error) => error.message)
                    .join(", ")
            );
        }

        if (
            variantUpdatePayload.productVariants?.length
        ) {
            variant =
                variantUpdatePayload.productVariants[0];

            inventoryItemId =
                variant.inventoryItem?.id ||
                inventoryItemId;
        }

        console.log("\n========================================");
        console.log("VARIANT UPDATED");
        console.log("Variant ID:", variant.id);
        console.log(
            "Inventory Item ID:",
            inventoryItemId
        );
        console.log("========================================");

        // ------------------------------------------
        // 4. GET ACTIVE LOCATIONS
        // ------------------------------------------
        const locationsQuery = `
            query GetLocations {
                locations(first: 50) {
                    nodes {
                        id
                        name
                        isActive
                    }
                }
            }
        `;

        const locationsResponse =
            await shopifyGraphQL(locationsQuery);

        const locations =
            locationsResponse.data.locations.nodes;

        console.log("\n========== SHOPIFY LOCATIONS ==========");
        console.log(JSON.stringify(locations, null, 2));

        const activeLocation =
            locations.find((location) => location.isActive);

        if (!activeLocation) {
            throw new Error(
                "No active Shopify location found"
            );
        }

        console.log("\n========== SELECTED LOCATION ==========");
        console.log(
            JSON.stringify(activeLocation, null, 2)
        );

        // ------------------------------------------
        // 5. INVENTORY ACTIVATE
        // ------------------------------------------
        const inventoryActivateMutation = `
            mutation InventoryActivate(
                $inventoryItemId: ID!
                $locationId: ID!
                $available: Int
                $onHand: Int
                $idempotencyKey: String!
            ) {
                inventoryActivate(
                    inventoryItemId: $inventoryItemId
                    locationId: $locationId
                    available: $available
                    onHand: $onHand
                ) @idempotent(key: $idempotencyKey) {

                    inventoryLevel {
                        id

                        location {
                            id
                            name
                        }

                        quantities(
                            names: ["available", "on_hand"]
                        ) {
                            name
                            quantity
                        }
                    }

                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const activateVariables = {
            inventoryItemId,
            locationId: activeLocation.id,
            available: numericInventory,
            onHand: numericInventory,
            idempotencyKey: crypto.randomUUID(),
        };

        console.log("\n========== INVENTORY ACTIVATE VARIABLES ==========");
        console.log(
            JSON.stringify(
                activateVariables,
                null,
                2
            )
        );

        const activateResponse =
            await shopifyGraphQL(
                inventoryActivateMutation,
                activateVariables
            );

        // IMPORTANT LOG
        console.log(
            "\n========== INVENTORY ACTIVATE RESPONSE =========="
        );
        console.log(
            JSON.stringify(
                activateResponse,
                null,
                2
            )
        );

        const activatePayload =
            activateResponse.data.inventoryActivate;

        if (activatePayload.userErrors?.length) {
            console.error(
                "Inventory activate userErrors:",
                activatePayload.userErrors
            );

            throw new Error(
                activatePayload.userErrors
                    .map((error) => error.message)
                    .join(", ")
            );
        }

        // ------------------------------------------
        // 6. INVENTORY SET QUANTITIES
        // ------------------------------------------
        const inventorySetMutation = `
            mutation InventorySet(
                $input: InventorySetQuantitiesInput!
                $idempotencyKey: String!
            ) {
                inventorySetQuantities(
                    input: $input
                ) @idempotent(key: $idempotencyKey) {

                    inventoryAdjustmentGroup {
                        createdAt
                        reason
                        referenceDocumentUri

                        changes {
                            name
                            delta
                            quantityAfterChange
                        }
                    }

                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const inventorySetVariables = {
            input: {
                name: "available",
                reason: "correction",
                referenceDocumentUri:
                    `product-manager://create/${product.id}`,

                quantities: [
                    {
                        inventoryItemId,
                        locationId: activeLocation.id,
                        quantity: numericInventory,
                        changeFromQuantity: null,
                    },
                ],
            },

            idempotencyKey: crypto.randomUUID(),
        };

        console.log(
            "\n========== INVENTORY SET VARIABLES =========="
        );

        console.log(
            JSON.stringify(
                inventorySetVariables,
                null,
                2
            )
        );

        const inventorySetResponse =
            await shopifyGraphQL(
                inventorySetMutation,
                inventorySetVariables
            );

        // IMPORTANT LOG
        console.log(
            "\n========== INVENTORY SET RESPONSE =========="
        );

        console.log(
            JSON.stringify(
                inventorySetResponse,
                null,
                2
            )
        );

        const inventorySetPayload =
            inventorySetResponse.data
                .inventorySetQuantities;

        if (inventorySetPayload.userErrors?.length) {
            console.error(
                "Inventory set userErrors:",
                inventorySetPayload.userErrors
            );

            throw new Error(
                inventorySetPayload.userErrors
                    .map((error) => error.message)
                    .join(", ")
            );
        }

        // ------------------------------------------
        // 7. VERIFY FINAL INVENTORY
        // ------------------------------------------
        const verifyInventoryQuery = `
            query VerifyInventory(
                $inventoryItemId: ID!
            ) {
                inventoryItem(
                    id: $inventoryItemId
                ) {
                    id

                    tracked

                    inventoryLevels(first: 50) {
                        nodes {
                            id

                            location {
                                id
                                name
                                isActive
                            }

                            quantities(
                                names: [
                                    "available",
                                    "on_hand",
                                    "committed",
                                    "incoming",
                                    "reserved"
                                ]
                            ) {
                                name
                                quantity
                            }
                        }
                    }
                }
            }
        `;

        const verifyResponse =
            await shopifyGraphQL(
                verifyInventoryQuery,
                {
                    inventoryItemId,
                }
            );

        // IMPORTANT LOG
        console.log(
            "\n========== FINAL INVENTORY LEVELS =========="
        );

        console.log(
            JSON.stringify(
                verifyResponse,
                null,
                2
            )
        );

        const inventoryLevels =
            verifyResponse.data.inventoryItem
                ?.inventoryLevels?.nodes || [];

        console.log(
            "\n========== INVENTORY LEVEL SUMMARY =========="
        );

        inventoryLevels.forEach((level) => {
            console.log({
                location: level.location.name,
                locationId: level.location.id,
                isActive: level.location.isActive,
                quantities: level.quantities,
            });
        });

        const selectedLevel =
            inventoryLevels.find(
                (level) =>
                    level.location.id ===
                    activeLocation.id
            );

        if (!selectedLevel) {
            throw new Error(
                "Inventory level was not found at the selected location"
            );
        }

        const availableQuantity = Number(
            selectedLevel.quantities.find(
                (quantity) =>
                    quantity.name === "available"
            )?.quantity ?? 0
        );

        console.log("\n========== INVENTORY VERIFICATION ==========");
        console.log(
            "Expected inventory:",
            numericInventory
        );
        console.log(
            "Actual available inventory:",
            availableQuantity
        );
        console.log(
            "Location:",
            selectedLevel.location.name
        );

        if (
            availableQuantity !==
            numericInventory
        ) {
            console.error(
                "INVENTORY VERIFICATION FAILED"
            );

            return res.status(500).json({
                success: false,
                message:
                    "Inventory was not saved correctly",
                expected: numericInventory,
                actual: availableQuantity,
                location: selectedLevel.location.name,
            });
        }

        console.log(
            "\n✅ Inventory successfully verified"
        );

        // ------------------------------------------
        // 8. SAVE ACTIVITY
        // ------------------------------------------
        await ProductActivity.create({
            shop,
            productId: product.id,

            action: "CREATE",

            oldValue: null,

            newValue: {
                title: product.title,
                description: product.description,
                status: product.status,
                productType: product.productType,
                vendor: product.vendor,
                price: numericPrice,
                sku,
                inventory: numericInventory,
            },
        });

        // ------------------------------------------
        // 9. SUCCESS RESPONSE
        // ------------------------------------------
        return res.status(201).json({
            success: true,
            message:
                "Product created successfully",
            product: {
                ...product,
                price: numericPrice,
                sku,
                inventory: numericInventory,
                inventoryItemId,
                location: activeLocation,
            },
        });
    } catch (error) {
        console.error(
            "\n========== CREATE PRODUCT ERROR =========="
        );

        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to create product",
        });
    }
};

// --------------------------------------------------
// GET PRODUCT BY ID
// --------------------------------------------------
const getProductById = async (req, res) => {
    try {
        const { shop, accessToken } = req.shopify;
        const productId = toProductGid(req.params.id);

        const query = `
            query GetProduct($id: ID!) {
                product(id: $id) {
                    id
                    title
                    description
                    status
                    productType
                    vendor
                    totalInventory
                    createdAt
                    updatedAt

                    variants(first: 50) {
                        nodes {
                            id
                            title
                            sku
                            price
                            inventoryQuantity

                            inventoryItem {
                                id
                                tracked

                                inventoryLevels(first: 50) {
                                    nodes {
                                        location {
                                            id
                                            name
                                        }

                                        quantities(
                                            names: [
                                                "available",
                                                "on_hand",
                                                "committed",
                                                "incoming",
                                                "reserved"
                                            ]
                                        ) {
                                            name
                                            quantity
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await fetch(
            `https://${shop}/admin/api/2026-07/graphql.json`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
                },
                body: JSON.stringify({
                    query,
                    variables: {
                        id: productId,
                    },
                }),
            }
        );

        const result = await response.json();

        if (result.errors) {
            console.error(
                "Get product GraphQL errors:",
                result.errors
            );

            return res.status(400).json({
                success: false,
                message: "Failed to fetch product",
                errors: result.errors,
            });
        }

        if (!result.data.product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        return res.json({
            success: true,
            product: result.data.product,
        });
    } catch (error) {
        console.error(
            "Get product error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product",
        });
    }
};

// --------------------------------------------------
// UPDATE PRODUCT
// --------------------------------------------------
const updateProduct = async (req, res) => {
    try {
        const { shop, accessToken } = req.shopify;

        const productId =
            toProductGid(req.params.id);

        const {
            title,
            description,
            status,
            productType,
            vendor,
        } = req.body;

        const validationErrors =
            validateProductFields({
                title,
                status,
                productType,
                vendor,
            });

        if (
            Object.keys(validationErrors).length
        ) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors,
            });
        }

        // ------------------------------------------
        // Get old product
        // ------------------------------------------
        const getOldQuery = `
            query GetProduct($id: ID!) {
                product(id: $id) {
                    id
                    title
                    description
                    status
                    productType
                    vendor
                }
            }
        `;

        const oldResponse = await fetch(
            `https://${shop}/admin/api/2026-07/graphql.json`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
                },
                body: JSON.stringify({
                    query: getOldQuery,
                    variables: {
                        id: productId,
                    },
                }),
            }
        );

        const oldResult =
            await oldResponse.json();

        if (!oldResult.data?.product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const oldProduct =
            oldResult.data.product;

        // ------------------------------------------
        // Update
        // ------------------------------------------
        const mutation = `
            mutation ProductUpdate(
                $input: ProductInput!
            ) {
                productUpdate(input: $input) {
                    product {
                        id
                        title
                        description
                        status
                        productType
                        vendor
                    }

                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const variables = {
            input: {
                id: productId,
                title: title?.trim(),
                description,
                status,
                productType,
                vendor,
            },
        };

        const response = await fetch(
            `https://${shop}/admin/api/2026-07/graphql.json`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
                },
                body: JSON.stringify({
                    query: mutation,
                    variables,
                }),
            }
        );

        const result =
            await response.json();

        if (result.errors) {
            return res.status(400).json({
                success: false,
                message: "Shopify update failed",
                errors: result.errors,
            });
        }

        const payload =
            result.data.productUpdate;

        if (payload.userErrors?.length) {
            return res.status(400).json({
                success: false,
                message: "Shopify update failed",
                errors: payload.userErrors,
            });
        }

        // ------------------------------------------
        // Activity
        // ------------------------------------------
        await ProductActivity.create({
            shop,
            productId,

            action: "UPDATE",

            oldValue: oldProduct,

            newValue: payload.product,
        });

        return res.json({
            success: true,
            message:
                "Product updated successfully",
            product: payload.product,
        });
    } catch (error) {
        console.error(
            "Update product error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to update product",
        });
    }
};

// --------------------------------------------------
// GET PRODUCT ACTIVITIES
// --------------------------------------------------
const getProductActivities = async (
    req,
    res
) => {
    try {
        const { shop } = req.shopify;

        const productId =
            toProductGid(req.params.id);

        const activities =
            await ProductActivity.find({
                shop,
                productId,
            }).sort({
                createdAt: -1,
            });

        return res.json({
            success: true,
            activities,
        });
    } catch (error) {
        console.error(
            "Get product activities error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch product activities",
        });
    }
};

module.exports = {
    getProducts,
    createProduct,
    getProductById,
    updateProduct,
    getProductActivities,
};