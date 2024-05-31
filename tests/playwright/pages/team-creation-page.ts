import { Page, Locator } from "@playwright/test";


export class TeamCreationPage {
    readonly teamNameInput: Locator;
    readonly captainInput: Locator;
    readonly saveTeamButton: Locator;
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        this.teamNameInput = page.locator('#teamName');
        this.captainInput = page.locator('#captain');
        this.saveTeamButton = page.locator('#saveTeam');
    }

    async accept(){
        await this.page.waitForURL('**/team-creation');
    }
}
