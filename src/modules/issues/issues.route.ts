import { Router } from "express";
import { issuesController } from "./issues.controller";
import { maintainerController } from "../maintainer/maintainer.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../../type";

 const router = Router();
    router.post("/",auth(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.createIssues);

    router.get("/", auth(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.getAllIssues );

    router.get("/:id",auth(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.getSingleIssues);

    router.put("/:id",auth(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.updateIssues);

    router.delete("/:id",auth(USER_ROLE.maintainer), maintainerController.deleteIssues);

    router.put("/:id/status",auth(USER_ROLE.maintainer), maintainerController.updateIssueStatus);

 export const issuesRouter = router;