import nodemailer from 'nodemailer';
import { AppConfig } from './app-config';

export const transporter = CreateTransporter(AppConfig.emailLogin, AppConfig.emailPassword);
const changePasswordMessage = 'Ваш код подтверждения для смены пароля:';
const adminPasswordMessage = 'Вас назначили администратором проекта Своя ЧГК. Ваш временный пароль:';
const ignoreMessage = 'Если вы не запрашивали код, то проигнорируйте это сообщение';

export function CreateTransporter(user: string, pass: string) {
    return nodemailer.createTransport({
        host: 'smtp.yandex.ru',
        port: 465,
        secure: true,
        auth: {
            user,
            pass,
        }
    });
}

export function makeTemporaryPassword(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export async function SendMailWithTemporaryPassword(transporter, email: string, code: string) {
    await transporter.sendMail({
        from: `"Своя ЧГК" <${AppConfig.emailLogin}>`,
        to: email,
        subject: 'Смена пароля',
        html: `${changePasswordMessage} <b>${code}</b><br>${ignoreMessage}`
    });
}

export async function SendMailWithTemporaryPasswordToAdmin(transporter, email: string, code: string) {
    await transporter.sendMail({
        from: `"Своя ЧГК" <${AppConfig.emailLogin}>`,
        to: email,
        subject: 'Временный пароль',
        html: `${adminPasswordMessage} <b>${code}</b><br>${ignoreMessage}`
    });
}