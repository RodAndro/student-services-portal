import { DescriptionItem, DescriptionList } from "../../components/data/DescriptionList";
import { Card } from "../../components/ui/Card";
import { formatDate, formatDateTime, humanizeStatus, orDash } from "../../lib/format";
import type { Student } from "../../types/api";

/**
 * Renders exactly what `StudentResource` returns - no derived academic fields.
 * Shared by the staff Student detail page and the student portal, so both show the
 * same data in the same way.
 */
export function StudentProfileCard({ student }: { student: Student }) {
  return (
    <Card title="Student profile" description="Data returned by GET /students/{id}.">
      <DescriptionList>
        <DescriptionItem
          label="Student number"
          value={<span className="font-mono">{student.student_number}</span>}
        />
        <DescriptionItem label="Full name" value={student.full_name} />
        <DescriptionItem label="First name" value={student.first_name} />
        <DescriptionItem label="Middle name" value={orDash(student.middle_name)} />
        <DescriptionItem label="Last name" value={student.last_name} />
        <DescriptionItem label="Suffix" value={orDash(student.suffix)} />
        <DescriptionItem label="Birth date" value={formatDate(student.birth_date)} />
        <DescriptionItem label="Email" value={orDash(student.email)} />
        <DescriptionItem label="Contact number" value={orDash(student.contact_number)} />
        <DescriptionItem
          label="Program"
          value={student.program ? `${student.program.code} — ${student.program.name}` : "—"}
        />
        <DescriptionItem label="Year level" value={`Year ${student.year_level}`} />
        <DescriptionItem label="Status" value={humanizeStatus(student.status)} />
        <DescriptionItem label="Address" value={orDash(student.address)} />
        <DescriptionItem label="Created" value={formatDateTime(student.created_at)} />
        <DescriptionItem label="Last updated" value={formatDateTime(student.updated_at)} />
        <DescriptionItem
          label="Record id"
          value={<span className="font-mono">{student.id}</span>}
        />
      </DescriptionList>
    </Card>
  );
}
