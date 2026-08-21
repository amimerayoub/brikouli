import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AuthFeedback, AuthFrame } from "./AuthFrame";
import { signInWithEmail } from "@/lib/api/auth";

export default function Login() {
  const [, setLocation] = useLocation(); const [loading, setLoading] = useState(false); const [message, setMessage] = useState<string>();
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); setLoading(true); setMessage(undefined); const result = await signInWithEmail(String(form.get("email") ?? ""), String(form.get("password") ?? "")); setLoading(false); if (result.success) setLocation("/"); else setMessage(result.message); };
  return <AuthFrame title="أهلاً بعودتك" description="سجّل دخولك لتتابع فرصك القريبة بأمان."><form className="auth-form" onSubmit={submit}><label>البريد الإلكتروني<input name="email" type="email" autoComplete="email" required placeholder="name@example.com" /></label><label>كلمة المرور<input name="password" type="password" autoComplete="current-password" required minLength={8} placeholder="••••••••" /></label><Link href="/forgot-password" className="auth-inline-link">نسيت كلمة المرور؟</Link><AuthFeedback message={message} /><button className="primary-cta auth-submit" disabled={loading}>{loading ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}</button></form><p className="auth-footnote">ما عندك حساب؟ <Link href="/register">أنشئ حسابك</Link></p><Link href="/verify-otp" className="auth-secondary-link">الدخول برمز الهاتف</Link></AuthFrame>;
}
