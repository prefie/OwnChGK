import { Page, Locator } from "@playwright/test";

export class StartScreenPage {
    readonly addTeamButton: Locator;
    readonly logoutButton: Locator;
    readonly page: Page;
    readonly teamsTab: Locator;
    readonly profile: Locator;

    constructor(page: Page) {
        this.page = page;
        this.addTeamButton = page.locator('#addTeamButton');
        this.logoutButton = page.locator('img[alt="LogOut"]');
        this.teamsTab = page.locator('#teams');
        this.profile = page.locator('#profile')
    }

    async accept(){
        await this.page.waitForURL('**/start-screen');
    }
}

