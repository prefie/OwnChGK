import { ADMIN_URL, LOGIN_USER_SECRET, PASSWORD_USER_SECRET, URL } from "../test-helper";

const { firefox } = require('playwright');

let page;

beforeEach(async () => {
    const browser = await firefox.launch();
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
});

test('Should_open_admin_page', async () => {
    const currentUrl = page.url();
    expect(currentUrl).toContain(ADMIN_URL);
}, 60000);

test('Should_click_reset_for_admin', async () => {
    const restoreLink = await page.$('#restore');
    await restoreLink.click();
    await page.waitForNavigation();
    const currentUrl = page.url();
    expect(currentUrl).toContain('/restore-password');
}, 60000);

test('Should_successful_login', async () => {
    await login(LOGIN_USER_SECRET, PASSWORD_USER_SECRET, "teams");

    const currentUrl = page.url();
    expect(currentUrl).toContain('/start-screen');
}, 60000);

test('Should_go_to_change_password', async () => {
    const restoreLink = await page.$('#restore');
    await restoreLink.click();
    await page.waitForNavigation();

    await page.waitForSelector("#restoreSend");
    const button = await page.$('#restoreSend');
    const input = await page.$('#email');
    const rememberPasswordLink = await page.$('#remember');

    const currentUrl = page.url();
    expect(currentUrl).toContain('/restore-password');
    expect(await input.getAttribute("placeholder")).toBe("Почта");
    expect(await button.textContent()).toBe('Отправить');
    expect(await rememberPasswordLink.getAttribute("href")).toContain("/admin");
    expect(await rememberPasswordLink.textContent()).toBe("Вспомнил пароль");
}, 60000);

test('Should_go_to_team_creation_by_admin', async () => {
    await login(LOGIN_USER_SECRET, PASSWORD_USER_SECRET, "games");

    await page.waitForSelector("#teams");
    const teamsTab = await page.$('#teams');
    await teamsTab.click();
    await page.waitForSelector("#addTeamButton");
    const button = await page.$('#addTeamButton');
    await button.click();
    await page.waitForSelector("#teamName");

    const teamNameInput = await page.$('#teamName');
    const captainInput = await page.$('#captain');
    const saveTeamButton = await page.$('#saveTeam');

    const currentUrl = page.url();
    expect(currentUrl).toContain('/team-creation');
    expect(await teamNameInput.getAttribute("placeholder")).toBe("Название команды");
    expect(await saveTeamButton.textContent()).toBe("Создать");
    expect(await captainInput.getAttribute("value")).toBe(LOGIN_USER_SECRET);
}, 60000);

test('Should_go_to_admin_profile', async () => {
    await login(LOGIN_USER_SECRET, PASSWORD_USER_SECRET, "games");

    await page.waitForSelector("#profile");
    const profile = await page.$('#profile');
    await profile.click();
    await page.waitForSelector("#email");

    const email = await page.$('#email');
    const oldPassword = await page.$('#old-password');
    const newPassword = await page.$('#new-password');
    const newPasswordRepeat = await page.$('#repeat-new-password');
    const saveButton = await page.$('#saveProfile');

    expect(await email.textContent()).toBe(LOGIN_USER_SECRET);
    expect(await oldPassword.getAttribute("value")).toBe("");
    expect(await newPassword.getAttribute("value")).toBe("");
    expect(await newPasswordRepeat.getAttribute("value")).toBe("");
    expect(await saveButton.textContent()).toBe("Сохранить");
}, 60000);

test('Should_admin_logout', async () => {
    await login(LOGIN_USER_SECRET, PASSWORD_USER_SECRET, "games");

    const cookie = await page.cookies();
    expect(cookie.find(c => c.name === "authorization")).toBeDefined();

    await page.waitForSelector('img[alt="LogOut"]');
    const logout = await page.$('img[alt="LogOut"]');
    await logout.click();

    const currentUrl = page.url();
    expect(currentUrl).toContain(ADMIN_URL);
    try {
        const cookieAfterLogout = await page.cookies();
        expect(cookieAfterLogout.find(c => c.name === "authorization")).toBeUndefined();
    } catch {

    }
}, 60000);

afterEach(async () => {
    await page.close();
});

async function login(email, password, elementId) {
    await page.fill('#password', password);
    await page.press('#password', 'Enter');
    await page.fill('#email', email);
    await page.press('#email', 'Enter');
    await page.waitForSelector(`#${elementId}`);
}