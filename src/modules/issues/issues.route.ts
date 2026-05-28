import { Router } from "express";
import { issuesController } from "./issues.controller";

 const router = Router();
    router.post("/", issuesController.createIssues);
    router.get("/", issuesController.getAllIssues );
    router.get("/:id", issuesController.getSingleIssues);
    router.put("/:id", issuesController.updateIssues);

 export const issuesRouter = router;