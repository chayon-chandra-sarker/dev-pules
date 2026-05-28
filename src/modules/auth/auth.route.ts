import { Router } from "express";
import { authController } from "./auth.controller";
import { usersController } from "../users/users.controller";

const router = Router();
    router.post("/signup", usersController.signupUsers );
    router.post("/login", authController.login);
    router.post("/refresh-token", authController.refreshToken);


export const authRoute = router;