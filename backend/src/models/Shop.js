const mongoose  = require("mongoose")

const shopSchema = new mongoose.Schema({
    shop:{
        type: String,
            required: true,
            unique: true,
            trim: true,
    },
    accessToken: {
            type: String,
            required: true,
        },
}, {
    timestamps: true,
})

module.exports = mongoose.model("Shop", shopSchema)