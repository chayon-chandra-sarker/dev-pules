import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import sendResponse from "../../utils/send.response";

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

const getSingleIssues = async (req:Request, res:Response) => {
    const {id} = req.params;
    try {
        const result = await issuesService.getSingleIssuesFromDB(id as string);
        if(result.rows.length === 0){
            sendResponse(res, {
                statuscode:404,
                success:false,
                message: "Issues Data Not Found",
                data: {},
            })
            sendResponse(res,{
            statuscode:200,
            success:true,
            message: "Issues retrieved successfully",
            data: result.rows,
        })
        }
        sendResponse(res, {
            statuscode:200,
            success:true,
            message: "Issue retrieved successfully",
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

const updateIssues = async (req:Request, res:Response) => {
    const {id} = req.params;
    try {
        const result = await issuesService.updateIssuesFromDB(req.body, id as string, req.user);

        if(result.rows.length === 0){
           sendResponse(res, {
                statuscode:404,
                success:false,
                message: "Issues Data Not Found",
                data: {},
            })
        }
        sendResponse(res,{
            statuscode:200,
            success:true,
            message: "Issue updated successfully",
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
    getSingleIssues,
    updateIssues,

}