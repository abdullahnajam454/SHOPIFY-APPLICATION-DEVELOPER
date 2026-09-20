const mongoose = require("mongoose");

const productActivitySchema = new mongoose.Schema(
    {
        shop: {
            type: String,
            required: true,
            trim: true,
        },

        productId: {
            type: String,
            required: true,
            trim: true,
        },

        action: {
            type: String,
            required: true,
            enum: [
                "CREATE",
                "UPDATE",
                "DELETE",
                "WEBHOOK_UPDATE"
            ],
        },

        oldValue: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },

        newValue: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model(
    "ProductActivity",
    productActivitySchema
)