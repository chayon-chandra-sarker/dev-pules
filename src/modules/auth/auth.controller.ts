
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
            statuscode:200,
            success:true,
            message: "Login successfully",
            data: result,
        })
        
    } catch (error:any) {
         sendResponse(res, {
            statuscode:500,
            success:false,
            message: error.message,
            error:error,
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
    } catch (error:any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error,
        })
    }
};

export const authController = {
    login,
    refreshToken,
};