import { Page, Locator } from "@playwright/test";

export class RestorePasswordPage {
    readonly restoreSendButton: Locator;
    readonly emailInput: Locator;
    readonly rememberPasswordLink: Locator;
    readonly page: Page;
    
    constructor(page: Page) {
        this.page = page;
        this.restoreSendButton = page.locator('#restoreSend');
        this.emailInput = page.locator('#email');
        this.rememberPasswordLink = page.locator('#remember');
    }

    async accept(){
        await this.page.waitForURL('**/restore-password');
    }
}