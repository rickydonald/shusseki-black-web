import * as cheerio from "cheerio"

export interface StudentProfile {
    name: string
    deptNo: string
    urn: string
    course: string
    academicInfo: string
    institution: string
    dob: string
    gender: string
    fatherName: string
    motherName: string
    address: string
    studentPhone: string
    studentEmail: string
    parentPhone: string
    parentEmail: string
    admittedDate: string
    community: string
    nationality: string
    religion: string
    hosteller: boolean
    occupation: string
    annualIncome: number
    district: string
    state: string
    status: string
    photoUrl: string
}

const URL = "https://erp.loyolacollege.edu/loyolaonline/students/report/studentProfile.jsp";
export async function scrapeStudentProfile(cookieHeader: string): Promise<StudentProfile> {
    const res = await fetch(URL, {
        headers: {
            Cookie: cookieHeader
        }
    });

    const html = await res.text();
    const $ = cheerio.load(html)

    const profile: any = {}

    const rows = $('table.table-bordered tr')

    rows.each((_, row) => {
        const label = $(row).find("td").first().text().trim()
        const value = $(row).find("td").last().text().trim()

        if (!label || !value) return

        switch (label) {
            case "Student Name":
                profile.name = value
                break

            case "Dept No.":
                profile.deptNo = value
                break

            case "University Register No.(URN)":
                profile.urn = value
                break

            case "Course":
                profile.course = value
                break

            case "Academic Year / Semester / Section":
                profile.academicInfo = value
                break

            case "Institution":
                profile.institution = value
                break

            case "D.O.B. / Gender": {
                const [dob, gender] = value.split("/").map(v => v.trim())
                profile.dob = dob
                profile.gender = gender
                break
            }

            case "Father Name / Mother Name": {
                const [father, mother] = value.split("/").map(v => v.trim())
                profile.fatherName = father
                profile.motherName = mother
                break
            }

            case "Residential Address":
                profile.address = value.replace(/\s+/g, " ")
                break

            case "Student Contact Number / Email": {
                const [phone, email] = value.split("/").map(v => v.trim())
                profile.studentPhone = phone
                profile.studentEmail = email
                break
            }

            case "Parent Contact Number / Email": {
                const [phone, email] = value.split("/").map(v => v.trim())
                profile.parentPhone = phone
                profile.parentEmail = email
                break
            }

            case "Admitted Date":
                profile.admittedDate = value
                break

            case "Community":
                profile.community = value
                break

            case "Nationality / Religion": {
                const [nationality, religion] = value.split("/").map(v => v.trim())
                profile.nationality = nationality
                profile.religion = religion
                break
            }

            case "Hosteller":
                profile.hosteller = value.toLowerCase() === "yes"
                break

            case "Occupation / Annual Income Rs.": {
                const parts = value.split("/")
                profile.occupation = parts.slice(0, -1).join("/").trim()
                profile.annualIncome = Number(parts.at(-1)?.trim() || 0)
                break
            }

            case "District / State Name": {
                const [district, state] = value.split("/").map(v => v.trim())
                profile.district = district
                profile.state = state
                break
            }
        }
    })

    const BASE_URL = "//wsrv.nl/?url=https://erp.loyolacollege.edu/loyolaonline"
    const relativePhoto = $('#divImage img').attr("src") || ""
    profile.photoUrl = relativePhoto
        ? `${BASE_URL}/${relativePhoto.replace(/^(\.\.\/)+/, "")}`
        : ""

    const statusText = $('#divImage p')
        .text()
        .replace("Current Status:", "")
        .trim()

    profile.status = statusText

    return profile
}