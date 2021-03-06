import { injectable } from "inversify";
import { DB } from "../apiBase/db";
import { Visit } from "../models";
import { DateTimeHelper, UniqueIdHelper, ArrayHelper } from '../helpers'

@injectable()
export class VisitRepository {

    public save(visit: Visit) {
        return visit.id ? this.update(visit) : this.create(visit);
    }

    private async create(visit: Visit) {
        visit.id = UniqueIdHelper.shortId();
        const visitDate = DateTimeHelper.toMysqlDate(visit.visitDate);
        const checkinTime = DateTimeHelper.toMysqlDate(visit.checkinTime);
        const sql = "INSERT INTO visits (id, churchId, personId, serviceId, groupId, visitDate, checkinTime, addedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
        const params = [visit.id, visit.churchId, visit.personId, visit.serviceId, visit.groupId, visitDate, checkinTime, visit.addedBy];
        await DB.query(sql, params);
        return visit;
    }

    private async update(visit: Visit) {
        const visitDate = DateTimeHelper.toMysqlDate(visit.visitDate);
        const checkinTime = DateTimeHelper.toMysqlDate(visit.checkinTime);
        const sql = "UPDATE visits SET personId=?, serviceId=?, groupId=?, visitDate=?, checkinTime=?, addedBy=? WHERE id=? and churchId=?";
        const params = [visit.personId, visit.serviceId, visit.groupId, visitDate, checkinTime, visit.addedBy, visit.id, visit.churchId];
        await DB.query(sql, params);
        return visit;
    }

    public delete(churchId: string, id: string) {
        return DB.query("DELETE FROM visits WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public load(churchId: string, id: string) {
        return DB.queryOne("SELECT * FROM visits WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public loadAll(churchId: string) {
        return DB.query("SELECT * FROM visits WHERE churchId=?;", [churchId]);
    }

    public loadForSessionPerson(churchId: string, sessionId: string, personId: string) {
        const sql = "SELECT v.*"
            + " FROM sessions s"
            + " LEFT OUTER JOIN serviceTimes st on st.id = s.serviceTimeId"
            + " INNER JOIN visits v on(v.serviceId = st.serviceId or v.groupId = s.groupId) and v.visitDate = s.sessionDate"
            + " WHERE v.churchId=? AND s.id = ? AND v.personId=? LIMIT 1";
        return DB.queryOne(sql, [churchId, sessionId, personId]);
    }

    public loadByServiceDatePeopleIds(churchId: string, serviceId: string, visitDate: Date, peopleIds: string[]) {
        const vsDate = DateTimeHelper.toMysqlDate(visitDate);
        const sql = "SELECT * FROM visits WHERE churchId=? AND serviceId = ? AND visitDate = ? AND personId IN (" + ArrayHelper.fillArray("?", peopleIds.length).join(", ") + ")";
        const params = [churchId, serviceId, vsDate].concat(peopleIds);
        return DB.query(sql, params);
    }

    public loadForPerson(churchId: string, personId: string) {
        return DB.query("SELECT * FROM visits WHERE churchId=? AND personId=?", [churchId, personId]);
    }

    public convertToModel(churchId: string, data: any) {
        const result: Visit = { id: data.id, personId: data.personId, serviceId: data.serviceId, groupId: data.groupId, visitDate: data.visitDate, checkinTime: data.checkinTime };
        return result;
    }

    public convertAllToModel(churchId: string, data: any[]) {
        const result: Visit[] = [];
        data.forEach(d => result.push(this.convertToModel(churchId, d)));
        return result;
    }

}
