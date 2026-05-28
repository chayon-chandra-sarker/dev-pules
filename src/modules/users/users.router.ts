import { Router } from "express";
import { usersController } from "./users.controller";


const router = Router();

router.post('/', usersController.signupUsers );


export const usersRouter = router;