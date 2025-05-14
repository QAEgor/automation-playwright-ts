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

test('E2E checkout process', async () => {
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
}); 