const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./src/config/db");

const productRoutes = require("./src/routes/productRoutes");
const webhookRoutes = require("./src/routes/webhookRoutes");
const authRoutes = require("./src/routes/authRoutes");

const app = express();
app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

connectDB()

// Webhooks MUST come before express.json()
app.use("/webhooks", webhookRoutes)
app.use("/auth", authRoutes)

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Shopify Product Manager Backend is running"
    })
})

app.use("/api/products", productRoutes);

const frontendPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(frontendPath));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})