<?php

require_once __DIR__ . '/baselinker_api/vendor/autoload.php';
require_once __DIR__ . '/includes/helpers.php';

// Configuration
define('DB_HOST', 'ls-e762e8d374f4ba2167eace39cfc7a740a111318f.czs6kg88k6zy.us-east-2.rds.amazonaws.com');
define('DB_PORT', '5432');
define('DB_NAME', 'dbaimagic');
define('DB_USER', 'djhollywood');
define('DB_PASSWORD', '!Maverick007!');
define('BASELINKER_API_TOKEN', '8002043-8022066-YE18MFRCWOF6M64RTEOAEEOPYCM4MMYYM5R4X6JP77T6D1YTL4JHF0RJ1DEA6RMH');
define('BASELINKER_INVENTORY_ID', '35120');

use Baselinker\Baselinker;

// Helper function for logging
function log_message(string $message): void {
    echo "[" . date('Y-m-d H:i:s') . "] " . $message . PHP_EOL;
}

function processBatch($baselinker, $products, $db_connection) {
    // Group products by operation type
    $batch = prepareBulkUpdate($products);
    
    // Log batch statistics
    log_message("Batch summary:");
    log_message("Products to create: " . count($batch['create']));
    log_message("Products to update: " . count($batch['update']));
    log_message("Products to skip: " . count($batch['skip']));

    // Process updates first
    foreach ($batch['update'] as $product) {
        try {
            $productData = [
                'inventory_id' => BASELINKER_INVENTORY_ID,
                'product_id' => $product['baselinker_id'],
                'product_data' => [
                    'sku' => $product['sku'] ?? $product['upc'] ?? '',
                    'price_brutto' => (float)($product['price'] ?? 0),
                    'quantity' => 1,
                    'ebay_category_id' => getEbayCategoryId($product),
                ]
            ];

            // Add images if available
            if (!empty($product['image_urls'])) {
                $imageData = json_decode($product['image_urls'], true);
                if ($imageData && isset($imageData['urls'])) {
                    $validImages = validateProductImages($imageData['urls']);
                    if (!empty($validImages)) {
                        $productData['product_data']['images'] = [];
                        foreach ($validImages as $index => $url) {
                            $productData['product_data']['images']['image_' . ($index + 1)] = $url;
                        }
                    }
                }
            }

            $response = $baselinker->productCatalog()->updateInventoryProduct(
                (int)$product['baselinker_id'],
                [
                    'inventory_id' => BASELINKER_INVENTORY_ID,
                    'product_data' => $productData['product_data']
                ]
            );
            $responseData = $response->toArray();

            if (isset($responseData['status']) && $responseData['status'] === 'SUCCESS') {
                log_message("Updated product ID: " . $product['baselinker_id']);
            } else {
                log_message("Failed to update product ID: " . $product['baselinker_id'] . 
                    " Error: " . ($responseData['error_message'] ?? 'Unknown error'));
            }
        } catch (\Exception $e) {
            log_message("Error updating product ID " . $product['baselinker_id'] . ": " . $e->getMessage());
        }
    }

    // Process new products
    if (!empty($batch['create'])) {
        foreach ($batch['create'] as $product) {
            try {
                $productName = $product['title'] ?? '';
                if (empty($productName)) {
                    $parts = [];
                    if (!empty($product['brand'])) $parts[] = $product['brand'];
                    if (!empty($product['condition'])) $parts[] = $product['condition'];
                    $parts[] = 'Product';
                    $parts[] = '(UPC: ' . ($product['upc'] ?? 'Unknown') . ')';
                    $productName = implode(' - ', array_filter($parts));
                }

                $newProductData = [
                    'inventory_id' => BASELINKER_INVENTORY_ID,
                    'product_data' => [
                        'sku' => $product['sku'] ?? $product['upc'] ?? '',
                        'ebay_account_id' => '3804',
                        'price_brutto' => (float)($product['price'] ?? 0),
                        'quantity' => 1,
                        'ebay_category_id' => getEbayCategoryId($product),
                    ],
                    'translations' => [
                        'en' => [
                            'name' => $productName,
                            'description' => $product['description'] ?? ''
                        ]
                    ],
                    'text_fields' => [
                        'name' => [
                            'value' => $productName,
                            'lang' => 'en'
                        ],
                        'description' => [
                            'value' => $product['description'] ?? '',
                            'lang' => 'en'
                        ]
                    ]
                ];

                // Add images if available
                if (!empty($product['image_urls'])) {
                    $imageData = json_decode($product['image_urls'], true);
                    if ($imageData && isset($imageData['urls'])) {
                        $validImages = validateProductImages($imageData['urls']);
                        if (!empty($validImages)) {
                            $newProductData['product_data']['images'] = [];
                            foreach ($validImages as $index => $url) {
                                $newProductData['product_data']['images']['image_' . ($index + 1)] = $url;
                                if ($index === 0) {
                                    $newProductData['product_data']['ebay_image_url'] = $url;
                                }
                            }
                        }
                    }
                }

                $response = $baselinker->productCatalog()->addInventoryProduct($newProductData);
                $responseData = $response->toArray();

                if (isset($responseData['status']) && $responseData['status'] === 'SUCCESS') {
                    $baselinker_id = $responseData['product_id'];
                    log_message("Created new product. SKU: " . ($product['sku'] ?? 'N/A') . 
                        ", Baselinker ID: " . $baselinker_id);
                    
                    // Store Baselinker ID in database
                    $update_query = "UPDATE products SET baselinker_id = $1 WHERE id = $2";
                    $update_result = pg_query_params($db_connection, $update_query, 
                        [$baselinker_id, $product['id']]);
                    
                    if (!$update_result) {
                        log_message("Warning: Failed to store Baselinker ID for product ID " . 
                            $product['id']);
                    }
                } else {
                    log_message("Failed to create product SKU: " . ($product['sku'] ?? 'N/A') . 
                        " Error: " . ($responseData['error_message'] ?? 'Unknown error'));
                }
            } catch (\Exception $e) {
                log_message("Error creating product SKU " . ($product['sku'] ?? 'N/A') . 
                    ": " . $e->getMessage());
            }
        }
    }

    // Log skipped products
    foreach ($batch['skip'] as $product) {
        log_message("Skipped product UPC: " . ($product['upc'] ?? 'N/A') . 
            " - Missing required fields or invalid data");
    }
}

// Database connection string
$conn_string = sprintf(
    "host=%s port=%s dbname=%s user=%s password=%s",
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USER,
    DB_PASSWORD
);

// Main execution
try {
    log_message("Starting bulk update process...");
    $baselinker = new Baselinker(BASELINKER_API_TOKEN);
    log_message("Baselinker API client initialized for bulk update.");

    // Connect to database
    $db_connection = pg_connect($conn_string);
    if (!$db_connection) {
        throw new Exception("Failed to connect to database: " . pg_last_error());
    }

    // First ensure the last_modified column exists
    $create_column_sql = file_get_contents('create_last_modified_column.sql');
    pg_query($db_connection, $create_column_sql);

    // Get products that need updating
    $query = "SELECT id, upc, sku, title, description, price, brand, condition, 
              image_urls, baselinker_id 
              FROM products 
              WHERE last_modified > (NOW() - INTERVAL '24 HOURS')
              OR baselinker_id IS NULL
              LIMIT 100";  // Process in batches of 100

    $result = pg_query($db_connection, $query);
    if (!$result) {
        throw new Exception("Failed to fetch products: " . pg_last_error($db_connection));
    }

    $products = pg_fetch_all($result);
    if (empty($products)) {
        log_message("No products found for update.");
        exit(0);
    }

    processBatch($baselinker, $products, $db_connection);

} catch (\Exception $e) {
    log_message("Error in bulk update: " . $e->getMessage());
    exit(1);
} finally {
    if (isset($db_connection)) {
        pg_close($db_connection);
    }
}

log_message("Bulk update completed.");
