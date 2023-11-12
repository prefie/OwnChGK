import { ADMIN_URL } from "./test-helper";

const webdriver = require('selenium-webdriver')
const { By, Key, until } = require('selenium-webdriver');
let driver;

const loginSecret = "test@test.test";
const passwordSecret = "test";

beforeEach(async function () {
    try {
        jest.useFakeTimers({ legacyFakeTimers: true })
        jest.useRealTimers()
        jest.setTimeout(60000);
        driver = new webdriver.Builder().forBrowser('firefox').build();
        driver.get(ADMIN_URL);
        await driver.wait(until.elementLocated(By.id('restore')), 10000);
    } catch (ex) {
        // @ts-ignore
        console.log(ex.stack);
    }
})

test('Should_open_admin_page', async () => {
    let currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain(ADMIN_URL);
}, 60000);

test('Should_click_reset_for_admin', async () => {
    await driver.findElement(By.id('restore')).click();
    let currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/restore-password');
}, 60000);

test('Should_successful_login', async () => {
    await login(loginSecret, passwordSecret, "teams")

    let currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/start-screen');
}, 60000);

test('Should_go_to_change_password', async () => {
    let restoreLink = await driver.findElement(By.id('restore'));
    restoreLink.click();
    await driver.wait(until.elementLocated(By.id('restoreSend')), 5000);
    let button = await driver.findElement(By.id('restoreSend'));
    let input = await driver.findElement(By.id('email'));
    let rememberPasswordLink = await driver.findElement(By.id('remember'));

    let currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/restore-password');
    expect(await input.getAttribute("placeholder")).toBe("Почта")
    expect(await button.getText()).toBe('Отправить');
    expect(await rememberPasswordLink.getAttribute("href")).toContain("/admin");
    expect(await rememberPasswordLink.getText()).toBe("Вспомнил пароль");
}, 60000);

test('Should_go_to_team_creation_by_admin', async () => {
    await login(loginSecret, passwordSecret, "games")

    const teamsTab = await driver.findElement(By.id('teams'));
    teamsTab.click();
    await driver.wait(until.elementLocated(By.id('addTeamButton')), 5000);
    const button = await driver.findElement(By.id('addTeamButton'));
    button.click();
    await driver.wait(until.elementLocated(By.id('teamName')), 5000);

    let teamNameInput = await driver.findElement(By.id('teamName'));
    let captainInput = await driver.findElement(By.id('captain'));
    let saveTeamButton = await driver.findElement(By.id('saveTeam'));
    let currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/team-creation');
    expect(await teamNameInput.getAttribute("placeholder")).toBe("Название команды")
    expect(await saveTeamButton.getText()).toBe("Создать");
    expect(await captainInput.getAttribute("value")).toBe(loginSecret);
}, 60000);

test('Should_go_to_admin_profile', async () => {
    await login(loginSecret, passwordSecret, "games")

    const profile = await driver.findElement(By.id('profile'));
    profile.click();

    await driver.wait(until.elementLocated(By.id('email')), 5000);

    let email = await driver.findElement(By.id('email'));
    let oldPassword = await driver.findElement(By.id('old-password'));
    let newPassword = await driver.findElement(By.id('new-password'));
    let newPasswordRepeat = await driver.findElement(By.id('repeat-new-password'));
    let saveButton = await driver.findElement(By.id('saveProfile'));
    expect(await email.getText()).toBe(loginSecret);
    expect(await oldPassword.getAttribute("value")).toBe("");
    expect(await newPassword.getAttribute("value")).toBe("");
    expect(await newPasswordRepeat.getAttribute("value")).toBe("");
    expect(await saveButton.getText()).toBe("Сохранить");
}, 60000);

test('Should_admin_logout', async () => {
    await login(loginSecret, passwordSecret, "games")
    let cookie = await driver.manage().getCookie("authorization");
    expect(cookie).not.toBeNull();

    const logout = await driver.findElement(By.css('img[alt="LogOut"]'));
    logout.click();

    let currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain(ADMIN_URL);
    try {
        cookie = await driver.manage().getCookie("authorization");
        expect(cookie).toBe(null);
    } catch {

    }
}, 60000);

afterEach(async function () {
    await driver.quit();
})

async function login(email: string, password: string, elementId: string) {
    await driver.findElement(By.id('password')).sendKeys(password, Key.ENTER);
    await driver.findElement(By.id('email')).sendKeys(email, Key.ENTER);
    await driver.wait(until.elementLocated(By.id(elementId)), 10000);
}