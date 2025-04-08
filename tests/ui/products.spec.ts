import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPages';
import { ProductsPage } from '../../pages/ProductsPages';
import { checkConsoleErrors, generateTestData, getRandomItem } from '../../utils/helpers';

test.describe('Product and Checkout Functionality', () => {
  let loginPage: LoginPage;
  let productsPage: ProductsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    productsPage = new ProductsPage(page);

    // Start monitoring console errors
    await checkConsoleErrors(page);

    await loginPage.navigate();
    await loginPage.login();
  });

  test('Add product to cart and checkout', async ({ page }) => {
    // Get all products and select a random one
    const products = await productsPage.getProductNames();
    const productName = getRandomItem(products);
    
    // Add the product to cart
    await productsPage.addProductToCart(productName);
    
    // Verify product is in cart
    const cartCount = await productsPage.getCartItemCount();
    expect(cartCount).toBe(1);
    
    const isAdded = await productsPage.isProductAddedToCart(productName);
    expect(isAdded).toBeTruthy();

    // Get product details for verification
    const productDetails = await productsPage.getProductDetails(productName);
    
    // Proceed to checkout
    await productsPage.proceedToCheckout();
    
    // Fill checkout information with generated test data
    const testData = generateTestData();
    await productsPage.fillCheckoutInfo(testData.firstName, testData.lastName, testData.zipCode);
    
    // Complete checkout and verify success message
    const confirmationMessage = await productsPage.completeCheckout();
    expect(confirmationMessage).toContain('Thank you for your order!');

    // Check for any console errors that occurred during the test
    await checkConsoleErrors(page);
  });

  test('Add and remove multiple products from cart', async ({ page }) => {
    // Get all products and select random three
    const allProducts = await productsPage.getProductNames();
    const selectedProducts = Array.from({ length: 3 }, () => getRandomItem(allProducts));
    
    for (const product of selectedProducts) {
      await productsPage.addProductToCart(product);
      const isAdded = await productsPage.isProductAddedToCart(product);
      expect(isAdded).toBeTruthy();
    }

    // Verify cart count
    let cartCount = await productsPage.getCartItemCount();
    expect(cartCount).toBe(selectedProducts.length);

    // Remove one random product
    const productToRemove = getRandomItem(selectedProducts);
    await productsPage.removeProductFromCart(productToRemove);
    cartCount = await productsPage.getCartItemCount();
    expect(cartCount).toBe(selectedProducts.length - 1);
  });

  test('Sort products and verify order', async ({ page }) => {
    // Get initial product names
    const initialProducts = await productsPage.getProductNames();

    // Sort by name (A to Z)
    await productsPage.sortProducts('az');
    const azProducts = await productsPage.getProductNames();
    expect(azProducts).toEqual([...initialProducts].sort());

    // Sort by name (Z to A)
    await productsPage.sortProducts('za');
    const zaProducts = await productsPage.getProductNames();
    expect(zaProducts).toEqual([...initialProducts].sort().reverse());

    // Sort by price (low to high)
    await productsPage.sortProducts('lohi');
    const prices = await productsPage.getProductPrices();
    const isSortedByPrice = prices.every((price, i) => {
      if (i === 0) return true;
      return parseFloat(price.replace('$', '')) >= parseFloat(prices[i - 1].replace('$', ''));
    });
    expect(isSortedByPrice).toBeTruthy();
  });

  test('Verify product details accuracy', async ({ page }) => {
    const productName = 'Sauce Labs Backpack';
    const details = await productsPage.getProductDetails(productName);

    // Verify product has all required information
    expect(details.name).toBe(productName);
    expect(details.price).toBeTruthy();
    expect(parseFloat(details.price)).toBeGreaterThan(0);
    expect(details.description).toBeTruthy();
  });

  test('Checkout form validation', async ({ page }) => {
    // Get random product and add to cart
    const products = await productsPage.getProductNames();
    const productName = getRandomItem(products);
    await productsPage.addProductToCart(productName);
    await productsPage.proceedToCheckout();

    // Try to continue without filling any information
    await page.click('[data-test="continue"]');
    const errorMessage = await page.textContent('[data-test="error"]');
    expect(errorMessage).toContain('First Name is required');

    // Generate test data for partial fills
    const testData = generateTestData();

    // Fill only first name and verify last name error
    await productsPage.fillCheckoutInfo(testData.firstName, '', '');
    const lastNameError = await page.textContent('[data-test="error"]');
    expect(lastNameError).toContain('Last Name is required');

    // Fill first and last name, verify zip code error
    await productsPage.fillCheckoutInfo(testData.firstName, testData.lastName, '');
    const zipError = await page.textContent('[data-test="error"]');
    expect(zipError).toContain('Postal Code is required');
  });

  test('Performance - Page load time', async ({ page }) => {
    // Measure navigation timing
    const timing = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.startTime,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
      };
    });

    // Assert reasonable load times
    expect(timing.loadTime).toBeLessThan(5000); // Page should load within 5 seconds
    expect(timing.domContentLoaded).toBeLessThan(3000); // DOM should be ready within 3 seconds
    expect(timing.firstPaint).toBeLessThan(2000); // First paint should occur within 2 seconds
  });

  test('Image loading verification', async ({ page }) => {
    // Get all product images
    const images = page.locator('.inventory_item img');
    const count = await images.count();

    // Verify each image is loaded and has proper attributes
    for (let i = 0; i < count; i++) {
      const image = images.nth(i);
      
      // Check if image is visible
      await expect(image).toBeVisible();
      
      // Verify image has loaded successfully
      const naturalWidth = await image.evaluate(img => (img as HTMLImageElement).naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);

      // Verify alt text exists
      const altText = await image.getAttribute('alt');
      expect(altText).toBeTruthy();
    }
  });

  test('Price calculation verification', async ({ page }) => {
    // Get all products and select random two
    const allProducts = await productsPage.getProductNames();
    const selectedProducts = Array.from({ length: 2 }, () => getRandomItem(allProducts));
    let expectedTotal = 0;

    // Add products and calculate expected total
    for (const product of selectedProducts) {
      await productsPage.addProductToCart(product);
      const details = await productsPage.getProductDetails(product);
      expectedTotal += parseFloat(details.price);
    }

    // Go to cart
    await productsPage.proceedToCheckout();

    // Fill checkout information with generated test data
    const testData = generateTestData();
    await productsPage.fillCheckoutInfo(testData.firstName, testData.lastName, testData.zipCode);

    // Get subtotal from page
    const subtotalText = await page.locator('.summary_subtotal_label').textContent();
    const actualTotal = parseFloat(subtotalText?.replace(/[^0-9.]/g, '') || '0');

    // Verify totals match
    expect(actualTotal).toBeCloseTo(expectedTotal, 2);

    // Verify tax calculation (assuming 8% tax)
    const taxText = await page.locator('.summary_tax_label').textContent();
    const taxAmount = parseFloat(taxText?.replace(/[^0-9.]/g, '') || '0');
    expect(taxAmount).toBeCloseTo(expectedTotal * 0.08, 2);

    // Verify final total
    const totalText = await page.locator('.summary_total_label').textContent();
    const finalTotal = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');
    expect(finalTotal).toBeCloseTo(expectedTotal + taxAmount, 2);
  });

  test('Session persistence', async ({ page, context }) => {
    // Add a product to cart
    const productName = 'Sauce Labs Backpack';
    await productsPage.addProductToCart(productName);
    
    // Store cart count
    const initialCartCount = await productsPage.getCartItemCount();
    
    // Create a new page in the same context (simulates opening new tab)
    const newPage = await context.newPage();
    const newLoginPage = new LoginPage(newPage);
    const newProductsPage = new ProductsPage(newPage);
    
    // Navigate to the site in new tab
    await newLoginPage.navigate();
    await newLoginPage.login();
    
    // Verify cart count persists
    const newCartCount = await newProductsPage.getCartItemCount();
    expect(newCartCount).toBe(initialCartCount);
    
    // Verify product is still in cart
    const isStillInCart = await newProductsPage.isProductAddedToCart(productName);
    expect(isStillInCart).toBeTruthy();
    
    // Close the new page
    await newPage.close();
  });
}); 