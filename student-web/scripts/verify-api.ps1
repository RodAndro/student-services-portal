$ProgressPreference = 'SilentlyContinue'
$base = 'http://localhost:5173/api/v1'

function Call($method, $path, $body, $token) {
    $headers = @{ Accept = 'application/json' }
    if ($token) { $headers['Authorization'] = "Bearer $token" }
    try {
        $p = @{ Method = $method; Uri = "$base$path"; Headers = $headers; UseBasicParsing = $true }
        if ($body -ne $null) { $p['ContentType'] = 'application/json'; $p['Body'] = ($body | ConvertTo-Json -Compress) }
        $r = Invoke-WebRequest @p
        $o = $null
        try { $o = $r.Content | ConvertFrom-Json } catch {}
        return @{ code = [int]$r.StatusCode; obj = $o; raw = $r.Content }
    } catch {
        $c = 0
        $o = $null
        $raw = ""
        if ($_.Exception.Response) {
            $c = [int]$_.Exception.Response.StatusCode
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $raw = $reader.ReadToEnd()
                $o = $raw | ConvertFrom-Json
            } catch {}
        }
        return @{ code = $c; obj = $o; raw = $raw }
    }
}

$global:res = @()
function Check($area, $test, $expected, $actual, $fix = "") {
    $global:res += [pscustomobject]@{
        Feature = $area; Test = $test; Expected = $expected; Actual = $actual
        Status = $(if ($expected -eq $actual) { "PASS" } else { "FAIL" }); Fix = $fix
    }
}

$ts = [int](Get-Date -UFormat %s)
$admin = (Call 'POST' '/auth/login' @{ email = 'admin@example.com'; password = 'password' } $null).obj.data.token
$registrar = (Call 'POST' '/auth/login' @{ email = 'registrar@example.com'; password = 'password' } $null).obj.data.token
$instructor = (Call 'POST' '/auth/login' @{ email = 'instructor@example.com'; password = 'password' } $null).obj.data.token
$instructor2 = (Call 'POST' '/auth/login' @{ email = 'instructor2@example.com'; password = 'password' } $null).obj.data.token
$student = (Call 'POST' '/auth/login' @{ email = 'student@example.com'; password = 'password' } $null).obj.data.token

$programId = (Call 'GET' '/programs?per_page=1' $null $admin).obj.data[0].id
$courseId = (Call 'GET' '/courses?per_page=1' $null $admin).obj.data[0].id
$termId = (Call 'GET' '/academic-terms?per_page=1' $null $admin).obj.data[0].id

# ============================== AUTHENTICATION ==============================
$login = Call 'POST' '/auth/login' @{ email = 'admin@example.com'; password = 'password' } $null
Check 'Authentication' 'successful login -> 200' 200 $login.code
Check 'Authentication' 'login returns token + user' $true ($null -ne $login.obj.data.token -and $null -ne $login.obj.data.user.email)
Check 'Authentication' 'password never returned' $true ($null -eq $login.obj.data.user.password)
Check 'Authentication' 'invalid password -> 422' 422 (Call 'POST' '/auth/login' @{ email = 'admin@example.com'; password = 'bad' } $null).code
Check 'Authentication' 'unknown email -> 422' 422 (Call 'POST' '/auth/login' @{ email = 'nobody@example.com'; password = 'password' } $null).code
Check 'Authentication' 'missing password -> 422' 422 (Call 'POST' '/auth/login' @{ email = 'admin@example.com' } $null).code
Check 'Authentication' 'protected route without token -> 401' 401 (Call 'GET' '/students' $null $null).code
Check 'Authentication' 'protected route with bad token -> 401' 401 (Call 'GET' '/students' $null 'not-a-token').code
Check 'Authentication' 'session persistence (me) -> 200' 200 (Call 'GET' '/auth/me' $null $admin).code
Check 'Authentication' 'logout -> 200' 200 (Call 'POST' '/auth/logout' $null $registrar).code
Check 'Authentication' 'logout revokes the token -> 401' 401 (Call 'GET' '/auth/me' $null $registrar).code
Check 'Authentication' '401 body uses the envelope' $false (Call 'GET' '/auth/me' $null $null).obj.success

# ================================ STUDENTS =================================
$list = Call 'GET' '/students?per_page=5' $null $admin
Check 'Students' 'list -> 200' 200 $list.code
Check 'Students' 'list meta has total and last_page' $true ($null -ne $list.obj.meta.total -and $null -ne $list.obj.meta.last_page)
Check 'Students' 'search by name -> 200' 200 (Call 'GET' '/students?search=a' $null $admin).code
Check 'Students' 'search with % does not 500' 200 (Call 'GET' '/students?search=%25' $null $admin).code
Check 'Students' 'search with quote does not 500' 200 (Call 'GET' "/students?search=%27" $null $admin).code
Check 'Students' 'filter program_id -> 200' 200 (Call 'GET' "/students?program_id=$programId" $null $admin).code
Check 'Students' 'filter year_level -> 200' 200 (Call 'GET' '/students?year_level=2' $null $admin).code
Check 'Students' 'filter status -> 200' 200 (Call 'GET' '/students?status=ACTIVE' $null $admin).code
Check 'Students' 'pagination page 2 -> current_page 2' 2 (Call 'GET' '/students?page=2&per_page=5' $null $admin).obj.meta.current_page
Check 'Students' 'per_page capped at 100' 100 (Call 'GET' '/students?per_page=500' $null $admin).obj.meta.per_page
Check 'Students' 'sort by last_name desc -> 200' 200 (Call 'GET' '/students?sort=last_name&direction=desc' $null $admin).code
Check 'Students' 'unknown sort falls back (no error)' 200 (Call 'GET' '/students?sort=nope' $null $admin).code
Check 'Students' 'sort direction bogus -> 200' 200 (Call 'GET' '/students?sort=last_name&direction=sideways' $null $admin).code

$created = Call 'POST' '/students' @{ student_number = "QA$ts"; first_name = 'QA'; middle_name = 'Test'; last_name = 'Student'; birth_date = '2004-01-01'; email = "qa$ts@example.com"; program_id = $programId; year_level = 1; status = 'ACTIVE' } $admin
Check 'Students' 'create -> 201' 201 $created.code
Check 'Students' 'create message from API' 'Student created successfully.' $created.obj.message
$studentId = $created.obj.data.id
Check 'Students' 'edit -> 200' 200 (Call 'PUT' "/students/$studentId" @{ year_level = 3 } $admin).code
Check 'Students' 'edit persisted -> year_level 3' 3 (Call 'GET' "/students/$studentId" $null $admin).obj.data.year_level
Check 'Students' 'duplicate number -> 422' 422 (Call 'POST' '/students' @{ student_number = "QA$ts"; first_name = 'D'; last_name = 'S'; program_id = $programId; year_level = 1; status = 'ACTIVE' } $admin).code
Check 'Students' 'invalid year_level -> 422' 422 (Call 'POST' '/students' @{ student_number = "QB$ts"; first_name = 'B'; last_name = 'Y'; program_id = $programId; year_level = 9; status = 'ACTIVE' } $admin).code
Check 'Students' 'unknown program -> 422' 422 (Call 'POST' '/students' @{ student_number = "QC$ts"; first_name = 'B'; last_name = 'P'; program_id = 999999; year_level = 1; status = 'ACTIVE' } $admin).code
Check 'Students' 'future birth date -> 422' 422 (Call 'POST' '/students' @{ student_number = "QD$ts"; first_name = 'B'; last_name = 'D'; birth_date = '2099-01-01'; program_id = $programId; year_level = 1; status = 'ACTIVE' } $admin).code
Check 'Students' 'invalid email -> 422' 422 (Call 'POST' '/students' @{ student_number = "QE$ts"; first_name = 'B'; last_name = 'E'; email = 'nope'; program_id = $programId; year_level = 1; status = 'ACTIVE' } $admin).code
Check 'Students' 'invalid status -> 422' 422 (Call 'POST' '/students' @{ student_number = "QF$ts"; first_name = 'B'; last_name = 'S'; program_id = $programId; year_level = 1; status = 'WOBBLY' } $admin).code
Check 'Students' 'deactivate -> 200' 200 (Call 'PUT' "/students/$studentId" @{ status = 'INACTIVE' } $admin).code
Check 'Students' 'deactivated status persisted' 'INACTIVE' (Call 'GET' "/students/$studentId" $null $admin).obj.data.status
Check 'Students' 'reactivate -> 200' 200 (Call 'PUT' "/students/$studentId" @{ status = 'ACTIVE' } $admin).code
Check 'Students' 'not found -> 404' 404 (Call 'GET' '/students/999999' $null $admin).code
Check 'Students' 'delete -> 200' 200 (Call 'DELETE' "/students/$studentId" $null $admin).code
Check 'Students' 'deleted -> 404' 404 (Call 'GET' "/students/$studentId" $null $admin).code
$enrolled = (Call 'GET' '/enrollments?per_page=1' $null $admin).obj.data[0].student_id
Check 'Students' 'delete with enrollments -> 409' 409 (Call 'DELETE' "/students/$enrolled" $null $admin).code

# ================================= PROGRAMS ================================
$p = Call 'POST' '/programs' @{ code = "PG$ts"; name = 'QA Program'; description = 'x'; status = 'ACTIVE' } $admin
Check 'Programs' 'create -> 201' 201 $p.code
Check 'Programs' 'list/search -> 200' 200 (Call 'GET' "/programs?search=QA%20Program" $null $admin).code
Check 'Programs' 'update -> 200' 200 (Call 'PUT' "/programs/$($p.obj.data.id)" @{ name = 'QA Program 2' } $admin).code
Check 'Programs' 'duplicate code -> 422' 422 (Call 'POST' '/programs' @{ code = "PG$ts"; name = 'D'; status = 'ACTIVE' } $admin).code
Check 'Programs' 'invalid status -> 422' 422 (Call 'POST' '/programs' @{ code = "PH$ts"; name = 'D'; status = 'X' } $admin).code
Check 'Programs' 'not found -> 404' 404 (Call 'GET' '/programs/999999' $null $admin).code
Check 'Programs' 'delete -> 200' 200 (Call 'DELETE' "/programs/$($p.obj.data.id)" $null $admin).code
Check 'Programs' 'delete in use -> 409' 409 (Call 'DELETE' "/programs/$programId" $null $admin).code

# ================================== COURSES ================================
$c = Call 'POST' '/courses' @{ course_code = "CG$ts"; course_title = 'QA Course'; units = 3; status = 'ACTIVE' } $admin
Check 'Courses' 'create -> 201' 201 $c.code
Check 'Courses' 'list/search -> 200' 200 (Call 'GET' '/courses?search=QA' $null $admin).code
Check 'Courses' 'update -> 200' 200 (Call 'PUT' "/courses/$($c.obj.data.id)" @{ units = 4 } $admin).code
Check 'Courses' 'duplicate code -> 422' 422 (Call 'POST' '/courses' @{ course_code = "CG$ts"; course_title = 'D'; units = 3; status = 'ACTIVE' } $admin).code
Check 'Courses' 'units 0 -> 422' 422 (Call 'POST' '/courses' @{ course_code = "CH$ts"; course_title = 'D'; units = 0; status = 'ACTIVE' } $admin).code
Check 'Courses' 'units 13 -> 422' 422 (Call 'POST' '/courses' @{ course_code = "CI$ts"; course_title = 'D'; units = 13; status = 'ACTIVE' } $admin).code
Check 'Courses' 'delete -> 200' 200 (Call 'DELETE' "/courses/$($c.obj.data.id)" $null $admin).code

# ============================== ACADEMIC TERMS =============================
$t = Call 'POST' '/academic-terms' @{ academic_year = "TG-$ts"; semester = 1; start_date = '2027-08-01'; end_date = '2027-12-15'; status = 'UPCOMING' } $admin
Check 'Academic Terms' 'create (UPCOMING) -> 201' 201 $t.code
Check 'Academic Terms' 'list/search -> 200' 200 (Call 'GET' '/academic-terms?search=TG' $null $admin).code
Check 'Academic Terms' 'filter semester -> 200' 200 (Call 'GET' '/academic-terms?semester=1' $null $admin).code
Check 'Academic Terms' 'update -> 200' 200 (Call 'PUT' "/academic-terms/$($t.obj.data.id)" @{ status = 'ACTIVE' } $admin).code
Check 'Academic Terms' 'duplicate year+semester -> 422' 422 (Call 'POST' '/academic-terms' @{ academic_year = "TG-$ts"; semester = 1; start_date = '2027-08-01'; end_date = '2027-12-15'; status = 'ACTIVE' } $admin).code
Check 'Academic Terms' 'semester 9 -> 422' 422 (Call 'POST' '/academic-terms' @{ academic_year = "TH-$ts"; semester = 9; start_date = '2027-08-01'; end_date = '2027-12-15'; status = 'ACTIVE' } $admin).code
Check 'Academic Terms' 'end before start -> 422' 422 (Call 'POST' '/academic-terms' @{ academic_year = "TI-$ts"; semester = 2; start_date = '2027-12-01'; end_date = '2027-08-01'; status = 'ACTIVE' } $admin).code
Check 'Academic Terms' 'delete -> 200' 200 (Call 'DELETE' "/academic-terms/$($t.obj.data.id)" $null $admin).code

# ============================= COURSE OFFERINGS ============================
$o = Call 'POST' '/course-offerings' @{ course_id = $courseId; academic_term_id = $termId; instructor_id = 3; section = "OG$ts"; schedule = 'MWF 08:00'; room = 'R1'; capacity = 2; status = 'ACTIVE' } $admin
Check 'Course Offerings' 'create -> 201' 201 $o.code
Check 'Course Offerings' 'instructor must have instructor role -> 422' 422 (Call 'POST' '/course-offerings' @{ course_id = $courseId; academic_term_id = $termId; instructor_id = 1; section = 'X'; schedule = 'T'; capacity = 5; status = 'ACTIVE' } $admin).code
Check 'Course Offerings' 'capacity 0 -> 422' 422 (Call 'POST' '/course-offerings' @{ course_id = $courseId; academic_term_id = $termId; instructor_id = 3; section = 'X'; schedule = 'T'; capacity = 0; status = 'ACTIVE' } $admin).code
Check 'Course Offerings' 'list/search/filter -> 200' 200 (Call 'GET' "/course-offerings?academic_term_id=$termId" $null $admin).code
Check 'Course Offerings' 'update -> 200' 200 (Call 'PUT' "/course-offerings/$($o.obj.data.id)" @{ room = 'R2' } $admin).code
$offeringId = $o.obj.data.id
Check 'Course Offerings' 'show -> 200' 200 (Call 'GET' "/course-offerings/$offeringId" $null $admin).code
Check 'Course Offerings' 'class list -> 200' 200 (Call 'GET' "/course-offerings/$offeringId/students" $null $admin).code
Check 'Course Offerings' 'not found -> 404' 404 (Call 'GET' '/course-offerings/999999' $null $admin).code

# ================================ ENROLLMENTS ==============================
$studentA = (Call 'GET' '/students?per_page=1&page=1' $null $admin).obj.data[0].id
$studentB = (Call 'GET' '/students?per_page=1&page=3' $null $admin).obj.data[0].id
$e = Call 'POST' '/enrollments' @{ student_id = $studentA; course_offering_id = $offeringId } $admin
Check 'Enrollments' 'successful enrollment -> 201' 201 $e.code
Check 'Enrollments' 'duplicate enrollment -> 409' 409 (Call 'POST' '/enrollments' @{ student_id = $studentA; course_offering_id = $offeringId } $admin).code
Check 'Enrollments' 'invalid student -> 422' 422 (Call 'POST' '/enrollments' @{ student_id = 999999; course_offering_id = $offeringId } $admin).code
Check 'Enrollments' 'invalid offering -> 422' 422 (Call 'POST' '/enrollments' @{ student_id = $studentA; course_offering_id = 999999 } $admin).code
$e2 = Call 'POST' '/enrollments' @{ student_id = $studentB; course_offering_id = $offeringId } $admin
Check 'Enrollments' 'second enrollment fills capacity -> 201' 201 $e2.code
$studentC = (Call 'GET' '/students?per_page=1&page=4' $null $admin).obj.data[0].id
Check 'Enrollments' 'over capacity -> 409' 409 (Call 'POST' '/enrollments' @{ student_id = $studentC; course_offering_id = $offeringId } $admin).code
Check 'Enrollments' 'update status -> 200' 200 (Call 'PATCH' "/enrollments/$($e.obj.data.id)" @{ status = 'COMPLETED' } $admin).code
Check 'Enrollments' 'not found -> 404' 404 (Call 'GET' '/enrollments/999999' $null $admin).code
Check 'Enrollments' 'unauthorized create as student -> 403' 403 (Call 'POST' '/enrollments' @{ student_id = $studentC; course_offering_id = $offeringId } $student).code
Check 'Enrollments' 'unauthorized create as instructor -> 403' 403 (Call 'POST' '/enrollments' @{ student_id = $studentC; course_offering_id = $offeringId } $instructor).code
Check 'Enrollments' 'list filter by offering -> 200' 200 (Call 'GET' "/enrollments?course_offering_id=$offeringId" $null $admin).code

# =================================== GRADES ================================
$g = Call 'POST' '/grades' @{ enrollment_id = $e.obj.data.id; midterm_grade = 88; final_grade = 90 } $admin
Check 'Grades' 'authorized entry -> 201' 201 $g.code
Check 'Grades' 'remarks PASSED at 90' 'PASSED' $g.obj.data.remarks
Check 'Grades' 'second grade -> 409' 409 (Call 'POST' '/grades' @{ enrollment_id = $e.obj.data.id; final_grade = 80 } $admin).code
Check 'Grades' 'invalid grade 150 -> 422' 422 (Call 'POST' '/grades' @{ enrollment_id = $e2.obj.data.id; final_grade = 150 } $admin).code
Check 'Grades' 'negative grade -> 422' 422 (Call 'POST' '/grades' @{ enrollment_id = $e2.obj.data.id; midterm_grade = -5 } $admin).code
Check 'Grades' 'invalid enrollment -> 422' 422 (Call 'POST' '/grades' @{ enrollment_id = 999999; final_grade = 80 } $admin).code
$gBoundary = Call 'POST' '/grades' @{ enrollment_id = $e2.obj.data.id; final_grade = 75 } $admin
Check 'Grades' 'boundary 75 -> PASSED' 'PASSED' $gBoundary.obj.data.remarks
Check 'Grades' 'update -> 200' 200 (Call 'PUT' "/grades/$($g.obj.data.id)" @{ final_grade = 74.99 } $admin).code
Check 'Grades' 'remarks recomputed FAILED' 'FAILED' (Call 'GET' "/grades/$($g.obj.data.id)" $null $admin).obj.data.remarks
Check 'Grades' 'no delete endpoint -> 405' 405 (Call 'DELETE' "/grades/$($g.obj.data.id)" $null $admin).code
Check 'Grades' 'unauthorized entry as student -> 403' 403 (Call 'POST' '/grades' @{ enrollment_id = $e2.obj.data.id; final_grade = 99 } $student).code
Check 'Grades' 'student cannot list grades -> 403' 403 (Call 'GET' '/grades' $null $student).code
Check 'Grades' 'owning instructor may grade -> 201 or 409' $true ((Call 'POST' '/grades' @{ enrollment_id = $e2.obj.data.id; final_grade = 80 } $instructor).code -in @(201, 409))
Check 'Grades' 'other instructor refused -> 403' 403 (Call 'PUT' "/grades/$($gBoundary.obj.data.id)" @{ final_grade = 99 } $instructor2).code

# ============================== ACADEMIC RECORD ============================
$rec = Call 'GET' "/students/$studentA/academic-record" $null $admin
Check 'Academic Record' 'loads -> 200' 200 $rec.code
Check 'Academic Record' 'payload has student' $true ($null -ne $rec.obj.data.student.student_number)
Check 'Academic Record' 'grouped by term' $true ($rec.obj.data.academic_record.Count -ge 1)
Check 'Academic Record' 'entry has course + grade fields' $true ($null -ne $rec.obj.data.academic_record[0].enrollments[0].course.course_code)
Check 'Academic Record' 'student reads own -> 200' 200 (Call 'GET' '/students/1/academic-record' $null $student).code
Check 'Academic Record' 'student reads other -> 403' 403 (Call 'GET' '/students/2/academic-record' $null $student).code

# ================================= ROUTING ==================================
Check 'Routing' 'unknown student id -> 404 (not 500)' 404 (Call 'GET' '/students/999999' $null $admin).code
Check 'Routing' 'student enrollments tab -> 200' 200 (Call 'GET' "/students/$studentA/enrollments" $null $admin).code
Check 'Routing' 'student grades tab -> 200' 200 (Call 'GET' "/students/$studentA/grades" $null $admin).code
Check 'Routing' 'ping (login connection check) -> 200' 200 (Call 'GET' '/ping' $null $null).code

# SPA deep links are served by Vite, not by the API, so request them directly.
function ServesSpa($path) {
    try {
        $r = Invoke-WebRequest -Method GET -Uri "http://localhost:5173$path" -UseBasicParsing
        return "$([int]$r.StatusCode):$($r.Content -match 'id=""root""')"
    } catch { return "0" }
}
foreach ($deep in @('/', '/students', '/students/12/edit', '/portal/academic-record', '/does-not-exist')) {
    Check 'Routing' "deep link $deep serves the SPA shell" '200:True' (ServesSpa $deep)
}

# ============================== ROLE RESTRICTIONS ==========================
foreach ($endpoint in @('/students', '/programs', '/courses', '/academic-terms', '/course-offerings', '/enrollments', '/grades')) {
    Check 'Roles' "student refused on $endpoint -> 403" 403 (Call 'GET' "$endpoint`?per_page=1" $null $student).code
}
Check 'Roles' 'instructor refused on /students -> 403' 403 (Call 'GET' '/students' $null $instructor).code
Check 'Roles' 'instructor may read /programs -> 200' 200 (Call 'GET' '/programs?per_page=1' $null $instructor).code
Check 'Roles' 'instructor may read /courses -> 200' 200 (Call 'GET' '/courses?per_page=1' $null $instructor).code
Check 'Roles' 'instructor may read /academic-terms -> 200' 200 (Call 'GET' '/academic-terms?per_page=1' $null $instructor).code
$instructorId = (Call 'GET' '/auth/me' $null $instructor).obj.data.id
$instructorEnrollments = (Call 'GET' '/enrollments?per_page=100' $null $instructor).obj
Check 'Roles' 'instructor may list /enrollments (own only) -> 200' 200 (Call 'GET' '/enrollments?per_page=1' $null $instructor).code
$foreign = @($instructorEnrollments.data | Where-Object { $_.course_offering.instructor_id -ne $instructorId }).Count
Check 'Roles' 'every instructor enrollment belongs to their own offering' 0 $foreign
$adminTotal = (Call 'GET' '/enrollments?per_page=1' $null $admin).obj.meta.total
$instructorTotal = (Call 'GET' '/enrollments?per_page=1' $null $instructor).obj.meta.total
Check 'Roles' 'instructor sees fewer enrollments than admin' $true ($instructorTotal -le $adminTotal)
$registrarFresh = (Call 'POST' '/auth/login' @{ email = 'registrar@example.com'; password = 'password' } $null).obj.data.token
Check 'Roles' 'registrar may read /students -> 200' 200 (Call 'GET' '/students?per_page=1' $null $registrarFresh).code
$instructorGrades = (Call 'GET' '/grades?per_page=100' $null $instructor).obj
$foreignGrades = @($instructorGrades.data | Where-Object { $_.enrollment.course_offering.instructor_id -ne $instructorId }).Count
Check 'Roles' 'every instructor grade belongs to their own offering' 0 $foreignGrades

$global:res | Format-Table -AutoSize | Out-String -Width 190
$pass = @($global:res | Where-Object { $_.Status -eq 'PASS' }).Count
$fail = @($global:res | Where-Object { $_.Status -eq 'FAIL' }).Count
"TOTAL=$($global:res.Count) PASS=$pass FAIL=$fail"
"---- failures ----"
$global:res | Where-Object { $_.Status -eq 'FAIL' } | Format-Table -AutoSize | Out-String -Width 190
