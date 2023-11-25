import { LOGIN_USER_SECRET, PASSWORD_USER_SECRET, URL, login } from "../test-helper";

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
  expect(currentUrl).toEqual(URL);
}, 60000);

test('Should_successful_login', async () => {
  await login(page);
  await page.waitForSelector('#teams');

  const currentUrl = page.url();
  expect(currentUrl).toContain('/start-screen');
}, 60000);

test('Should_go_to_change_password', async () => {
  const restoreLink = page.locator('#restore');
  await restoreLink?.click();
  await page.waitForURL('**/restore-password');

  await page.waitForSelector("#restoreSend");
  const button = page.locator('#restoreSend');
  const input = page.locator('#email');
  const rememberPasswordLink = page.locator('#remember');

  expect(await input?.getAttribute("placeholder")).toBe("Почта");
  await expect(button).toHaveText('Отправить');
  expect(await rememberPasswordLink?.getAttribute("href")).toContain("/auth");
  await expect(rememberPasswordLink).toHaveText("Вспомнил пароль");
}, 60000);

test('Should_go_to_team_creation', async () => {
  await login(page);
  await page.waitForSelector('#teams');

  await page.waitForSelector("#addTeamButton");
  const button = page.locator('#addTeamButton');
  await button?.click();

  await page.waitForSelector("#teamName");
  const teamNameInput = page.locator('#teamName');
  const captainInput = page.locator('#captain');
  const saveTeamButton = page.locator('#saveTeam');

  const currentUrl = page.url();
  expect(currentUrl).toContain('/team-creation');
  expect(await teamNameInput?.getAttribute("placeholder")).toBe("Название команды");
  await expect(saveTeamButton).toHaveText("Создать");
  expect(await captainInput?.getAttribute("value")).toBe(LOGIN_USER_SECRET);
}, 60000);

test('Should_user_logout', async () => {
  await login(page);
  await page.waitForSelector('#games');

  const cookie = await page.context().cookies();;
  expect(cookie.find(c => c.name === "authorization")).toBeDefined();

  await page.waitForSelector('img[alt="LogOut"]');
  const logout = page.locator('img[alt="LogOut"]');
  await logout?.click();

  const currentUrl = page.url();
  expect(currentUrl).toContain(URL);
  try {
    const cookieAfterLogout = await page.context().cookies();;
    expect(cookieAfterLogout.find(c => c.name === "authorization")).toBeUndefined();
  } catch {

  }
}, 60000);

afterEach(async () => {
  await page.close();
});
