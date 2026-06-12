
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
import { env } from "process";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: env.PORT,
  connection_String: process.env.CONNECTION,
  secret: process.env.JWT_SECRET,
  refresh_secret: process.env.JWT_REFRESH_SECRET
};
var config_default = config;

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.connection_String
});
var initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(20),
                email VARCHAR(30) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'contributor',
                create_at TIMESTAMP DEFAULT NOW(),
                update_at TIMESTAMP DEFAULT NOW()
            )
        `);
    await pool.query(`
                CREATE TABLE IF NOT EXISTS issues(
                id SERIAL PRIMARY KEY,
                title VARCHAR (150),
                description TEXT,
                type TEXT NOT NULL
                CHECK (type IN ('bug', 'feature_request')),
                status TEXT DEFAULT 'open'
                CHECK (status IN ('open', 'in_progress', 'resolved')),
                reporter_id INT REFERENCES users(id) ON DELETE CASCADE,
                create_at TIMESTAMP DEFAULT NOW(),
                update_at TIMESTAMP DEFAULT NOW()
             )
         `);
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";
var loginIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `SELECT * FROM users WHERE email=$1`,
    [email]
  );
  if (!userData.rows.length) {
    throw new Error("Invalid credentials");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid credentials");
  }
  const jwtPayload = {
    id: user.id
  };
  const accessToken = jwt.sign(jwtPayload, config_default.secret, {
    expiresIn: "1d"
  });
  const refreshToken2 = jwt.sign(jwtPayload, config_default.refresh_secret, {
    expiresIn: "100d"
  });
  delete user.password;
  return {
    user,
    token: accessToken,
    refreshToken: refreshToken2
  };
};
var generateRefresh = async (token) => {
  if (!token) {
    throw new Error("Unauthorized");
  }
  const decoded = jwt.verify(
    token,
    config_default.refresh_secret
  );
  if (!decoded.id) {
    throw new Error("Invalid refresh token");
  }
  const userData = await pool.query(
    `SELECT * FROM users WHERE id=$1`,
    [decoded.id]
  );
  if (!userData.rows.length) {
    throw new Error("User not found");
  }
  const user = userData.rows[0];
  const newAccessToken = jwt.sign(
    { id: user.id },
    config_default.secret,
    { expiresIn: "1d" }
  );
  return {
    accessToken: newAccessToken
  };
};
var authService = {
  loginIntoDB,
  generateRefresh
};

// src/utils/send.response.ts
var sendResponse = (res, data) => {
  return res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    ...data.data !== void 0 && { data: data.data },
    ...data.errors !== void 0 && { errors: data.errors }
  });
};
var send_response_default = sendResponse;

// src/modules/auth/auth.controller.ts
var login = async (req, res) => {
  try {
    const result = await authService.loginIntoDB(req.body);
    const { refreshToken: refreshToken2 } = result;
    res.cookie("refreshToken", refreshToken2, {
      secure: false,
      httpOnly: true,
      sameSite: "lax"
    });
    send_response_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successfully",
      data: {
        user: result.user,
        token: result.token
      }
    });
  } catch (errors) {
    send_response_default(res, {
      statusCode: 401,
      success: false,
      message: errors.message,
      errors
    });
  }
};
var refreshToken = async (req, res) => {
  try {
    const result = await authService.generateRefresh(req.cookies.refreshToken);
    res.status(200).json({
      success: true,
      message: "Access token Generated",
      data: result
    });
  } catch (errors) {
    res.status(500).json({
      success: false,
      message: errors.message,
      errors
    });
  }
};
var authController = {
  login,
  refreshToken
};

// src/modules/users/users.service.ts
import bcrypt2 from "bcryptjs";
import jwt2 from "jsonwebtoken";
var signupUsersIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt2.hash(password, 12);
  const result = await pool.query(`
        INSERT INTO users (name, email, password, role) VALUES($1,$2,$3, COALESCE($4, 'contributor'))
        RETURNING *
        `, [name, email, hashPassword, role]);
  delete result.rows[0].password;
  const token = jwt2.sign(
    {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role
    },
    config_default.secret,
    {
      expiresIn: "7d"
    }
  );
  return {
    user: result.rows[0],
    token
  };
};
var usersService = {
  signupUsersIntoDB
};

// src/modules/users/users.controller.ts
var signupUsers = async (req, res) => {
  try {
    const result = await usersService.signupUsersIntoDB(req.body);
    send_response_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: {
        user: result.user,
        token: result.token
      }
    });
  } catch (errors) {
    send_response_default(res, {
      statusCode: 500,
      success: true,
      message: errors.message,
      errors
    });
  }
};
var usersController = {
  signupUsers
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", usersController.signupUsers);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
var authRoute = router;

// src/app.ts
import cookieParser from "cookie-parser";

// src/middleware/logger.ts
import fs from "fs";
var logger = (req, res, next) => {
  console.log("Time:", Date.now());
  const log = `
Method -> ${req.method} - Time -> ${Date.now()} - URL -> ${req.url}
`;
  fs.appendFile("logger.txt", log, (err) => {
  });
  next();
};
var logger_default = logger;

// src/app.ts
import cors from "cors";

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/errors/AppError.ts
var AppError = class extends Error {
  statusCode;
  errors;
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
};
var AppError_default = AppError;

// src/modules/issues/issues.service.ts
var createIssuesIntoDB = async (payload, userData) => {
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
var getAllIssuesFromDB = async (filters) => {
  let query = `SELECT * FROM issues`;
  const values = [];
  const conditions = [];
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
    ...new Set(issues.map((issue) => issue.reporter_id))
  ];
  const usersResult = await pool.query(
    `SELECT id, name, email FROM users WHERE id = ANY($1)`,
    [reporterIds]
  );
  const reporterMap = new Map(
    usersResult.rows.map((user) => [user.id, user])
  );
  const issuesWithReporter = issues.map((issue) => ({
    ...issue,
    reporter: reporterMap.get(issue.reporter_id) || null
  }));
  return issuesWithReporter;
};
var getSingleIssuesFromDB = async (id) => {
  const result = await pool.query(
    "SELECT * FROM issues WHERE id = $1",
    [id]
  );
  return result.rows[0];
};
var updateIssuesFromDB = async (payload, id, userData) => {
  const issueData = await pool.query(
    `
      SELECT * FROM issues
      WHERE id = $1
    `,
    [id]
  );
  if (issueData.rows.length === 0) {
    throw new AppError_default(404, "Issue not found");
  }
  const issue = issueData.rows[0];
  const {
    title,
    description,
    type,
    status
  } = payload;
  if (userData.role === "contributor") {
    if (issue.reporter_id !== userData.id) {
      throw new AppError_default(
        403,
        "You are not authorized to update this issue"
      );
    }
    if (issue.status !== "open") {
      throw new AppError_default(
        403,
        "Only open issues can be updated"
      );
    }
    if (status !== void 0) {
      throw new AppError_default(
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
      id
    ]
  );
  return result;
};
var issuesService = {
  createIssuesIntoDB,
  getAllIssuesFromDB,
  getSingleIssuesFromDB,
  updateIssuesFromDB
};

// src/modules/issues/issues.controller.ts
var createIssues = async (req, res) => {
  try {
    const result = await issuesService.createIssuesIntoDB(req.body, req.user);
    send_response_default(res, {
      statusCode: 201,
      success: true,
      message: "Issues Create successfully",
      data: result.rows[0]
    });
  } catch (errors) {
    send_response_default(res, {
      statusCode: 500,
      success: false,
      message: errors.message,
      errors
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const { sort, type, status } = req.query;
    const result = await issuesService.getAllIssuesFromDB({
      sort,
      type,
      status
    });
    send_response_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  } catch (errors) {
    send_response_default(res, {
      statusCode: 500,
      success: false,
      message: errors.message,
      errors
    });
  }
};
var getSingleIssues = async (req, res) => {
  try {
    const numericId = Number(req.params.id);
    if (isNaN(numericId)) {
      return send_response_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid ID",
        data: {}
      });
    }
    const result = await issuesService.getSingleIssuesFromDB(numericId);
    if (!result) {
      return send_response_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
        data: {}
      });
    }
    return send_response_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  } catch (errors) {
    return send_response_default(res, {
      statusCode: 500,
      success: false,
      message: errors.message
    });
  }
};
var updateIssues = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issuesService.updateIssuesFromDB(req.body, id, req.user);
    if (result.rows.length === 0) {
      send_response_default(res, {
        statusCode: 404,
        success: false,
        message: "Issues Data Not Found",
        data: {}
      });
    }
    send_response_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result.rows[0]
    });
  } catch (errors) {
    send_response_default(res, {
      statusCode: errors.statusCode || 500,
      success: false,
      message: errors.message,
      errors
    });
  }
};
var issuesController = {
  createIssues,
  getAllIssues,
  getSingleIssues,
  updateIssues
};

// src/modules/maintainer/maintainer.service.ts
var deleteIssuesFromDB = async (id) => {
  const result = await pool.query(`
            DELETE FROM issues WHERE id=$1

            `, [id]);
  return result;
};
var updateIssueStatusFromDB = async (id, status) => {
  const result = await pool.query(`
        UPDATE issues
        SET status = $1
        WHERE id = $2
        RETURNING *
    `, [status, id]);
  return result;
};
var maintainerService = {
  deleteIssuesFromDB,
  updateIssueStatusFromDB
};

// src/modules/maintainer/maintainer.controller.ts
var deleteIssues = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return send_response_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid id",
        data: {}
      });
    }
    const result = await maintainerService.deleteIssuesFromDB(id);
    if (result.rowCount === 0) {
      return send_response_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
        data: {}
      });
    }
    return send_response_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
      data: {}
    });
  } catch (errors) {
    return send_response_default(res, {
      statusCode: 500,
      success: false,
      message: errors.message,
      errors
    });
  }
};
var updateIssueStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await maintainerService.updateIssueStatusFromDB(id, status);
    send_response_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue status updated successfully",
      data: result.rows[0]
    });
  } catch (errors) {
    send_response_default(res, {
      statusCode: 500,
      success: false,
      message: errors.message,
      errors
    });
  }
};
var maintainerController = {
  deleteIssues,
  updateIssueStatus
};

// src/middleware/auth.ts
import Jwt from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    console.log(roles);
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return send_response_default(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized Access"
        });
      }
      const decoded = Jwt.verify(token, config_default.secret);
      console.log("DECODED:", decoded);
      console.log("ID:", decoded.id);
      const userData = await pool.query(`
            SELECT * FROM users WHERE id=$1
        `, [decoded.id]);
      const user = userData.rows[0];
      console.log(user);
      if (userData.rows.length === 0) {
        return send_response_default(res, {
          statusCode: 404,
          success: false,
          message: "Data not found"
        });
      }
      ;
      if (roles.length && !roles.includes(user.role)) {
        return send_response_default(res, {
          statusCode: 401,
          success: false,
          message: "Forbidden"
        });
      }
      ;
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/type/index.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post("/", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.createIssues);
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", issuesController.getSingleIssues);
router2.put("/:id", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.updateIssues);
router2.delete("/:id", auth_default(USER_ROLE.maintainer), maintainerController.deleteIssues);
router2.put("/:id/status", auth_default(USER_ROLE.maintainer), maintainerController.updateIssueStatus);
var issuesRouter = router2;

// src/middleware/golobal.error.handler.ts
var globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || null
  });
};
var golobal_error_handler_default = globalErrorHandler;

// src/middleware/notFound.ts
var notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    errors: null
  });
};
var notFound_default = notFound;

// src/app.ts
var app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(logger_default);
app.use(cors({ origin: "http://localhost:5000" }));
app.get("/", (req, res) => {
  res.status(200).json({
    "message": "Dev Pules",
    "author": "Dev pules"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRouter);
app.use(notFound_default);
app.use(golobal_error_handler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map