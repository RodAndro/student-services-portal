/**
 * Barrel for the API layer. Feature code imports from here:
 *
 *   import { studentsApi, healthApi } from "../api";
 *
 * Each module maps 1:1 to a backend resource and only uses documented endpoints.
 */

export * as academicTermsApi from "./academicTerms.api";
export * as authApi from "./auth.api";
export * as courseOfferingsApi from "./courseOfferings.api";
export * as coursesApi from "./courses.api";
export * as enrollmentsApi from "./enrollments.api";
export * as gradesApi from "./grades.api";
export * as healthApi from "./health.api";
export * as programsApi from "./programs.api";
export * as studentsApi from "./students.api";
