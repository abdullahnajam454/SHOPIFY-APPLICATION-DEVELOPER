const Shop = require("../models/Shop");

const normalizeShopDomain = (shop) => {
    const value = String(shop || "").trim().toLowerCase();

    return value;
};
const exchangeIdTokenForAccessToken = async (idToken, shopDomain) => {
    const response = await fetch(
        `https://${shopDomain}/admin/oauth/access_token`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: process.env.SHOPIFY_CLIENT_ID,
                client_secret: process.env.SHOPIFY_CLIENT_SECRET,
                grant_type:
                    "urn:ietf:params:oauth:grant-type:token-exchange",
                subject_token: idToken,
                subject_token_type:
                    "urn:ietf:params:oauth:token-type:id_token",
                requested_token_type:
                    "urn:shopify:params:oauth:token-type:offline-access-token",
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            `Shopify token exchange failed: ${error}`
        );
    }

    const data = await response.json();

    return data;
};

const getShopifyAccessToken = async (shop) => {
    const shopDomain = normalizeShopDomain(shop);

    if (!shopDomain) {
        throw new Error("Shop domain is required");
    }

    const storedShop = await Shop.findOne({ shop: shopDomain });

    if (storedShop?.accessToken) {
        return storedShop.accessToken;
    }

    throw new Error("Shopify access token not found for this shop");
};

module.exports = {
    getShopifyAccessToken,
    normalizeShopDomain,
    exchangeIdTokenForAccessToken,
};