import { controller, httpPost } from "inversify-express-utils";
import { UserInterface, ChurchInterface } from "../helpers";
import express from "express";
import { AttendanceBaseController } from "./AttendanceBaseController";

@controller("/churches")
export class ChurchController extends AttendanceBaseController {

    async validateInit(churchId: number) {
        const errors = [];
        const campuses = await this.repositories.campus.loadAll(churchId);
        if (campuses.length > 0) errors.push("Church already initialized");
        return errors;
    }

    @httpPost("/init")
    public async init(req: express.Request<{}, {}, { user: UserInterface, church: ChurchInterface }>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            const errors = await this.validateInit(au.churchId);
            if (errors.length > 0) return this.denyAccess(errors);
            else {
                const campus = await this.repositories.campus.save({ churchId: au.churchId, name: "Main Campus" });
                const service = await this.repositories.service.save({ churchId: au.churchId, campusId: campus.id, name: "Sunday Morning" });
                await this.repositories.serviceTime.save({ churchId: au.churchId, serviceId: service.id, name: "09:00am" });
                return {};
            }

        });
    }
}
