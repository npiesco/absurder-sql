/**
 * Credentials Search Showcase E2E (25 credentials)
 *
 * Creates a 25-credential demo vault and verifies search queries.
 */

import { by, device, element, expect, waitFor } from 'detox';

const VAULT_PASSWORD = 'VaultDemoPass123!';
const CREDENTIALS = [
  { name: 'Canine Guardian Stream', user: 'dog.guardian@demo.local' },
  { name: 'Plane Keeper Airfield Dock', user: 'plane.keeper@demo.local' },
  { name: 'Sea Keeper Shoreline Ring', user: 'sea.keeper@demo.local' },
  { name: 'Doctor Guide Mountain Pass', user: 'doctor.guide@demo.local' },
  { name: 'River Falcon Beacon', user: 'river.falcon@demo.local' },
  { name: 'Forest Lantern Archive', user: 'forest.lantern@demo.local' },
  { name: 'Signal Harbor Ledger', user: 'signal.harbor@demo.local' },
  { name: 'Atlas Bridge Console', user: 'atlas.bridge@demo.local' },
  { name: 'Cedar Vault Access', user: 'cedar.vault@demo.local' },
  { name: 'Nimbus Route Tracker', user: 'nimbus.route@demo.local' },
  { name: 'Orbit Supply Channel', user: 'orbit.supply@demo.local' },
  { name: 'Prairie Forge Terminal', user: 'prairie.forge@demo.local' },
  { name: 'Delta Harbor Login', user: 'delta.harbor@demo.local' },
  { name: 'Mariner Shield Panel', user: 'mariner.shield@demo.local' },
  { name: 'Summit Relay Credentials', user: 'summit.relay@demo.local' },
  { name: 'Pioneer Compass Access', user: 'pioneer.compass@demo.local' },
  { name: 'Harbor Crane Operations', user: 'harbor.crane@demo.local' },
  { name: 'Granite Engine Console', user: 'granite.engine@demo.local' },
  { name: 'Lighthouse Keeper Notes', user: 'lighthouse.keeper@demo.local' },
  { name: 'Valley Scout Registry', user: 'valley.scout@demo.local' },
  { name: 'Helix Dispatch Board', user: 'helix.dispatch@demo.local' },
  { name: 'Bridge Watch Account', user: 'bridge.watch@demo.local' },
  { name: 'Dockyard Safety Console', user: 'dockyard.safety@demo.local' },
  { name: 'Tundra Carrier Control', user: 'tundra.carrier@demo.local' },
  { name: 'Signal Ridge Panel', user: 'signal.ridge@demo.local' },
];

const QUERIES: Array<{ query: string; expected: string }> = [
  { query: 'canine guardian', expected: 'Canine Guardian Stream' },
  { query: 'plane keeper', expected: 'Plane Keeper Airfield Dock' },
  { query: 'sea keeper', expected: 'Sea Keeper Shoreline Ring' },
  { query: 'doctor guide', expected: 'Doctor Guide Mountain Pass' },
  { query: 'river falcon', expected: 'River Falcon Beacon' },
  { query: 'forest lantern', expected: 'Forest Lantern Archive' },
  { query: 'signal harbor', expected: 'Signal Harbor Ledger' },
  { query: 'nimbus route', expected: 'Nimbus Route Tracker' },
  { query: 'summit relay', expected: 'Summit Relay Credentials' },
  { query: 'dockyard safety', expected: 'Dockyard Safety Console' },
];

describe('Credentials Search Showcase', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });

    await element(by.text('Create New')).tap();
    await element(by.id('master-password-input')).tap();
    await element(by.id('master-password-input')).replaceText(VAULT_PASSWORD);
    await element(by.id('confirm-password-input')).tap();
    await element(by.id('confirm-password-input')).replaceText(VAULT_PASSWORD);
    await element(by.id('create-vault-button')).tap();
    await waitFor(element(by.text('Vault'))).toBeVisible().withTimeout(10000);

    for (let i = 0; i < CREDENTIALS.length; i++) {
      const item = CREDENTIALS[i];
      await element(by.id('add-credential-fab')).tap();
      await waitFor(element(by.id('credential-name-input'))).toBeVisible().withTimeout(5000);
      await element(by.id('credential-name-input')).replaceText(item.name);
      await element(by.id('credential-username-input')).replaceText(item.user);
      await element(by.id('credential-password-input')).replaceText(`DemoPass${i + 1}!`);
      await element(by.id('save-credential-button')).tap();
      await waitFor(element(by.id('credentials-list'))).toBeVisible().withTimeout(5000);
    }
  }, 300000);

  it('creates 25 demo credentials', async () => {
    await expect(element(by.text('Canine Guardian Stream'))).toBeVisible();
    await element(by.id('search-input')).tap();
    await element(by.id('search-input')).replaceText('Signal');
    await expect(element(by.text('Signal Harbor Ledger'))).toBeVisible();
    await element(by.id('search-input')).clearText();
  });

  it('runs demo search queries', async () => {
    for (const entry of QUERIES) {
      await element(by.id('search-input')).tap();
      await element(by.id('search-input')).replaceText(entry.query);
      await waitFor(element(by.text(entry.expected))).toExist().withTimeout(5000);
      await element(by.id('search-input')).clearText();
    }
  });
});
