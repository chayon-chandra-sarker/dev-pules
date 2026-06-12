import type { Request, Response } from "express";
import { maintainerService } from "./maintainer.service";
import sendResponse from "../../utils/send.response";

const deleteIssues = async (req: Request, res: Response) => {

  try {
    const id = Number(req.params.id);

        if (isNaN(id)) {
            return sendResponse(res, {
                 statusCode: 400,
                 success: false,
                 message: "Invalid id",
                 data: {},
                });
        }
    const result = await maintainerService.deleteIssuesFromDB(id);

    if (result.rowCount === 0) {
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
      message: "Issue deleted successfully",
      data: {},
    });

  } catch (errors: any) {
    return sendResponse(res, {
      statusCode: 500,
      success: false,
      message: errors.message,
      errors: errors,
    });
  }
};

const updateIssueStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    try {

        const result = await maintainerService.updateIssueStatusFromDB(id as string, status);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue status updated successfully",
            data: result.rows[0],
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
export const maintainerController = {
    deleteIssues,
    updateIssueStatus,
};