import { injectable } from "inversify";
import { DB } from "../apiBase/db";
import { AttendanceRecord } from "../models";
import { DateTimeHelper } from '../helpers'

@injectable()
export class AttendanceRepository {

    public async loadTree(churchId: number) {
        const sql = "SELECT c.id as campusId, IFNULL(c.name, 'Unassigned') as campusName, s.id as serviceId, s.name as serviceName, st.id as serviceTimeId, st.name as serviceTimeName"
            + " FROM campuses c"
            + " LEFT JOIN services s on s.campusId = c.id AND IFNULL(s.removed, 0) = 0"
            + " LEFT JOIN serviceTimes st on st.serviceId = s.id AND IFNULL(st.removed, 0) = 0"
            + " WHERE(c.id is NULL or c.churchId = ?) AND IFNULL(c.removed, 0) = 0"
            + " ORDER by campusName, serviceName, serviceTimeName";
        return DB.query(sql, [churchId, churchId, churchId, churchId]);
    }

    public async loadTrend(churchId: number, campusId: number, serviceId: number, serviceTimeId: number, groupId: number) {
        const sql = "SELECT STR_TO_DATE(concat(year(v.visitDate), ' ', week(v.visitDate, 0), ' Sunday'), '%X %V %W') AS week, count(distinct(v.id)) as visits"
            + " FROM visits v"
            + " LEFT JOIN visitSessions vs on vs.visitId=v.id"
            + " LEFT JOIN sessions s on s.id = vs.sessionId"
            + " LEFT JOIN groupServiceTimes gst on gst.groupId = s.groupId"
            + " LEFT JOIN serviceTimes st on st.id = gst.serviceTimeId"
            + " LEFT JOIN services ser on ser.id = st.serviceId"
            + " WHERE v.churchId=?"
            + " AND ? IN (0, s.groupId)"
            + " AND ? IN (0, st.id)"
            + " AND ? IN (0, ser.id)"
            + " AND ? IN (0, ser.campusId)"
            + " GROUP BY year(v.visitDate), week(v.visitDate, 0), STR_TO_DATE(concat(year(v.visitDate), ' ', week(v.visitDate, 0), ' Sunday'), '%X %V %W')"
            + " ORDER BY year(v.visitDate), week(v.visitDate, 0);";
        const params = [churchId, groupId, serviceTimeId, serviceId, campusId];
        return DB.query(sql, params);
    }

    public convertToModel(churchId: number, data: any) {
        const result: AttendanceRecord = { visitDate: data.visitDate, week: data.week, count: data.count };
        if (data.campusId !== undefined || data.campusName !== undefined) result.campus = { id: data.campusId, name: data.campusName };
        if (data.serviceId !== null || data.serviceName !== null) result.service = { id: data.serviceId, name: data.serviceName, campusId: data.campusId };
        if (data.serviceTimeId !== null || data.serviceTimeName !== null) result.serviceTime = { id: data.serviceTimeId, name: data.serviceTimeName, serviceId: data.serviceId };
        return result;
    }

    public convertAllToModel(churchId: number, data: any[]) {
        const result: AttendanceRecord[] = [];
        data.forEach(d => result.push(this.convertToModel(churchId, d)));
        return result;
    }


    // UNVALIDATED CODE BELOW
    public async loadForPerson(churchId: number, personId: number) {
        const sql = "SELECT v.visitDate, c.id as campusId, c.name as campusName, ser.id as serviceId, ser.name as serviceName, st.id as serviceTimeId, st.name as serviceTimeName, g.id as groupId, g.categoryName, g.name as groupName"
            + " FROM visits v"
            + " INNER JOIN visitSessions vs on vs.visitId = v.id"
            + " INNER JOIN sessions s on s.id = vs.sessionId"
            + " INNER JOIN `groups` g on g.id = s.groupId"
            + " LEFT OUTER JOIN serviceTimes st on st.id = s.serviceTimeId"
            + " LEFT OUTER JOIN services ser on ser.Id = st.serviceId"
            + " LEFT OUTER JOIN campuses c on c.id = ser.campusId"
            + " WHERE v.churchId=? AND v.PersonId = ?"
            + " ORDER BY v.visitDate desc, c.name, ser.name, st.name";
        return DB.query(sql, [churchId, personId]);
    }

    public async load(churchId: number, campusId: number, serviceId: number, serviceTimeId: number, categoryName: string, groupId: number, startDate: Date, endDate: Date, groupBy: string, trend: boolean) {
        const field = this.getGroupByField(groupBy);
        const params = [];
        params.push(churchId);
        params.push(DateTimeHelper.toMysqlDate(startDate));
        params.push(DateTimeHelper.toMysqlDate(endDate));

        let sql = "SELECT ";
        if (trend) sql += "week(v.visitDate,0) as week, ";
        sql += field + " as " + groupBy + ", Count(distinct(p.id)) as count"
            + " FROM visitSessions vs"
            + " INNER JOIN visits v on v.id = vs.visitId"
            + " INNER JOIN sessions s on s.id = vs.sessionId"
            + " INNER JOIN people p on p.id = v.personId"
            + " INNER JOIN `groups` g on g.id = s.groupId"
            + " LEFT OUTER JOIN serviceTimes st on st.id = s.serviceTimeId"
            + " LEFT OUTER JOIN services ser on ser.id = st.serviceId"
            + " LEFT OUTER JOIN campuses c on c.id = ser.campusId"
            + " WHERE p.churchId = ? AND v.visitDate BETWEEN ? AND ?";

        if (campusId > 0) { sql += " AND ser.campusId=?"; params.push(campusId); }
        if (serviceId > 0) { sql += " AND ser.id=?"; params.push(serviceId); }
        if (serviceTimeId > 0) { sql += " AND st.id=?"; params.push(serviceTimeId); }
        if (categoryName !== "") { sql += " AND g.categoryName=?"; params.push(categoryName); }
        if (groupId > 0) { sql += " AND g.id=?"; params.push(groupId); }
        sql += " GROUP BY ";
        if (trend) sql += "week(v.visitDate, 0), ";
        sql += field + " ORDER BY ";
        if (trend) sql += "week(v.visitDate, 0), ";
        sql += field;
        return DB.query(sql, params);
    }

    public getGroupByField(groupBy: string) {
        let result = "c.name";
        switch (groupBy) {
            case "groupName": result = "g.name"; break;
            case "campusName": result = "c.name"; break;
            case "serviceName": result = "ser.name"; break;
            case "serviceTimeName": result = "st.name"; break;
            case "categoryName": result = "g.categoryName"; break;
            case "gender": result = "p.gender"; break;
        }
        return result;
    }


}
