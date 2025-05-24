# Image Management Troubleshooting Guide

## Common Issues and Solutions

### 1. Images Not Loading/Displaying

**Symptoms:**
- Images show as broken/placeholder
- Gallery appears empty
- Main image doesn't change when clicked

**Solutions:**
1. **Check Browser Console:**
   - Press F12 and look for JavaScript errors
   - Look for network errors (404, CORS, etc.)

2. **Verify n8n Workflow Data:**
   ```javascript
   // Test in browser console after loading a product
   console.log("Product data:", window.lastProductData);
   ```

3. **Check Image URL Accessibility:**
   - Try opening image URLs directly in browser
   - Verify CORS headers if loading from different domains

4. **Validate Data Structure:**
   Ensure your n8n workflow returns data in this format:
   ```json
   {
     "main_image_url": "https://example.com/main.jpg",
     "image_urls": {
       "urls": ["https://example.com/img1.jpg"]
     },
     "raw_amazon_payload": {
       "items": [{ "images": [...] }]
     }
   }
   ```

### 2. Drag and Drop Not Working

**Symptoms:**
- Cannot reorder selected images
- Dragging doesn't provide visual feedback

**Solutions:**
1. **Check for JavaScript Errors:**
   - Ensure no console errors are blocking functionality

2. **Verify HTML Structure:**
   - Selected images container should have proper class names
   - Drag/drop event listeners should be attached

3. **Test with Simple Case:**
   - Select only 2-3 images and try reordering

### 3. Save Images Functionality Issues

**Symptoms:**
- "Save Kept Images" button doesn't work
- No success/error messages
- Images don't persist after refresh

**Solutions:**
1. **Check n8n Workflow Endpoint:**
   - Verify `https://n8n.by1.net/webhook/product-images` is accessible
   - Test with Postman or curl:
   ```bash
   curl -X POST https://n8n.by1.net/webhook/product-images \
     -H "Content-Type: application/json" \
     -d '{"upc":"123456789012","selected_images":[{"url":"test.jpg","order":1,"is_main":true}]}'
   ```

2. **Verify Payload Format:**
   - Check browser network tab for request payload
   - Ensure UPC is included in the request

3. **Check Database Schema:**
   - Ensure your database can store the image data structure
   - Verify column types and constraints

### 4. Image Selection Limits

**Symptoms:**
- Cannot select more than expected number of images
- Checkboxes become disabled unexpectedly

**Solutions:**
1. **Check MAX_SELECTED_IMAGES:**
   ```javascript
   console.log("Max images allowed:", MAX_SELECTED_IMAGES);
   ```

2. **Verify Selection Logic:**
   ```javascript
   console.log("Currently selected:", selectedImagesForKeeping.length);
   ```

### 5. Main Image Selection Issues

**Symptoms:**
- Cannot set main image
- Main image doesn't update visually
- Multiple images marked as main

**Solutions:**
1. **Check Main Image Logic:**
   - Only one image should have `is_main: true`
   - Main image should update both display and data structure

2. **Verify Visual Updates:**
   - Main image container should show updated image
   - Selected thumbnails should show correct "Is Main" status

## Debug Tools

### 1. Console Commands for Testing

```javascript
// Check current selected images
console.log("Selected images:", selectedImagesForKeeping);

// Check if functions are available
console.log("Functions available:", {
  selectAll: typeof selectAllImages,
  deselectAll: typeof deselectAllImages,
  validate: typeof validateImageUrls,
  export: typeof exportImageList
});

// Test image selection manually
handleImageSelection(
  document.querySelector('.image-select-checkbox'),
  { url: 'test.jpg', source: 'test' }
);
```

### 2. Network Debugging

```javascript
// Monitor fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch request:', args);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('Fetch response:', response);
      return response;
    });
};
```

### 3. Event Listener Debugging

```javascript
// Check if event listeners are attached
const saveButton = document.getElementById('saveKeptImagesButton');
console.log('Save button listeners:', getEventListeners(saveButton));
```

## Performance Optimization

### 1. Image Loading Optimization

```javascript
// Lazy load images in gallery
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      imageObserver.unobserve(img);
    }
  });
});

// Apply to gallery images
document.querySelectorAll('.gallery-image[data-src]').forEach(img => {
  imageObserver.observe(img);
});
```

### 2. Debounce Updates

```javascript
// Debounce drag and drop updates
let dragUpdateTimeout;
function debouncedUpdate() {
  clearTimeout(dragUpdateTimeout);
  dragUpdateTimeout = setTimeout(() => {
    renderSelectedImagesForManagement();
  }, 100);
}
```

## Best Practices

1. **Always validate image URLs before saving**
2. **Provide clear visual feedback during operations**
3. **Handle errors gracefully with user-friendly messages**
4. **Keep the UI responsive during bulk operations**
5. **Persist user selections locally as backup**
6. **Test with various image formats and sizes**
7. **Implement proper loading states**
8. **Use meaningful error messages**

## Getting Help

If issues persist:

1. **Check the browser console** for specific error messages
2. **Test n8n workflows individually** using the n8n interface
3. **Verify database connectivity** and schema
4. **Test with minimal data** to isolate issues
5. **Compare working vs non-working scenarios**

## Useful Browser Extensions

- **n8n Browser Extension** - For easier workflow testing
- **CORS Unblock** - For local development CORS issues
- **JSON Formatter** - For better API response viewing
- **Network Monitor** - For detailed request/response analysis
