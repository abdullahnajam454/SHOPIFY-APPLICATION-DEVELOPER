const express = require("express");
const Shop = require("../models/Shop");

const router = express.Router();

router.get("/", (req, res) => {
    const shop = String(req.query.shop || "").trim();

    if (!shop) {
        return res.status(400).json({
            success: false,
            message: "Shop domain is required"
        });
    }

    const redirectUri = process.env.SHOPIFY_REDIRECT_URI;

    if (!redirectUri) {
        return res.status(500).json({
            success: false,
            message: "SHOPIFY_REDIRECT_URI is not configured"
        });
    }

    const scopes = process.env.SHOPIFY_SCOPES || "read_products,write_products,read_inventory";
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${Date.now()}`;

    return res.redirect(installUrl);
});

router.get("/callback", async (req, res) => {
    try {
        const { shop, code } = req.query;

        if (!shop || !code) {
            return res.status(400).json({
                success: false,
                message: "Missing shop or authorization code"
            });
        }

        const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: process.env.SHOPIFY_CLIENT_ID,
                client_secret: process.env.SHOPIFY_CLIENT_SECRET,
                code,
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.access_token) {
            return res.status(400).json({
                success: false,
                message: "Shopify OAuth failed",
                details: data
            });
        }

        const cleanShop = String(shop).trim().toLowerCase();

        await Shop.findOneAndUpdate(
            { shop: cleanShop },
            {
                shop: cleanShop,
                accessToken: data.access_token,
            },
            { upsert: true, returnDocument: "after" }
        );

        return res.redirect(
    `https://dander-partition-overfull.ngrok-free.dev?shop=${encodeURIComponent(cleanShop)}`
);
    } catch (error) {
        console.error("OAuth callback error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to complete Shopify authentication",
            error: error.message
        });
    }
});

module.exports = router;
