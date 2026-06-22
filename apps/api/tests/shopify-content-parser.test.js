import { describe, expect, it } from 'vitest';
import { parseShopifyStorefrontTabs } from '../src/modules/catalog/shopifyImport.service.js';

describe('Shopify storefront tab parser', () => {
  it('maps the three wanted tabs and ignores File Guidelines', () => {
    const tabs = parseShopifyStorefrontTabs(`
      <div data-tab-title="Description">
        <style>.noise { color: red; }</style>
        <span class="metafield-multi_line_text_field">Actual product description<br>Second line</span>
        <div>Read more</div>
      </div>
      <div data-tab-title="Key features">
        <ul>
          <li><p>Features</p><p>x x x</p></li>
          <li><p>Material</p><p>Cork</p></li>
          <li><p>Brand</p><p>9Cork</p></li>
        </ul>
      </div>
      <div data-tab-title="Size Guide">
        <table><tr><td>Feature</td><td>Details</td></tr></table>
      </div>
      <div data-tab-title="File Guidelines">Do not import this</div>
    `);

    expect(tabs.description).toBe('Actual product description\nSecond line');
    expect(tabs.keyFeatures).toBe('Material: Cork\nBrand: 9Cork');
    expect(tabs.sizeGuide).toBe('Feature: Details');
    expect(JSON.stringify(tabs)).not.toContain('Do not import this');
  });
});
