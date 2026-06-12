import { pool } from "../../db";
import AppError  from "../../errors/AppError";
import type { IIssues } from "../users/users.interface ";


const createIssuesIntoDB = async (payload:any, userData:any) => {
    const { title, description, type, status } = payload;

    if (!userData || !userData.id) {
        throw new Error("user not exists");
    }

    const result = await pool.query(
        `INSERT INTO issues(reporter_id, title, description, type, status)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [userData.id, title, description, type, status]
    );

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

        const issues = result.rows;
        const reporterIds = [
            ...new Set(issues.map(issue => issue.reporter_id))
                ];

        const usersResult = await pool.query(
            `SELECT id, name, email FROM users WHERE id = ANY($1)`,
                [reporterIds]
            );

            const reporterMap = new Map(
                usersResult.rows.map(user => [user.id, user])
                );

        const issuesWithReporter = issues.map(issue => ({
            ...issue,
        reporter: reporterMap.get(issue.reporter_id) || null,
        }));

    return issuesWithReporter;
};

const getSingleIssuesFromDB = async (id: number) => {
  const result = await pool.query(
    "SELECT * FROM issues WHERE id = $1",
    [id]
  );

  return result.rows[0];
};

const updateIssuesFromDB = async (
  payload: IIssues,
  id: string,
  userData: any
) => {

  const issueData = await pool.query(
    `
      SELECT * FROM issues
      WHERE id = $1
    `,
    [id]
  );

  if (issueData.rows.length === 0) {
    throw new AppError(404, "Issue not found");
  }

  const issue = issueData.rows[0];

  const {
    title,
    description,
    type,
    status,
  } = payload;

  
  if (userData.role === "contributor") {

    
    if (issue.reporter_id !== userData.id) {
      throw new AppError(
        403,
        "You are not authorized to update this issue"
      );
    }

    
    if (issue.status !== "open") {
      throw new AppError(
        403,
        "Only open issues can be updated"
      );
    }

   
    if (status !== undefined) {
      throw new AppError(
        403,
        "Contributor cannot change status"
      );
    }
  }

  const result = await pool.query(
    `
      UPDATE issues
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        type = COALESCE($3, type),
        status = COALESCE($4, status)
      WHERE id = $5
      RETURNING *
    `,
    [
      title,
      description,
      type,
      status,
      id,
    ]
  );

  return result;
};



export const issuesService = {
    createIssuesIntoDB,
    getAllIssuesFromDB,
    getSingleIssuesFromDB,
    updateIssuesFromDB,
  
}