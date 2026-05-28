import bcrypt from "bcryptjs";
import { pool } from "../../db";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../../config";

const loginIntoDB = async (payload:{email: string, password:string}) => {
     const {email, password}= payload;
      const userData = await pool.query(`
        SELECT * FROM users WHERE email=$1
        `,[email]);
        if(userData.rows.length === 0){
            throw new Error("Invalid credentials")
        };
        const user = userData.rows[0];
        const matchPassword = await bcrypt.compare(password, user.password);

        console.log(matchPassword)
        if(!matchPassword){
            throw new Error("Invalid credentials")
        };

          const jwtPayload = {
            id:user.id,
            name: user.name,
            role:user.role,
            email: user.email,
         }
         const accessToken = jwt.sign(jwtPayload, config.secret as string, {expiresIn: "1d"});
     

         const refreshToken = jwt.sign(jwtPayload, config.refresh_secret as string, {expiresIn: "100d"});

         return {accessToken, refreshToken};
        
};

const generateRefresh = async (token:string) => {
        if(!token){
         throw new Error("Unauthorized!!")
     };
     const decoded = jwt.verify(token as string, config.refresh_secret as string,) as JwtPayload;
    const userData = await pool.query(`
            SELECT * FROM users WHERE email=$1
        `, [decoded.email]);
    
    const user = userData.rows[0];
    
    if(userData.rows.length === 0) {
       throw new Error("user not found!!")
    };


    const jwtPayload = {
            id:user.id,
            name: user.name,
            role:user.role,
            email: user.email,
         }
    const accessToken = jwt.sign(jwtPayload, config.secret as string, {expiresIn: "1d"});
     return {accessToken};
};

export const authService = {
    loginIntoDB,
    generateRefresh,
}