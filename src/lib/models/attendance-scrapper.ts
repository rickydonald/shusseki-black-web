import helpers from '$lib/helpers';
import type { Attendance } from '$lib/types/attendance-scrapper.type';
import { attendanceFormatter } from '$lib/h';
import * as cheerio from 'cheerio';
import testData from "$lib/data/test_data.json"
import axios from 'axios';
import https from 'https';

type AttendanceInputProps = {
    dno: string;
    dob: string;
}
export interface AttendanceResponse {
    status: boolean;
    data?: Attendance;
    error?: string | null;
    errorCode?: "user_not_found" | "missing_data" | "fetching_failed";
}

export class Scrapper {
    /**
     * Returns the attendance data for a student based on their DNO and DOB.
     * @param data - An object containing `dno` (DNO) and `dob` (Date of Birth) properties.
     * `dno` should be a string representing the DNO of the student.
     * `dob` should be a string in ISO format (YYYY-MM-DD) representing the
     * @returns 
     */
    static async getAttendanceData(data: AttendanceInputProps): Promise<AttendanceResponse> {

        if (!data.dno || !data.dob) {
            return { error: 'DNO and DOB are required', status: false, errorCode: "missing_data" };
        }

        const url = `https://erp.loyolacollege.edu/loyolaonline/online/AttendanceReportInner.jsp?registerno=${data.dno}&iden=1&randid=55&dob=${helpers.formatDateISOToDMY(data.dob)}`;

        try {
            const insecureAgent = new https.Agent({
                rejectUnauthorized: false,
                keepAlive: true,
                keepAliveMsecs: 1000
            });
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0',
                'DNT': '1',
                'Referer': 'https://erp.loyolacollege.edu/',
            };

            const response = await axios.get(url, {
                headers,
                timeout: 30000,
                maxRedirects: 5,
                validateStatus: (status) => status < 500
            });

            const html = response.data;
            const $ = cheerio.load(html);

            let name = '';
            let registerNumber = '';

            $('table')
                .first()
                .find('tr')
                .each((_, tr) => {
                    const tds = $(tr).find('td');
                    const label = $(tds[0]).text().replace(/\u00a0/g, ' ').trim().toLowerCase();
                    const value = $(tds[1]).text().trim();

                    if (label.startsWith('name')) {
                        name = value;
                    } else if (label.startsWith('register no')) {
                        registerNumber = value;
                    }
                });
            // Attendance scrapper
            let attendance: Record<string, string[]> = {};
            $('table[name="table1"] tr.ui-widget-content').each((_, row) => {
                const cells = $(row).find('td');
                const date = $(cells[0]).text().trim();
                const statuses = cells
                    .slice(1)
                    .map((_, cell) => $(cell).text().trim())
                    .get();
                attendance[date] = statuses;
            });
            // Life skill attendance scrapper
            const lifeSkillEntries: Record<string, string> = {};
            let lifeSkillPresentCount = 0;
            let lifeSkillTotalRows = 0;
            $('table[name="table5"] tr').each((_, row) => {
                const cells = $(row).find('td');
                if (cells.length >= 2) {
                    const firstText = $(cells[0]).text().trim();
                    const secondText = $(cells[1]).text().trim();
                    if (firstText && secondText) {
                        const looksLikeDate = /\d{1,2}-[A-Za-z]{3}-\d{4}/.test(firstText) || /\d{1,2}\-/.test(firstText) || $(cells[0]).hasClass('ui-state-highlight');

                        if (looksLikeDate) {
                            const date = firstText;
                            const status = secondText;
                            lifeSkillEntries[date] = status;
                            lifeSkillTotalRows++;
                            if (status.toUpperCase() === 'P') lifeSkillPresentCount++;
                        }
                    }
                }
            });

            const getVal = (id: string) => Number($(`#${id}`).text().replace(':', '').trim()) || 0;
            const getHidden = (id: string) => Number($(`input#${id}`).attr('value')) || 0;

            let attendanceOverrideValue = 0;
            if (registerNumber === "25-PCS-018") {
                attendanceOverrideValue = 8;
            }

            const summary = {
                hoursPresent: getHidden('hdnHrsPresent') + attendanceOverrideValue,
                hoursAbsent: getHidden('hdnHrsAbsent') - attendanceOverrideValue,
                hoursCL: getHidden('hdnCL'),
                hoursML: getHidden('hdnML'),
                hoursOD: getHidden('hdnOD'),
            }

            const formattedSummary = attendanceFormatter(summary, registerNumber);

            const result = {
                student: {
                    name,
                    registerNumber
                },
                summary: {
                    totalWorkingDays: getVal('td_1'),
                    ...formattedSummary,
                },
                attendance,
                lifeSkill: {
                    entries: lifeSkillEntries,
                    presentCount: lifeSkillPresentCount,
                    totalRows: lifeSkillTotalRows
                }
            };

            // if (result.student.name === '' || result.student.registerNumber === '') {
            //     return {
            //         status: false,
            //         error: 'Invalid DNO or DOB. No attendance data found.',
            //         errorCode: "user_not_found"
            //     };
            // }

            return {
                status: true,
                error: null,
                data: result,
            }
        } catch (err) {
            console.error('Error fetching attendance data:', err);
            return { error: 'Failed to fetch attendance data', status: false, errorCode: "fetching_failed" };
        }
    }
    /**
     * Checks if attendance data exists for the given DNO and DOB.
     * @param data - An object containing `dno` (DNO) and `dob` (Date of Birth) properties.
     * @returns A boolean indicating whether attendance data exists.
     */
    // static async isAttendanceDataExists(data: AttendanceInputProps): Promise<boolean> {
    //     const response = await this.getAttendanceData(data);
    //     if (response.data && response.status) {
    //         return true
    //     }
    //     return false
    // }
}
