const express = require("express");
const crypto = require("crypto");
const ProductActivity = require("../models/ProductActivity");

const router = express.Router();

router.post(
    "/products-update",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        try {
            const hmacHeader = req.get("X-Shopify-Hmac-Sha256");

            if (!hmacHeader) {
                return res.status(401).send("Missing HMAC");
            }

            const generatedHash = crypto
                .createHmac(
                    "sha256",
                    process.env.SHOPIFY_CLIENT_SECRET
                )
                .update(req.body)
                .digest("base64");

            const generatedBuffer = Buffer.from(generatedHash);
            const receivedBuffer = Buffer.from(hmacHeader);

            if (
                generatedBuffer.length !== receivedBuffer.length ||
                !crypto.timingSafeEqual(
                    generatedBuffer,
                    receivedBuffer
                )
            ) {
                return res.status(401).send("Invalid HMAC");
            }

            const payload = JSON.parse(req.body.toString("utf8"));

            const shopDomain = req.get("X-Shopify-Shop-Domain");

            if (!shopDomain) {
                return res.status(400).send("Invalid shop domain");
            }

            const productId = `gid://shopify/Product/${payload.id}`;

            await ProductActivity.create({
                shop: shopDomain,

                productId,

                action: "WEBHOOK_UPDATE",

                oldValue: null,

                newValue: {
                    title: payload.title,
                    status: payload.status,
                    vendor: payload.vendor,
                    productType: payload.product_type,
                    updatedAt: payload.updated_at
                }
            })

            console.log(
                "Shopify product update webhook received:",
                productId
            )

            return res.status(200).send("Webhook received");

        } catch (error) {
            console.error(
                "Webhook error:",
                error.message
            )

            return res.status(500).send("Webhook processing failed")
        }
    }
)

module.exports = router