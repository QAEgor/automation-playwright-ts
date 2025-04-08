import { test, expect } from '@playwright/test';
import { APIHelper } from '../../utils/apiHelper';
import { generateTestData } from '../../utils/helpers';

test.describe('Shopping Cart API', () => {
  let api: APIHelper;

  test.beforeEach(async () => {
    api = new APIHelper();
    await api.init();
    
    // Login and set token
    const loginResponse = await api.login('standard_user', 'secret_sauce');
    const { token } = await loginResponse.json();
    api.setToken(token);
  });

  test('Add multiple products to cart', async () => {
    // Get products first
    const productsResponse = await api.getProducts();
    const products = await productsResponse.json();
    const productIds = products.slice(0, 3).map(p => p.id); // Get first 3 products

    // Add each product to cart
    for (const productId of productIds) {
      const response = await api.addToCart(productId);
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
    }

    // Verify cart contents
    const cartResponse = await api.get('/api/cart');
    const cart = await cartResponse.json();
    expect(cart.items.length).toBe(productIds.length);
    productIds.forEach(id => {
      expect(cart.items).toContainEqual(expect.objectContaining({ id }));
    });
  });

  test('Remove all products from cart', async () => {
    // Add products first
    const productsResponse = await api.getProducts();
    const products = await productsResponse.json();
    const productIds = products.slice(0, 2).map(p => p.id);

    for (const productId of productIds) {
      await api.addToCart(productId);
    }

    // Remove each product
    for (const productId of productIds) {
      const response = await api.removeFromCart(productId);
      expect(response.ok()).toBeTruthy();
    }

    // Verify cart is empty
    const cartResponse = await api.get('/api/cart');
    const cart = await cartResponse.json();
    expect(cart.items.length).toBe(0);
  });

  test('Checkout with empty cart', async () => {
    const testData = generateTestData();
    const response = await api.checkout({
      firstName: testData.firstName,
      lastName: testData.lastName,
      postalCode: testData.zipCode
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.message).toBe('Cart is empty');
  });

  test('Cart persistence after logout/login', async () => {
    // Add a product to cart
    const productsResponse = await api.getProducts();
    const products = await productsResponse.json();
    const productId = products[0].id;
    await api.addToCart(productId);

    // Create new API instance (simulating new session)
    const newApi = new APIHelper();
    await newApi.init();
    
    // Login again
    const loginResponse = await newApi.login('standard_user', 'secret_sauce');
    const { token } = await loginResponse.json();
    newApi.setToken(token);

    // Check if cart persisted
    const cartResponse = await newApi.get('/api/cart');
    const cart = await cartResponse.json();
    expect(cart.items).toContainEqual(expect.objectContaining({ id: productId }));
  });

  test('Cart total calculation', async () => {
    // Add multiple products
    const productsResponse = await api.getProducts();
    const products = await productsResponse.json();
    const selectedProducts = products.slice(0, 2);
    
    let expectedTotal = 0;
    for (const product of selectedProducts) {
      await api.addToCart(product.id);
      expectedTotal += parseFloat(product.price);
    }

    // Get cart total
    const cartResponse = await api.get('/api/cart');
    const cart = await cartResponse.json();
    
    expect(parseFloat(cart.total)).toBeCloseTo(expectedTotal, 2);
    expect(parseFloat(cart.tax)).toBeCloseTo(expectedTotal * 0.08, 2);
    expect(parseFloat(cart.finalTotal)).toBeCloseTo(expectedTotal * 1.08, 2);
  });
}); 