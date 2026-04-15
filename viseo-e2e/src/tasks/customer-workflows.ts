import { Page, expect } from '@playwright/test';

import { E2eApiClient, InspectResponse, SeedRequest, SeedResponse } from '../api/e2e-api-client';
import { pollUntil } from '../utils/polling';
import { LoginPage } from '../pages/login.page';
import { SignupPage } from '../pages/signup.page';

export async function registerCustomerViaUi(page: Page, email: string, password: string): Promise<void> {
  const signupPage = new SignupPage(page);
  await signupPage.goto();
  await signupPage.registerCustomer(email, password);
}

export async function loginSeededUserViaUi(page: Page, seed: SeedResponse): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(seed.email, seed.password);
}

export async function seedScenario(
  e2eApi: E2eApiClient,
  request: SeedRequest
): Promise<{ seed: SeedResponse; inspect: InspectResponse }> {
  const seed = await e2eApi.seed(request);
  const inspect = await e2eApi.inspect(seed.email);
  return { seed, inspect };
}

export async function expectSubscriptionStatus(
  e2eApi: E2eApiClient,
  email: string,
  expectedStatus: string
): Promise<InspectResponse> {
  return pollUntil(
    () => e2eApi.inspect(email),
    (inspect) => inspect.subscriptionStatus === expectedStatus,
    {
      description: `Subscription status ${expectedStatus} was not observed for ${email}`
    }
  );
}

export async function expectNoSubscription(e2eApi: E2eApiClient, email: string): Promise<void> {
  const inspect = await e2eApi.inspect(email);
  expect(inspect.subscriptionStatus ?? null).toBeNull();
}
