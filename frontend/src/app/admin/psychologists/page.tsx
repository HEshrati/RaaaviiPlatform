import { redirect } from "next/navigation";

// همهٔ تأییدها در پنل واحد حرفه‌ای‌ها انجام می‌شود.
export default function AdminPsychologistsRedirect() {
  redirect("/admin/professionals");
}
