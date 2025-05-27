<?php

require_once __DIR__ . '/baselinker_api/vendor/autoload.php';

// Add these lines for dotenv
if (file_exists(__DIR__ . '/.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} else {
    // Fallback or error handling if .env is missing, though for this task we assume it will be present.
    // For now, let's die if .env is not found, to make it clear.
    die('.env file not found. Please create one based on .env.example.');
}

use Baselinker\Baselinker;

// Configuration
define('BASELINKER_API_TOKEN', getenv('BASELINKER_API_TOKEN'));
define('BASELINKER_INVENTORY_ID', '35120');

// Helper function for logging
function log_message(string $message): void {
    echo "[" . date('Y-m-d H:i:s') . "] " . $message . PHP_EOL;
}

// Initialize Baselinker API Client
try {
    $baselinker = new Baselinker(BASELINKER_API_TOKEN);
    log_message("Baselinker API client initialized.");
    
    // Create a new product with eBay integration fields
    log_message("Creating product with eBay integration fields...");
    
    $testProduct = [
        'inventory_id' => 35120,
        'product_data' => [
            'sku' => 'TEST-123',
            'ebay_account_id' => '3804',
            'ebay_title' => 'Test Product Title',
            'ebay_description' => 'Test Product Description',
            'ebay_category_id' => '1',
            'price_brutto' => 9.99,
            'quantity' => 10
        ],
        'translations' => [
            'en' => [
                'name' => 'Test Product Title',
                'description' => 'Test Product Description'
            ]
        ],
        'text_fields' => [
            'name' => [
                'value' => 'Test Product Title',
                'lang' => 'en'
            ],
            'description' => [
                'value' => 'Test Product Description',
                'lang' => 'en'
            ]
        ]
    ];
    
    log_message("\nAttempting to add product with data: " . json_encode($testProduct, JSON_PRETTY_PRINT));
    $addProductResponse = $baselinker->productCatalog()->addInventoryProduct($testProduct);
    log_message("Add product response: " . json_encode($addProductResponse->toArray(), JSON_PRETTY_PRINT));
    
} catch (\Exception $e) {
    log_message("Error: " . $e->getMessage());
}

?>
