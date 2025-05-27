<?php

// Include Composer autoloader
require_once __DIR__ . '/baselinker_api/vendor/autoload.php';

// --- Configuration ---
// Database Configuration
define('DB_HOST', 'ls-e762e8d374f4ba2167eace39cfc7a740a111318f.czs6kg88k6zy.us-east-2.rds.amazonaws.com');
define('DB_PORT', '5432');
define('DB_NAME', 'dbaimagic');
define('DB_USER', 'djhollywood');
define('DB_PASSWORD', '!Maverick007!');

// Baselinker API Configuration
define('BASELINKER_API_TOKEN', '8002043-8022066-YE18MFRCWOF6M64RTEOAEEOPYCM4MMYYM5R4X6JP77T6D1YTL4JHF0RJ1DEA6RMH');
define('BASELINKER_INVENTORY_ID', '35120'); // e.g., 'bl_1' or a numeric ID

// --- End Configuration ---


use Baselinker\Baselinker;

// Include helper functions
require_once __DIR__ . '/includes/helpers.php';

// --- Helper Functions ---
function log_message(string $message): void
{
    echo "[" . date('Y-m-d H:i:s') . "] " . $message . PHP_EOL;
}

// --- Main Script Logic ---

log_message("Starting product synchronization script.");

// 1. Initialize Baselinker API Client
try {
    $baselinker = new Baselinker(BASELINKER_API_TOKEN);
    log_message("Baselinker API client initialized.");
} catch (\Exception $e) {
    log_message("Error initializing Baselinker API client: " . $e->getMessage());
    exit(1);
}

// 2. Database Connection
$conn_string = sprintf(
    "host=%s port=%s dbname=%s user=%s password=%s",
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USER,
    DB_PASSWORD
);

$db_connection = pg_connect($conn_string);

if (!$db_connection) {
    log_message("Error connecting to PostgreSQL database: " . pg_last_error());
    exit(1);
}
log_message("Successfully connected to PostgreSQL database.");

// 3. Fetch Products from Database
// Essential columns: upc, sku, title, description, price, brand, condition, image_urls
// Add other relevant columns like ean, weight, stock as needed.
// First ensure the baselinker_id column exists
$create_column_sql = file_get_contents('create_baselinker_id_column.sql');
pg_query($db_connection, $create_column_sql);

$query = "SELECT id, upc, sku, title, description, price, brand, condition, image_urls, baselinker_id FROM products";
// Later, you might want to add a WHERE clause, e.g., "WHERE status = 'pending_sync'" or "WHERE last_updated > 'some_timestamp'"

$result = pg_query($db_connection, $query);

if (!$result) {
    log_message("Error fetching products from database: " . pg_last_error($db_connection));
    pg_close($db_connection);
    exit(1);
}

$products_to_sync = pg_fetch_all($result);

if (empty($products_to_sync)) {
    log_message("No products found in the database to sync.");
    pg_close($db_connection);
    exit(0);
}

log_message("Fetched " . count($products_to_sync) . " products from the database.");

// 4. Process and Sync Each Product
foreach ($products_to_sync as $product) {
    log_message("Processing product UPC: " . ($product['upc'] ?? 'N/A') . ", SKU: " . ($product['sku'] ?? 'N/A'));

    // Prepare data for Baselinker API
    // Try different variations of name field
    $productName = $product['title'] ?? '';
    if (empty($productName)) {
        $parts = [];
        if (!empty($product['brand'])) {
            $parts[] = $product['brand'];
        }
        if (!empty($product['condition'])) {
            $parts[] = $product['condition'];
        }
        $parts[] = 'Product';
        $parts[] = '(UPC: ' . ($product['upc'] ?? 'Unknown') . ')';
        $productName = implode(' - ', array_filter($parts));
    }

    // Get appropriate eBay category using helper function
    $ebayCategory = getEbayCategoryId($product);

    // Set product condition for eBay
    $ebayCondition = '1000'; // Default to 'New'
    if (!empty($product['condition'])) {
        switch (strtolower($product['condition'])) {
            case 'used':
                $ebayCondition = '3000';
                break;
            case 'like new':
                $ebayCondition = '2000';
                break;
            case 'refurbished':
                $ebayCondition = '2500';
                break;
        }
    }

    $productDataForApi = [
        'inventory_id' => BASELINKER_INVENTORY_ID,
        'product_data' => [
            'sku' => $product['sku'] ?? $product['upc'] ?? '',
            'ebay_account_id' => '3804',
            'price_brutto' => (float)($product['price'] ?? 0),
            'quantity' => 1,
            'ebay_category_id' => $ebayCategory,
            'ebay_condition_id' => $ebayCondition,
            'ebay_payment_methods' => ['PayPal'],
            'ebay_shipping_methods' => ['Standard Shipping'],
            'ebay_product_location' => 'United States',
            'ebay_dispatch_time' => 3, // Days to ship
            'ebay_listing_duration' => 'GTC', // Good Till Cancelled
            'ebay_returns_accepted' => true,
            'ebay_returns_within' => '30 Days',
            'ebay_returns_shipping_cost_paid_by' => 'Buyer'
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

    // Conditionally add ean, stock, and weight if they exist and are not empty/null
    if (isset($product['ean']) && !empty($product['ean'])) {
        $productDataForApi['ean'] = $product['ean'];
    }
    if (isset($product['stock']) && $product['stock'] !== null) {
        $productDataForApi['stock'] = (int)$product['stock'];
    }
    if (isset($product['weight']) && $product['weight'] !== null) {
        $productDataForApi['weight'] = (float)$product['weight'];
    }

    // Handle and validate product images
    if (!empty($product['image_urls'])) {
        $imageData = json_decode($product['image_urls'], true);
        if (json_last_error() === JSON_ERROR_NONE && isset($imageData['urls']) && is_array($imageData['urls'])) {
            $validImages = validateProductImages($imageData['urls']);
            
            if (!empty($validImages)) {
                $productDataForApi['product_data']['images'] = [];
                foreach ($validImages as $index => $url) {
                    $productDataForApi['product_data']['images']['image_' . ($index + 1)] = $url;
                    
                    if ($index === 0) {
                        $productDataForApi['product_data']['ebay_image_url'] = $url;
                    }
                }
            } else {
                log_message("Warning: No valid images found for product SKU: " . ($product['sku'] ?? 'N/A'));
            }
        } else {
            log_message("Warning: Could not decode image_urls for product SKU: " . ($product['sku'] ?? 'N/A'));
        }
    }



    // Add custom fields if needed, for example 'brand' and 'condition'
    if (!empty($product['brand']) || !empty($product['condition'])) {
        $productDataForApi['features'] = [];
        if (!empty($product['brand'])) {
            $productDataForApi['features']['Brand'] = $product['brand'];
        }
        if (!empty($product['condition'])) {
            $productDataForApi['features']['Condition'] = $product['condition'];
        }
    }


    // Call Baselinker API to add product
    try {
        log_message("Attempting to add product to Baselinker with data: " . json_encode($productDataForApi, JSON_PRETTY_PRINT));
        // The ProductCatalog class should be available via the $baselinker instance
        $apiResponse = $baselinker->productCatalog()->addInventoryProduct($productDataForApi);

        $responseData = $apiResponse->toArray();
        if (isset($responseData['status']) && $responseData['status'] === 'SUCCESS') {
            $baselinker_id = $responseData['product_id'];
            log_message("Product SKU: " . ($product['sku'] ?? 'N/A') . " synced successfully. Baselinker Product ID: " . $baselinker_id);
            
            // Store Baselinker ID in database
            $update_query = "UPDATE products SET baselinker_id = $1 WHERE id = $2";
            $update_result = pg_query_params($db_connection, $update_query, [$baselinker_id, $product['id']]);
            
            if (!$update_result) {
                log_message("Warning: Failed to store Baselinker ID in database for product ID " . $product['id']);
            }
        } else {
            $errorMessage = "Error syncing product SKU: " . ($product['sku'] ?? 'N/A') . ". Baselinker response: " . json_encode($responseData);
            if (isset($responseData['error_code'])) {
                $errorMessage .= " (Code: " . $responseData['error_code'] . ")";
            }
            if (isset($responseData['error_message'])) {
                $errorMessage .= " (Message: " . $responseData['error_message'] . ")";
            }
            log_message($errorMessage);
        }
    } catch (\Exception $e) {
        log_message("Exception during Baselinker API call for product SKU: " . ($product['sku'] ?? 'N/A') . ". Error: " . $e->getMessage());
    }
    log_message("---"); // Separator for product logs
}

// 5. Close Database Connection
pg_close($db_connection);
log_message("Product synchronization script finished.");

?>
