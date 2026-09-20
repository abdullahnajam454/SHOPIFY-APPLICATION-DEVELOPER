const crypto = require("crypto");
require("dotenv").config();

const secret = process.env.SHOPIFY_CLIENT_SECRET;

const payload = JSON.stringify({
    id: 8273638654061,
    title: "Webhook Test Product",
    status: "active",
    vendor: "Test Vendor",
    product_type: "Electronics",
    updated_at: new Date().toISOString()
});

const hmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64");

console.log("PAYLOAD:");
console.log(payload);

console.log("\nHMAC:");
console.log(hmac);