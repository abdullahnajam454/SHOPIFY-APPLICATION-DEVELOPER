# Shopify Product Manager Backend

Node.js and Express backend for managing Shopify products through the Admin GraphQL API.

## Requirements

- Node.js 18 or newer
- MongoDB
- Shopify development store and app
- Public HTTPS URL for local OAuth and webhooks

## Setup

1. Copy `.env.example` to `.env` and fill in the Shopify and MongoDB values.
2. Set `SHOPIFY_REDIRECT_URI` to `<public-url>/auth/callback`.
3. Register the same callback URL in the Shopify app configuration.
4. Install dependencies with `npm install`.
5. Start the API with `npm run dev`.

The current app requests `read_products`, `write_products`, and `read_inventory` scopes.

## Authentication

Start installation by opening:

`GET /auth?shop=your-store.myshopify.com`

The callback stores the shop access token in MongoDB. Product API requests must include either the `X-Shopify-Shop-Domain` header or a `shop` query parameter.

## Product API

- `GET /api/products?limit=10&cursor=<cursor>&search=<query>`
- `POST /api/products`
- `GET /api/products/:id`
- `PATCH /api/products/:id`
- `GET /api/products/:id/activities`

Product updates are sent to Shopify with `productUpdate` before an activity record is stored.

## Webhook

Shopify sends `products/update` to:

`POST /webhooks/products-update`

The backend verifies `X-Shopify-Hmac-Sha256` against the raw request body and records the event in `ProductActivity`.

To generate a valid local test signature:

`node test-webhook.js`

Do not commit `.env` or real Shopify credentials. Rotate any credentials that have been exposed.
