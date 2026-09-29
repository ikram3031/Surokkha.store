# mtEcomWhite (Multi-Tenant eCommerce White-Label Backend)

## Feature: Meta Commerce Catalog Feed
The backend automatically generates a dynamic Facebook/Meta Catalog CSV Feed for the active client.

### Endpoint
`GET /api/v1/products/feed/meta-catalog.csv`

### Description
This endpoint generates a compliant Meta Commerce Manager Data Feed in CSV format dynamically from the `ProductModel`. It maps the following fields:
- **id**: 16-character `did` (e.g. `b9de8b186df2b554`) matching the Meta Pixel and CAPI `contents[].id`.
- **title**: Product Name
- **description**: Product Description
- **availability**: In Stock / Out of Stock
- **condition**: New
- **link**: Fully qualified canonical product slug
- **image_link**: Absolute URL to the primary product image
- **brand**: Fetched from `activeClient.json`
- **price**: Base Price in BDT
- **sale_price**: Offer Price in BDT (if applicable)

### Usage
Provide the URL `https://api.<client-domain>.com/api/v1/products/feed/meta-catalog.csv` directly into **Meta Commerce Manager > Data Sources > Data Feed > Schedule**. Meta will fetch and sync the latest products and prices automatically.
