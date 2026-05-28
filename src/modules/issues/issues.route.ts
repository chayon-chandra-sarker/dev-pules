import { Router } from "express";
import { issuesController } from "./issues.controller";
import { maintainerController } from "../maintainer/maintainer.controller";

 const router = Router();
    router.post("/", issuesController.createIssues);
    router.get("/", issuesController.getAllIssues );
    router.get("/:id", issuesController.getSingleIssues);
    router.put("/:id", issuesController.updateIssues);
    router.delete("/:id", maintainerController.deleteIssues);

 export const issuesRouter = router;