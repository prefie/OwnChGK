import { LOGIN_USER_SECRET, URL } from '../test-consts';

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page';
import { RestorePasswordPage } from './pages/restore-password-page';
import { StartScreenPage } from './pages/start-screen-page';
import { TeamCreationPage } from './pages/team-creation-page';

test.beforeEach(async ({ page }) => {
    await page.goto(URL);
    await page.waitForLoadState('networkidle');
});

test('Should_open_page', async ({ page }) => {
    const currentUrl = page.url();
    expect.soft(currentUrl).toEqual(URL);
});

test('Should_successful_login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login();

    const startScreenPage = new StartScreenPage(page);
    await startScreenPage.accept();
});

test('Should_go_to_change_password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.restoreLink.click();

    const restorePasswordPage = new RestorePasswordPage(page);
    await restorePasswordPage.accept();

    expect.soft(await restorePasswordPage.emailInput.getAttribute('placeholder')).toBe('Почта');
    await expect.soft(restorePasswordPage.restoreSendButton).toHaveText('Отправить');
    expect.soft(await restorePasswordPage.rememberPasswordLink.getAttribute('href')).toContain('/auth');
    await expect.soft(restorePasswordPage.rememberPasswordLink).toHaveText('Вспомнил пароль');
});

test('Should_go_to_team_creation', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login();

    const startScreenPage = new StartScreenPage(page);
    await startScreenPage.accept();
    await startScreenPage.addTeamButton.click();

    const teamCreationPage = new TeamCreationPage(page);
    await teamCreationPage.accept();

    expect.soft(await teamCreationPage.teamNameInput.getAttribute('placeholder')).toBe('Название команды');
    await expect.soft(teamCreationPage.saveTeamButton).toHaveText('Создать');
    expect.soft(await teamCreationPage.captainInput.getAttribute('value')).toBe(LOGIN_USER_SECRET);
});

test('Should_user_logout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login();

    const startScreenPage = new StartScreenPage(page);
    await startScreenPage.accept();

    const cookie = await page.context().cookies();
    expect.soft(cookie.find(c => c.name === 'authorization')).toBeDefined();

    await startScreenPage.logoutButton.click();

    const currentUrl = page.url();
    expect.soft(currentUrl).toContain(URL);
    const cookieAfterLogout = await page.context().cookies();
    expect.soft(cookieAfterLogout.find(c => c.name === 'authorization')).toBeUndefined();
});
