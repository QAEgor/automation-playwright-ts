import { test, expect } from '@playwright/test';
import { APIHelper } from '../../utils/apiHelper';

test.describe('Products API', () => {
  let api: APIHelper;

  test.beforeEach(async () => {
    api = new APIHelper();
    await api.init();
    
    // Login and set token
    const loginResponse = await api.login('standard_user', 'secret_sauce');
    const { token } = await loginResponse.json();
    api.setToken(token);
  });

  test('Get all products', async () => {
    const response = await api.getProducts();
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const products = await response.json();
    expect(Array.isArray(products)).toBeTruthy();
    expect(products.length).toBeGreaterThan(0);
    
    // Verify product structure
    const product = products[0];
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('description');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('image_url');
  });

  test('Add product to cart', async () => {
    // Get a product first
    const productsResponse = await api.getProducts();
    const products = await productsResponse.json();
    const productId = products[0].id;

    // Add to cart
    const response = await api.addToCart(productId);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const cart = await response.json();
    expect(cart.items).toContainEqual(expect.objectContaining({ id: productId }));
  });

  test('Remove product from cart', async () => {
    // Add product first
    const productsResponse = await api.getProducts();
    const products = await productsResponse.json();
    const productId = products[0].id;
    await api.addToCart(productId);

    // Remove from cart
    const response = await api.removeFromCart(productId);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const cart = await response.json();
    expect(cart.items).not.toContainEqual(expect.objectContaining({ id: productId }));
  });

  test('Complete checkout process', async () => {
    // Add product to cart first
    const productsResponse = await api.getProducts();
    const products = await productsResponse.json();
    const productId = products[0].id;
    await api.addToCart(productId);

    // Checkout
    const checkoutInfo = {
      firstName: 'John',
      lastName: 'Doe',
      postalCode: '12345'
    };

    const response = await api.checkout(checkoutInfo);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const order = await response.json();
    expect(order).toHaveProperty('orderId');
    expect(order).toHaveProperty('items');
    expect(order.items).toContainEqual(expect.objectContaining({ id: productId }));
  });

  test('Get order details', async () => {
    // Create order first
    const productsResponse = await api.getProducts();
    const products = await productsResponse.json();
    const productId = products[0].id;
    await api.addToCart(productId);

    const checkoutResponse = await api.checkout({
      firstName: 'John',
      lastName: 'Doe',
      postalCode: '12345'
    });
    const { orderId } = await checkoutResponse.json();

    // Get order details
    const response = await api.getOrderDetails(orderId);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const order = await response.json();
    expect(order.orderId).toBe(orderId);
    expect(order.items).toContainEqual(expect.objectContaining({ id: productId }));
    expect(order).toHaveProperty('total');
    expect(order).toHaveProperty('tax');
    expect(order).toHaveProperty('shippingAddress');
  });

  test('Unauthorized access to products', async () => {
    // Create new API helper without auth token
    const unauthorizedApi = new APIHelper();
    await unauthorizedApi.init();

    const response = await unauthorizedApi.getProducts();
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401);
  });
}); 