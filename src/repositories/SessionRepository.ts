import { injectable } from "inversify";
import { DB } from "../apiBase/db";
import { Session } from "../models";
import { DateTimeHelper } from '../helpers'
import { UniqueIdHelper } from "../helpers";

@injectable()
export class SessionRepository {

    public async save(session: Session) {
        if (UniqueIdHelper.isMissing(session.id)) return this.create(session); else return this.update(session);
    }

    public async create(session: Session) {
        session.id = UniqueIdHelper.shortId();
        const sessionDate = DateTimeHelper.toMysqlDate(session.sessionDate);
        return DB.query(
            "INSERT INTO sessions (id, churchId, groupId, serviceTimeId, sessionDate) VALUES (?, ?, ?, ?, ?);",
            [session.id, session.churchId, session.groupId, session.serviceTimeId, sessionDate]
        ).then(() => { return session; });
    }

    public async update(session: Session) {
        const sessionDate = DateTimeHelper.toMysqlDate(session.sessionDate);
        return DB.query(
            "UPDATE sessions SET groupId=?, serviceTimeId=?, sessionDate=? WHERE id=? and churchId=?",
            [session.groupId, session.serviceTimeId, sessionDate, session.id, session.churchId]
        ).then(() => { return session });
    }

    public async delete(churchId: string, id: string) {
        DB.query("DELETE FROM sessions WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public async load(churchId: string, id: string) {
        return DB.queryOne("SELECT * FROM sessions WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public async loadByIds(churchId: string, ids: string[]) {
        return DB.query("SELECT * FROM sessions WHERE churchId=? AND id IN (" + ids.join(",") + ");", [churchId]);
    }

    public async loadAll(churchId: string) {
        return DB.query("SELECT * FROM sessions WHERE churchId=?;", [churchId]);
    }

    public async loadByGroupServiceTimeDate(churchId: string, groupId: string, serviceTimeId: string, sessionDate: Date) {
        const sessDate = DateTimeHelper.toMysqlDate(sessionDate);
        return DB.queryOne("SELECT * FROM sessions WHERE churchId=? AND groupId = ? AND serviceTimeId = ? AND sessionDate = ?;", [churchId, groupId, serviceTimeId, sessDate]);
    }

    public async loadByGroupIdWithNames(churchId: string, groupId: string) {
        const sql = "select s.id, "
            + " CASE"
            + "     WHEN st.name IS NULL THEN DATE_FORMAT(sessionDate, '%m/%d/%Y')"
            + "     ELSE concat(DATE_FORMAT(sessionDate, '%m/%d/%Y'), ' - ', st.name)"
            + " END AS displayName"
            + " FROM sessions s"
            + " LEFT OUTER JOIN serviceTimes st on st.id = s.serviceTimeId"
            + " WHERE s.churchId=? AND s.groupId=?"
            + " ORDER by s.sessionDate desc";
        return DB.query(sql, [churchId, groupId]);
    }

    public convertToModel(churchId: string, data: any) {
        const result: Session = { id: data.id, groupId: data.groupId, serviceTimeId: data.serviceTimeId, sessionDate: data.sessionDate, displayName: data.displayName };
        return result;
    }

    public convertAllToModel(churchId: string, data: any[]) {
        const result: Session[] = [];
        data.forEach(d => result.push(this.convertToModel(churchId, d)));
        return result;
    }

}
