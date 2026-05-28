import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import sendResponse from "../../utils/send.response";
import { usersService } from "../users/users.service";


const createIssues = async (req: Request, res:Response) => {
    try {
        const result = await issuesService.createIssuesIntoDB(req.body);
        sendResponse(res, {
            statuscode:201,
            success:true,
            message: "Issues Create successfully",
            data:result.rows[0],
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

const getAllIssues = async (req:Request, res:Response) => {
    const result = await issuesService.getAllIssuesFromDB();
    try {
        sendResponse(res,{
            statuscode:200,
            success:true,
            message: "Issues retrieved successfully",
            data: result.rows,
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

export const issuesController = {
    createIssues,
    getAllIssues,
}