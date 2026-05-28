import {Pool} from "pg";
import config from "../config";


export const pool = new Pool({
    connectionString: config.connection_String,
});

export const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(20),
                email VARCHAR(30) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'contributor',
                create_at TIMESTAMP DEFAULT NOW(),
                update_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
                CREATE TABLE IF NOT EXISTS issues(
                id SERIAL PRIMARY KEY,
                title VARCHAR (150),
                description TEXT,
                type TEXT,
                status TEXT,
                reporter_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                create_at TIMESTAMP DEFAULT NOW(),
                update_at TIMESTAMP DEFAULT NOW()
             )
         `);


        console.log("Database connected successfully");
    } catch (error) {
        console.log(error)
    }
};