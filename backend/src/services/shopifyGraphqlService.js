const {
    getShopifyAccessToken,
    normalizeShopDomain
} = require("./shopifyService");

const shopifyGraphql = async (
    query,
    variables = {},
    shopDomain = `${process.env.SHOPIFY_SHOP}.myshopify.com`
) => {
    const normalizedShopDomain = normalizeShopDomain(shopDomain);
    const accessToken = await getShopifyAccessToken(normalizedShopDomain);

    const response = await fetch(
        `https://${normalizedShopDomain}/admin/api/2026-07/graphql.json`,
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
    )

    const data = await response.json();

    if (!response.ok || data.errors) {
        throw new Error(
            JSON.stringify(data.errors || data)
        )
    }

    return data
}

module.exports = shopifyGraphql