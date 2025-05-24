# BaseLinker N8N Workflows

This directory contains the n8n workflows for the BaseLinker product management system.

## Workflows Overview

### 1. Enrich Product Workflow (`enrich-product-workflow.json`)
- **Endpoint**: `POST /webhook/enrich-product`
- **Purpose**: Enriches product data by fetching information from multiple sources (eBay, Amazon, UPC databases)
- **Input**: `{ "upc": "product_upc_code" }`
- **Output**: Enriched product data with images, descriptions, and metadata

### 2. Get Product Details Workflow (`get-product-details-workflow.json`)
- **Endpoint**: `GET /webhook/get-single-product-details?upc={upc}`
- **Purpose**: Retrieves detailed product information for a specific UPC
- **Input**: UPC as query parameter
- **Output**: Complete product data including images and enrichment status

### 3. Save Product Images Workflow (`save-product-images-workflow.json`)
- **Endpoint**: `POST /webhook/product-images`
- **Purpose**: Saves selected product images with ordering and main image designation
- **Input**: 
  ```json
  {
    "upc": "product_upc_code",
    "selected_images": [
      {
        "url": "image_url",
        "order": 1,
        "is_main": true,
        "source": "amazon",
        "variant": "MAIN",
        "width": 500,
        "height": 500
      }
    ]
  }
  ```
- **Output**: Success/error response

### 4. Update Product Info Workflow (`update-product-info-workflow.json`)
- **Endpoint**: `POST /webhook/edit-update`
- **Purpose**: Updates product information and metadata
- **Input**: Product data object with UPC and fields to update
- **Output**: Success/error response

## Current Endpoints Configuration

The HTML files are configured to use these endpoints:
- Main endpoint: `https://n8n.by1.net/webhook/`
- Enrich product: `https://n8n.by1.net/webhook/enrich-product`
- Get product details: `https://n8n.by1.net/webhook/get-single-product-details`
- Save images: `https://n8n.by1.net/webhook/product-images`
- Update product: `https://n8n.by1.net/webhook/edit-update`

## Image Management Features

The product detail page includes comprehensive image management:

### Features Available:
1. **Image Selection**: Check/uncheck images to include in the final product
2. **Drag and Drop Reordering**: Rearrange selected images by dragging thumbnails
3. **Main Image Selection**: Designate one image as the primary display image
4. **Multiple Source Support**: Images from Amazon, eBay, UPCitemDB, and custom sources
5. **Image Preview**: Click any image to preview it as the main image
6. **Batch Save**: Save all selected images with their order and main designation

### Troubleshooting Image Issues:

If image management isn't working properly:

1. **Check Browser Console**: Look for JavaScript errors
2. **Verify n8n Workflows**: Ensure the workflows return proper image data
3. **Test Endpoints**: Verify that the webhook URLs are accessible
4. **Check Image URLs**: Ensure image URLs are valid and accessible
5. **CORS Issues**: Make sure n8n is configured to allow CORS from your domain

### Expected Data Structure for Images:

The workflows should return image data in this format:
```json
{
  "upc": "123456789012",
  "main_image_url": "https://example.com/main.jpg",
  "image_urls": {
    "urls": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]
  },
  "kept_images": [
    {
      "url": "https://example.com/selected.jpg",
      "order": 1,
      "is_main": true,
      "source": "amazon"
    }
  ],
  "raw_amazon_payload": {
    "items": [{
      "images": [{
        "images": [{
          "link": "https://amazon.com/image.jpg",
          "variant": "MAIN",
          "width": 500,
          "height": 500
        }]
      }]
    }]
  },
  "raw_ebay_payload": {
    "itemSummaries": [{
      "image": { "imageUrl": "https://ebay.com/image.jpg" },
      "thumbnailImages": [{ "imageUrl": "https://ebay.com/thumb.jpg" }]
    }]
  }
}
```

## Installation Instructions

1. Import each JSON file into your n8n instance
2. Configure database connections and API credentials
3. Activate the workflows
4. Update the webhook URLs in the HTML files if different from the configured endpoints
5. Test each endpoint individually to ensure proper functionality

## Next Steps

To enhance the image management system:

1. **Add Image Upload**: Allow users to upload custom images
2. **Image Optimization**: Automatically resize/optimize images
3. **Bulk Operations**: Select/deselect all images at once
4. **Image Validation**: Check image URLs for accessibility
5. **Advanced Filters**: Filter images by source, size, or quality
