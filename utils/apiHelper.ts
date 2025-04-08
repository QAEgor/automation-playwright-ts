import { APIRequestContext, APIResponse, request } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export class APIHelper {
  private context: APIRequestContext;
  private baseUrl: string;
  private token: string;
  private cart: any[] = [];

  constructor() {
    this.baseUrl = process.env.BASE_URL || 'https://www.saucedemo.com';
    this.token = '';
  }

  async init() {
    this.context = await request.newContext({
      baseURL: this.baseUrl,
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  async setToken(token: string) {
    this.token = token;
    if (this.context) {
      this.context = await request.newContext({
        baseURL: this.baseUrl,
        extraHTTPHeaders: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    }
  }

  async post(endpoint: string, data: any): Promise<APIResponse> {
    return await this.context.post(endpoint, {
      data: data
    });
  }

  async get(endpoint: string): Promise<APIResponse> {
    return await this.context.get(endpoint);
  }

  async put(endpoint: string, data: any): Promise<APIResponse> {
    return await this.context.put(endpoint, {
      data: data
    });
  }

  async delete(endpoint: string): Promise<APIResponse> {
    return await this.context.delete(endpoint);
  }

  // Helper methods for common operations
  private createResponse(status: number, body: any): Promise<APIResponse> {
    return Promise.resolve({
      ok: () => status >= 200 && status < 300,
      status: () => status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body))
    } as APIResponse);
  }

  async login(username: string, password: string): Promise<APIResponse> {
    if (!username || !password) {
      return this.createResponse(400, { error: 'Username and password are required' });
    }
    if (username === 'standard_user' && password === 'secret_sauce') {
      return this.createResponse(200, { token: 'fake-token-123' });
    }
    if (username === 'locked_out_user') {
      return this.createResponse(403, { error: 'User is locked out' });
    }
    return this.createResponse(401, { error: 'Invalid credentials' });
  }

  async getProducts(): Promise<APIResponse> {
    if (!this.token) {
      return this.createResponse(401, { error: 'Unauthorized' });
    }
    return this.createResponse(200, [
      { id: '1', name: 'Sauce Labs Backpack', price: '29.99', description: 'Backpack', image_url: '/img/sauce-backpack.jpg' },
      { id: '2', name: 'Sauce Labs Bike Light', price: '9.99', description: 'Bike Light', image_url: '/img/sauce-bike-light.jpg' }
    ]);
  }

  async addToCart(productId: string): Promise<APIResponse> {
    if (!this.token) return this.createResponse(401, { error: 'Unauthorized' });
    if (this.cart.includes(productId)) {
      return this.createResponse(400, { message: 'Product already in cart' });
    }
    this.cart.push(productId);
    return this.createResponse(200, { items: this.cart.map(id => ({ id })) });
  }

  async removeFromCart(productId: string): Promise<APIResponse> {
    if (!this.token) return this.createResponse(401, { error: 'Unauthorized' });
    this.cart = this.cart.filter(id => id !== productId);
    return this.createResponse(200, { items: this.cart.map(id => ({ id })) });
  }

  async checkout(checkoutInfo: { firstName: string; lastName: string; postalCode: string; }): Promise<APIResponse> {
    if (!this.token) return this.createResponse(401, { error: 'Unauthorized' });
    if (this.cart.length === 0) {
      return this.createResponse(400, { message: 'Cart is empty' });
    }
    const orderId = 'order-' + Date.now();
    return this.createResponse(200, { 
      orderId,
      items: this.cart.map(id => ({ id }))
    });
  }

  async getOrderDetails(orderId: string): Promise<APIResponse> {
    if (!this.token) return this.createResponse(401, { error: 'Unauthorized' });
    return this.createResponse(200, {
      orderId,
      items: this.cart.map(id => ({ id })),
      total: '39.98',
      tax: '3.20',
      shippingAddress: 'Test Address'
    });
  }
} 