import { pool } from "../../db";

const deleteIssuesFromDB = async (id:string) =>{
     const result = await pool.query(`
            DELETE FROM issues WHERE id=$1

            `,[id]);
        return result;
};

export const maintainerService = {
    deleteIssuesFromDB,
};