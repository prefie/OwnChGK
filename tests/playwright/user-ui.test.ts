import { LOGIN_USER_SECRET, URL, login } from "../test-helper";

import { Page, firefox } from 'playwright';

let page: Page;

beforeEach(async () => {
  const browser = await firefox.launch();
  const context = await browser.newContext();
  page = await context.newPage();
  await page.goto(URL);
  await page.waitForLoadState('networkidle');
});

test('Should_open_page', async () => {
  const currentUrl = page.url();
  await expect.soft(currentUrl).toEqual(URL);
}, 60000);

test('Should_successful_login', async () => {
  await login(page);

  const currentUrl = page.url();
  await expect.soft(currentUrl).toContain('/start-screen');
}, 60000);

test('Should_go_to_change_password', async () => {
  const restoreLink = page.locator('#restore');
  await restoreLink?.click();
  await page.waitForURL('**/restore-password');

  const button = page.locator('#restoreSend');
  const input = page.locator('#email');
  const rememberPasswordLink = page.locator('#remember');

  await expect.soft(await input?.getAttribute("placeholder")).toBe("Почта");
  await expect.soft(button).toHaveText('Отправить');
  await expect.soft(await rememberPasswordLink?.getAttribute("href")).toContain("/auth");
  await expect.soft(rememberPasswordLink).toHaveText("Вспомнил пароль");
}, 60000);

test('Should_go_to_team_creation', async () => {
  await login(page);

  const button = page.locator('#addTeamButton');
  await button?.click();

  const teamNameInput = page.locator('#teamName');
  const captainInput = page.locator('#captain');
  const saveTeamButton = page.locator('#saveTeam');

  const currentUrl = page.url();
  await expect.soft(currentUrl).toContain('/team-creation');
  await expect.soft(await teamNameInput?.getAttribute("placeholder")).toBe("Название команды");
  await expect.soft(saveTeamButton).toHaveText("Создать");
  await expect.soft(await captainInput?.getAttribute("value")).toBe(LOGIN_USER_SECRET);
}, 60000);

test('Should_user_logout', async () => {
  await login(page);

  const cookie = await page.context().cookies();;
  await expect.soft(cookie.find(c => c.name === "authorization")).toBeDefined();

  const logout = page.locator('img[alt="LogOut"]');
  await logout?.click();

  const currentUrl = page.url();
  await expect.soft(currentUrl).toContain(URL);
  const cookieAfterLogout = await page.context().cookies();;
  await expect.soft(cookieAfterLogout.find(c => c.name === "authorization")).toBeUndefined();
}, 60000);

afterEach(async () => {
  await page.close();
});
