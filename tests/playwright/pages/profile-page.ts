import { Page, Locator } from '@playwright/test';

export class ProfilePage {
    readonly page: Page;
    readonly email: Locator;
    readonly oldPassword: Locator;
    readonly newPassword: Locator;
    readonly newPasswordRepeat: Locator;
    readonly saveButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.email = page.locator('#email');
        this.oldPassword = page.locator('#old-password');
        this.newPassword = page.locator('#new-password');
        this.newPasswordRepeat = page.locator('#repeat-new-password');
        this.saveButton = page.locator('#saveProfile');
    }

    async accept() {
        await this.page.waitForURL('**/profile');
    }
}
