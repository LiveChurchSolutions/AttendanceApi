import {
  AttendanceRepository,
  SessionRepository,
  VisitRepository,
  VisitSessionRepository
} from ".";

export class Repositories {
  public attendance: AttendanceRepository;
  public session: SessionRepository;
  public visit: VisitRepository;
  public visitSession: VisitSessionRepository;

  private static _current: Repositories = null;
  public static getCurrent = () => {
    if (Repositories._current === null) Repositories._current = new Repositories();
    return Repositories._current;
  }

  constructor() {
    this.attendance = new AttendanceRepository();
    this.session = new SessionRepository();
    this.visit = new VisitRepository();
    this.visitSession = new VisitSessionRepository();
  }
}
