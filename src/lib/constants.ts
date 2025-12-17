import { DateTime } from "luxon";
import ReleaseNotes from '$lib/data/release_notes.json';

export class Constants {
    public static readonly _SITE = {
        NAME: "Shusseki Black",
        TAMIL_NAME: "சுஸெக்கி பிளாக்",
        VERSION: ReleaseNotes.currentVersion,
        VERSION_CODE: ReleaseNotes.versionCode,
        MAINTENANCE_MODE_KEY: "app:maintenance_mode",
        MOBILE_ONLY_MODE: true
    }
    public static readonly _COOKIES = {
        SESSION_COOKIE_NAME: "shussekiMinionSessionVerifier",
        CSRF_COOKIE_NAME: "shussekiXsrfVerifier",
        ERP_SESSION_COOKIE_NAME: "shussekiScrapperErpSession",
        EXPIRES: DateTime.now().plus({ days: 30 }).toJSDate()
    }
    public static readonly _API = {
        BASE_URI: "/api/v1",
        MAINTENANCE_MODE_KEY: "api:maintenance_mode",
        TIMEZONE: "Asia/Kolkata"
    }
    public static readonly _JWT = {
        EXPIRES_IN: '30d'
    }
    public static readonly _API_URI = {
        SHOW_USER_ATTENDANCE: this._API.BASE_URI + "/user/attendance/show",
        CREATE_TIMETABLE: this._API.BASE_URI + "/user/timetable/create",
        CREATE_FEEDBACK: this._API.BASE_URI + "/user/feedback/create",
        LIST_FEEDBACK: this._API.BASE_URI + "/user/feedback/list",
    }
}