import { test, expect } from '@playwright/test';
import { APIHelper } from '../../utils/apiHelper';
import { generateTestData } from '../../utils/helpers';

test.describe('Authentication API', () => {
  let api: APIHelper;

  test.beforeEach(async () => {
    api = new APIHelper();
    await api.init();
  });

  test.only('Successful login', async () => {
    const response = await api.login('standard_user', 'secret_sauce');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.token).toBeDefined();
  });

  test('Failed login - invalid credentials', async () => {
    const response = await api.login('invalid_user', 'wrong_password');
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error).toBe('Invalid credentials');
  });

  test('Failed login - locked out user', async () => {
    const response = await api.login('locked_out_user', 'secret_sauce');
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(403);
    
    const body = await response.json();
    expect(body.error).toBe('User is locked out');
  });

  test('Login with empty credentials', async () => {
    const response = await api.login('', '');
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error).toBe('Username and password are required');
  });
}); 