import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import sendResponse from "../../utils/send.response";

const createIssues = async (req: Request, res:Response) => {
    try {
        const result = await issuesService.createIssuesIntoDB(req.body,req.user);
        sendResponse(res, {
            statusCode:201,
            success:true,
            message: "Issues Create successfully",
            data:result.rows[0],
        })
    } catch (errors:any) {
         sendResponse(res, {
            statusCode:500,
            success:false,
            message: errors.message,
            errors:errors,
        })
    }
};

const getAllIssues = async (req: Request, res: Response) => {

    try {

        const { sort, type, status } = req.query;

        const result = await issuesService.getAllIssuesFromDB({
            sort,
            type,
            status
        });

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issues retrieved successfully",
            data: result,
        });

    } catch (errors: any) {

        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: errors.message,
            errors: errors,
        });
    }
};

const getSingleIssues = async (req: Request, res: Response) => {
  try {
    const numericId = Number(req.params.id);

    if (isNaN(numericId)) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid ID",
        data: {},
      });
    }

    const result = await issuesService.getSingleIssuesFromDB(numericId);

    if (!result) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
        data: {},
      });
    }

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });

  } catch (errors: any) {
    return sendResponse(res, {
      statusCode: 500,
      success: false,
      message: errors.message,
    });
  }
};

const updateIssues = async (req:Request, res:Response) => {
    const {id} = req.params;
    try {
        const result = await issuesService.updateIssuesFromDB(req.body, id as string, req.user);

        if(result.rows.length === 0){
           sendResponse(res, {
                statusCode:404,
                success:false,
                message: "Issues Data Not Found",
                data: {},
            })
        }
        sendResponse(res,{
            statusCode:200,
            success:true,
            message: "Issue updated successfully",
            data: result.rows[0],
        })
    } catch (errors:any) {
        sendResponse(res, {
            statusCode:errors.statusCode || 500,
            success:false,
            message: errors.message,
            errors:errors,
        })
    }
};


export const issuesController = {
    createIssues,
    getAllIssues,
    getSingleIssues,
    updateIssues,

}