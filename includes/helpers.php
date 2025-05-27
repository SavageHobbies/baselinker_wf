<?php

/**
 * Validates an image URL by checking format and accessibility
 * 
 * @param string $url The URL to validate
 * @return bool True if valid and accessible, false otherwise
 */
function validateImageUrl($url) {
    // Check if URL is properly formatted
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return false;
    }

    // Check if URL ends with common image extensions
    $validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $extension = strtolower(pathinfo($url, PATHINFO_EXTENSION));
    if (!in_array($extension, $validExtensions)) {
        return false;
    }

    // Check if URL is accessible
    $headers = get_headers($url, 1);
    if (!$headers || strpos($headers[0], '200') === false) {
        return false;
    }

    // Check if content type is an image
    if (isset($headers['Content-Type'])) {
        $contentType = is_array($headers['Content-Type']) 
            ? $headers['Content-Type'][0] 
            : $headers['Content-Type'];
        if (!str_starts_with($contentType, 'image/')) {
            return false;
        }
    }

    return true;
}

/**
 * Gets the most appropriate eBay category ID based on product data
 * 
 * @param array $product The product data array
 * @return string The eBay category ID
 */
function getEbayCategoryId($product) {
    static $categories = null;
    if ($categories === null) {
        $categories = require __DIR__ . '/ebay_categories.php';
    }

    $searchText = strtolower($product['title'] . ' ' . ($product['description'] ?? ''));
    
    foreach ($categories as $keyword => $categoryId) {
        if ($keyword !== 'default' && stripos($searchText, $keyword) !== false) {
            return $categoryId;
        }
    }

    return $categories['default'];
}

/**
 * Prepares a batch of products for bulk update
 * 
 * @param array $products Array of products to update
 * @return array Products grouped by operation type
 */
function prepareBulkUpdate($products) {
    $batch = [
        'create' => [],
        'update' => [],
        'skip' => []
    ];

    foreach ($products as $product) {
        if (!empty($product['baselinker_id'])) {
            $batch['update'][] = $product;
        } elseif (!empty($product['title']) && !empty($product['price'])) {
            $batch['create'][] = $product;
        } else {
            $batch['skip'][] = $product;
        }
    }

    return $batch;
}

/**
 * Validates and filters product images
 * 
 * @param array $imageUrls Array of image URLs
 * @return array Valid image URLs
 */
function validateProductImages($imageUrls) {
    $validImages = [];
    
    foreach ($imageUrls as $url) {
        if (validateImageUrl($url)) {
            $validImages[] = $url;
        }
    }
    
    return $validImages;
}
