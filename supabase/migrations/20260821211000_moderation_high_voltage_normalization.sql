-- Preserve blocked high-voltage detection across common Arabic inflections.
create or replace function public.assess_gig_moderation(p_title text, p_description text, p_category text)
returns table (risk public.gig_moderation_risk, matches text[])
language plpgsql stable security definer set search_path = '' as $$
declare content text := public.normalize_safety_text(concat_ws(' ', p_title, p_description, p_category));
declare blocked_rules text[] := '{}'; declare review_rules text[] := '{}';
begin
  if content ~ '(جهد عال[ي]?|كهرباء.*عال[ي]?|اسلاك مكشوفة|متفجرات|تفجير|مواد متفجرة|high voltage|live wire|explosives)' then blocked_rules := array_append(blocked_rules, 'critical_electrical_or_explosive'); end if;
  if content ~ '(هدم ثقيل|حفريات عميقة|ماكينة خطرة|منشار صناعي|heavy construction|dangerous machinery)' then blocked_rules := array_append(blocked_rules, 'heavy_construction_or_machinery'); end if;
  if content ~ '(سقالة|ارتفاع|سطح مرتفع|تسلق|رافعة|غاز|كهرباء|آلة ثقيلة|معدات ثقيلة|high altitude|scaffold|crane)' then review_rules := array_append(review_rules, 'height_energy_or_heavy_equipment'); end if;
  if cardinality(blocked_rules) > 0 then return query select 'blocked'::public.gig_moderation_risk, blocked_rules; return; end if;
  if cardinality(review_rules) > 0 then return query select 'review'::public.gig_moderation_risk, review_rules; return; end if;
  return query select 'safe'::public.gig_moderation_risk, '{}'::text[];
end;
$$;
revoke execute on function public.assess_gig_moderation(text, text, text) from public, anon, authenticated;
