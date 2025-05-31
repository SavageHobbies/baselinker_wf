// Global variables
let currentProductData = null;
let currentImages = [];
let mainImageIndex = 0;
let sessionStats = {
    totalScans: 0,
    successfulScans: 0,
    failedScans: 0,
    pushedToBaseLinker: 0
};

// DOM elements
const elements = {
    scanBtn: document.getElementById('scanBtn'),
    scanLoader: document.getElementById('scanLoader'),
    upcInput: document.getElementById('upcInput'),
    productInfo: document.getElementById('productInfo'),
    mainImage: document.getElementById('mainImage'),
    noImagePlaceholder: document.getElementById('noImagePlaceholder'),
    productTitle: document.getElementById('productTitle'),
    productUPC: document.getElementById('productUPC'),
    productBrand: document.getElementById('productBrand'),
    productCategory: document.getElementById('productCategory'),
    pushToBaseLinker: document.getElementById('pushToBaseLinker'),
    pushLoader: document.getElementById('pushLoader')
    // Add other frequently accessed elements here if needed
};

// Event listeners
function initializeEventListeners() {
    elements.scanBtn.addEventListener('click', handleScan);
    elements.upcInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleScan();
        }
    });
    elements.pushToBaseLinker.addEventListener('click', pushToBaseLinker);

    // Tab functionality
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // AI feature buttons
    document.getElementById('suggestCategoryBtn').addEventListener('click', () => {
        callAIFunction('category-suggestion', 'categorySuggestion');
    });
    document.getElementById('generateDescriptionBtn').addEventListener('click', () => {
        callAIFunction('description-generation', 'aiDescription');
    });
    document.getElementById('optimizeListingBtn').addEventListener('click', () => {
        callAIFunction('listing-optimization', 'listingOptimization');
    });
}

// Main scan function
async function handleScan() {
    const upc = elements.upcInput.value.trim();
    if (!upc) {
        showToast('Please enter a UPC code', 'warning');
        return;
    }

    elements.scanBtn.disabled = true;
    elements.scanLoader.classList.remove('hidden');
    
    try {
        sessionStats.totalScans++;
        updateSessionStatsDisplay(); // Renamed for clarity
        
        const response = await fetch('https://n8n.by1.net/webhook/scan-upc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ upc: upc })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data);
        
        if (data && (data.title || data.product_name)) {
            sessionStats.successfulScans++;
            displayProductData(data);
            addToHistory(upc, data);
            showToast('Product scanned successfully!', 'success');
        } else {
            throw new Error('No product data found');
        }
        
    } catch (error) {
        console.error('Scan error:', error);
        sessionStats.failedScans++;
        showToast('Failed to scan product: ' + error.message, 'error');
    } finally {
        elements.scanBtn.disabled = false;
        elements.scanLoader.classList.add('hidden');
        updateSessionStatsDisplay(); // Renamed for clarity
    }
}

// Display product data
function displayProductData(product) {
    currentProductData = product;
    
    elements.productInfo.classList.remove('hidden');
    
    elements.productTitle.textContent = product.title || product.product_name || 'Unknown Product';
    elements.productUPC.textContent = product.upc || product.gtin || '-';
    elements.productBrand.textContent = product.brand || '-';
    elements.productCategory.textContent = product.category || '-';
    
    updateEnrichmentStatus(product.enrichment_status || 'completed');
    
    if (product.images && product.images.length > 0) {
        currentImages = [...product.images];
        mainImageIndex = 0; 
        setMainImage(mainImageIndex);
    } else {
        currentImages = [];
        mainImageIndex = 0;
        elements.mainImage.src = '';
        elements.mainImage.classList.add('hidden');
        elements.noImagePlaceholder.classList.remove('hidden');
        updateImageGallery([]); // Ensure gallery is cleared
    }
    
    updatePricingData(product);
    updateProductDetails(product);
    // updateImageGallery is called within setMainImage or if no images
}

// Enhanced pricing data
function updatePricingData(product) {
    console.log('Product data for pricing:', product);
    currentProductData = product; // Ensure it's set for modal access

    // Amazon pricing
    let amazonPrice = 'N/A';
    if (product.amazon_buybox_price) {
        amazonPrice = `$${product.amazon_buybox_price}`;
    } else if (product.amazon_data?.price) {
        amazonPrice = `$${product.amazon_data.price}`;
    } else if (product.amazon_data?.items?.[0]?.offers?.listings?.[0]?.price?.amount) {
        amazonPrice = `$${product.amazon_data.items[0].offers.listings[0].price.amount}`;
    }
    document.getElementById('amazonPrice').textContent = amazonPrice;
    document.getElementById('amazonCondition').textContent = amazonPrice !== 'N/A' ? (product.amazon_data?.condition || 'New') : 'N/A';
    document.getElementById('amazonSeller').textContent = amazonPrice !== 'N/A' ? (product.amazon_data?.seller_name || 'Amazon') : 'N/A';
    document.getElementById('amazonAvailability').textContent = amazonPrice !== 'N/A' ? (product.amazon_data?.availability || 'In Stock') : 'N/A';

    // eBay pricing
    let ebayPrice = 'N/A';
    let ebayListings = 'N/A';
    if (product.ebay_price_range) {
        ebayPrice = product.ebay_price_range;
        ebayListings = `${product.ebay_listing_count || 0} listings`;
    } else if (product.ebay_data?.itemSummaries?.length > 0) {
        const prices = product.ebay_data.itemSummaries
            .map(item => parseFloat(item.price?.value || item.currentBidPrice?.value || 0))
            .filter(price => price > 0);
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            ebayPrice = minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
            ebayListings = `${prices.length} listings`;
        }
    }
    document.getElementById('ebayPrice').textContent = ebayPrice;
    document.getElementById('ebayCondition').textContent = ebayPrice !== 'N/A' ? (product.ebay_data?.conditionDisplayName || 'Various') : 'N/A';
    document.getElementById('ebayShipping').textContent = ebayPrice !== 'N/A' ? (product.ebay_data?.shippingOptions?.[0]?.shippingCost?.value ? `$${product.ebay_data.shippingOptions[0].shippingCost.value}` : 'Varies') : 'N/A';
    document.getElementById('ebaySold').textContent = ebayListings;

    // UPCitemdb data
    let upcPrice = 'N/A';
    let msrp = 'N/A';
    if (product.upcitemdb_price_range) {
        upcPrice = product.upcitemdb_price_range;
    } else if (product.upcitemdb_data?.offers?.length > 0) {
        const prices = product.upcitemdb_data.offers
            .map(offer => parseFloat(offer.price || 0))
            .filter(price => price > 0);
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            upcPrice = minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
        }
    }
    if (product.msrp) {
        msrp = `$${product.msrp}`;
    } else if (product.upcitemdb_data?.msrp) {
        msrp = `$${product.upcitemdb_data.msrp}`;
    }
    document.getElementById('upcPrice').textContent = upcPrice;
    document.getElementById('msrp').textContent = msrp;
    document.getElementById('upcOffers').textContent = product.upcitemdb_data?.offers?.length || 'N/A';
    document.getElementById('upcUpdated').textContent = product.upcitemdb_data?.last_update ? new Date(product.upcitemdb_data.last_update).toLocaleDateString() : 'Recent';
}

// Show pricing details function (MODAL IMPLEMENTATION PENDING)
function showPricingDetails(merchant) {
    if (!currentProductData) {
        showToast('No product data available', 'warning');
        return;
    }
    
    let detailsTitle = '';
    let detailsContent = '';

    switch(merchant) {
        case 'amazon':
            detailsTitle = 'Amazon Pricing Details';
            detailsContent = currentProductData.amazon_data ? JSON.stringify(currentProductData.amazon_data, null, 2) : 'No detailed Amazon data available';
            break;
        case 'ebay':
            detailsTitle = 'eBay Pricing Details';
            detailsContent = currentProductData.ebay_data ? JSON.stringify(currentProductData.ebay_data, null, 2) : 'No detailed eBay data available';
            break;
        case 'upcitemdb':
            detailsTitle = 'UPCitemdb Pricing Details';
            detailsContent = currentProductData.upcitemdb_data ? JSON.stringify(currentProductData.upcitemdb_data, null, 2) : 'No detailed UPCitemdb data available';
            break;
        default:
            showToast('Unknown merchant', 'error');
            return;
    }
    
    // Placeholder for modal display - we will replace this
    // alert(`${detailsTitle}\n\n${detailsContent}`);
    openPricingModal(detailsTitle, detailsContent);
}

// Update image gallery
function updateImageGallery(images) {
    const gallery = document.getElementById('imageGallery');
    gallery.innerHTML = '';

    if (!images || images.length === 0) {
        gallery.innerHTML = '<p class="col-span-full text-center text-gray-500">No images available</p>';
        return;
    }

    const controlsHtml = `
        <div class="col-span-full mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 class="font-semibold text-blue-800 mb-2">Image Management</h4>
            <div class="flex flex-wrap gap-2 text-sm">
                <span class="text-blue-600">• Click image to set as main</span>
                <span class="text-blue-600">• Use ✕ to delete</span>
                <span class="text-blue-600">• Drag to reorder</span>
            </div>
        </div>
    `;
    gallery.insertAdjacentHTML('beforeend', controlsHtml);

    images.forEach((imageUrl, index) => {
        const isMain = index === mainImageIndex;
        const imageHtml = `
            <div class="image-thumbnail-container relative bg-white rounded-lg border-2 ${isMain ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} overflow-hidden cursor-move" 
                 draggable="true"
                 data-image-index="${index}"
                 ondragstart="handleDragStart(event)"
                 ondragover="handleDragOver(event)"
                 ondrop="handleDrop(event)">
                
                <button class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-10" 
                        onclick="deleteImage(${index})" title="Delete image">
                    ✕
                </button>
                
                ${isMain ? '<div class="absolute top-1 left-1 bg-blue-500 text-white rounded px-2 py-1 text-xs font-bold z-10">MAIN</div>' : ''}
                
                <img src="${imageUrl}" alt="Product Image ${index + 1}" 
                     class="w-full h-24 object-cover cursor-pointer"
                     onclick="setMainImage(${index})">
                
                <div class="absolute bottom-1 left-1 bg-gray-800 text-white rounded px-2 py-1 text-xs">
                    ${index + 1}
                </div>
            </div>
        `;
        gallery.insertAdjacentHTML('beforeend', imageHtml);
    });
}

// Set main image function
function setMainImage(index) {
    if (index >= 0 && index < currentImages.length) {
        mainImageIndex = index;
        elements.mainImage.src = currentImages[index];
        elements.mainImage.classList.remove('hidden');
        elements.noImagePlaceholder.classList.add('hidden');
        updateImageGallery(currentImages);
        showToast(`Image ${index + 1} set as main image`, 'success');
    } else if (currentImages.length === 0) {
        elements.mainImage.src = '';
        elements.mainImage.classList.add('hidden');
        elements.noImagePlaceholder.classList.remove('hidden');
        updateImageGallery([]);
    }
}

// Delete image function
function deleteImage(index) {
    if (currentImages.length <= 1) {
        showToast('Cannot delete the last image', 'warning');
        return;
    }
    currentImages.splice(index, 1);
    if (mainImageIndex >= index) {
        mainImageIndex = Math.max(0, mainImageIndex - 1);
    }
    if (currentImages.length > 0) {
        setMainImage(mainImageIndex);
    } else {
        setMainImage(-1); // To trigger placeholder logic in setMainImage
    }
    showToast('Image deleted successfully', 'success');
}

// Drag and drop functions
let draggedIndex = null;
function handleDragStart(event) {
    draggedIndex = parseInt(event.target.closest('.image-thumbnail-container').dataset.imageIndex);
    event.dataTransfer.effectAllowed = 'move';
    event.target.closest('.image-thumbnail-container').classList.add('dragging');
}
function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}
function handleDrop(event) {
    event.preventDefault();
    const dropTarget = event.target.closest('.image-thumbnail-container');
    if (!dropTarget) return; // Dropped outside a valid target
    const dropIndex = parseInt(dropTarget.dataset.imageIndex);
    
    document.querySelectorAll('.image-thumbnail-container').forEach(el => {
        el.classList.remove('dragging');
    });
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
        const draggedImage = currentImages[draggedIndex];
        currentImages.splice(draggedIndex, 1);
        currentImages.splice(dropIndex, 0, draggedImage);
        
        if (mainImageIndex === draggedIndex) {
            mainImageIndex = dropIndex;
        } else if (draggedIndex < mainImageIndex && dropIndex >= mainImageIndex) {
            mainImageIndex--;
        } else if (draggedIndex > mainImageIndex && dropIndex <= mainImageIndex) {
            mainImageIndex++;
        }
        
        updateImageGallery(currentImages);
        showToast('Images reordered successfully', 'success');
    }
    draggedIndex = null;
}

// Update product details section
function updateProductDetails(product) {
    const basicDetails = document.getElementById('basicDetails');
    const technicalDetails = document.getElementById('technicalDetails');
    const productDescription = document.getElementById('productDescription');

    basicDetails.innerHTML = `
        <div><span class="text-gray-500">UPC:</span> <span class="font-medium">${product.upc || 'N/A'}</span></div>
        <div><span class="text-gray-500">Brand:</span> <span class="font-medium">${product.brand || 'N/A'}</span></div>
        <div><span class="text-gray-500">Category:</span> <span class="font-medium">${product.category || 'N/A'}</span></div>
        <div><span class="text-gray-500">Manufacturer:</span> <span class="font-medium">${product.manufacturer || 'N/A'}</span></div>
        <div><span class="text-gray-500">Model:</span> <span class="font-medium">${product.model || 'N/A'}</span></div>
    `;
    technicalDetails.innerHTML = `
        <div><span class="text-gray-500">Weight:</span> <span class="font-medium">${product.weight || 'N/A'}</span></div>
        <div><span class="text-gray-500">Dimensions:</span> <span class="font-medium">${product.dimensions || 'N/A'}</span></div>
        <div><span class="text-gray-500">Color:</span> <span class="font-medium">${product.color || 'N/A'}</span></div>
        <div><span class="text-gray-500">Material:</span> <span class="font-medium">${product.material || 'N/A'}</span></div>
        <div><span class="text-gray-500">Country:</span> <span class="font-medium">${product.country || 'N/A'}</span></div>
    `;
    productDescription.textContent = product.description || 'No description available';
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('tab-active');
        btn.classList.add('tab-inactive');
    });
    const activeTabButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTabButton) {
        activeTabButton.classList.add('tab-active');
        activeTabButton.classList.remove('tab-inactive');
    }

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    const activeTabContent = document.getElementById(`${tabName}Tab`);
    if (activeTabContent) {
        activeTabContent.classList.remove('hidden');
    }
}

// AI Functions
async function callAIFunction(endpoint, targetElementId) {
    if (!currentProductData) {
        showToast('No product data available for AI analysis', 'warning');
        return;
    }
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) return;
    targetElement.innerHTML = '<div class="loader"></div>';

    try {
        const response = await fetch(`https://n8n.by1.net/webhook/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentProductData)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        targetElement.innerHTML = escapeHtml(result.content || result.suggestion || result.description || 'AI analysis completed');
        showToast('AI analysis completed successfully!', 'success');
    } catch (error) {
        console.error('AI function error:', error);
        targetElement.innerHTML = 'Failed to generate AI content. Please try again.';
        showToast('AI analysis failed: ' + error.message, 'error');
    }
}

// Push to BaseLinker
async function pushToBaseLinker() {
    if (!currentProductData) {
        showToast('No product data to push', 'warning');
        return;
    }
    elements.pushToBaseLinker.disabled = true;
    elements.pushLoader.classList.remove('hidden');
    try {
        // Construct payload, ensuring images are handled correctly (e.g., only send URLs)
        const payload = { ...currentProductData };
        if (currentImages && currentImages.length > 0) {
            payload.images = currentImages; // Send the current, possibly reordered/filtered, list
            payload.main_image_url = currentImages[mainImageIndex]; // Explicitly send main image URL
        }

        const response = await fetch('https://n8n.by1.net/webhook/push-to-baselinker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        sessionStats.pushedToBaseLinker++;
        updateSessionStatsDisplay();
        showToast('Product pushed to BaseLinker successfully!', 'success');
    } catch (error) {
        console.error('Push error:', error);
        showToast('Failed to push to BaseLinker: ' + error.message, 'error');
    } finally {
        elements.pushToBaseLinker.disabled = false;
        elements.pushLoader.classList.add('hidden');
    }
}

// Utility functions
function updateEnrichmentStatus(status) {
    const statusElement = document.getElementById('enrichmentStatus');
    if (!statusElement) return;
    statusElement.className = 'status-badge'; // Reset classes
    let statusText = status;
    switch(status?.toLowerCase()) {
        case 'completed': case 'enriched':
            statusElement.classList.add('status-enriched'); statusText = 'Enriched'; break;
        case 'pending': case 'processing':
            statusElement.classList.add('status-pending'); statusText = 'Processing'; break;
        case 'failed': case 'error':
            statusElement.classList.add('status-failed'); statusText = 'Failed'; break;
        default:
            statusElement.classList.add('status-pending'); break;
    }
    statusElement.textContent = statusText;
}

function updateSessionStatsDisplay() { // Renamed for clarity
    document.getElementById('totalScans').textContent = sessionStats.totalScans;
    document.getElementById('successfulScans').textContent = sessionStats.successfulScans;
    document.getElementById('failedScans').textContent = sessionStats.failedScans;
    document.getElementById('pushedToBaseLinker').textContent = sessionStats.pushedToBaseLinker;
}

function addToHistory(upc, data) {
    const historyContainer = document.getElementById('scanHistory');
    if (!historyContainer) return;
    const timestamp = new Date().toLocaleString();
    
    // Clear placeholder if it's the first item
    if (historyContainer.querySelector('p.text-gray-500')) {
        historyContainer.innerHTML = '';
    }

    const historyItem = document.createElement('div');
    historyItem.className = 'bg-white rounded-lg border border-gray-200 p-4';
    const productTitleText = data.title || data.product_name || 'Unknown Product';
    
    // Sanitize data for the onclick attribute
    const sanitizedData = JSON.stringify(data).replace(/'/g, "\'").replace(/"/g, '&quot;');

    historyItem.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <h4 class="font-semibold">${escapeHtml(productTitleText)}</h4>
                <p class="text-sm text-gray-600">UPC: ${escapeHtml(upc)}</p>
                <p class="text-xs text-gray-500">${timestamp}</p>
            </div>
            <button onclick='displayProductData(${sanitizedData})' 
                    class="text-blue-600 hover:text-blue-800 text-sm">
                View Again
            </button>
        </div>
    `;
    historyContainer.insertBefore(historyItem, historyContainer.firstChild);
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Modal for Pricing Details
function openPricingModal(title, content) {
    // Check if modal already exists
    let modal = document.getElementById('pricingDetailsModal');
    if (!modal) {
        // Create modal structure
        modal = document.createElement('div');
        modal.id = 'pricingDetailsModal';
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 hidden';
        modal.innerHTML = `
            <div class="relative mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
                <div class="mt-3 text-center">
                    <h3 class="text-lg leading-6 font-medium text-gray-900" id="modalTitle"></h3>
                    <div class="mt-2 px-7 py-3">
                        <pre class="text-sm text-gray-700 bg-gray-100 p-3 rounded-md overflow-x-auto text-left" id="modalContent"></pre>
                    </div>
                    <div class="items-center px-4 py-3">
                        <button id="closeModalButton" class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('closeModalButton').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        // Close modal on clicking outside content
        modal.addEventListener('click', (event) => {
            if (event.target.id === 'pricingDetailsModal') {
                modal.classList.add('hidden');
            }
        });
    }

    // Set content and show modal
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalContent').textContent = content;
    modal.classList.remove('hidden');
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    elements.upcInput.focus();
    updateSessionStatsDisplay();
    initializeEventListeners();
    switchTab('pricing'); // Default to pricing tab
});