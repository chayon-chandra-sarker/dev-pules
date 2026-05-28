import type { Request, Response } from "express";
import { usersService } from "./users.service";
import sendResponse from "../../utils/send.response";


const signupUsers = async (req: Request, res:Response) =>{
    try {
        const result = await usersService.signupUsersIntoDB(req.body);
          sendResponse(res, {
            statuscode:201,
            success:true,
            message: "User registered successfully",
            data: result.rows[0],
        })
    } catch (error:any) {
         sendResponse(res, {
            statuscode:500,
            success:true,
            message: error.message,
            error:error,
        })
    } 
};

export const usersController = {
    signupUsers,
};