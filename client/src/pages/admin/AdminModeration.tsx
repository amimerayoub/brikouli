import { AdminShell } from "@/components/admin/AdminShell";
import { AdminGigBoard } from "./AdminGigs";
export default function AdminModeration() { return <AdminShell title="طابور السلامة" description="فرص تحتاج مراجعة بشرية بعد محرك السلامة العربي."><AdminGigBoard moderationOnly /></AdminShell>; }
