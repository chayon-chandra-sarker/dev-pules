
import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utils/send.response";

const login = async (req:Request, res:Response) => {
    try {
        const result = await authService.loginIntoDB(req.body);
        const {refreshToken} = result;
        res.cookie("refreshToken", refreshToken, {
            secure: false, 
            httpOnly:true,
            sameSite: "lax",
        });

        sendResponse(res, {
            statusCode:200,
            success:true,
            message: "Login successfully",
            data: {
                user: result.user,
                token: result.token,
            },
        })
        
    } catch (errors:any) {
         sendResponse(res, {
            statusCode:401,
            success:false,
            message: errors.message,
            errors:errors,
        })
    }
};

const refreshToken = async (req:Request,res:Response) => {
    // console.log(req.cookies);
    try {
        const result = await authService.generateRefresh(req.cookies.refreshToken);
         res.status(200).json({
            success: true,
            message: "Access token Generated",
            data:result,
        })
    } catch (errors:any) {
        res.status(500).json({
            success: false,
            message: errors.message,
            errors: errors,
        })
    }
};

export const authController = {
    login,
    refreshToken,
};