import { useEffect } from "react";
import { useLocation } from "wouter";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { AuthFrame } from "./AuthFrame";

export default function ProtectedPlaceholder({ label }: { label: string }) { const { loading, isAuthenticated } = useSupabaseSession(); const [, setLocation] = useLocation(); useEffect(() => { if (!loading && !isAuthenticated) setLocation("/login"); }, [isAuthenticated, loading, setLocation]); if (loading) return <AuthFrame title="جارٍ التحقق" description="نراجع جلستك الآمنة."><div className="auth-guard"><LoaderCircle className="animate-spin" size={24} /></div></AuthFrame>; if (!isAuthenticated) return null; return <AuthFrame title={label} description="تم التحقق من الجلسة. ستصل واجهة هذا القسم في مرحلة لاحقة."><div className="auth-guard"><LockKeyhole size={25} /><p>هذه الصفحة محمية ولا تعرض أي بيانات قبل اكتمال خصائصها.</p></div></AuthFrame>; }
