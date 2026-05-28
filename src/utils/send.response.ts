import type { Response } from "express";

type TResponse <T> = {
    statuscode:number;
    success: boolean;
    message: string;
    data?:T;
    error?: any;
}

const sendResponse = <T> (res:Response, data:TResponse <T>) => {
      res.status(data.statuscode).json({
                success: data.success,
                message: data.message,
                data:data.data,
                error:data.error,
            })
};
export default sendResponse;