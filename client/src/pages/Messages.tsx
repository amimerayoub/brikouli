import { MessageCircle } from "lucide-react";
import { AppShell, PageHeading } from "@/components/phase3/AppShell";
import { EmptyState } from "@/components/phase3/EmptyState";
export default function Messages() { return <AppShell><section className="phase-section messages-page"><PageHeading eyebrow="الرسائل" title="مساحة التواصل" /><EmptyState icon={<MessageCircle size={28} />} title="لا توجد رسائل" description="ستتوفر المحادثات بعد تحديد تجربة الرسائل وحمايتها في مرحلة لاحقة." /></section></AppShell>; }

