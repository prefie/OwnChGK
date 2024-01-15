import { ADMIN_URL, LOGIN_USER_SECRET } from "../test-consts";

import { test, expect } from '@playwright/test'
import { LoginPage } from "./pages/login-page";
import { RestorePasswordPage } from "./pages/restore-password-page";
import { StartScreenPage } from "./pages/start-screen-page";
import { TeamCreationPage } from "./pages/team-creation-page";
import { ProfilePage } from "./pages/profile-page";

test.beforeEach(async ({page}) => {
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
});

test('Should_open_admin_page', async ({page}) => {
    const currentUrl = page.url();
    expect.soft(currentUrl).toContain(ADMIN_URL);
});

test('Should_successful_login', async ({page}) => {
    const loginPage = new LoginPage(page);
    await loginPage.login();
 
    const startScreenPage = new StartScreenPage(page);
    await startScreenPage.accept();
});

test('Should_go_to_change_password', async ({page}) => {
    const loginPage = new LoginPage(page);
    await loginPage.restoreLink.click();

    const restorePasswordPage = new RestorePasswordPage(page);
    await restorePasswordPage.accept();
  
    expect.soft(await restorePasswordPage.emailInput.getAttribute("placeholder")).toBe("Почта");
    await expect.soft(restorePasswordPage.restoreSendButton).toHaveText('Отправить');
    expect.soft(await restorePasswordPage.rememberPasswordLink.getAttribute("href")).toContain("/admin");
    await expect.soft(restorePasswordPage.rememberPasswordLink).toHaveText("Вспомнил пароль");
});

test('Should_go_to_team_creation_by_admin', async ({page}) => {
    const loginPage = new LoginPage(page);
    await loginPage.login();

    const startScreenPage = new StartScreenPage(page);
    await startScreenPage.accept();

    await startScreenPage.teamsTab.click();
    await startScreenPage.addTeamButton.click();

    const teamCreationPage = new TeamCreationPage(page);
    await teamCreationPage.accept();

    expect.soft(await teamCreationPage.teamNameInput.getAttribute("placeholder")).toBe("Название команды");
    await expect.soft(teamCreationPage.saveTeamButton).toHaveText("Создать");
});

test('Should_go_to_admin_profile', async ({page}) => {
    const loginPage = new LoginPage(page);
    await loginPage.login();

    const startScreenPage = new StartScreenPage(page);
    await startScreenPage.accept();

    await startScreenPage.profile.click();

    const profilePage = new ProfilePage(page);
    profilePage.accept();

    await expect.soft(profilePage.email).toHaveText(LOGIN_USER_SECRET);
    expect.soft(await profilePage.oldPassword.getAttribute("value")).toBe("");
    expect.soft(await profilePage.newPassword.getAttribute("value")).toBe("");
    expect.soft(await profilePage.newPasswordRepeat.getAttribute("value")).toBe("");
    await expect.soft(profilePage.saveButton).toHaveText("Сохранить");
});

test('Should_admin_logout', async ({page}) => {
    const loginPage = new LoginPage(page);
    await loginPage.login();

    const startScreenPage = new StartScreenPage(page);
    await startScreenPage.accept();

    const cookie = await page.context().cookies();
    expect(cookie.find(c => c.name === "authorization")).toBeDefined();

    await startScreenPage.logoutButton.click();

    const currentUrl = page.url();
    expect.soft(currentUrl).toContain(ADMIN_URL);
    const cookieAfterLogout = await page.context().cookies();
    expect.soft(cookieAfterLogout.find(c => c.name === "authorization")).toBeUndefined();
});
