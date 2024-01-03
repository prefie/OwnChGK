import { ADMIN_URL, LOGIN_USER_SECRET, login } from "../test-helper";

import { Page, firefox } from 'playwright';
import { test, expect } from '@playwright/test'

let page: Page;

test.beforeEach(async () => {
    const browser = await firefox.launch();
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
});

test('Should_open_admin_page', async () => {
    const currentUrl = page.url();
    expect.soft(currentUrl).toContain(ADMIN_URL);
});

test('Should_successful_login', async () => {
    await login(page);
    await page.waitForURL('**/start-screen');
});

test('Should_go_to_change_password', async () => {
    const restoreLink = page.locator('#restore');
    await restoreLink?.click();
    await page.waitForURL('**/restore-password');

    const button = page.locator('#restoreSend');
    const input = page.locator('#email');
    const rememberPasswordLink = page.locator('#remember');

    expect.soft(await input?.getAttribute("placeholder")).toBe("Почта");
    await expect.soft(button).toHaveText('Отправить');
    expect.soft(await rememberPasswordLink?.getAttribute("href")).toContain("/admin");
    await expect.soft(rememberPasswordLink).toHaveText("Вспомнил пароль");
});

test('Should_go_to_team_creation_by_admin', async () => {
    await login(page);
    await page.waitForURL('**/start-screen');

    const teamsTab = page.locator('#teams');
    await teamsTab?.click();
    const button = page.locator('#addTeamButton');
    await button?.click();

    const teamNameInput = page.locator('#teamName');
    const captainInput = page.locator('#captain');
    const saveTeamButton = page.locator('#saveTeam');

    const currentUrl = page.url();
    expect.soft(currentUrl).toContain('/team-creation');
    expect.soft(await teamNameInput?.getAttribute("placeholder")).toBe("Название команды");
    await expect.soft(saveTeamButton).toHaveText("Создать");
    expect.soft(await captainInput?.getAttribute("value")).toBe(LOGIN_USER_SECRET);
});

test('Should_go_to_admin_profile', async () => {
    await login(page);
    await page.waitForURL('**/start-screen');

    const profile = page.locator('#profile');
    await profile?.click();
    const email = page.locator('#email');

    const oldPassword = page.locator('#old-password');
    const newPassword = page.locator('#new-password');
    const newPasswordRepeat = page.locator('#repeat-new-password');
    const saveButton = page.locator('#saveProfile');

    await expect.soft(email).toHaveText(LOGIN_USER_SECRET);
    expect.soft(await oldPassword?.getAttribute("value")).toBe("");
    expect.soft(await newPassword?.getAttribute("value")).toBe("");
    expect.soft(await newPasswordRepeat?.getAttribute("value")).toBe("");
    await expect.soft(saveButton).toHaveText("Сохранить");
});

test('Should_admin_logout', async () => {
    await login(page);
    await page.waitForURL('**/start-screen');

    const cookie = await page.context().cookies();
    expect(cookie.find(c => c.name === "authorization")).toBeDefined();

    const logout = page.locator('img[alt="LogOut"]');
    await logout?.click();

    const currentUrl = page.url();
    expect.soft(currentUrl).toContain(ADMIN_URL);
    const cookieAfterLogout = await page.context().cookies();
    expect.soft(cookieAfterLogout.find(c => c.name === "authorization")).toBeUndefined();
});

test.afterEach(async () => {
    await page.close();
});
