import dotenv from "dotenv";
import path from "path";
import {env} from "process";

dotenv.config({
    path: path.join(process.cwd(), ".env")
})
const config = {
    port: env.PORT,
    connection_String:process.env.CONNECTION as string,
    secret: process.env.JWT_SECRET,
    refresh_secret: process.env.JWT_REFRESH_SECRET,
};
export default config;

