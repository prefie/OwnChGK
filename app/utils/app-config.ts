import * as dotenv from 'dotenv';

dotenv.config({ override: true });

export const AppConfig = {
    databaseUrl: process.env.DATABASE_URL || "",
    port: process.env.PORT || "",
    emailLogin: process.env.LOGIN || "",
    emailPassword: process.env.PASSWORD || "",
    jwtSecretKey: process.env.SECRET_KEY || "",
};
