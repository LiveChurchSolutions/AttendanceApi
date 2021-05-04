export class Permissions {
    static attendance = {
        view: { contentType: "Attendance", action: "View" },
        viewSummary: { contentType: "Attendance", action: "View Summary" },
        edit: { contentType: "Attendance", action: "Edit" },
        checkin: { contentType: "Attendance", action: "Checkin" }
    };
    static services = {
        edit: { contentType: "Services", action: "Edit" }
    };
    static admin = {
        editSettings: { contentType: "Admin", action: "Edit Settings" }
    }
}