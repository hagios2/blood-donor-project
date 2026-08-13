-- SMS notification support: two SECURITY DEFINER read functions that expose
-- only the minimum contact info needed to notify genuinely matching people,
-- each gated by an ownership check so they can't be used to harvest phone
-- numbers arbitrarily.

-- 1. Called right after a hospital creates a request: returns phone/name for
--    eligible matching donors and nearby hospitals with matching surplus stock.
create or replace function get_notification_targets(p_request_id uuid)
returns table (phone text, name text, kind text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request blood_requests;
begin
  select * into v_request from blood_requests where id = p_request_id;

  if v_request.hospital_id <> auth.uid() then
    raise exception 'Only the requesting hospital may fetch notification targets';
  end if;

  return query
    select p.phone, p.name, 'donor'::text as kind
    from donor_profiles dp
    join profiles p on p.id = dp.user_id
    where p.region = v_request.region
      and dp.blood_type = v_request.blood_type
      and (dp.last_donation_date is null
           or dp.last_donation_date <= current_date - interval '56 days')
      and p.phone is not null
    union all
    select p.phone, p.name, 'hospital'::text as kind
    from hospital_stock hs
    join hospitals h on h.user_id = hs.hospital_id
    join profiles p on p.id = h.user_id
    where p.region = v_request.region
      and hs.blood_type = v_request.blood_type
      and hs.units_available > 0
      and hs.hospital_id <> v_request.hospital_id
      and p.phone is not null;
end;
$$;

-- 2. Called right after accept_response(): returns just enough info to text
--    the responder that their offer was accepted.
create or replace function get_response_notification_info(p_response_id uuid)
returns table (
  responder_phone text,
  responder_name text,
  responder_type text,
  hospital_name text,
  blood_type text,
  units_offered int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hospital_id uuid;
begin
  select br.hospital_id into v_hospital_id
    from responses r join blood_requests br on br.id = r.request_id
    where r.id = p_response_id;

  if v_hospital_id <> auth.uid() then
    raise exception 'Only the requesting hospital may fetch response notification info';
  end if;

  return query
    select rp.phone, rp.name, r.responder_type, hp.name, br.blood_type, r.units_offered
    from responses r
    join blood_requests br on br.id = r.request_id
    join profiles rp on rp.id = r.responder_id
    join profiles hp on hp.id = br.hospital_id
    where r.id = p_response_id;
end;
$$;
