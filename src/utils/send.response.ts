import type { Response } from "express";

type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
};

const sendResponse = <T>(res: Response, data: TResponse<T>) => {
  return res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    ...(data.data !== undefined && { data: data.data }),
    ...(data.errors !== undefined && { errors: data.errors }),
  });
};

export default sendResponse;