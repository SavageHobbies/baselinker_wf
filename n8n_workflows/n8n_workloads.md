{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "enrich-product",
        "options": {
          "responseData": ""
        }
      },
      "name": "Webhook (POST /enrich-product)",
      "type": "n8n-nodes-base.webhook",
      "position": [
        -1100,
        520
      ],
      "id": "f8180b37-b75c-4eef-9e7b-3b8ab628691f",
      "typeVersion": 2,
      "webhookId": "5b299e27-bf6e-482b-aff1-7ec65caa7ec7"
    },
    {
      "parameters": {
        "url": "https://api.ebay.com/buy/browse/v1/item_summary/search",
        "authentication": "genericCredentialType",
        "genericAuthType": "oAuth2Api",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "gtin",
              "value": "={{ $json.upc }}"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-EBAY-C-MARKETPLACE-ID",
              "value": "EBAY-US"
            }
          ]
        },
        "options": {
          "timeout": 15000
        }
      },
      "id": "e02cbf11-efeb-444a-a257-b3d8b347a229",
      "name": "API Call: eBay Browse API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [
        260,
        400
      ],
      "credentials": {
        "oAuth2Api": {
          "id": "uyDoEPeMUvATmqb9",
          "name": "eBay Dev Connection"
        }
      },
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.upcitemdb.com/prod/trial/lookup",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Accept",
              "value": "application/json"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ ({ \"upc\": $json.upc }) }}",
        "options": {
          "timeout": 15000
        }
      },
      "id": "d3c26abd-05fe-440e-95a3-d2d013d6b9f3",
      "name": "API Call: UPCitemdb",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [
        -620,
        620
      ],
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "0b0d3deb-5cf8-4bc0-a8b3-f989b0bc1862",
              "name": "upcitemdb_api_output",
              "value": "={{ $json }}",
              "type": "json"
            },
            {
              "id": "dff30919-cc41-4eb2-be4d-bc607c7adbdf",
              "name": "id",
              "value": "={{ $items(\"Set: Store eBay Output\").first().json.id }}",
              "type": "string"
            },
            {
              "id": "0e874c29-5131-4b03-947c-72d7ddc1e37c",
              "name": "upc",
              "value": "={{ $items(\"Set: Store eBay Output\").first().json.upc }}",
              "type": "string"
            },
            {
              "id": "ea0495e4-946a-4852-8ba9-194a85239258",
              "name": "name",
              "value": "={{ $items(\"Set: Store eBay Output\").first().json.name || $items(\"Set: Store eBay Output\").first().json[\"name \"] }}",
              "type": "string"
            },
            {
              "id": "58a90426-9250-43cb-a1a6-6dd8d45b7826",
              "name": "amazonData",
              "value": "={{ $items(\"Set: Store eBay Output\").first().json.amazonData }}",
              "type": "object"
            },
            {
              "id": "e27175b6-c2fa-4bee-84ff-6ac210d37690",
              "name": "ebay_api_output",
              "value": "={{ $items(\"Set: Store eBay Output\").first().json.ebay_api_output }}",
              "type": "object"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        -400,
        620
      ],
      "id": "8b76acf7-fce9-4419-9bb9-d70d607fc31f",
      "name": "Set: Store UPCitemdb Output"
    },
    {
      "parameters": {
        "jsCode": "// --- 1. Initialize Comprehensive Product Data Structure ---\n// ... (no changes here) ...\nlet productData = {\n  id: null,\n  upc: null,\n  name: null,\n\n  am_title: null,\n  am_brand: null,\n  am_price: null,\n  am_currency: null,\n  am_imageUrl: null,\n  am_features: [],\n  am_error: null,\n  raw_amazon: null,\n\n  eb_title: null,\n  eb_price: null,\n  eb_currency: null,\n  eb_imageUrl: null,\n  eb_condition: null,\n  eb_epid: null,\n  eb_watchCount: null,\n  eb_sellerUsername: null,\n  eb_itemLocation: null,\n  eb_error: null,\n  raw_ebay: null,\n\n  upcdb_title: null,\n  upcdb_brand: null,\n  upcdb_description: null,\n  upcdb_imageUrl: null,\n  upcdb_offers: [],\n  upcdb_lowestPrice: null,\n  upcdb_highestPrice: null,\n  upcdb_offerCount: 0,\n  upcdb_error: null,\n  raw_upcitemdb: null,\n\n  ai_optimized_title: null, // To be filled by AI node\n  ai_optimized_description: null, // To be filled by AI node\n  ai_seo_keywords: [], // To be filled by AI node\n  ai_sales_summary: null, // To be filled by AI node\n\n  enrichment_status: 'pending_processing',\n  last_api_error_source: null,\n  last_api_error_message: null\n};\n\n// --- 2. Process the Single Incoming Item ---\nconst incomingItem = $input.item;\n// console.log(\"Full incomingItem: \" + JSON.stringify(incomingItem, null, 2)); \n\nif (!incomingItem || typeof incomingItem.json === 'undefined') {\n  console.error(\"Code: Merge All Data - No valid JSON payload in the incoming item.\");\n  productData.enrichment_status = 'error_no_input_to_merge_node';\n  return [{ json: productData }];\n}\n\nconst allData = incomingItem.json;\n// console.log(\"allData (incomingItem.json): \" + JSON.stringify(allData, null, 2));\n\nproductData.id = allData.id || null;\nproductData.upc = allData.upc || null;\nproductData.name = allData.name || allData[\"name \"] || null;\n\n\n// --- Process Amazon Data ---\nif (allData.amazonData) {\n  let amazonSourceData;\n  if (typeof allData.amazonData === 'string') {\n    try {\n      amazonSourceData = JSON.parse(allData.amazonData);\n      productData.raw_amazon = allData.amazonData; // Store the original string\n    } catch (e) {\n      console.error(\"Failed to parse amazonData string: \", e);\n      productData.am_error = \"Failed to parse raw Amazon data\";\n      amazonSourceData = { error: true, message: productData.am_error }; // Create an error object\n    }\n  } else {\n    amazonSourceData = allData.amazonData; // It's already an object\n    productData.raw_amazon = JSON.stringify(allData.amazonData);\n  }\n\n  if (amazonSourceData.error || (amazonSourceData.items && amazonSourceData.items.length > 0 && amazonSourceData.items[0] && amazonSourceData.items[0].error) ) {\n    let errorMsg = 'Unknown Amazon API error';\n    if (amazonSourceData.error && amazonSourceData.message) { \n        errorMsg = typeof amazonSourceData.message === 'string' ? amazonSourceData.message : JSON.stringify(amazonSourceData.message);\n    } else if (amazonSourceData.items && amazonSourceData.items.length > 0 && amazonSourceData.items[0] && amazonSourceData.items[0].error) {\n        errorMsg = amazonSourceData.items[0].message || JSON.stringify(amazonSourceData.items[0].error);\n    }\n    productData.am_error = errorMsg;\n    productData.last_api_error_source = productData.last_api_error_source || 'amazon';\n    productData.last_api_error_message = productData.last_api_error_message || productData.am_error;\n  } else if (amazonSourceData.items && amazonSourceData.items.length > 0) {\n    const amItem = amazonSourceData.items[0];\n    productData.am_title = amItem.attributes?.item_name?.[0]?.value || null;\n    productData.am_brand = amItem.attributes?.brand?.[0]?.value || null;\n    if (amItem.attributes?.list_price?.[0]) {\n        productData.am_price = parseFloat(amItem.attributes.list_price[0].value);\n        productData.am_currency = amItem.attributes.list_price[0].currency;\n    } else if (amItem.attributes?.item_price?.[0]) { \n        productData.am_price = parseFloat(amItem.attributes.item_price[0].value);\n        productData.am_currency = amItem.attributes.item_price[0].currency;\n    }\n    productData.am_imageUrl = amItem.images?.[0]?.images?.[0]?.link || null;\n    productData.am_features = amItem.attributes?.bullet_point?.map(bp => bp.value) || [];\n  } else if (amazonSourceData.skipped) { \n    productData.am_error = `Skipped: ${amazonSourceData.reason || 'Unknown reason'}`;\n  }\n} else {\n  console.warn(\"Code: Merge All Data - 'amazonData' property not found.\");\n}\n\n// --- Process eBay Data ---\nif (allData.ebay_api_output) { \n  let ebaySourceData;\n  if (typeof allData.ebay_api_output === 'string') {\n    try {\n      ebaySourceData = JSON.parse(allData.ebay_api_output);\n      productData.raw_ebay = allData.ebay_api_output; // Store the original string\n    } catch (e) {\n      console.error(\"Failed to parse ebay_api_output string: \", e);\n      productData.eb_error = \"Failed to parse raw eBay data\";\n      ebaySourceData = { errors: [{ message: productData.eb_error }] }; // Create an error object\n    }\n  } else {\n    ebaySourceData = allData.ebay_api_output; // It's already an object\n    productData.raw_ebay = JSON.stringify(allData.ebay_api_output);\n  }\n\n  if (ebaySourceData.errors && ebaySourceData.errors.length > 0) { \n    productData.eb_error = ebaySourceData.errors[0]?.message || 'Unknown eBay API error';\n    productData.last_api_error_source = productData.last_api_error_source || 'ebay';\n    productData.last_api_error_message = productData.last_api_error_message || productData.eb_error;\n  } else if (ebaySourceData.itemSummaries && ebaySourceData.itemSummaries.length > 0) {\n    const ebItem = ebaySourceData.itemSummaries[0]; \n    productData.eb_title = ebItem.title || null;\n    if (ebItem.price) {\n        productData.eb_price = parseFloat(ebItem.price.value);\n        productData.eb_currency = ebItem.price.currency;\n    }\n    productData.eb_imageUrl = ebItem.image?.imageUrl || null;\n    productData.eb_condition = ebItem.condition || null;\n    productData.eb_epid = ebItem.epid || null;\n    productData.eb_watchCount = ebItem.watchCount ? parseInt(ebItem.watchCount, 10) : 0;\n    productData.eb_sellerUsername = ebItem.seller?.username || null;\n    if (ebItem.itemLocation) {\n        productData.eb_itemLocation = `${ebItem.itemLocation.city || ''} ${ebItem.itemLocation.stateOrProvince || ''} ${ebItem.itemLocation.country || ''}`.trim() || null;\n    }\n  }\n} else {\n  console.warn(\"Code: Merge All Data - 'ebay_api_output' property not found.\");\n}\n\n// --- Process UPCitemdb Data ---\n// This section seems to be working correctly as upcitemdb_api_output is already an object.\nif (allData.upcitemdb_api_output) {\n  const upcDbSourceData = allData.upcitemdb_api_output; // It's already an object\n  productData.raw_upcitemdb = JSON.stringify(upcDbSourceData);\n\n  if (upcDbSourceData.code && upcDbSourceData.code.toUpperCase() !== 'OK') {\n    productData.upcdb_error = upcDbSourceData.message || `UPCitemdb API error code: ${upcDbSourceData.code}`;\n    productData.last_api_error_source = productData.last_api_error_source || 'upcitemdb';\n    productData.last_api_error_message = productData.last_api_error_message || productData.upcdb_error;\n  } else if (upcDbSourceData.items && upcDbSourceData.items.length > 0) {\n    const upcDbItem = upcDbSourceData.items[0]; \n    productData.upcdb_title = upcDbItem.title || null;\n    productData.upcdb_brand = upcDbItem.brand || null;\n    productData.upcdb_description = upcDbItem.description || null;\n    productData.upcdb_imageUrl = upcDbItem.images?.[0] || null; \n\n    if (upcDbItem.offers && upcDbItem.offers.length > 0) {\n      productData.upcdb_offerCount = upcDbItem.offers.length;\n      productData.upcdb_offers = upcDbItem.offers.map(offer => ({\n        merchant: offer.merchant, \n        domain: offer.domain, \n        title: offer.title, \n        currency: offer.currency,\n        list_price: offer.list_price ? parseFloat(offer.list_price) : null,\n        price: offer.price ? parseFloat(offer.price) : null,\n        shipping: offer.shipping, \n        condition: offer.condition, \n        updated_t: offer.updated_t\n      }));\n      const prices = upcDbItem.offers\n        .map(o => o.price ? parseFloat(o.price) : null) \n        .filter(p => p !== null && !isNaN(p));\n      if (prices.length > 0) {\n        productData.upcdb_lowestPrice = Math.min(...prices);\n        productData.upcdb_highestPrice = Math.max(...prices);\n      }\n    }\n  }\n} else {\n  console.warn(\"Code: Merge All Data - 'upcitemdb_api_output' property not found.\");\n}\n\n// --- 3. Set Final Enrichment Status ---\n// ... (no changes to this section) ...\nif (!productData.id && !productData.upc) {\n  productData.enrichment_status = 'error_missing_identifier';\n} else if (productData.am_error || productData.eb_error || productData.upcdb_error) {\n  if (productData.am_error && productData.last_api_error_source === 'amazon') {\n    productData.enrichment_status = `data_merged_with_errors_api_amazon`;\n  } else if (productData.eb_error && productData.last_api_error_source === 'ebay') {\n    productData.enrichment_status = `data_merged_with_errors_api_ebay`;\n  } else if (productData.upcdb_error && productData.last_api_error_source === 'upcitemdb') {\n    productData.enrichment_status = `data_merged_with_errors_api_upcitemdb`;\n  } else { \n      productData.enrichment_status = `data_merged_with_errors_api_${productData.last_api_error_source || 'unknown'}`;\n  }\n} else {\n  productData.enrichment_status = 'data_merged_pending_ai';\n}\n\n// --- 4. Return Combined Data ---\nreturn [{ json: productData }];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -200,
        620
      ],
      "id": "3b0d63c3-6dce-487b-aa2b-b57a45f29caa",
      "name": "Code: Merge All Data"
    },
    {
      "parameters": {
        "jsCode": "// This Code node receives input from \"Extract Essential Data\"\n// and also needs access to N8N environment variables for credentials.\nconst item = $input.first().json;\n\n// Retrieve environment variables. N8N makes these available to Code nodes.\n// Ensure these are correctly set in your N8N's .env file or environment.\nconst refreshToken = $env.AMAZON_SPAPI_REFRESH_TOKEN;\nconst clientId = $env.SELLING_PARTNER_APP_CLIENT_ID;\nconst clientSecret = $env.SELLING_PARTNER_APP_CLIENT_SECRET;\n\n// Get values from the incoming item\nconst upc = item.upc === null || typeof item.upc === 'undefined' ? 'null' : String(item.upc);\nconst id = item.id === null || typeof item.id === 'undefined' ? 'null' : String(item.id);\n\n// For the name, ensure it's a string and escape any double quotes within it for shell safety\n// The String() constructor handles null/undefined gracefully, converting them to \"null\" or \"undefined\"\n// We then explicitly check for these string values if we want to pass the literal string 'null'.\nlet nameValue = 'null'; // Default to the string 'null'\nif (item.name !== null && typeof item.name !== 'undefined') {\n    // Ensure item.name is treated as a string, then escape double quotes.\n    // The original replace was /\\\"/g, which is correct for replacing double quotes.\n    // The \\\\\" is for the shell to see a literal quote if the name itself had one.\n    // However, for the command string itself, we need to make sure the quotes in the name are escaped\n    // so they don't break the quoting of the argument itself.\n    nameValue = String(item.name).replace(/\"/g, '\\\\\"'); \n}\n\n// Construct the full command string\n// Single quotes are used around each VAR=VALUE pair for the `env` utility.\n// Double quotes are used around each command-line argument for the Node.js script.\nconst command = `env 'AMAZON_SPAPI_REFRESH_TOKEN=${refreshToken}' 'SELLING_PARTNER_APP_CLIENT_ID=${clientId}' 'SELLING_PARTNER_APP_CLIENT_SECRET=${clientSecret}' node /scripts_for_n8n/lookup_product.js \"${upc}\" \"${id}\" \"${nameValue}\"`;\n\n// Prepare the output item for the next node\n// We pass along the original item data and add the commandToExecute\nconst outputJson = {\n  ...item, // Pass through original id, upc, name etc. from the input to this node\n  commandToExecute: command\n};\n\nreturn [{ json: outputJson }];\n"
      },
      "name": "Build Amazon API Command",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -620,
        400
      ],
      "id": "1b52d33e-a8b0-4fc9-892d-1a221c402dbc"
    },
    {
      "parameters": {
        "command": "={{$json.commandToExecute}}"
      },
      "name": "Execute Amazon SP-API Script",
      "type": "n8n-nodes-base.executeCommand",
      "typeVersion": 1,
      "position": [
        -400,
        400
      ],
      "id": "8053978c-b721-4960-afd0-6c82314cf2ea",
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "jsCode": "// Input to this node is the output of the \"Execute Amazon SP-API Script1\" node.\n// item.json from this input contains:\n//   - id, upc, name, commandToExecute (passed from \"Build Amazon API Command1\")\n//   - stdout, stderr, exitCode (from the execution of lookup_product.js)\n// The stdout string itself is already the desired JSON structure: \n//   { \"id\": \"...\", \"upc\": \"...\", \"name\": \"...\", \"amazonData\": { ...results... } }\n\nconst items = $input.all(); // Should typically be one item.\nconst resultItems = [];\n\nfor (const item of items) {\n    // item.json contains all fields from the Execute Command node's output.\n    const inputFromExecuteCmd = item.json; \n    let finalJsonOutput = {};\n\n    try {\n        if (inputFromExecuteCmd.stdout && typeof inputFromExecuteCmd.stdout === 'string' && inputFromExecuteCmd.stdout.trim() !== '') {\n            // The stdout from your script is already the correctly structured JSON.\n            // We just need to parse it and this becomes our main output.\n            finalJsonOutput = JSON.parse(inputFromExecuteCmd.stdout);\n        } else {\n            // stdout is missing or empty. This is an error condition.\n            // We should preserve the original id, upc, name if possible, and add error info.\n            // These original fields (id, upc, name) were part of the input to the Execute Command node,\n            // and the Execute Command node passes them through in its output item.\n            console.warn(\"Parse Amazon Script Output1: No valid stdout received from Execute Command node.\");\n            finalJsonOutput = { \n                id: inputFromExecuteCmd.id,     // Original ID from input to Execute Command\n                upc: inputFromExecuteCmd.upc,   // Original UPC from input to Execute Command\n                name: inputFromExecuteCmd.name, // Original Name from input to Execute Command\n                error: true, \n                source: 'parse-amazon-script-output', \n                message: 'No valid stdout from Execute Command for Amazon script.',\n                details: { \n                    stderr: inputFromExecuteCmd.stderr,\n                    exitCode: inputFromExecuteCmd.exitCode \n                }\n            };\n        }\n    } catch (e) {\n        // Error parsing the stdout JSON.\n        console.error(\"Parse Amazon Script Output1: Failed to parse JSON from stdout.\", e.message);\n        // Preserve original id, upc, name from the input to the Execute Command node.\n        finalJsonOutput = { \n            id: inputFromExecuteCmd.id,   // Corrected: Use inputFromExecuteCmd\n            upc: inputFromExecuteCmd.upc, // Corrected: Use inputFromExecuteCmd\n            name: inputFromExecuteCmd.name, // Corrected: Use inputFromExecuteCmd\n            error: true, \n            source: 'parse-amazon-script-output', \n            message: 'Failed to parse JSON from Amazon script stdout.', \n            details: e.message, \n            raw_stdout: inputFromExecuteCmd.stdout \n        };\n    }\n    resultItems.push({ json: finalJsonOutput });\n}\n\nreturn resultItems;\n"
      },
      "name": "Parse Amazon Script Output",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -180,
        400
      ],
      "id": "dcd9bd1a-4858-401f-95ad-484179ae64a5",
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": []
        },
        "includeOtherFields": true,
        "include": "except",
        "excludeFields": "envRefreshToken,clientId,clientSecret,commandToExecute",
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        40,
        400
      ],
      "id": "420846bb-36e8-4baa-a319-eedd472f8ced",
      "name": "Set: Clean Amazon Output (and pass amazonData)"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "0b0d3deb-5cf8-4bc0-a8b3-f989b0bc1862",
              "name": "ebay_api_output",
              "value": "={{ $json }}",
              "type": "json"
            },
            {
              "id": "1f9a4286-90ec-4a77-8b1e-da9279ecc112",
              "name": "id",
              "value": "={{ $items(\"Set: Clean Amazon Output (and pass amazonData)\").first().json.id }}",
              "type": "string"
            },
            {
              "id": "e66a7b86-b4d3-40d7-beb2-2a7778788681",
              "name": "upc",
              "value": "={{ $items(\"Set: Clean Amazon Output (and pass amazonData)\").first().json.upc }}",
              "type": "string"
            },
            {
              "id": "b68f1b28-5e38-48a4-8e4e-aee4e760a835",
              "name": "name ",
              "value": "={{ $items(\"Set: Clean Amazon Output (and pass amazonData)\").first().json.name }}",
              "type": "string"
            },
            {
              "id": "8da53c05-c0c7-4005-8d75-33d987e6224d",
              "name": "amazonData",
              "value": "={{ $items(\"Set: Clean Amazon Output (and pass amazonData)\").first().json.amazonData }}",
              "type": "object"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        -840,
        620
      ],
      "id": "619b371d-8579-4e3b-8fcd-d9dff161853c",
      "name": "Set: Store eBay Output"
    },
    {
      "parameters": {
        "jsCode": "// Extract only essential data from webhook input\nconst items = $input.all();\n\nif (!items || items.length === 0) {\n  console.warn(\"Extract Essential Data: No input items received. Returning empty array.\");\n  return []; \n}\n\nconst firstItem = items[0];\n\n// Check if the first item and its json property are valid\nif (!firstItem || typeof firstItem.json === 'undefined') {\n  console.warn(\"Extract Essential Data: First input item is invalid or has no json property. Returning an error item.\");\n  // Return an item with an error structure if the input is not as expected\n  return [{ json: { \n    error: \"Invalid input item structure to Extract Essential Data node\", \n    receivedInput: firstItem // Include the received input for debugging\n  } }];\n}\n\nlet dataToProcess = firstItem.json;\n\n// Check if the actual payload is nested under a 'body' property of the main JSON payload\n// This is common for webhook data.\nif (dataToProcess && typeof dataToProcess.body === 'object' && dataToProcess.body !== null) {\n  dataToProcess = dataToProcess.body;\n} else {\n  // If not nested under 'body', assume dataToProcess itself is the direct payload\n  // or that there's no further nesting to do.\n  // console.warn(\"Extract Essential Data: 'body' property not found in firstItem.json, or it's not an object. Processing firstItem.json directly.\");\n}\n\n// Ensure dataToProcess is an object before trying to access properties from it\n// This handles cases where dataToProcess.body might not exist or is not an object.\nif (typeof dataToProcess !== 'object' || dataToProcess === null) {\n  console.warn(\"Extract Essential Data: Processable data (after attempting to access .body) is not an object. Defaulting to empty object for essentialData creation.\");\n  // If dataToProcess is not an object at this point (e.g., if firstItem.json was a primitive or firstItem.json.body was not an object),\n  // assign an empty object to prevent errors when accessing .id, .upc, .name.\n  dataToProcess = {}; \n}\n\n// Create a new simplified object with only what we need\nconst essentialData = {\n  id: dataToProcess.id || null,\n  upc: dataToProcess.upc || null,\n  name: dataToProcess.name || null\n};\n\n// Return the simplified data in the format N8N expects: an array of objects,\n// where each object has a 'json' property.\nreturn [{ json: essentialData }];\n"
      },
      "name": "Extract Essential Data",
      "type": "n8n-nodes-base.code",
      "position": [
        -840,
        400
      ],
      "id": "cbc9116b-9b11-442d-8dbc-88632eb15461",
      "typeVersion": 2
    },
    {
      "parameters": {
        "modelName": "models/gemini-2.0-flash",
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "typeVersion": 1,
      "position": [
        -900,
        1020
      ],
      "id": "f91e574d-b15a-46a9-b693-9749f22aff3e",
      "name": "Google Gemini Chat Model",
      "credentials": {
        "googlePalmApi": {
          "id": "IONpyAhTFAkMw7aY",
          "name": "Google Gemini(PaLM) Api account"
        }
      }
    },
    {
      "parameters": {
        "sessionIdType": "customKey",
        "sessionKey": "=={{ $json.originalProductData.id || $json.originalProductData.upc }}"
      },
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [
        -760,
        1040
      ],
      "id": "b6e92e41-a21d-4dd7-915f-6ef95adbadac",
      "name": "Simple Memory"
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "=={{ $json.promptForAI }}",
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.9,
      "position": [
        -860,
        860
      ],
      "id": "079c4388-3fc7-438d-ad98-14b73d1a3b79",
      "name": "CPI Enhancer"
    },
    {
      "parameters": {
        "jsCode": "// Input to this node is the output from \"Code: Merge All Data\"\n// $input.item.json will be your productData object\nconst product = $input.item.json;\n\n// Extract necessary details from productData (adjust paths as needed)\nconst title = product.upcdb_title || product.eb_title || product.am_title || product.name || \"N/A\";\nconst description = product.upcdb_description || product.am_title || product.eb_title || \"Not available\";\nconst upc = product.upc || \"N/A\";\nconst brand = product.upcdb_brand || product.am_brand || product.eb_sellerUsername || \"N/A\";\nconst model = product.model || product.upcdb_model || product.am_attributes?.model_number?.[0]?.value || \"N/A\";\nconst color = product.color || product.upcdb_color || product.am_attributes?.color?.[0]?.value || \"N/A\";\nconst size = product.size || product.upcdb_size || product.am_attributes?.size?.[0]?.value || \"N/A\";\nconst dimension = product.dimension || product.upcdb_dimension || \"N/A\";\nconst weight = product.weight || product.upcdb_weight || (product.am_attributes?.item_weight?.[0]?.value ? `${product.am_attributes.item_weight[0].value} ${product.am_attributes.item_weight[0].unit}` : \"N/A\");\nconst images = product.images || product.upcdb_imageUrl || product.am_imageUrl || product.eb_imageUrl || \"N/A\";\nconst condition = product.condition || product.eb_condition || product.am_attributes?.condition_type?.[0]?.value || \"New\";\n\nconst tagKeywordsArray = [\n    title === \"N/A\" ? null : title,\n    brand === \"N/A\" ? null : brand,\n    model === \"N/A\" ? null : model,\n    color === \"N/A\" ? null : color,\n    size === \"N/A\" ? null : size,\n    product.upcdb_category ? product.upcdb_category.split(' > ').pop() : null,\n    \"Funko Pop\",\n    \"Collectible\"\n].filter(Boolean);\nconst tagKeywords = tagKeywordsArray.join(\", \");\n\nlet additionalAttributesString = \"\";\nconst knownFieldsForPrompt = ['id', 'upc', 'name', 'am_title', 'am_brand', 'am_price', 'am_currency', 'am_imageUrl', 'am_features', 'am_error', 'raw_amazon', 'eb_title', 'eb_price', 'eb_currency', 'eb_imageUrl', 'eb_condition', 'eb_epid', 'eb_watchCount', 'eb_sellerUsername', 'eb_itemLocation', 'eb_error', 'raw_ebay', 'upcdb_title', 'upcdb_brand', 'upcdb_description', 'upcdb_imageUrl', 'upcdb_offers', 'upcdb_lowestPrice', 'upcdb_highestPrice', 'upcdb_offerCount', 'upcdb_error', 'raw_upcitemdb', 'ai_optimized_title', 'ai_optimized_description', 'ai_seo_keywords', 'ai_sales_summary', 'enrichment_status', 'last_api_error_source', 'last_api_error_message', 'quantity', 'title', 'brand', 'model', 'color', 'size', 'dimension', 'weight', 'images', 'condition', 'description'];\n\nfor (const key in product) {\n    if (product.hasOwnProperty(key) && product[key] !== null && product[key] !== undefined && String(product[key]).trim() !== \"\") {\n        if (!knownFieldsForPrompt.includes(key) && !key.startsWith('raw_') && !key.endsWith('_error') && !key.includes('status') && key !== 'upcdb_offers') {\n            if (typeof product[key] === 'object' && !Array.isArray(product[key])) {\n                // Skip\n            } else if (Array.isArray(product[key]) && product[key].length === 0) {\n                // Skip\n            } else {\n                 additionalAttributesString += `${key.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}: ${Array.isArray(product[key]) ? product[key].join(', ') : product[key]}\\n`;\n            }\n        }\n    }\n}\nadditionalAttributesString = additionalAttributesString.trim() || \"N/A\";\n\nconst promptForAI = `You are an AI assistant that generates product listing content.\nBased on the Product Details provided below, generate the content for the specified JSON keys.\n\nProduct Details:\nTitle: ${title}\nUPC: ${upc}\nBrand: ${brand}\nModel: ${model}\nColor: ${color}\nSize: ${size}\nDimensions: ${dimension}\nWeight: ${weight}\nCurrent Description: ${description}\nImage URLs (if available): ${images}\nCondition: ${condition}\nRelevant Keywords to consider: ${tagKeywords}\nOther Available Data:\n${additionalAttributesString}\n\nMANDATORY RESPONSE FORMATTING INSTRUCTIONS:\n1. Your entire response MUST be a single, valid JSON object.\n2. The JSON object MUST start with an opening curly brace '{' and end with a closing curly brace '}'.\n3. DO NOT include any text, explanations, conversational phrases, or markdown formatting (like \\`\\`\\`json or \\`\\`\\`) before or after this single JSON object.\n4. Ensure all string values within the JSON are properly escaped if they contain special characters (e.g., double quotes within descriptions).\n\nJSON Object Structure and Content Requirements:\n{\n  \"ai_optimized_title\": \"String (max 80 characters): Generate an attention-grabbing, keyword-rich, SEO-optimized product title that is descriptive and persuasive.\",\n  \"ai_optimized_description\": \"String (approx 150-200 words): Generate a detailed, informative, and persuasive product description. Use bullet points (using \\\\n for new lines within the string) for key features/specifications if appropriate. Organize into concise paragraphs. Mention the item's condition. Incorporate relevant keywords naturally. Include a call to action.\",\n  \"ai_seo_keywords\": [\"Array of 5-7 Strings: Generate broad and specific SEO keywords for this product, focusing on key features, brand, and category. Example: 'keyword1', 'keyword2'\"],\n  \"ai_sales_summary\": \"String (2-3 sentences): Generate a concise and persuasive sales summary highlighting key benefits and unique selling points.\"\n}\n\nAdditional Generation Guidelines:\n- Tone and Style: Maintain a friendly and approachable tone.\n- Completeness: Populate all requested JSON fields based on the Product Details.\n- Handling Missing Information: If critical information is missing for a specific field, make a reasonable effort based on what's available or indicate its absence gracefully within the content if appropriate. Do not invent factual specifications if data is missing.\n`;\n\n// Output the prompt for the AI Agent and the original product data\nreturn [{ json: { promptForAI: promptForAI, originalProductData: product } }];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        40,
        620
      ],
      "id": "8434f594-c2ba-453c-9c5e-19bb040a832e",
      "name": "CPI Data instructions"
    },
    {
      "parameters": {
        "jsCode": "// --- Code for \"Code: Clean and Prepare AI Output\" ---\nconst items = $input.all();\nconst results = [];\n\n// Get the original product data passed from the prompt generation step\nconst originalDataItems = $items(\"CPI Data instructions\");\n\nfor (const [index, item] of items.entries()) {\n  // The raw text from the LLM (via the Agent with hasOutputParser: false)\n  // is in item.json.output based on your latest test.\n  let llmText = item.json.output; // <<< THIS IS THE KEY CHANGE HERE\n\n  let aiParsedContent = null;\n  let processingError = null;\n\n  const currentOriginalData = originalDataItems[index]?.json?.originalProductData || {};\n\n  if (llmText && typeof llmText === 'string') {\n    // Attempt to extract JSON from ```json ... ``` markdown code block\n    const jsonMatch = llmText.match(/```json\\s*([\\s\\S]*?)\\s*```/);\n    if (jsonMatch && jsonMatch[1]) {\n      llmText = jsonMatch[1].trim();\n    } else {\n      // Fallback for ``` ... ``` (if 'json' language tag is missing)\n      const plainMatch = llmText.match(/```\\s*([\\s\\S]*?)\\s*```/);\n      if (plainMatch && plainMatch[1]) {\n        llmText = plainMatch[1].trim();\n      } else {\n        // If no markdown fences are found, assume the text itself might be the JSON\n        // (or it's just plain text that will fail parsing, which is fine, error will be caught)\n        llmText = llmText.trim();\n      }\n    }\n\n    // console.log(\"Text to be parsed as JSON:\", llmText); // For debugging\n\n    if (llmText) {\n      try {\n        aiParsedContent = JSON.parse(llmText);\n      } catch (e) {\n        processingError = \"Failed to parse cleaned LLM response: \" + e.message;\n        console.error(processingError, \"Cleaned LLM text that failed parsing:\", llmText);\n      }\n    } else {\n        processingError = \"LLM text became empty after attempting to strip markdown.\";\n        console.error(processingError, \"Original text from LLM:\", item.json.output);\n    }\n  } else {\n    processingError = \"No 'output' text found from LLM in CPI Enhancer (Agent) output.\";\n    console.error(processingError, \"Full item from Agent:\", JSON.stringify(item.json, null, 2));\n  }\n\n  // Merge originalProductData with AI content\n  const finalProductData = {\n    ...currentOriginalData,\n    ai_optimized_title: aiParsedContent?.ai_optimized_title || null,\n    ai_optimized_description: aiParsedContent?.ai_optimized_description || null,\n    ai_seo_keywords: aiParsedContent?.ai_seo_keywords || [],\n    ai_sales_summary: aiParsedContent?.ai_sales_summary || null,\n    // Add any other AI fields you expect from your schema\n    // ai_unique_selling_points: aiParsedContent?.ai_unique_selling_points || [],\n    // ai_key_features: aiParsedContent?.ai_key_features || [],\n\n    ai_processing_error: processingError,\n    enrichment_status: aiParsedContent && aiParsedContent.ai_optimized_title && !processingError ? \"enrichment_complete\" : (processingError ? \"enrichment_failed_ai\" : (currentOriginalData.enrichment_status || 'enrichment_failed_ai_unknown_state'))\n  };\n  results.push({ json: finalProductData });\n}\nreturn results;"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -480,
        860
      ],
      "id": "bb31add7-65c2-43c4-8163-f45e914a378c",
      "name": "Code: Clean and Prepare AI Output"
    },
    {
      "parameters": {
        "operation": "update",
        "schema": "public",
        "table": "products",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "sale_price": "={{ $json.sale_price != null ? parseFloat($json.sale_price) : null }}",
            "highest_recorded_price": "={{ $json.upcdb_highestPrice != null ? parseFloat($json.upcdb_highestPrice) : null }}",
            "height": "={{ $json.height != null ? parseFloat($json.height) : null }}",
            "sku": "={{ $json.sku ?? null }}",
            "asin": "={{ $json.am_asin ?? ($json.raw_amazon?.items?.[0]?.asin) ?? null }}",
            "gtin": "={{ $json.gtin ?? null }}",
            "ean": "={{ $json.ean ?? $json.am_ean ?? null }}",
            "epid": "={{ $json.eb_epid ?? null }}",
            "upc": "={{ $json.upc }}",
            "code_type": "={{ $json.code_type ?? null }}",
            "title": "={{ $json.ai_optimized_title || $json.upcdb_title || $json.eb_title || $json.am_title || $json.name || null }}",
            "brand": "={{ $json.brand || $json.upcdb_brand || $json.am_brand || null }}",
            "product_type": "={{ $json.product_type ?? null }}",
            "condition": "={{ $json.condition || $json.eb_condition || null }}",
            "condition_details": "={{ $json.condition_details ?? null }}",
            "short_description": "={{ $json.ai_sales_summary || $json.short_description || null }}",
            "description": "={{ $json.ai_optimized_description || $json.upcdb_description || $json.description || null }}",
            "long_description": "={{ $json.ai_optimized_description || $json.long_description || $json.upcdb_description || null }}",
            "unique_selling_points": "={{ ($json.ai_unique_selling_points && Array.isArray($json.ai_unique_selling_points) ? $json.ai_unique_selling_points.join(' | ') : $json.unique_selling_points) ?? null }}",
            "key_features": "={{ ($json.ai_key_features && Array.isArray($json.ai_key_features) ? $json.ai_key_features.join(' | ') : ($json.am_features && Array.isArray($json.am_features) ? $json.am_features.join(' | ') : $json.key_features)) ?? null }}",
            "key_benefits": "={{ $json.key_benefits ?? null }}",
            "price": "={{ $json.price != null ? parseFloat($json.price) : ($json.am_price != null ? parseFloat($json.am_price) : ($json.eb_price != null ? parseFloat($json.eb_price) : ($json.upcdb_lowestPrice != null ? parseFloat($json.upcdb_lowestPrice) : null))) }}",
            "regular_price": "={{ $json.regular_price != null ? parseFloat($json.regular_price) : null }}",
            "sale_start_date": "={{ $json.sale_start_date ? new Date($json.sale_start_date).toISOString() : null }}",
            "sale_end_date": "={{ $json.sale_end_date ? new Date($json.sale_end_date).toISOString() : null }}",
            "currency": "={{ $json.currency || $json.am_currency || $json.eb_currency || ($json.upcdb_offers && $json.upcdb_offers.length > 0 ? $json.upcdb_offers[0].currency : null) || 'USD' }}",
            "item_specifics": "={{ $json.ai_item_specifics || $json.item_specifics || null }}",
            "additional_attributes": "={{ $json.ai_additional_attributes || $json.additional_attributes || null }}",
            "image_urls": "={{\n  {\n    \"urls\": $json.image_urls_all || \n            ($json.images && Array.isArray($json.images) ? $json.images : Array.from(new Set([$json.upcdb_imageUrl, $json.am_imageUrl, $json.eb_imageUrl].filter(Boolean)))) || \n            []\n  }\n}}",
            "main_image_url": "={{ $json.main_image_url || $json.upcdb_imageUrl || $json.am_imageUrl || $json.eb_imageUrl || null }}",
            "lowest_recorded_price": "={{ $json.upcdb_lowestPrice != null ? parseFloat($json.upcdb_lowestPrice) : null }}",
            "tags": "={{ ($json.ai_seo_keywords && Array.isArray($json.ai_seo_keywords) && $json.ai_seo_keywords.length > 0 ? $json.ai_seo_keywords.join(', ') : $json.tags) ?? null }}",
            "weight": "={{ $json.weight_value != null ? parseFloat($json.weight_value) : ($json.weight ? parseFloat(String($json.weight).replace(/[^\\\\d.-]/g, '')) : null) }}",
            "length": "={{ $json.length != null ? parseFloat($json.length) : null }}",
            "weight_unit": "={{ $json.weight_unit != null ? parseFloat($json.length) : null }}",
            "width": "={{ $json.width != null ? parseFloat($json.width) : null }}",
            "dimensions_unit": "={{ $json.dimensions_unit ?? null }}",
            "ebay_category": "={{ $json.eb_categoryName ?? null }}",
            "ebay_category_id": "={{ $json.eb_categoryId ?? null }}",
            "google_category_id": "={{ $json.google_category_id ?? null }}",
            "google_category": "={{ $json.google_category ?? null }}",
            "amazon_data": "={{ $json.raw_amazon ?? $json.amazon_data ?? null }}",
            "visibility": "={{ $json.visibility ?? null }}",
            "position": "={{ $json.position != null ? parseInt($json.position, 10) : null }}",
            "enrichment_status": "={{ $json.enrichment_status ?? null }}",
            "notes": "={{ $json.notes ?? null }}",
            "care_instructions": "={{ $json.care_instructions ?? null }}",
            "authentication": "={{ $json.authentication ?? null }}",
            "history_provenance": "={{ $json.history_provenance ?? null }}",
            "dimensions_text": "={{ $json.dimensions_text ?? $json.dimension ?? null }}",
            "amazon_category_browse_node_id": "={{ $json.am_browse_node_id ?? ($json.raw_amazon?.items?.[0]?.browse_node_info?.browse_nodes?.[0]?.id) ?? null }}",
            "upcdb_category": "={{ $json.upcdb_category ?? null }}",
            "ai_optimized_title": "={{ $json.ai_optimized_title ?? null }}",
            "ai_optimized_description": "={{ $json.ai_optimized_description ?? null }}",
            "ai_seo_keywords": "={{ $json.ai_seo_keywords && Array.isArray($json.ai_seo_keywords) && $json.ai_seo_keywords.length > 0 ? $json.ai_seo_keywords : null }}",
            "ai_sales_summary": "={{ $json.ai_sales_summary ?? null }}",
            "ai_unique_selling_points": "={{ $json.ai_unique_selling_points && Array.isArray($json.ai_unique_selling_points) && $json.ai_unique_selling_points.length > 0 ? $json.ai_unique_selling_points : null }}",
            "ai_key_features": "={{ $json.ai_key_features && Array.isArray($json.ai_key_features) && $json.ai_key_features.length > 0 ? $json.ai_key_features : ($json.am_features && Array.isArray($json.am_features) ? $json.am_features : null) }}",
            "ai_specifications": "={{ $json.ai_specifications ?? null }}",
            "raw_amazon_payload": "={{ $json.raw_amazon ?? null }}",
            "raw_ebay_payload": "={{ $json.raw_ebay ?? null }}",
            "raw_upcitemdb_payload": "={{ $json.raw_upcitemdb ?? null }}",
            "ai_processing_error": "={{ $json.ai_processing_error ?? null }}",
            "last_api_error_source": "={{ $json.last_api_error_source ?? null }}",
            "last_api_error_message": "={{ $json.last_api_error_message ?? null }}",
            "last_enriched_at": "={{ new Date().toISOString() }}"
          },
          "matchingColumns": [
            "upc"
          ],
          "schema": [
            {
              "id": "id",
              "displayName": "id",
              "required": false,
              "defaultMatch": true,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "sku",
              "displayName": "sku",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "upc",
              "displayName": "upc",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "code_type",
              "displayName": "code_type",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "quantity",
              "displayName": "quantity",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "created_at",
              "displayName": "created_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "last_scanned_at",
              "displayName": "last_scanned_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "title",
              "displayName": "title",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "brand",
              "displayName": "brand",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "product_type",
              "displayName": "product_type",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "condition",
              "displayName": "condition",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "condition_details",
              "displayName": "condition_details",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "short_description",
              "displayName": "short_description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "description",
              "displayName": "description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "long_description",
              "displayName": "long_description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "unique_selling_points",
              "displayName": "unique_selling_points",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "key_features",
              "displayName": "key_features",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "key_benefits",
              "displayName": "key_benefits",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "price",
              "displayName": "price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "regular_price",
              "displayName": "regular_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "sale_price",
              "displayName": "sale_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "sale_start_date",
              "displayName": "sale_start_date",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "sale_end_date",
              "displayName": "sale_end_date",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "currency",
              "displayName": "currency",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "lowest_recorded_price",
              "displayName": "lowest_recorded_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "highest_recorded_price",
              "displayName": "highest_recorded_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "item_specifics",
              "displayName": "item_specifics",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "additional_attributes",
              "displayName": "additional_attributes",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "tags",
              "displayName": "tags",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "weight",
              "displayName": "weight",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "weight_unit",
              "displayName": "weight_unit",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "length",
              "displayName": "length",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "width",
              "displayName": "width",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "height",
              "displayName": "height",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "dimensions_unit",
              "displayName": "dimensions_unit",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ebay_category_id",
              "displayName": "ebay_category_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ebay_category",
              "displayName": "ebay_category",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "epid",
              "displayName": "epid",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "google_category_id",
              "displayName": "google_category_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "google_category",
              "displayName": "google_category",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "amazon_data",
              "displayName": "amazon_data",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "image_urls",
              "displayName": "image_urls",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "low_stock_amount",
              "displayName": "low_stock_amount",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "backorders_allowed",
              "displayName": "backorders_allowed",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "sold_individually",
              "displayName": "sold_individually",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "published",
              "displayName": "published",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "is_featured",
              "displayName": "is_featured",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "visibility",
              "displayName": "visibility",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "allow_reviews",
              "displayName": "allow_reviews",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "position",
              "displayName": "position",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "enrichment_status",
              "displayName": "enrichment_status",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "notes",
              "displayName": "notes",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "care_instructions",
              "displayName": "care_instructions",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "authentication",
              "displayName": "authentication",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "history_provenance",
              "displayName": "history_provenance",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ean",
              "displayName": "ean",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "gtin",
              "displayName": "gtin",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "asin",
              "displayName": "asin",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "dimensions_text",
              "displayName": "dimensions_text",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "amazon_category_browse_node_id",
              "displayName": "amazon_category_browse_node_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "upcdb_category",
              "displayName": "upcdb_category",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "main_image_url",
              "displayName": "main_image_url",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_optimized_title",
              "displayName": "ai_optimized_title",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_optimized_description",
              "displayName": "ai_optimized_description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_seo_keywords",
              "displayName": "ai_seo_keywords",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "array",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_sales_summary",
              "displayName": "ai_sales_summary",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_unique_selling_points",
              "displayName": "ai_unique_selling_points",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "array",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_key_features",
              "displayName": "ai_key_features",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "array",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_specifications",
              "displayName": "ai_specifications",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "raw_amazon_payload",
              "displayName": "raw_amazon_payload",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "raw_ebay_payload",
              "displayName": "raw_ebay_payload",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "raw_upcitemdb_payload",
              "displayName": "raw_upcitemdb_payload",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_processing_error",
              "displayName": "ai_processing_error",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "last_api_error_source",
              "displayName": "last_api_error_source",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "last_api_error_message",
              "displayName": "last_api_error_message",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "last_enriched_at",
              "displayName": "last_enriched_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false,
          "values": []
        },
        "options": {}
      },
      "id": "3de33425-56ff-4081-9e2e-66010ab4780d",
      "name": "Update Product data-original",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        -280,
        860
      ],
      "credentials": {
        "postgres": {
          "id": "ROCom75uM2IZ3Ca9",
          "name": "dbaimagic Lightsail"
        }
      }
    },
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "scan-upc",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "efeb7ed7-bcaf-47a6-9574-9ab77aba41aa",
      "name": "Webhook (POST /scan-upc)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1.1,
      "position": [
        -1220,
        -500
      ],
      "webhookId": "YOUR_SCAN_WEBHOOK_ID"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO products (upc, code_type, quantity, created_at, last_scanned_at, enrichment_status)\nVALUES ($1, $2, 1, NOW(), NOW(), 'scanned')\nON CONFLICT (upc)\nDO UPDATE SET \n  quantity = products.quantity + 1,\n  last_scanned_at = NOW()\nRETURNING *;",
        "options": {
          "queryReplacement": "=Item 1: Value = {{$json.validatedCode}}  (for $1 - UPC)\nItem 2: Value = {{$json.codeType}}       (for $2 - code type)"
        }
      },
      "id": "99e59ed7-c477-4f3a-8c44-e085e71c338c",
      "name": "DB Upsert Quantity",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        -780,
        -600
      ],
      "credentials": {
        "postgres": {
          "id": "ROCom75uM2IZ3Ca9",
          "name": "dbaimagic Lightsail"
        }
      }
    },
    {
      "parameters": {
        "options": {}
      },
      "id": "85bae2c7-fdfa-41ac-86a8-65bb6ad30c75",
      "name": "Respond Success",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        -560,
        -600
      ],
      "notes": "Sends a 200 OK response if DB operation succeeds"
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { \"error\": \"Processing failed.\", \"details\": $json.errorMessage || 'Unknown error' } }}",
        "options": {
          "responseCode": 500
        }
      },
      "id": "fd9c3e70-490f-4649-9260-af5576c2c341",
      "name": "Respond DB Error",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        -780,
        -400
      ],
      "executeOnce": true,
      "notes": "Sends a 500 Internal Server Error if DB fails"
    },
    {
      "parameters": {
        "jsCode": "// Validate Input Code node\n\n// --- Get Input Data ---\n// Access the incoming request body data provided by the Webhook node\nconst incomingBody = items[0].json.body;\n\n// --- Basic Input Checks ---\n// Ensure the body exists and the 'upc' field is a non-empty string\nif (!incomingBody || typeof incomingBody.upc !== 'string' || incomingBody.upc.trim() === '') {\n  // If checks fail, throw a descriptive error to stop the workflow\n  const receivedData = JSON.stringify(items[0].json); // Log what was received for debugging\n  throw new Error(`INVALID_INPUT: Missing or invalid 'upc' string in request body. Received: ${receivedData}`);\n}\n\n// --- Clean Input ---\n// Trim whitespace from the input code\nconst productCode = incomingBody.upc.trim();\n\n// --- Define Validation Rules (Regular Expressions) ---\n// GTIN (covers UPC-A 12, EAN-13, EAN-8, GTIN-14)\nconst gtinRegex = /^\\d{8}$|^\\d{12}$|^\\d{13}$|^\\d{14}$/;\n// ASIN (Amazon Standard Identification Number or ISBN-10)\n// Starts B + 9 Alphanumeric OR is 10 digits\nconst asinRegex = /^B[A-Z0-9]{9}$|^\\d{10}$/;\n// FNSKU (Amazon FBA - often starts X00...)\n// Starts X00 + 7 Alphanumeric (case-insensitive)\nconst fnskuRegex = /^X00[A-Z0-9]{7}$/i;\n\n// --- Perform Validation ---\nlet isValidFormat = false;\nlet codeType = 'unknown'; // Default type\n\n// Check against known formats in order\nif (gtinRegex.test(productCode)) {\n  isValidFormat = true;\n  // Set specific type - could refine further (e.g., check length for UPC-A vs EAN-13) if needed\n  codeType = 'GTIN/UPC/EAN';\n  console.log(`Input '${productCode}' matches GTIN/UPC/EAN format.`);\n} else if (asinRegex.test(productCode)) {\n  isValidFormat = true;\n  codeType = 'ASIN/ISBN'; // Combine as they share regex part\n  console.log(`Input '${productCode}' matches ASIN/ISBN format.`);\n} else if (fnskuRegex.test(productCode)) {\n    isValidFormat = true;\n    codeType = 'FNSKU';\n    console.log(`Input '${productCode}' matches FNSKU format.`);\n}\n\n// --- Handle Validation Result ---\nif (!isValidFormat) {\n  // If none of the formats matched, throw an error\n  throw new Error(`INVALID_CODE_FORMAT: Input '${productCode}' is not a recognized product code format (UPC, GTIN, EAN, ASIN, FNSKU).`);\n}\n\n// --- Prepare Clean Output Data ---\n// Create a *new* object containing only the essential validated data\n// for the next node (e.g., the Database node).\nconst outputData = {\n  json: { // n8n expects the data payload within a 'json' key\n    validatedCode: productCode, // The cleaned/validated code itself\n    codeType: codeType          // The identified type (e.g., 'GTIN/UPC/EAN', 'ASIN/ISBN', 'FNSKU')\n  }\n};\n\n// --- Return Output ---\n// Return an array containing *only* the new, clean output object.\n// This replaces the large input data from the webhook.\nreturn [outputData];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -1000,
        -500
      ],
      "id": "ed2b0653-8f66-4ee7-87aa-1fcf5807ed99",
      "name": "Validate Code",
      "onError": "continueErrorOutput"
    },
    {
      "parameters": {
        "path": "/update-product-info",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [
        -220,
        -660
      ],
      "id": "eff5fb9d-4600-48b9-9fa1-5e6172fc4137",
      "name": "Webhook",
      "webhookId": "0d4b5dfd-8e70-40ac-b8a2-ac52ab460b3f"
    },
    {
      "parameters": {
        "operation": "update",
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        },
        "table": {
          "__rl": true,
          "value": "products",
          "mode": "list",
          "cachedResultName": "products"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "upc": "={{$json.upc}}",
            "title": "={{$json.title}}",
            "sku": "={{$json.sku}}",
            "quantity": "={{$json.quantity}}",
            "brand": "={{$json.brand}}",
            "condition": "={{$json.condition}}",
            "price": "={{$json.price}}",
            "regular_price": "={{$json.regular_price}}",
            "sale_price": "={{$json.sale_price}}"
          },
          "matchingColumns": [
            "upc"
          ],
          "schema": [
            {
              "id": "id",
              "displayName": "id",
              "required": false,
              "defaultMatch": true,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "sku",
              "displayName": "sku",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "upc",
              "displayName": "upc",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "code_type",
              "displayName": "code_type",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "quantity",
              "displayName": "quantity",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true
            },
            {
              "id": "created_at",
              "displayName": "created_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "last_scanned_at",
              "displayName": "last_scanned_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "title",
              "displayName": "title",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "brand",
              "displayName": "brand",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "product_type",
              "displayName": "product_type",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "condition",
              "displayName": "condition",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "condition_details",
              "displayName": "condition_details",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "short_description",
              "displayName": "short_description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "description",
              "displayName": "description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "long_description",
              "displayName": "long_description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "unique_selling_points",
              "displayName": "unique_selling_points",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "key_features",
              "displayName": "key_features",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "key_benefits",
              "displayName": "key_benefits",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "price",
              "displayName": "price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true
            },
            {
              "id": "regular_price",
              "displayName": "regular_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true
            },
            {
              "id": "sale_price",
              "displayName": "sale_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true
            },
            {
              "id": "sale_start_date",
              "displayName": "sale_start_date",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "sale_end_date",
              "displayName": "sale_end_date",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "currency",
              "displayName": "currency",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "lowest_recorded_price",
              "displayName": "lowest_recorded_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "highest_recorded_price",
              "displayName": "highest_recorded_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "item_specifics",
              "displayName": "item_specifics",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "additional_attributes",
              "displayName": "additional_attributes",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "tags",
              "displayName": "tags",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "weight",
              "displayName": "weight",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "weight_unit",
              "displayName": "weight_unit",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "length",
              "displayName": "length",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "width",
              "displayName": "width",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "height",
              "displayName": "height",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "dimensions_unit",
              "displayName": "dimensions_unit",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "ebay_category_id",
              "displayName": "ebay_category_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "ebay_category",
              "displayName": "ebay_category",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "epid",
              "displayName": "epid",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "google_category_id",
              "displayName": "google_category_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "google_category",
              "displayName": "google_category",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "amazon_data",
              "displayName": "amazon_data",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "image_urls",
              "displayName": "image_urls",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "low_stock_amount",
              "displayName": "low_stock_amount",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "backorders_allowed",
              "displayName": "backorders_allowed",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "sold_individually",
              "displayName": "sold_individually",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "published",
              "displayName": "published",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "is_featured",
              "displayName": "is_featured",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "visibility",
              "displayName": "visibility",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "allow_reviews",
              "displayName": "allow_reviews",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "position",
              "displayName": "position",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "enrichment_status",
              "displayName": "enrichment_status",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "notes",
              "displayName": "notes",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "care_instructions",
              "displayName": "care_instructions",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "authentication",
              "displayName": "authentication",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "history_provenance",
              "displayName": "history_provenance",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "ean",
              "displayName": "ean",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "gtin",
              "displayName": "gtin",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "asin",
              "displayName": "asin",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "dimensions_text",
              "displayName": "dimensions_text",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "amazon_category_browse_node_id",
              "displayName": "amazon_category_browse_node_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "upcdb_category",
              "displayName": "upcdb_category",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "main_image_url",
              "displayName": "main_image_url",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "ai_optimized_title",
              "displayName": "ai_optimized_title",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "ai_optimized_description",
              "displayName": "ai_optimized_description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "ai_seo_keywords",
              "displayName": "ai_seo_keywords",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "array",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "ai_sales_summary",
              "displayName": "ai_sales_summary",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "ai_unique_selling_points",
              "displayName": "ai_unique_selling_points",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "array",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "ai_key_features",
              "displayName": "ai_key_features",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "array",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "ai_specifications",
              "displayName": "ai_specifications",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "raw_amazon_payload",
              "displayName": "raw_amazon_payload",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "raw_ebay_payload",
              "displayName": "raw_ebay_payload",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "raw_upcitemdb_payload",
              "displayName": "raw_upcitemdb_payload",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "ai_processing_error",
              "displayName": "ai_processing_error",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "last_api_error_source",
              "displayName": "last_api_error_source",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "last_api_error_message",
              "displayName": "last_api_error_message",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "last_enriched_at",
              "displayName": "last_enriched_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": true
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        0,
        -660
      ],
      "id": "c653f87a-4c74-4b9e-905c-8edc8a7c5b9c",
      "name": "Postgres",
      "credentials": {
        "postgres": {
          "id": "ROCom75uM2IZ3Ca9",
          "name": "dbaimagic Lightsail"
        }
      }
    },
    {
      "parameters": {
        "respondWith": "allIncomingItems",
        "options": {}
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.2,
      "position": [
        220,
        -660
      ],
      "id": "3dc347db-f9bb-4835-8717-2f917e908eb5",
      "name": "Respond to Webhook"
    },
    {
      "parameters": {
        "path": "inventory",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook (GET /inventory)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1.1,
      "position": [
        -220,
        -440
      ],
      "webhookId": "59c2ff9e-0079-49d2-a8bf-b5d088497ea8",
      "id": "aaf07224-dfd2-4b85-b3ee-2c57c0e6c361"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT * FROM products ORDER BY last_scanned_at DESC;",
        "options": {}
      },
      "name": "Postgres (Get Products)",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        0,
        -440
      ],
      "id": "a3e5233c-1567-4393-9f27-6a88d0ccddbe",
      "credentials": {
        "postgres": {
          "id": "ROCom75uM2IZ3Ca9",
          "name": "dbaimagic Lightsail"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "const allDbRows = $input.all();\nconst allProducts = allDbRows.map(item => item.json);\nconst response = {\n  success: true,\n  data: allProducts\n};\nreturn response;"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        220,
        -440
      ],
      "name": "Format Response",
      "id": "864eff93-b761-4e7f-a980-71421b63a54d"
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $input.item.json }}",
        "options": {
          "responseHeaders": {
            "entries": [
              {
                "name": "Access-Control-Allow-Origin",
                "value": "*"
              }
            ]
          }
        }
      },
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        440,
        -440
      ],
      "id": "566cb18d-cecb-4e29-8052-470a59cec2fa"
    },
    {
      "parameters": {
        "content": "## SCAN UPC\n\n",
        "height": 720,
        "width": 960,
        "color": 3
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        -1300,
        -740
      ],
      "id": "694b3c69-8109-4d98-8809-93e964661c6f",
      "name": "Sticky Note"
    },
    {
      "parameters": {
        "content": "## Update Product Qty\n\n\n",
        "height": 220,
        "width": 980,
        "color": 5
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        -320,
        -740
      ],
      "id": "48b4eedf-561b-4356-b6c5-bf53c1688a69",
      "name": "Sticky Note1"
    },
    {
      "parameters": {
        "content": "## Product Inventory\n\n\n",
        "height": 220,
        "width": 980,
        "color": 2
      },
      "type": "n8n-nodes-base.stickyNote",
      "position": [
        -320,
        -500
      ],
      "typeVersion": 1,
      "id": "974a7d95-76fc-4424-83da-c76192746233",
      "name": "Sticky Note2"
    },
    {
      "parameters": {
        "content": "## Retrieve Info and Enrich Product Data\n",
        "height": 900,
        "width": 1960,
        "color": 6
      },
      "type": "n8n-nodes-base.stickyNote",
      "position": [
        -1300,
        320
      ],
      "typeVersion": 1,
      "id": "8f0247af-3811-42f1-a830-60bfe2c06ecc",
      "name": "Sticky Note3"
    },
    {
      "parameters": {
        "respondWith": "allIncomingItems",
        "options": {}
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.2,
      "position": [
        220,
        -200
      ],
      "id": "dc62ab5f-4456-421c-9d54-fc274cc64a18",
      "name": "Respond to Webhook1"
    },
    {
      "parameters": {
        "operation": "update",
        "schema": "public",
        "table": "products",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "sale_price": "={{ $json.sale_price != null ? parseFloat($json.sale_price) : null }}",
            "highest_recorded_price": "={{ $json.upcdb_highestPrice != null ? parseFloat($json.upcdb_highestPrice) : null }}",
            "height": "={{ $json.height != null ? parseFloat($json.height) : null }}",
            "sku": "={{ $json.sku ?? null }}",
            "asin": "={{ $json.am_asin ?? ($json.raw_amazon?.items?.[0]?.asin) ?? null }}",
            "gtin": "={{ $json.gtin ?? null }}",
            "ean": "={{ $json.ean ?? $json.am_ean ?? null }}",
            "epid": "={{ $json.eb_epid ?? null }}",
            "upc": "={{ $json.upc }}",
            "code_type": "={{ $json.code_type ?? null }}",
            "title": "={{ $json.ai_optimized_title || $json.upcdb_title || $json.eb_title || $json.am_title || $json.name || null }}",
            "brand": "={{ $json.brand || $json.upcdb_brand || $json.am_brand || null }}",
            "product_type": "={{ $json.product_type ?? null }}",
            "condition": "={{ $json.condition || $json.eb_condition || null }}",
            "condition_details": "={{ $json.condition_details ?? null }}",
            "short_description": "={{ $json.ai_sales_summary || $json.short_description || null }}",
            "description": "={{ $json.ai_optimized_description || $json.upcdb_description || $json.description || null }}",
            "long_description": "={{ $json.ai_optimized_description || $json.long_description || $json.upcdb_description || null }}",
            "unique_selling_points": "={{ ($json.ai_unique_selling_points && Array.isArray($json.ai_unique_selling_points) ? $json.ai_unique_selling_points.join(' | ') : $json.unique_selling_points) ?? null }}",
            "key_features": "={{ ($json.ai_key_features && Array.isArray($json.ai_key_features) ? $json.ai_key_features.join(' | ') : ($json.am_features && Array.isArray($json.am_features) ? $json.am_features.join(' | ') : $json.key_features)) ?? null }}",
            "key_benefits": "={{ $json.key_benefits ?? null }}",
            "price": "={{ $json.price != null ? parseFloat($json.price) : ($json.am_price != null ? parseFloat($json.am_price) : ($json.eb_price != null ? parseFloat($json.eb_price) : ($json.upcdb_lowestPrice != null ? parseFloat($json.upcdb_lowestPrice) : null))) }}",
            "regular_price": "={{ $json.regular_price != null ? parseFloat($json.regular_price) : null }}",
            "sale_start_date": "={{ $json.sale_start_date ? new Date($json.sale_start_date).toISOString() : null }}",
            "sale_end_date": "={{ $json.sale_end_date ? new Date($json.sale_end_date).toISOString() : null }}",
            "currency": "={{ $json.currency || $json.am_currency || $json.eb_currency || ($json.upcdb_offers && $json.upcdb_offers.length > 0 ? $json.upcdb_offers[0].currency : null) || 'USD' }}",
            "item_specifics": "={{ $json.ai_item_specifics || $json.item_specifics || null }}",
            "additional_attributes": "={{ $json.ai_additional_attributes || $json.additional_attributes || null }}",
            "image_urls": "={{\n  {\n    \"urls\": $json.image_urls_all || \n            ($json.images && Array.isArray($json.images) ? $json.images : Array.from(new Set([$json.upcdb_imageUrl, $json.am_imageUrl, $json.eb_imageUrl].filter(Boolean)))) || \n            []\n  }\n}}",
            "main_image_url": "={{ $json.main_image_url || $json.upcdb_imageUrl || $json.am_imageUrl || $json.eb_imageUrl || null }}",
            "lowest_recorded_price": "={{ $json.upcdb_lowestPrice != null ? parseFloat($json.upcdb_lowestPrice) : null }}",
            "tags": "={{ ($json.ai_seo_keywords && Array.isArray($json.ai_seo_keywords) && $json.ai_seo_keywords.length > 0 ? $json.ai_seo_keywords.join(', ') : $json.tags) ?? null }}",
            "weight": "={{ $json.weight_value != null ? parseFloat($json.weight_value) : ($json.weight ? parseFloat(String($json.weight).replace(/[^\\\\d.-]/g, '')) : null) }}",
            "length": "={{ $json.length != null ? parseFloat($json.length) : null }}",
            "weight_unit": "={{ $json.weight_unit != null ? parseFloat($json.length) : null }}",
            "width": "={{ $json.width != null ? parseFloat($json.width) : null }}",
            "dimensions_unit": "={{ $json.dimensions_unit ?? null }}",
            "ebay_category": "={{ $json.eb_categoryName ?? null }}",
            "ebay_category_id": "={{ $json.eb_categoryId ?? null }}",
            "google_category_id": "={{ $json.google_category_id ?? null }}",
            "google_category": "={{ $json.google_category ?? null }}",
            "amazon_data": "={{ $json.raw_amazon ?? $json.amazon_data ?? null }}",
            "visibility": "={{ $json.visibility ?? null }}",
            "position": "={{ $json.position != null ? parseInt($json.position, 10) : null }}",
            "enrichment_status": "={{ $json.enrichment_status ?? null }}",
            "notes": "={{ $json.notes ?? null }}",
            "care_instructions": "={{ $json.care_instructions ?? null }}",
            "authentication": "={{ $json.authentication ?? null }}",
            "history_provenance": "={{ $json.history_provenance ?? null }}",
            "dimensions_text": "={{ $json.dimensions_text ?? $json.dimension ?? null }}",
            "amazon_category_browse_node_id": "={{ $json.am_browse_node_id ?? ($json.raw_amazon?.items?.[0]?.browse_node_info?.browse_nodes?.[0]?.id) ?? null }}",
            "upcdb_category": "={{ $json.upcdb_category ?? null }}",
            "ai_optimized_title": "={{ $json.ai_optimized_title ?? null }}",
            "ai_optimized_description": "={{ $json.ai_optimized_description ?? null }}",
            "ai_seo_keywords": "={{ $json.ai_seo_keywords && Array.isArray($json.ai_seo_keywords) && $json.ai_seo_keywords.length > 0 ? $json.ai_seo_keywords : null }}",
            "ai_sales_summary": "={{ $json.ai_sales_summary ?? null }}",
            "ai_unique_selling_points": "={{ $json.ai_unique_selling_points && Array.isArray($json.ai_unique_selling_points) && $json.ai_unique_selling_points.length > 0 ? $json.ai_unique_selling_points : null }}",
            "ai_key_features": "={{ $json.ai_key_features && Array.isArray($json.ai_key_features) && $json.ai_key_features.length > 0 ? $json.ai_key_features : ($json.am_features && Array.isArray($json.am_features) ? $json.am_features : null) }}",
            "ai_specifications": "={{ $json.ai_specifications ?? null }}",
            "raw_amazon_payload": "={{ $json.raw_amazon ?? null }}",
            "raw_ebay_payload": "={{ $json.raw_ebay ?? null }}",
            "raw_upcitemdb_payload": "={{ $json.raw_upcitemdb ?? null }}",
            "ai_processing_error": "={{ $json.ai_processing_error ?? null }}",
            "last_api_error_source": "={{ $json.last_api_error_source ?? null }}",
            "last_api_error_message": "={{ $json.last_api_error_message ?? null }}",
            "last_enriched_at": "={{ new Date().toISOString() }}"
          },
          "matchingColumns": [
            "upc"
          ],
          "schema": [
            {
              "id": "id",
              "displayName": "id",
              "required": false,
              "defaultMatch": true,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "sku",
              "displayName": "sku",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "upc",
              "displayName": "upc",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "code_type",
              "displayName": "code_type",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "quantity",
              "displayName": "quantity",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "created_at",
              "displayName": "created_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "last_scanned_at",
              "displayName": "last_scanned_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "title",
              "displayName": "title",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "brand",
              "displayName": "brand",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "product_type",
              "displayName": "product_type",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "condition",
              "displayName": "condition",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "condition_details",
              "displayName": "condition_details",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "short_description",
              "displayName": "short_description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "description",
              "displayName": "description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "long_description",
              "displayName": "long_description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "unique_selling_points",
              "displayName": "unique_selling_points",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "key_features",
              "displayName": "key_features",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "key_benefits",
              "displayName": "key_benefits",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "price",
              "displayName": "price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "regular_price",
              "displayName": "regular_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "sale_price",
              "displayName": "sale_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "sale_start_date",
              "displayName": "sale_start_date",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "sale_end_date",
              "displayName": "sale_end_date",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "currency",
              "displayName": "currency",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "lowest_recorded_price",
              "displayName": "lowest_recorded_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "highest_recorded_price",
              "displayName": "highest_recorded_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "item_specifics",
              "displayName": "item_specifics",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "additional_attributes",
              "displayName": "additional_attributes",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "tags",
              "displayName": "tags",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "weight",
              "displayName": "weight",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "weight_unit",
              "displayName": "weight_unit",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "length",
              "displayName": "length",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "width",
              "displayName": "width",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "height",
              "displayName": "height",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "dimensions_unit",
              "displayName": "dimensions_unit",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ebay_category_id",
              "displayName": "ebay_category_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ebay_category",
              "displayName": "ebay_category",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "epid",
              "displayName": "epid",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "google_category_id",
              "displayName": "google_category_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "google_category",
              "displayName": "google_category",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "amazon_data",
              "displayName": "amazon_data",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "image_urls",
              "displayName": "image_urls",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "low_stock_amount",
              "displayName": "low_stock_amount",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "backorders_allowed",
              "displayName": "backorders_allowed",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "sold_individually",
              "displayName": "sold_individually",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "published",
              "displayName": "published",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "is_featured",
              "displayName": "is_featured",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "visibility",
              "displayName": "visibility",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "allow_reviews",
              "displayName": "allow_reviews",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "position",
              "displayName": "position",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "enrichment_status",
              "displayName": "enrichment_status",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "notes",
              "displayName": "notes",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "care_instructions",
              "displayName": "care_instructions",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "authentication",
              "displayName": "authentication",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "history_provenance",
              "displayName": "history_provenance",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ean",
              "displayName": "ean",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "gtin",
              "displayName": "gtin",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "asin",
              "displayName": "asin",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "dimensions_text",
              "displayName": "dimensions_text",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "amazon_category_browse_node_id",
              "displayName": "amazon_category_browse_node_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "upcdb_category",
              "displayName": "upcdb_category",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "main_image_url",
              "displayName": "main_image_url",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_optimized_title",
              "displayName": "ai_optimized_title",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_optimized_description",
              "displayName": "ai_optimized_description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_seo_keywords",
              "displayName": "ai_seo_keywords",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "array",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_sales_summary",
              "displayName": "ai_sales_summary",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_unique_selling_points",
              "displayName": "ai_unique_selling_points",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "array",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_key_features",
              "displayName": "ai_key_features",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "array",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_specifications",
              "displayName": "ai_specifications",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "raw_amazon_payload",
              "displayName": "raw_amazon_payload",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "raw_ebay_payload",
              "displayName": "raw_ebay_payload",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "raw_upcitemdb_payload",
              "displayName": "raw_upcitemdb_payload",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_processing_error",
              "displayName": "ai_processing_error",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "last_api_error_source",
              "displayName": "last_api_error_source",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "last_api_error_message",
              "displayName": "last_api_error_message",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "last_enriched_at",
              "displayName": "last_enriched_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false,
          "values": []
        },
        "options": {}
      },
      "id": "ac557190-a3b7-4aca-82a8-d42fbd4f5cf0",
      "name": "Update Product data-original1",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        0,
        -200
      ],
      "credentials": {
        "postgres": {
          "id": "ROCom75uM2IZ3Ca9",
          "name": "dbaimagic Lightsail"
        }
      }
    },
    {
      "parameters": {
        "content": "## Edit Product Data\n",
        "height": 240,
        "width": 980
      },
      "type": "n8n-nodes-base.stickyNote",
      "position": [
        -320,
        -260
      ],
      "typeVersion": 1,
      "id": "39ac80f3-3672-40dd-8bab-ed66dfec4c47",
      "name": "Sticky Note4"
    },
    {
      "parameters": {
        "operation": "update",
        "schema": "public",
        "table": "products",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "sale_price": "={{ $json.sale_price != null ? parseFloat($json.sale_price) : null }}",
            "highest_recorded_price": "={{ $json.upcdb_highestPrice != null ? parseFloat($json.upcdb_highestPrice) : null }}",
            "height": "={{ $json.height != null ? parseFloat($json.height) : null }}",
            "sku": "={{ $json.sku ?? null }}",
            "asin": "={{ $json.am_asin ?? ($json.raw_amazon?.items?.[0]?.asin) ?? null }}",
            "gtin": "={{ $json.gtin ?? null }}",
            "ean": "={{ $json.ean ?? $json.am_ean ?? null }}",
            "epid": "={{ $json.eb_epid ?? null }}",
            "upc": "={{ $json.upc }}",
            "code_type": "={{ $json.code_type ?? null }}",
            "title": "={{ $json.ai_optimized_title || $json.upcdb_title || $json.eb_title || $json.am_title || $json.name || null }}",
            "brand": "={{ $json.brand || $json.upcdb_brand || $json.am_brand || null }}",
            "product_type": "={{ $json.product_type ?? null }}",
            "condition": "={{ $json.condition || $json.eb_condition || null }}",
            "condition_details": "={{ $json.condition_details ?? null }}",
            "short_description": "={{ $json.ai_sales_summary || $json.short_description || null }}",
            "description": "={{ $json.ai_optimized_description || $json.upcdb_description || $json.description || null }}",
            "long_description": "={{ $json.ai_optimized_description || $json.long_description || $json.upcdb_description || null }}",
            "unique_selling_points": "={{ ($json.ai_unique_selling_points && Array.isArray($json.ai_unique_selling_points) ? $json.ai_unique_selling_points.join(' | ') : $json.unique_selling_points) ?? null }}",
            "key_features": "={{ ($json.ai_key_features && Array.isArray($json.ai_key_features) ? $json.ai_key_features.join(' | ') : ($json.am_features && Array.isArray($json.am_features) ? $json.am_features.join(' | ') : $json.key_features)) ?? null }}",
            "key_benefits": "={{ $json.key_benefits ?? null }}",
            "price": "={{ $json.price != null ? parseFloat($json.price) : ($json.am_price != null ? parseFloat($json.am_price) : ($json.eb_price != null ? parseFloat($json.eb_price) : ($json.upcdb_lowestPrice != null ? parseFloat($json.upcdb_lowestPrice) : null))) }}",
            "regular_price": "={{ $json.regular_price != null ? parseFloat($json.regular_price) : null }}",
            "sale_start_date": "={{ $json.sale_start_date ? new Date($json.sale_start_date).toISOString() : null }}",
            "sale_end_date": "={{ $json.sale_end_date ? new Date($json.sale_end_date).toISOString() : null }}",
            "currency": "={{ $json.currency || $json.am_currency || $json.eb_currency || ($json.upcdb_offers && $json.upcdb_offers.length > 0 ? $json.upcdb_offers[0].currency : null) || 'USD' }}",
            "item_specifics": "={{ $json.ai_item_specifics || $json.item_specifics || null }}",
            "additional_attributes": "={{ $json.ai_additional_attributes || $json.additional_attributes || null }}",
            "image_urls": "={{\n  {\n    \"urls\": $json.image_urls_all || \n            ($json.images && Array.isArray($json.images) ? $json.images : Array.from(new Set([$json.upcdb_imageUrl, $json.am_imageUrl, $json.eb_imageUrl].filter(Boolean)))) || \n            []\n  }\n}}",
            "main_image_url": "={{ $json.main_image_url || $json.upcdb_imageUrl || $json.am_imageUrl || $json.eb_imageUrl || null }}",
            "lowest_recorded_price": "={{ $json.upcdb_lowestPrice != null ? parseFloat($json.upcdb_lowestPrice) : null }}",
            "tags": "={{ ($json.ai_seo_keywords && Array.isArray($json.ai_seo_keywords) && $json.ai_seo_keywords.length > 0 ? $json.ai_seo_keywords.join(', ') : $json.tags) ?? null }}",
            "weight": "={{ $json.weight_value != null ? parseFloat($json.weight_value) : ($json.weight ? parseFloat(String($json.weight).replace(/[^\\\\d.-]/g, '')) : null) }}",
            "length": "={{ $json.length != null ? parseFloat($json.length) : null }}",
            "weight_unit": "={{ $json.weight_unit != null ? parseFloat($json.length) : null }}",
            "width": "={{ $json.width != null ? parseFloat($json.width) : null }}",
            "dimensions_unit": "={{ $json.dimensions_unit ?? null }}",
            "ebay_category": "={{ $json.eb_categoryName ?? null }}",
            "ebay_category_id": "={{ $json.eb_categoryId ?? null }}",
            "google_category_id": "={{ $json.google_category_id ?? null }}",
            "google_category": "={{ $json.google_category ?? null }}",
            "amazon_data": "={{ $json.raw_amazon ?? $json.amazon_data ?? null }}",
            "visibility": "={{ $json.visibility ?? null }}",
            "position": "={{ $json.position != null ? parseInt($json.position, 10) : null }}",
            "enrichment_status": "={{ $json.enrichment_status ?? null }}",
            "notes": "={{ $json.notes ?? null }}",
            "care_instructions": "={{ $json.care_instructions ?? null }}",
            "authentication": "={{ $json.authentication ?? null }}",
            "history_provenance": "={{ $json.history_provenance ?? null }}",
            "dimensions_text": "={{ $json.dimensions_text ?? $json.dimension ?? null }}",
            "amazon_category_browse_node_id": "={{ $json.am_browse_node_id ?? ($json.raw_amazon?.items?.[0]?.browse_node_info?.browse_nodes?.[0]?.id) ?? null }}",
            "upcdb_category": "={{ $json.upcdb_category ?? null }}",
            "ai_optimized_title": "={{ $json.ai_optimized_title ?? null }}",
            "ai_optimized_description": "={{ $json.ai_optimized_description ?? null }}",
            "ai_seo_keywords": "={{ $json.ai_seo_keywords && Array.isArray($json.ai_seo_keywords) && $json.ai_seo_keywords.length > 0 ? $json.ai_seo_keywords : null }}",
            "ai_sales_summary": "={{ $json.ai_sales_summary ?? null }}",
            "ai_unique_selling_points": "={{ $json.ai_unique_selling_points && Array.isArray($json.ai_unique_selling_points) && $json.ai_unique_selling_points.length > 0 ? $json.ai_unique_selling_points : null }}",
            "ai_key_features": "={{ $json.ai_key_features && Array.isArray($json.ai_key_features) && $json.ai_key_features.length > 0 ? $json.ai_key_features : ($json.am_features && Array.isArray($json.am_features) ? $json.am_features : null) }}",
            "ai_specifications": "={{ $json.ai_specifications ?? null }}",
            "raw_amazon_payload": "={{ $json.raw_amazon ?? null }}",
            "raw_ebay_payload": "={{ $json.raw_ebay ?? null }}",
            "raw_upcitemdb_payload": "={{ $json.raw_upcitemdb ?? null }}",
            "ai_processing_error": "={{ $json.ai_processing_error ?? null }}",
            "last_api_error_source": "={{ $json.last_api_error_source ?? null }}",
            "last_api_error_message": "={{ $json.last_api_error_message ?? null }}",
            "last_enriched_at": "={{ new Date().toISOString() }}"
          },
          "matchingColumns": [
            "upc"
          ],
          "schema": [
            {
              "id": "id",
              "displayName": "id",
              "required": false,
              "defaultMatch": true,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "sku",
              "displayName": "sku",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "upc",
              "displayName": "upc",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "code_type",
              "displayName": "code_type",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "quantity",
              "displayName": "quantity",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "created_at",
              "displayName": "created_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "last_scanned_at",
              "displayName": "last_scanned_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "title",
              "displayName": "title",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "brand",
              "displayName": "brand",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "product_type",
              "displayName": "product_type",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "condition",
              "displayName": "condition",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "condition_details",
              "displayName": "condition_details",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "short_description",
              "displayName": "short_description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "description",
              "displayName": "description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "long_description",
              "displayName": "long_description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "unique_selling_points",
              "displayName": "unique_selling_points",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "key_features",
              "displayName": "key_features",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "key_benefits",
              "displayName": "key_benefits",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "price",
              "displayName": "price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "regular_price",
              "displayName": "regular_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "sale_price",
              "displayName": "sale_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "sale_start_date",
              "displayName": "sale_start_date",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "sale_end_date",
              "displayName": "sale_end_date",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "currency",
              "displayName": "currency",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "lowest_recorded_price",
              "displayName": "lowest_recorded_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "highest_recorded_price",
              "displayName": "highest_recorded_price",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "item_specifics",
              "displayName": "item_specifics",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "additional_attributes",
              "displayName": "additional_attributes",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "tags",
              "displayName": "tags",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "weight",
              "displayName": "weight",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "weight_unit",
              "displayName": "weight_unit",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "length",
              "displayName": "length",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "width",
              "displayName": "width",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "height",
              "displayName": "height",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "dimensions_unit",
              "displayName": "dimensions_unit",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ebay_category_id",
              "displayName": "ebay_category_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ebay_category",
              "displayName": "ebay_category",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "epid",
              "displayName": "epid",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "google_category_id",
              "displayName": "google_category_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "google_category",
              "displayName": "google_category",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "amazon_data",
              "displayName": "amazon_data",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "image_urls",
              "displayName": "image_urls",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "low_stock_amount",
              "displayName": "low_stock_amount",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "backorders_allowed",
              "displayName": "backorders_allowed",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "sold_individually",
              "displayName": "sold_individually",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "published",
              "displayName": "published",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "is_featured",
              "displayName": "is_featured",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "visibility",
              "displayName": "visibility",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "allow_reviews",
              "displayName": "allow_reviews",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "boolean",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "position",
              "displayName": "position",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "enrichment_status",
              "displayName": "enrichment_status",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "notes",
              "displayName": "notes",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "care_instructions",
              "displayName": "care_instructions",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "authentication",
              "displayName": "authentication",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "history_provenance",
              "displayName": "history_provenance",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ean",
              "displayName": "ean",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "gtin",
              "displayName": "gtin",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "asin",
              "displayName": "asin",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "dimensions_text",
              "displayName": "dimensions_text",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "amazon_category_browse_node_id",
              "displayName": "amazon_category_browse_node_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "upcdb_category",
              "displayName": "upcdb_category",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "main_image_url",
              "displayName": "main_image_url",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_optimized_title",
              "displayName": "ai_optimized_title",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_optimized_description",
              "displayName": "ai_optimized_description",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_seo_keywords",
              "displayName": "ai_seo_keywords",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "array",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_sales_summary",
              "displayName": "ai_sales_summary",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_unique_selling_points",
              "displayName": "ai_unique_selling_points",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "array",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_key_features",
              "displayName": "ai_key_features",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "array",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_specifications",
              "displayName": "ai_specifications",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "raw_amazon_payload",
              "displayName": "raw_amazon_payload",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "raw_ebay_payload",
              "displayName": "raw_ebay_payload",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "raw_upcitemdb_payload",
              "displayName": "raw_upcitemdb_payload",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "ai_processing_error",
              "displayName": "ai_processing_error",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "last_api_error_source",
              "displayName": "last_api_error_source",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "last_api_error_message",
              "displayName": "last_api_error_message",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "last_enriched_at",
              "displayName": "last_enriched_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false,
          "values": []
        },
        "options": {}
      },
      "id": "cb0d5d7c-b95c-4179-a359-ed6ccf4782a7",
      "name": "Full Edit UPC",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        20,
        60
      ],
      "credentials": {
        "postgres": {
          "id": "ROCom75uM2IZ3Ca9",
          "name": "dbaimagic Lightsail"
        }
      }
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT * FROM products ORDER BY last_scanned_at DESC;",
        "options": {}
      },
      "id": "03723c20-0441-4891-a305-1caad9c0d14f",
      "name": "Inventory data",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        1020,
        -460
      ],
      "credentials": {
        "postgres": {
          "id": "ROCom75uM2IZ3Ca9",
          "name": "dbaimagic Lightsail"
        }
      }
    },
    {
      "parameters": {
        "path": "edit-update",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [
        -220,
        -200
      ],
      "id": "2223731e-d043-47c7-a9e5-b98d0cdd03a4",
      "name": "Edit/Update",
      "webhookId": "0d4b5dfd-8e70-40ac-b8a2-ac52ab460b3f"
    },
    {
      "parameters": {
        "content": "## Product Inventory\n\n\n",
        "height": 220,
        "width": 980,
        "color": 2
      },
      "type": "n8n-nodes-base.stickyNote",
      "position": [
        700,
        -520
      ],
      "typeVersion": 1,
      "id": "e56b10fc-3e30-4b6b-8a6b-235f4bc30e35",
      "name": "Sticky Note5"
    },
    {
      "parameters": {
        "path": "full-inventory",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "(GET /Full inventory)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1.1,
      "position": [
        800,
        -460
      ],
      "webhookId": "59c2ff9e-0079-49d2-a8bf-b5d088497ea8",
      "id": "cb7f489a-a72a-4f01-beeb-c011bcb52014"
    },
    {
      "parameters": {
        "path": "get-product-details?upc=YOUR_UPC",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [
        -220,
        60
      ],
      "id": "3efe7ec9-b436-4ef0-8c04-6e25b6f0f8ac",
      "name": "UPC-lookup",
      "webhookId": "0d4b5dfd-8e70-40ac-b8a2-ac52ab460b3f"
    },
    {
      "parameters": {
        "respondWith": "allIncomingItems",
        "options": {}
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.2,
      "position": [
        220,
        60
      ],
      "id": "e9b48dd5-38a8-4c74-97dc-146f83394028",
      "name": "Respond to UPC Lookup"
    },
    {
      "parameters": {
        "content": "## Single Product Load\n",
        "height": 240,
        "width": 1180
      },
      "type": "n8n-nodes-base.stickyNote",
      "position": [
        720,
        -240
      ],
      "typeVersion": 1,
      "id": "1e5a3825-fb5c-4eea-b0a5-cf2b29262535",
      "name": "Sticky Note6"
    },
    {
      "parameters": {},
      "name": "Start",
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [
        620,
        100
      ],
      "id": "f6dff753-9501-419a-887a-ab6b244226e9"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT original_url, display_order, is_main, source_platform, local_copy_url, metadata FROM product_images WHERE upc = $1 ORDER BY display_order ASC;",
        "options": {
          "queryReplacement": "={{$node[\"get-single-product-details\"].json.query.upc}}"
        }
      },
      "id": "bd2281e3-f70e-404c-995e-47c6b49d1087",
      "name": "Get Kept Images",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        1220,
        -180
      ],
      "credentials": {
        "postgres": {
          "id": "ROCom75uM2IZ3Ca9",
          "name": "dbaimagic Lightsail"
        }
      }
    },
    {
      "parameters": {
        "keepOnlySet": true,
        "values": {
          "string": [
            {
              "name": "product",
              "value": "={{$node[\"Single Product UPC\"].json}}"
            },
            {
              "name": "kept_images",
              "value": "={{ $node[\"Get Kept Images\"].json }}"
            }
          ]
        },
        "options": {}
      },
      "id": "217a47f8-4af3-4d4f-98f0-57cfef470c57",
      "name": "Merge Data",
      "type": "n8n-nodes-base.set",
      "typeVersion": 1,
      "position": [
        1440,
        -180
      ]
    },
    {
      "parameters": {
        "path": "get-single-product-details",
        "responseMode": "responseNode",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [
        800,
        -180
      ],
      "id": "17191f60-c443-4788-856b-7f609d2f7c40",
      "name": "get-single-product-details",
      "webhookId": "d4232580-c3bf-439c-88e1-bc75d66697f9"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT * FROM products WHERE upc = $1;",
        "options": {
          "queryReplacement": "={{$node[\"get-single-product-details\"].json.query.upc}}"
        }
      },
      "id": "04d172cf-ba1c-4264-925f-8c487dd32f9f",
      "name": "Single Product UPC",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        1000,
        -180
      ],
      "credentials": {
        "postgres": {
          "id": "ROCom75uM2IZ3Ca9",
          "name": "dbaimagic Lightsail"
        }
      }
    },
    {
      "parameters": {
        "options": {
          "responseCode": 200,
          "responseHeaders": {
            "entries": [
              {
                "name": "Access-Control-Allow-Origin",
                "value": "*"
              },
              {
                "name": "Content-Type",
                "value": "application/json"
              }
            ]
          }
        }
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.2,
      "position": [
        1640,
        -180
      ],
      "id": "37d78626-d519-494d-927d-35226fe9c78c",
      "name": "Respond to UPC Single Product"
    },
    {
      "parameters": {
        "content": "## Image Processing\n",
        "height": 240,
        "width": 1080
      },
      "type": "n8n-nodes-base.stickyNote",
      "position": [
        800,
        20
      ],
      "typeVersion": 1,
      "id": "a5c5664e-4fe3-416d-8e64-b547c1ee0d06",
      "name": "Sticky Note7"
    },
    {
      "parameters": {
        "batchSize": 1,
        "options": {}
      },
      "name": "Loop Through Images1",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 2,
      "position": [
        1340,
        80
      ],
      "id": "fa033bf1-ce41-4229-9b6d-a333bdf7cad2"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO product_images (upc, original_url, display_order, is_main, source_platform, metadata)\nVALUES (\n    '{{$node[\"Product-Images\"].json.body.upc}}',\n    '{{$json.original_url}}',\n    {{$json.display_order}},\n    {{$json.is_main}},\n    '{{$json.source_platform}}',\n    '{{$json.metadata}}'::jsonb\n);\n",
        "options": {}
      },
      "name": "New Image insert",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        1640,
        80
      ],
      "id": "44c53d76-e3ba-4f02-aa50-d12ee151ded2",
      "credentials": {
        "postgres": {
          "id": "ROCom75uM2IZ3Ca9",
          "name": "dbaimagic Lightsail"
        }
      }
    },
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "product-images",
        "options": {}
      },
      "name": "Product-Images",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [
        920,
        80
      ],
      "webhookId": "a4b2c1d3-e5f6-4a7b-8c9d-1e2f3a4b5c6d",
      "id": "ea808bc6-076c-48e2-8bb9-3293dd157267"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "DELETE FROM product_images WHERE upc = '{{$json.body.upc}}';",
        "options": {}
      },
      "name": "Remove Images",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        1120,
        80
      ],
      "id": "44fb0087-af6e-4678-ae03-0c463580b244",
      "credentials": {
        "postgres": {
          "id": "ROCom75uM2IZ3Ca9",
          "name": "dbaimagic Lightsail"
        }
      }
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $input.item.json }}",
        "options": {
          "responseHeaders": {
            "entries": [
              {
                "name": "Access-Control-Allow-Origin",
                "value": "*"
              },
              {
                "name": "Content-Type",
                "value": "application/json"
              }
            ]
          }
        }
      },
      "name": "Respond to Get Full Inventory",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        1460,
        -460
      ],
      "id": "d7e4f4d5-89b2-4417-a1f6-310c0923e09e"
    },
    {
      "parameters": {
        "jsCode": "const allDbRows = $input.all();\nconst allProducts = allDbRows.map(item => item.json);\n\nconst responseData = {\n  success: true,\n  data: allProducts\n};\n\nreturn [{ json: responseData }];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        1240,
        -460
      ],
      "name": "Formating Response",
      "id": "f1866a9d-ee69-4c80-b3df-1a35fa7931a9"
    }
  ],
  "connections": {
    "Webhook (POST /enrich-product)": {
      "main": [
        [
          {
            "node": "Extract Essential Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "API Call: eBay Browse API": {
      "main": [
        [
          {
            "node": "Set: Store eBay Output",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "API Call: UPCitemdb": {
      "main": [
        [
          {
            "node": "Set: Store UPCitemdb Output",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Set: Store UPCitemdb Output": {
      "main": [
        [
          {
            "node": "Code: Merge All Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code: Merge All Data": {
      "main": [
        [
          {
            "node": "CPI Data instructions",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Build Amazon API Command": {
      "main": [
        [
          {
            "node": "Execute Amazon SP-API Script",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Execute Amazon SP-API Script": {
      "main": [
        [
          {
            "node": "Parse Amazon Script Output",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Parse Amazon Script Output": {
      "main": [
        [
          {
            "node": "Set: Clean Amazon Output (and pass amazonData)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Set: Clean Amazon Output (and pass amazonData)": {
      "main": [
        [
          {
            "node": "API Call: eBay Browse API",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Set: Store eBay Output": {
      "main": [
        [
          {
            "node": "API Call: UPCitemdb",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Extract Essential Data": {
      "main": [
        [
          {
            "node": "Build Amazon API Command",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google Gemini Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "CPI Enhancer",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Simple Memory": {
      "ai_memory": [
        [
          {
            "node": "CPI Enhancer",
            "type": "ai_memory",
            "index": 0
          }
        ]
      ]
    },
    "CPI Enhancer": {
      "main": [
        [
          {
            "node": "Code: Clean and Prepare AI Output",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "CPI Data instructions": {
      "main": [
        [
          {
            "node": "CPI Enhancer",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code: Clean and Prepare AI Output": {
      "main": [
        [
          {
            "node": "Update Product data-original",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Webhook (POST /scan-upc)": {
      "main": [
        [
          {
            "node": "Validate Code",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "DB Upsert Quantity": {
      "main": [
        [
          {
            "node": "Respond Success",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Validate Code": {
      "main": [
        [
          {
            "node": "DB Upsert Quantity",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Respond DB Error",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Webhook": {
      "main": [
        [
          {
            "node": "Postgres",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Postgres": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Webhook (GET /inventory)": {
      "main": [
        [
          {
            "node": "Postgres (Get Products)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Postgres (Get Products)": {
      "main": [
        [
          {
            "node": "Format Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Format Response": {
      "main": [
        [
          {
            "node": "Respond",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Update Product data-original1": {
      "main": [
        [
          {
            "node": "Respond to Webhook1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Full Edit UPC": {
      "main": [
        [
          {
            "node": "Respond to UPC Lookup",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Inventory data": {
      "main": [
        [
          {
            "node": "Formating Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Edit/Update": {
      "main": [
        [
          {
            "node": "Update Product data-original1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "(GET /Full inventory)": {
      "main": [
        [
          {
            "node": "Inventory data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "UPC-lookup": {
      "main": [
        [
          {
            "node": "Full Edit UPC",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get Kept Images": {
      "main": [
        [
          {
            "node": "Merge Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Merge Data": {
      "main": [
        [
          {
            "node": "Respond to UPC Single Product",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "get-single-product-details": {
      "main": [
        [
          {
            "node": "Single Product UPC",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Single Product UPC": {
      "main": [
        [
          {
            "node": "Get Kept Images",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Loop Through Images1": {
      "main": [
        [
          {
            "node": "New Image insert",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Product-Images": {
      "main": [
        [
          {
            "node": "Remove Images",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Remove Images": {
      "main": [
        [
          {
            "node": "Loop Through Images1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Formating Response": {
      "main": [
        [
          {
            "node": "Respond to Get Full Inventory",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "a181be3f065802d782c0729f9e34f8ee1309d903960f13dd48b78423e9bd19e1"
  }
}