import { pool } from "../../db";


const createIssuesIntoDB = async (payload:any) => {
    const {reporter_id, title, description, type, status} = payload;
     const user = await pool.query (`
        SELECT * FROM users WHERE id=$1
        `,[reporter_id]);
        // console.log(user)
        if(user.rows.length === 0){
            throw new Error("user not exists")
    };

    const result = await pool.query(`
        INSERT INTO issues(reporter_id, title, description, type, status) VALUES ($1,$2,$3,$4,$5) RETURNING *
        `,[reporter_id, title, description, type, status]);

    return result;
};

export const issuesService = {
    createIssuesIntoDB,
}