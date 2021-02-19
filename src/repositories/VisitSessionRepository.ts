import { injectable } from "inversify";
import { DB } from "../apiBase/db";
import { VisitSession } from "../models";
import { UniqueIdHelper } from "../helpers";

@injectable()
export class VisitSessionRepository {

    public async save(visitSession: VisitSession) {
        if (UniqueIdHelper.isMissing(visitSession.id)) return this.create(visitSession); else return this.update(visitSession);
    }

    public async create(visitSession: VisitSession) {
        return DB.query(
            "INSERT INTO visitSessions (id, churchId, visitId, sessionId) VALUES (?, ?, ?, ?);",
            [UniqueIdHelper.shortId(), visitSession.churchId, visitSession.visitId, visitSession.sessionId]
        ).then((row: any) => { visitSession.id = row.insertId; return visitSession; });
    }

    public async update(visitSession: VisitSession) {
        return DB.query(
            "UPDATE visitSessions SET visitId=?, sessionId=? WHERE id=? and churchId=?",
            [visitSession.visitId, visitSession.sessionId, visitSession.id, visitSession.churchId]
        ).then(() => { return visitSession });
    }

    public async delete(churchId: string, id: string) {
        DB.query("DELETE FROM visitSessions WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public async load(churchId: string, id: string) {
        return DB.queryOne("SELECT * FROM visitSessions WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public async loadAll(churchId: string) {
        return DB.query("SELECT * FROM visitSessions WHERE churchId=?;", [churchId]);
    }

    public async loadByVisitIdSessionId(churchId: string, visitId: string, sessionId: string) {
        return DB.queryOne("SELECT * FROM visitSessions WHERE churchId=? AND visitId=? AND sessionId=? LIMIT 1;", [churchId, visitId, sessionId]);
    }

    public async loadByVisitIds(churchId: string, visitIds: string[]) {
        return DB.query("SELECT * FROM visitSessions WHERE churchId=? AND visitId IN (" + visitIds.join(",") + ");", [churchId]);
    }

    public async loadByVisitId(churchId: string, visitId: string) {
        return DB.query("SELECT * FROM visitSessions WHERE churchId=? AND visitId=?;", [churchId, visitId]);
    }

    public async loadForSessionPerson(churchId: string, sessionId: string, personId: string) {
        const sql = "SELECT v.*"
            + " FROM sessions s"
            + " LEFT OUTER JOIN serviceTimes st on st.id = s.serviceTimeId"
            + " INNER JOIN visits v on(v.serviceId = st.serviceId or v.groupId = s.groupId) and v.visitDate = s.sessionDate"
            + " WHERE v.churchId=? AND s.id = ? AND v.personId=? LIMIT 1";
        return DB.queryOne(sql, [churchId, sessionId, personId]);
    }

    public async loadForSession(churchId: string, sessionId: string) {
        const sql = "SELECT vs.*, v.personId FROM"
            + " visitSessions vs"
            + " INNER JOIN visits v on v.id = vs.visitId"
            + " WHERE vs.churchId=? AND vs.sessionId = ?";
        return DB.query(sql, [churchId, sessionId]);
    }

    public convertToModel(churchId: string, data: any) {
        const result: VisitSession = { id: data.id, visitId: data.visitId, sessionId: data.sessionId };
        if (data.personId !== undefined) {
            result.visit = { id: result.visitId, personId: data.personId }
            // result.visit.person = { id: result.visit.personId, photoUpdated: data.photoUpdated, name: { display: data.displayName }, contactInfo: { email: data.email } };
            // result.visit.person.photo = PersonHelper.getPhotoUrl(churchId, result.visit.person);
        }
        return result;
    }

    public convertAllToModel(churchId: string, data: any[]) {
        const result: VisitSession[] = [];
        data.forEach(d => result.push(this.convertToModel(churchId, d)));
        return result;
    }

}
