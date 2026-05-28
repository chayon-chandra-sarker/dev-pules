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
        const token = req.headers.authorization;
        if(!token){
             sendResponse(res, {
                statuscode:401,
                success:false,
                message: "Unauthorized Access",
            });
        }
            const decoded = Jwt.verify(token as string, config.secret as string) as JwtPayload;
            const userData = await pool.query(`
            SELECT * FROM users WHERE email=$1
        `, [decoded.email]);
    
         const user = userData.rows[0];
         if(userData.rows.length === 0){
              sendResponse(res, {
                statuscode:404,
                success:false,
                message: "Data not found",
            });
         };

         if(roles.length && !roles.includes(user.role)){
              sendResponse(res, {
                statuscode:401,
                success: false,
                message: "Forbidden",
            });
         };
         req.user = decoded    
            next();

      } catch (error) {
        next(error);
      }
    }

    
};

export default auth;