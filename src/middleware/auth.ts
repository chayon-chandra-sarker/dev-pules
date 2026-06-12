import type { NextFunction, Request, Response } from "express";
import type { ROLE } from "../type";
import Jwt, { type JwtPayload }  from "jsonwebtoken";
import sendResponse from "../utils/send.response";
import config from "../config";
import { pool } from "../db";

const auth = (...roles:ROLE[]) => {
    return async (req:Request, res:Response, next:NextFunction) =>{
        console.log(roles)
          try {
        const token = req.headers.authorization?.split(" ")[1];
  
        if(!token){
            return sendResponse(res, {
                statusCode:401,
                success:false,
                message: "Unauthorized Access",
            });
        }
          const decoded = Jwt.verify(token as string, config.secret as string) as JwtPayload;
         console.log("DECODED:", decoded);
         console.log("ID:", decoded.id);

        
            const userData = await pool.query(`
            SELECT * FROM users WHERE id=$1
        `, [decoded.id]);
    
         const user = userData.rows[0];
         console.log(user);
         if(userData.rows.length === 0){
              return sendResponse(res, {
                statusCode:404,
                success:false,
                message: "Data not found",
            });
         };

         if(roles.length && !roles.includes(user.role as ROLE)){
             return sendResponse(res, {
                statusCode:401,
                success: false,
                message: "Forbidden",
            });
         };
         req.user = user;   
            next();

      } catch (error) {
        next(error);
      }
    }

    
};

export default auth;