import type { Request, Response } from "express";
import { maintainerService } from "./maintainer.service";
import sendResponse from "../../utils/send.response";

const deleteIssues = async (req:Request, res:Response) => {
    const {id} = req.params;
    try {
        const result = await maintainerService.deleteIssuesFromDB(id as string);
        if(result.rowCount === 0) {
            sendResponse(res, {
                statuscode:404,
                success:false,
                message: "Issues Data Not Found",
                data: {},
            })
        };
        sendResponse(res,{
            statuscode:200,
            success:true,
            message: "Issue deleted successfully",
            data:{},
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

const updateIssueStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    try {

        const result = await maintainerService.updateIssueStatusFromDB(id as string, status);

        sendResponse(res, {
            statuscode: 200,
            success: true,
            message: "Issue status updated successfully",
            data: result.rows[0],
        });

    } catch (error: any) {

        sendResponse(res, {
            statuscode: 500,
            success: false,
            message: error.message,
            error: error,
        });
    }
};
export const maintainerController = {
    deleteIssues,
    updateIssueStatus,
};