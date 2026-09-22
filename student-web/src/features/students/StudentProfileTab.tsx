import { StudentProfileCard } from "./StudentProfileCard";
import { useStudentDetail } from "./studentDetailContext";

/** Profile tab on the staff Student detail page. */
export function StudentProfileTab() {
  const { student } = useStudentDetail();

  return <StudentProfileCard student={student} />;
}
