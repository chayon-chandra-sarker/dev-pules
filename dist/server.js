
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

// src/modules/users/users.router.ts
import { Router } from "express";

// src/modules/users/users.service.ts
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

// src/modules/users/users.service.ts
var signupUsersIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 12);
  const result = await pool.query(`
        INSERT INTO users (name, email, password, role) VALUES($1,$2,$3, COALESCE($4, 'contributor'))
        RETURNING *
        `, [name, email, hashPassword, role]);
  delete result.rows[0].password;
  return result;
};
var usersService = {
  signupUsersIntoDB
};

// src/utils/send.response.ts
var sendResponse = (res, data) => {
  res.status(data.statuscode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var send_response_default = sendResponse;

// src/modules/users/users.controller.ts
var signupUsers = async (req, res) => {
  try {
    const result = await usersService.signupUsersIntoDB(req.body);
    send_response_default(res, {
      statuscode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    send_response_default(res, {
      statuscode: 500,
      success: true,
      message: error.message,
      error
    });
  }
};
var usersController = {
  signupUsers
};

// src/modules/users/users.router.ts
var router = Router();

// src/modules/auth/auth.route.ts
import { Router as Router2 } from "express";

// src/modules/auth/auth.service.ts
import bcrypt2 from "bcryptjs";
import jwt from "jsonwebtoken";
var loginIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(`
        SELECT * FROM users WHERE email=$1
        `, [email]);
  if (userData.rows.length === 0) {
    throw new Error("Invalid credentials");
  }
  ;
  const user = userData.rows[0];
  const matchPassword = await bcrypt2.compare(password, user.password);
  console.log(matchPassword);
  if (!matchPassword) {
    throw new Error("Invalid credentials");
  }
  ;
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email
  };
  const accessToken = jwt.sign(jwtPayload, config_default.secret, { expiresIn: "1d" });
  const refreshToken2 = jwt.sign(jwtPayload, config_default.refresh_secret, { expiresIn: "100d" });
  return { accessToken, refreshToken: refreshToken2 };
};
var generateRefresh = async (token) => {
  if (!token) {
    throw new Error("Unauthorized!!");
  }
  ;
  const decoded = jwt.verify(token, config_default.refresh_secret);
  const userData = await pool.query(`
            SELECT * FROM users WHERE email=$1
        `, [decoded.email]);
  const user = userData.rows[0];
  if (userData.rows.length === 0) {
    throw new Error("user not found!!");
  }
  ;
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email
  };
  const accessToken = jwt.sign(jwtPayload, config_default.secret, { expiresIn: "1d" });
  return { accessToken };
};
var authService = {
  loginIntoDB,
  generateRefresh
};

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
      statuscode: 200,
      success: true,
      message: "Login successfully",
      data: result
    });
  } catch (error) {
    send_response_default(res, {
      statuscode: 500,
      success: false,
      message: error.message,
      error
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  login,
  refreshToken
};

// src/modules/auth/auth.route.ts
var router2 = Router2();
router2.post("/signup", usersController.signupUsers);
router2.post("/login", authController.login);
router2.post("/refresh-token", authController.refreshToken);
var authRoute = router2;

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
import { Router as Router3 } from "express";

// src/modules/issues/issues.service.ts
var createIssuesIntoDB = async (payload) => {
  const { reporter_id, title, description, type, status } = payload;
  const user = await pool.query(`
        SELECT * FROM users WHERE id=$1
        `, [reporter_id]);
  if (user.rows.length === 0) {
    throw new Error("user not exists");
  }
  ;
  const result = await pool.query(`
        INSERT INTO issues(reporter_id, title, description, type, status) VALUES ($1,$2,$3,$4,$5) RETURNING *
        `, [reporter_id, title, description, type, status]);
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
  return result;
};
var getSingleIssuesFromDB = async (id) => {
  const result = await pool.query(`
             SELECT * FROM issues WHERE id=$1
            `, [id]);
  return result;
};
var updateIssuesFromDB = async (payload, id, userData) => {
  const issueData = await pool.query(`
        SELECT * FROM issues WHERE id=$1
    `, [id]);
  if (issueData.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const { reporter_id, title, description, type, status } = payload;
  const issue = issueData.rows[0];
  if (userData.role === "contributor") {
    if (issue.reporter_id !== userData.id) {
      throw new Error("Forbidden Access");
    }
    ;
    if (status) {
      throw new Error("Contributor cannot change status");
    }
    ;
  }
  const result = await pool.query(`
            UPDATE issues SET 
            reporter_id= COALESCE($1,reporter_id), 
            title = COALESCE($2,title), 
            description = COALESCE($3,description), 
            type = COALESCE($4,type),
            status = COALESCE($5,status)
            WHERE id =$6 RETURNING *
        `, [reporter_id, title, description, type, status, id]);
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
    const result = await issuesService.createIssuesIntoDB(req.body);
    send_response_default(res, {
      statuscode: 201,
      success: true,
      message: "Issues Create successfully",
      data: result.rows[0]
    });
  } catch (error) {
    send_response_default(res, {
      statuscode: 500,
      success: false,
      message: error.message,
      error
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
      statuscode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: result.rows
    });
  } catch (error) {
    send_response_default(res, {
      statuscode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleIssues = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issuesService.getSingleIssuesFromDB(id);
    if (result.rows.length === 0) {
      send_response_default(res, {
        statuscode: 404,
        success: false,
        message: "Issues Data Not Found",
        data: {}
      });
      send_response_default(res, {
        statuscode: 200,
        success: true,
        message: "Issues retrieved successfully",
        data: result.rows
      });
    }
    send_response_default(res, {
      statuscode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result.rows[0]
    });
  } catch (error) {
    send_response_default(res, {
      statuscode: 500,
      success: true,
      message: error.message,
      error
    });
  }
};
var updateIssues = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issuesService.updateIssuesFromDB(req.body, id, req.user);
    if (result.rows.length === 0) {
      send_response_default(res, {
        statuscode: 404,
        success: false,
        message: "Issues Data Not Found",
        data: {}
      });
    }
    send_response_default(res, {
      statuscode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result.rows
    });
  } catch (error) {
    send_response_default(res, {
      statuscode: 500,
      success: true,
      message: error.message,
      error
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
  const { id } = req.params;
  try {
    const result = await maintainerService.deleteIssuesFromDB(id);
    if (result.rowCount === 0) {
      send_response_default(res, {
        statuscode: 404,
        success: false,
        message: "Issues Data Not Found",
        data: {}
      });
    }
    ;
    send_response_default(res, {
      statuscode: 200,
      success: true,
      message: "Issue deleted successfully",
      data: {}
    });
  } catch (error) {
    send_response_default(res, {
      statuscode: 500,
      success: true,
      message: error.message,
      error
    });
  }
};
var updateIssueStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await maintainerService.updateIssueStatusFromDB(id, status);
    send_response_default(res, {
      statuscode: 200,
      success: true,
      message: "Issue status updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    send_response_default(res, {
      statuscode: 500,
      success: false,
      message: error.message,
      error
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
      const token = req.headers.authorization;
      if (!token) {
        send_response_default(res, {
          statuscode: 401,
          success: false,
          message: "Unauthorized Access"
        });
      }
      const decoded = Jwt.verify(token, config_default.secret);
      const userData = await pool.query(`
            SELECT * FROM users WHERE email=$1
        `, [decoded.email]);
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        send_response_default(res, {
          statuscode: 404,
          success: false,
          message: "Data not found"
        });
      }
      ;
      if (roles.length && !roles.includes(user.role)) {
        send_response_default(res, {
          statuscode: 401,
          success: false,
          message: "Forbidden"
        });
      }
      ;
      req.user = decoded;
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
var router3 = Router3();
router3.post("/", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.createIssues);
router3.get("/", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.getAllIssues);
router3.get("/:id", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.getSingleIssues);
router3.put("/:id", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.updateIssues);
router3.delete("/:id", auth_default(USER_ROLE.maintainer), maintainerController.deleteIssues);
router3.put("/:id/status", auth_default(USER_ROLE.maintainer), maintainerController.updateIssueStatus);
var issuesRouter = router3;

// src/middleware/golobal.error.handler.ts
var globalErrorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var golobal_error_handler_default = globalErrorHandler;

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