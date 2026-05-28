import { pool } from "../../db";
import type { IIssues } from "../users/users.interface ";


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

const getAllIssuesFromDB = async (filters: any) => {

    let query = `SELECT * FROM issues`;
    const values: any[] = [];
    const conditions: string[] = [];

    const { sort, type, status } = filters;


    if (type) {
        values.push(type);
        conditions.push(`type = $${values.length}`);
    }


    if (status) {
        values.push(status);
        conditions.push(`status = $${values.length}`);
    }

   
    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(" AND ");
    }

    
    if (sort === "oldest") {
        query += ` ORDER BY create_at ASC`;
    } else {
        query += ` ORDER BY create_at DESC`; 
    }
    const result = await pool.query(query, values);
    return result;
};

const getSingleIssuesFromDB = async (id:string) =>{
    const result = await pool.query(`
             SELECT * FROM issues WHERE id=$1
            `,[id]);
        return result;
};

const updateIssuesFromDB = async (payload: IIssues, id:string, userData: any) =>{
        const issueData = await pool.query(`
        SELECT * FROM issues WHERE id=$1
    `, [id]);

    if(issueData.rows.length === 0){
        throw new Error("Issue not found");
    }
    const {reporter_id, title, description, type, status} = payload;

    const issue = issueData.rows[0];
    if(userData.role === "contributor"){

        if(issue.reporter_id !== userData.id){
            throw new Error("Forbidden Access");
        };
        if(status){
            throw new Error("Contributor cannot change status");
        };
    }

   
       const result = await pool.query(`
            UPDATE issues SET 
            reporter_id= COALESCE($1,reporter_id), 
            title = COALESCE($2,title), 
            description = COALESCE($3,description), 
            type = COALESCE($4,type),
            status = COALESCE($5,status)
            WHERE id =$6 RETURNING *
        `, [reporter_id, title, description, type, status,id]);

        return result;
};



export const issuesService = {
    createIssuesIntoDB,
    getAllIssuesFromDB,
    getSingleIssuesFromDB,
    updateIssuesFromDB,
  
}