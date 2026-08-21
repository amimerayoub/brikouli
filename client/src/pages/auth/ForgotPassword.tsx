import { useState } from "react";
import { Link } from "wouter";
import { AuthFeedback, AuthFrame } from "./AuthFrame";
import { sendPasswordReset } from "@/lib/api/auth";

export default function ForgotPassword() { const [loading, setLoading] = useState(false); const [message, setMessage] = useState<string>(); const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); setLoading(true); const form = new FormData(event.currentTarget); const result = await sendPasswordReset(String(form.get("email") ?? "")); setLoading(false); setMessage(result.message); }; return <AuthFrame title="استعادة كلمة المرور" description="أدخل بريدك وسنرسل رابطاً آمناً لاستعادة الوصول."><form className="auth-form" onSubmit={submit}><label>البريد الإلكتروني<input name="email" type="email" autoComplete="email" required placeholder="name@example.com" /></label><AuthFeedback message={message} tone="success" /><button className="primary-cta auth-submit" disabled={loading}>{loading ? "جارٍ الإرسال…" : "إرسال رابط الاستعادة"}</button></form><p className="auth-footnote"><Link href="/login">العودة لتسجيل الدخول</Link></p></AuthFrame>; }
