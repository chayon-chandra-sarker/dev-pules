import bcrypt from "bcryptjs";
import type { IContributor } from "./users.interface ";
import { pool } from "../../db";
import jwt from "jsonwebtoken";
import config from "../../config";

const signupUsersIntoDB = async (payload:IContributor) =>{
    const {name, email, password, role } = payload;
    
        const hashPassword = await bcrypt.hash(password, 12);
        const result = await pool.query(`
        INSERT INTO users (name, email, password, role) VALUES($1,$2,$3, COALESCE($4, 'contributor'))
        RETURNING *
        `, [name, email,hashPassword,role]);
        delete result.rows[0].password;

        const token = jwt.sign(
        {
            id: result.rows[0].id,
            email: result.rows[0].email,
            role: result.rows[0].role,
        },
        config.secret as string,
        {
            expiresIn: "7d",
        }
);

    return {
        user: result.rows[0],
        token,
    };
};




export const usersService = {
    signupUsersIntoDB,

}