import { Router } from "express";
import { issuesController } from "./issues.controller";

 const router = Router();
    router.post("/", issuesController.createIssues);
    router.get("/", issuesController.getAllIssues );
    router.get("/:id", issuesController.getSingleIssues);

 export const issuesRouter = router;