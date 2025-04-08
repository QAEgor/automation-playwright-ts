import { Page } from '@playwright/test';

export class ProductsPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Product locators
  private productLocator = '[class="inventory_item"]';
  private productNameLocator = '.inventory_item_name';
  private productPriceLocator = '.inventory_item_price';
  private addToCartButtonLocator = 'button[data-test^="add-to-cart"]';
  private removeButtonLocator = 'button[data-test^="remove"]';
  private cartBadgeLocator = '.shopping_cart_badge';
  private cartLinkLocator = '.shopping_cart_link';
  private checkoutButtonLocator = '[data-test="checkout"]';

  // Navigation methods
  async goToCart() {
    await this.page.click(this.cartLinkLocator);
  }

  // Product methods
  async getProductNames(): Promise<string[]> {
    return this.page.locator(this.productNameLocator).allTextContents();
  }

  async getProductPrices(): Promise<string[]> {
    return this.page.locator(this.productPriceLocator).allTextContents();
  }

  async addProductToCart(productName: string) {
    const productCard = this.page.locator(this.productLocator).filter({ hasText: productName });
    await productCard.locator(this.addToCartButtonLocator).click();
  }

  async removeProductFromCart(productName: string) {
    const productCard = this.page.locator(this.productLocator).filter({ hasText: productName });
    await productCard.locator(this.removeButtonLocator).click();
  }

  async getCartItemCount(): Promise<number> {
    try {
      const badge = await this.page.locator(this.cartBadgeLocator);
      const text = await badge.textContent();
      return text ? parseInt(text) : 0;
    } catch {
      return 0;
    }
  }

  // Checkout methods
  async proceedToCheckout() {
    await this.goToCart();
    await this.page.click(this.checkoutButtonLocator);
  }

  async fillCheckoutInfo(firstName: string, lastName: string, zipCode: string) {
    await this.page.fill('[data-test="firstName"]', firstName);
    await this.page.fill('[data-test="lastName"]', lastName);
    await this.page.fill('[data-test="postalCode"]', zipCode);
    await this.page.click('[data-test="continue"]');
  }

  async completeCheckout() {
    await this.page.click('[data-test="finish"]');
    return this.page.locator('.complete-header').textContent();
  }

  // Helper methods
  async sortProducts(sortOption: 'az' | 'za' | 'lohi' | 'hilo') {
    const sortMap = {
      az: 'az',
      za: 'za',
      lohi: 'lohi',
      hilo: 'hilo'
    };
    await this.page.selectOption('.product_sort_container', sortMap[sortOption]);
  }

  async getProductDetails(productName: string) {
    const productCard = this.page.locator(this.productLocator).filter({ hasText: productName });
    const price = await productCard.locator(this.productPriceLocator).textContent();
    const description = await productCard.locator('.inventory_item_desc').textContent();
    
    return {
      name: productName,
      price: price?.replace('$', '') || '',
      description: description || ''
    };
  }

  async isProductAddedToCart(productName: string): Promise<boolean> {
    const productCard = this.page.locator(this.productLocator).filter({ hasText: productName });
    const buttonText = await productCard.locator('button').textContent();
    return buttonText?.includes('Remove') || false;
  }
} 