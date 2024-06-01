import { Page, Locator } from '@playwright/test';
import { LOGIN_USER_SECRET, PASSWORD_USER_SECRET } from '../../test-consts';

export class LoginPage {
    readonly email: Locator;
    readonly password: Locator;
    readonly restoreLink: Locator;

    constructor(page: Page) {
        this.email = page.locator('#email');
        this.password = page.locator('#password');
        this.restoreLink = page.locator('#restore');
    }

    async login() {
        await this.password.fill(PASSWORD_USER_SECRET);
        await this.password.press('Enter');
        await this.email.fill(LOGIN_USER_SECRET);
        await this.email.press('Enter');
    }
}
