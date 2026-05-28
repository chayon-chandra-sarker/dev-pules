import { Router } from "express";
import { usersController } from "./users.controller";
import { issuesController } from "../issues/issues.controller";


const router = Router();

router.post('/', usersController.signupUsers );



export const usersRouter = router;