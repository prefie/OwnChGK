import { URL } from "./test-helper";

const webdriver = require('selenium-webdriver')
const { By, Key, until } = require('selenium-webdriver');
let driver;

const loginUserSecret = "test@test.test";
const passwordUserSecret = "test";


beforeEach(async function () {
    try {
        jest.useFakeTimers({ legacyFakeTimers: true })
        jest.useRealTimers()
        jest.setTimeout(60000);
        driver = new Builder().forBrowser('firefox').build();
        driver.get(url);
        driver = new webdriver.Builder().forBrowser('firefox').build();
        driver.get(URL);
        await driver.wait(until.elementLocated(By.id('restore')), 10000);
    } catch (ex) {
        // @ts-ignore
        console.log(ex.stack);
    }
})

test('Should_open_page', async () => {
    let url = await driver.getCurrentUrl();
    expect(url).toContain('localhost');
}, 60000);

test('Should_click_reset', async () => {
    await driver.findElement(By.id('restore')).click();
    let url = await driver.getCurrentUrl();
    expect(url).toContain('/restore-password');
}, 60000);

test('Should_successful_login', async () => {
    await login(loginUserSecret, passwordUserSecret, "teams")

    let url = await driver.getCurrentUrl();
    expect(url).toContain('/start-screen');
}, 60000);

test('Should_go_to_change_password', async () => {
    let restoreLink = await driver.findElement(By.id('restore'));
    restoreLink.click();
    await driver.wait(until.elementLocated(By.id('restoreSend')), 5000);
    let button = await driver.findElement(By.id('restoreSend'));
    let input = await driver.findElement(By.id('email'));
    let rememberPasswordLink = await driver.findElement(By.id('remember'));

    let url = await driver.getCurrentUrl();
    expect(url).toContain('/restore-password');
    expect(await input.getAttribute("placeholder")).toBe("Почта")
    expect(await button.getText()).toBe('Отправить');
    expect(await rememberPasswordLink.getAttribute("href")).toContain("/auth");
    expect(await rememberPasswordLink.getText()).toBe("Вспомнил пароль");
}, 60000);

test('Should_go_to_team_creation', async () => {
    await login(loginUserSecret, passwordUserSecret, "teams")

    await driver.wait(until.elementLocated(By.id('addTeamButton')), 5000);
    let button = await driver.findElement(By.id('addTeamButton'));
    button.click();
    await driver.wait(until.elementLocated(By.id('teamName')), 5000);

    let teamNameInput = await driver.findElement(By.id('teamName'));
    let captainInput = await driver.findElement(By.id('captain'));
    let saveTeamButton = await driver.findElement(By.id('saveTeam'));
    let url = await driver.getCurrentUrl();
    expect(url).toContain('/team-creation');
    expect(await teamNameInput.getAttribute("placeholder")).toBe("Название команды")
    expect(await saveTeamButton.getText()).toBe("Создать");
    expect(await captainInput.getAttribute("value")).toBe(loginUserSecret);
}, 60000);

test('Should_user_logout', async () => {
    await login(loginUserSecret, passwordUserSecret, "games")
    let cookie = await driver.manage().getCookie("authorization");
    expect(cookie).not.toBeNull();

    const logout = await driver.findElement(By.css('img[alt="LogOut"]'));
    logout.click();

    let currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain(URL);
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