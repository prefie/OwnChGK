import { Page } from "playwright";

export const PORT = parseInt(process.env.PORT || '3000');
export const URL = 'http://localhost:' + PORT;
export const ADMIN_URL = URL + '/admin';
export const LOGIN_USER_SECRET = "test@test.test";
export const PASSWORD_USER_SECRET = "test";

export async function login(page : Page) {
    await page.fill('#password', PASSWORD_USER_SECRET);
    await page.press('#password', 'Enter');
    await page.fill('#email', LOGIN_USER_SECRET);
    await page.press('#email', 'Enter');
}