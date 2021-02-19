import { injectable } from "inversify";
import { DB } from "../apiBase/db";
import { ServiceTime } from "../models";
import { UniqueIdHelper } from "../helpers";

@injectable()
export class ServiceTimeRepository {

    public async save(serviceTime: ServiceTime) {
        if (UniqueIdHelper.isMissing(serviceTime.id)) return this.create(serviceTime); else return this.update(serviceTime);
    }

    public async create(serviceTime: ServiceTime) {
        serviceTime.id = UniqueIdHelper.shortId();
        return DB.query(
            "INSERT INTO serviceTimes (id, churchId, serviceId, name, removed) VALUES (?, ?, ?, ?, 0);",
            [serviceTime.id, serviceTime.churchId, serviceTime.serviceId, serviceTime.name]
        ).then(() => { return serviceTime; });
    }

    public async update(serviceTime: ServiceTime) {
        return DB.query(
            "UPDATE serviceTimes SET serviceId=?, name=? WHERE id=? and churchId=?",
            [serviceTime.serviceId, serviceTime.name, serviceTime.id, serviceTime.churchId]
        ).then(() => { return serviceTime });
    }

    public async delete(churchId: string, id: string) {
        DB.query("UPDATE serviceTimes SET removed=1 WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public async load(churchId: string, id: string) {
        return DB.queryOne("SELECT * FROM serviceTimes WHERE id=? AND churchId=? AND removed=0;", [id, churchId]);
    }

    public async loadAll(churchId: string) {
        return DB.query("SELECT * FROM serviceTimes WHERE churchId=? AND removed=0;", [churchId]);
    }

    public async loadNamesWithCampusService(churchId: string) {
        return DB.query("SELECT st.*, concat(c.name, ' - ', s.name, ' - ', st.name) as longName FROM serviceTimes st INNER JOIN services s on s.Id=st.serviceId INNER JOIN campuses c on c.Id=s.campusId WHERE s.churchId=? AND st.removed=0 ORDER BY c.name, s.name, st.name;", [churchId]);
    }

    public async loadNamesByServiceId(churchId: string, serviceId: string) {
        return DB.query("SELECT st.*, concat(c.name, ' - ', s.name, ' - ', st.name) as longName FROM serviceTimes st INNER JOIN services s on s.id=st.serviceId INNER JOIN campuses c on c.id=s.campusId WHERE s.churchId=? AND s.id=? AND st.removed=0 ORDER BY c.name, s.name, st.name", [churchId, serviceId]);
    }

    public async loadByChurchCampusService(churchId: string, campusId: string, serviceId: string) {
        const sql = "SELECT st.*"
            + " FROM serviceTimes st"
            + " LEFT OUTER JOIN services s on s.id=st.serviceId"
            + " WHERE st.churchId = ? AND (?=0 OR st.serviceId=?) AND (? = 0 OR s.campusId = ?) AND st.removed=0";
        return DB.query(sql, [churchId, serviceId, serviceId, campusId, campusId]);
    }

    public convertToModel(churchId: string, data: any) {
        const result: ServiceTime = { id: data.id, serviceId: data.serviceId, name: data.name, longName: data.longName };
        return result;
    }

    public convertAllToModel(churchId: string, data: any[]) {
        const result: ServiceTime[] = [];
        data.forEach(d => result.push(this.convertToModel(churchId, d)));
        return result;
    }

}
