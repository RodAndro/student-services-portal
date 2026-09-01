interface Student {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive";
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

function formatStudent(student: Student): string {
  return `Student ID: ${student.id}\nName: ${student.name}\nEmail: ${student.email}\nStatus: ${student.status}`;
}

function formatStudentStatus(status: Student["status"] | string): string {
  switch (status) {
    case "active":
      return "Active Student";
    case "inactive":
      return "Inactive Student";
    default:
      return "Unknown Status";
  }
}

function isValidStudent(value: unknown): value is Student {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const student = value as Record<string, unknown>;

  return (
    typeof student.id === "number" &&
    typeof student.name === "string" &&
    typeof student.email === "string" &&
    (student.status === "active" || student.status === "inactive")
  );
}

const sampleStudent: Student = {
  id: 101,
  name: "Aisha Patel",
  email: "aisha.patel@example.com",
  status: "active"
};

const singleStudentResponse: ApiResponse<Student> = {
  success: true,
  data: sampleStudent
};

const studentListResponse: ApiResponse<Student[]> = {
  success: true,
  data: [
    sampleStudent,
    {
      id: 102,
      name: "Daniel Kim",
      email: "daniel.kim@example.com",
      status: "inactive"
    }
  ]
};

const validStudentObject = {
  id: 103,
  name: "Priya Shah",
  email: "priya.shah@example.com",
  status: "active" as const
};

const invalidStudentObjectWithWrongId = {
  id: "104",
  name: "Sam Lee",
  email: "sam.lee@example.com",
  status: "active" as const
};

const invalidStudentObjectMissingName = {
  id: 105,
  email: "noah@example.com",
  status: "active" as const
};

console.log("Formatted student:\n" + formatStudent(sampleStudent));
console.log("Status label for active:", formatStudentStatus("active"));
console.log("Status label for inactive:", formatStudentStatus("inactive"));
console.log("Status label for invalid:", formatStudentStatus("suspended"));
console.log("Single student response:", singleStudentResponse);
console.log("Student list response:", studentListResponse);
console.log("Valid object check:", isValidStudent(validStudentObject));
console.log("Invalid id check:", isValidStudent(invalidStudentObjectWithWrongId));
console.log("Missing name check:", isValidStudent(invalidStudentObjectMissingName));
