import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'https://zentry.local';

test.describe('Auth E2E (mocked API)', () => {
  test('register success and then login success', async ({ page }) => {
    // Mock register endpoint
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Conta criada com sucesso! Redirecionando para o login...' })
      });
    });

    // Mock login endpoint
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'fake-token', user: { id: '1', email: 'test@example.com', name: 'Test' } })
      });
    });

    await page.goto(`${BASE}/cadastro`);

    // fill minimal registration fields by placeholder
    await page.getByPlaceholder('000.000.000-00').fill('111.444.777-35');
    await page.getByPlaceholder('Joao da Silva').fill('Test User');
    const email = `e2e+${Date.now()}@example.com`;
    await page.getByPlaceholder('joao@email.com').fill(email);
    await page.getByPlaceholder('(11) 99999-9999').fill('(11) 99999-9999');
    await page.getByPlaceholder('00000-000').fill('01001-000');
    await page.getByPlaceholder('Rua, avenida, praca...').fill('Rua Teste');
    await page.getByPlaceholder('123').fill('123');
    await page.getByPlaceholder('Apto, bloco, casa...').fill('');
    await page.getByPlaceholder('SP').fill('SP');
    await page.getByPlaceholder('********').first().fill('Password123!');
    await page.getByPlaceholder('********').nth(1).fill('Password123!');

    await page.getByRole('button', { name: /Criar minha conta|Criar minha conta/i }).click();

    // Expect success message
    await expect(page.getByText(/Conta criada com sucesso/i)).toBeVisible();

    // Now go to login
    await page.goto(`${BASE}/login`);
    await page.getByPlaceholder('joao@email.com').fill(email);
    await page.getByPlaceholder('********').fill('Password123!');
    await page.getByRole('button', { name: /Entrar/i }).click();

    await expect(page.getByText(/Login realizado com sucesso/i)).toBeVisible();
  });

  test('login failure shows error', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Credenciais invalidas' }) });
    });

    await page.goto(`${BASE}/login`);
    await page.getByPlaceholder('joao@email.com').fill('notfound@example.com');
    await page.getByPlaceholder('********').fill('wrong');
    await page.getByRole('button', { name: /Entrar/i }).click();

    await expect(page.getByText(/Credenciais invalidas|Erro/i)).toBeVisible();
  });
});
