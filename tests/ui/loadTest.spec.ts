import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPages';
import { ProductsPage } from '../../pages/ProductsPages';
import { checkConsoleErrors, generateTestData } from '../../utils/helpers';

test.describe('Load Test for Adding Products to Cart and Checkout', () => {
  const userCount = 10; // Number of users to simulate

  test.beforeEach(async ({ page }) => {
    // Start monitoring console errors
    await checkConsoleErrors(page);
  });

  for (let i = 0; i < userCount; i++) {
    test(`User ${i + 1}: Add product to cart and checkout`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const productsPage = new ProductsPage(page);

      // Navigate and login
      await loginPage.navigate();
      await loginPage.login();

      // Get all products and select a random one
      const products = await productsPage.getProductNames();
      const productName = products[Math.floor(Math.random() * products.length)];

      // Add the product to cart
      await productsPage.addProductToCart(productName);

      // Verify product is in cart
      const cartCount = await productsPage.getCartItemCount();
      expect(cartCount).toBe(1);

      const isAdded = await productsPage.isProductAddedToCart(productName);
      expect(isAdded).toBeTruthy();

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
  }
});