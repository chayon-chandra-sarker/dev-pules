import type { Request, Response } from "express";
import { usersService } from "./users.service";
import sendResponse from "../../utils/send.response";


const signupUsers = async (req: Request, res:Response) =>{
    try {
        const result = await usersService.signupUsersIntoDB(req.body);
          sendResponse(res, {
            statusCode:201,
            success:true,
            message: "User registered successfully",
            data: {
                user: result.user,
                token: result.token,
            },
        })
    } catch (errors:any) {
         sendResponse(res, {
            statusCode:500,
            success:true,
            message: errors.message,
            errors:errors,
        })
    } 
};



export const usersController = {
    signupUsers,
   
    
};