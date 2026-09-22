import { useOutletContext } from "react-router-dom";
import type { Student } from "../../types/api";

export interface StudentDetailContext {
  student: Student;
  /** Re-loads the student after a status change. */
  refetchStudent: () => void;
}

/** The detail layout loads the student once and shares it with the tab routes. */
export function useStudentDetail(): StudentDetailContext {
  return useOutletContext<StudentDetailContext>();
}
