import { pool } from "../../db";

const deleteIssuesFromDB = async (id:Number) =>{
     const result = await pool.query(`
            DELETE FROM issues WHERE id=$1

            `,[id]);
        return result;
};

const updateIssueStatusFromDB = async (id: string,status: string) => {
    const result = await pool.query(`
        UPDATE issues
        SET status = $1
        WHERE id = $2
        RETURNING *
    `, [status, id]);

    return result;
};

export const maintainerService = {
    deleteIssuesFromDB,
    updateIssueStatusFromDB,
};