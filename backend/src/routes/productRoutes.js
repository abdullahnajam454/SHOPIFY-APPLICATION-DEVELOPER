const express = require("express");

const {
    getProducts,
    createProduct,
    getProductById,
    updateProduct,
    getProductActivities,
    addProductImage,
} = require("../controllers/productController");
const { requireShopifyAuth } = require("../middleware/shopifyAuth");

const router = express.Router()

router.use(requireShopifyAuth);

router.get("/", getProducts)
router.post("/", createProduct)
router.get("/:id/activities", getProductActivities);
router.post("/:id/images", addProductImage);
router.get("/:id", getProductById)
router.patch("/:id", updateProduct)

module.exports = router