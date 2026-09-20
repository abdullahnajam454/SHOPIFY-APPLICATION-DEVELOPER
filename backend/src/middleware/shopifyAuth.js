const jwt = require("jsonwebtoken");

const Shop = require("../models/Shop");

const {
    normalizeShopDomain,
    exchangeIdTokenForAccessToken,
} = require("../services/shopifyService");


const requireShopifyAuth = async (req, res, next) => {
    try {
        const authHeader = req.get("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Missing Shopify authentication token",
            });
        }

        const idToken = authHeader.replace("Bearer ", "");


        // ------------------------------------------
        // 1. Verify Shopify ID token
        // ------------------------------------------
        const payload = jwt.verify(
            idToken,
            process.env.SHOPIFY_CLIENT_SECRET,
            {
                algorithms: ["HS256"],
                audience: process.env.SHOPIFY_CLIENT_ID,
            }
        );


        // ------------------------------------------
        // 2. Get shop from token
        // ------------------------------------------
        const issuerHost = new URL(payload.iss).hostname;
        const destinationHost = new URL(payload.dest).hostname;

        if (issuerHost !== destinationHost) {
            return res.status(401).json({
                success: false,
                message: "Invalid Shopify token destination",
            });
        }

        const shopDomain =
            normalizeShopDomain(destinationHost);


        // ------------------------------------------
        // 3. Exchange ID token for access token
        // ------------------------------------------
        const tokenData =
            await exchangeIdTokenForAccessToken(
                idToken,
                shopDomain
            );

        const accessToken =
            tokenData.access_token;


        if (!accessToken) {
            throw new Error(
                "Shopify did not return an access token"
            );
        }


        // ------------------------------------------
        // 4. Save/update shop token
        // ------------------------------------------
        await Shop.findOneAndUpdate(
            { shop: shopDomain },
            {
                shop: shopDomain,
                accessToken,
            },
            {
                upsert: true,
                returnDocument: "after",
            }
        );


        // ------------------------------------------
        // 5. Store Shopify authentication
        // ------------------------------------------
        req.shopDomain = shopDomain;
        req.shopify = {
            shop: shopDomain,
            accessToken,
        };
        req.shopifyUserId = payload.sub;

        // IMPORTANT:
        // Controllers expect req.shopify.shop
        // and req.shopify.accessToken
        req.shopify = {
            shop: shopDomain,
            accessToken,
        };


        // ------------------------------------------
        // 6. Continue
        // ------------------------------------------
        next();

    } catch (error) {

        console.error(
            "Shopify authentication error:",
            error.message
        );

        res.set(
            "X-Shopify-Retry-Invalid-Session-Request",
            "1"
        );

        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired Shopify session",
        });
    }
};


module.exports = {
    requireShopifyAuth,
};