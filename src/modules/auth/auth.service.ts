import bcrypt from "bcryptjs";
import { pool } from "../../db";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../../config";


const loginIntoDB = async (payload: { email: string; password: string }) => {
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
    id: user.id,
  };


  const accessToken = jwt.sign(jwtPayload, config.secret as string, {
    expiresIn: "1d",
  });


  const refreshToken = jwt.sign(jwtPayload, config.refresh_secret as string, {
    expiresIn: "100d",
  });


  delete user.password;

  return {
    user,
    token: accessToken,
    refreshToken,
  };
};

const generateRefresh = async (token: string) => {
  if (!token) {
    throw new Error("Unauthorized");
  }


  const decoded = jwt.verify(
    token,
    
    config.refresh_secret as string
  ) as JwtPayload;

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
    config.secret as string,
    { expiresIn: "1d" }
  );

  return {
    accessToken: newAccessToken,
  };
};

export const authService = {
  loginIntoDB,
  generateRefresh,
};