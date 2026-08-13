-- BloodLink initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

-- 1. profiles: extends auth.users with app-specific fields
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('donor', 'hospital')),
  name text not null,
  phone text,
  region text not null,
  created_at timestamptz not null default now()
);

-- public-safe view: never exposes phone/email
create view profiles_public as
  select id, name, region, role from profiles;

-- 2. donor_profiles: donor-specific fields
create table donor_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  blood_type text not null check (blood_type in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  last_donation_date date
);

-- 3. hospitals: hospital-specific fields
create table hospitals (
  user_id uuid primary key references profiles(id) on delete cascade,
  address text not null
);

-- 4. hospital_stock: per-hospital, per-type unit count
create table hospital_stock (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(user_id) on delete cascade,
  blood_type text not null check (blood_type in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_available int not null default 0 check (units_available >= 0),
  unique (hospital_id, blood_type)
);

-- 5. blood_requests
create table blood_requests (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(user_id) on delete cascade,
  blood_type text not null check (blood_type in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_needed int not null check (units_needed > 0),
  units_fulfilled int not null default 0 check (units_fulfilled >= 0),
  urgency text not null check (urgency in ('low','medium','high','critical')),
  region text not null,
  status text not null default 'open' check (status in ('open','fulfilled','cancelled')),
  created_at timestamptz not null default now()
);

-- 6. responses
create table responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references blood_requests(id) on delete cascade,
  responder_type text not null check (responder_type in ('donor','hospital')),
  responder_id uuid not null references profiles(id) on delete cascade,
  units_offered int not null check (units_offered > 0),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','expired')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table donor_profiles enable row level security;
alter table hospitals enable row level security;
alter table hospital_stock enable row level security;
alter table blood_requests enable row level security;
alter table responses enable row level security;

-- profiles: owner-only full row (phone/email are sensitive)
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
-- profiles_public view is granted below, readable by any authenticated user

-- donor_profiles: owner-only
create policy "donor_profiles_select_own" on donor_profiles for select using (auth.uid() = user_id);
create policy "donor_profiles_insert_own" on donor_profiles for insert with check (auth.uid() = user_id);
create policy "donor_profiles_update_own" on donor_profiles for update using (auth.uid() = user_id);

-- hospitals: owner-only for full row; name/region already public via profiles_public
create policy "hospitals_select_own" on hospitals for select using (auth.uid() = user_id);
create policy "hospitals_insert_own" on hospitals for insert with check (auth.uid() = user_id);
create policy "hospitals_update_own" on hospitals for update using (auth.uid() = user_id);

-- hospital_stock: any authenticated user can read (needed to match surplus); only owner can write
create policy "hospital_stock_select_authenticated" on hospital_stock for select using (auth.role() = 'authenticated');
create policy "hospital_stock_insert_own" on hospital_stock for insert with check (auth.uid() = hospital_id);
create policy "hospital_stock_update_own" on hospital_stock for update using (auth.uid() = hospital_id);

-- blood_requests: any authenticated user can read (needed to browse open requests); only owning hospital can write
create policy "blood_requests_select_authenticated" on blood_requests for select using (auth.role() = 'authenticated');
create policy "blood_requests_insert_own" on blood_requests for insert with check (auth.uid() = hospital_id);
create policy "blood_requests_update_own" on blood_requests for update using (auth.uid() = hospital_id);

-- responses: visible to the responder, or to the hospital that owns the parent request
create policy "responses_select_participants" on responses for select using (
  auth.uid() = responder_id
  or auth.uid() in (select hospital_id from blood_requests where blood_requests.id = responses.request_id)
);
create policy "responses_insert_own" on responses for insert with check (auth.uid() = responder_id);
-- no direct update policy: status changes (accept/reject) go through the accept_response()/reject_response() RPCs below

grant select on profiles_public to authenticated;

-- ============================================================
-- Atomic accept-response RPC (prevents concurrent over-fulfillment)
-- ============================================================
create or replace function accept_response(p_response_id uuid)
returns blood_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_response responses;
  v_request blood_requests;
  v_stock hospital_stock;
begin
  -- lock the parent request row first to serialize concurrent accepts
  select * into v_request from blood_requests where id = (
    select request_id from responses where id = p_response_id
  ) for update;

  if v_request.status <> 'open' then
    raise exception 'Request is not open';
  end if;

  select * into v_response from responses where id = p_response_id;

  if v_response.status <> 'pending' then
    raise exception 'Response is not pending';
  end if;

  if v_request.hospital_id <> auth.uid() then
    raise exception 'Only the requesting hospital may accept a response';
  end if;

  if v_response.responder_type = 'hospital' then
    select * into v_stock from hospital_stock
      where hospital_id = v_response.responder_id and blood_type = v_request.blood_type
      for update;
    if v_stock.units_available < v_response.units_offered then
      raise exception 'Responding hospital no longer has enough stock';
    end if;
    update hospital_stock set units_available = units_available - v_response.units_offered
      where id = v_stock.id;
  else
    update donor_profiles set last_donation_date = current_date
      where user_id = v_response.responder_id;
  end if;

  update responses set status = 'accepted' where id = p_response_id;

  update blood_requests
    set units_fulfilled = units_fulfilled + v_response.units_offered
    where id = v_request.id
    returning * into v_request;

  if v_request.units_fulfilled >= v_request.units_needed then
    update blood_requests set status = 'fulfilled' where id = v_request.id returning * into v_request;
    update responses set status = 'expired'
      where request_id = v_request.id and status = 'pending';
  end if;

  return v_request;
end;
$$;

-- ============================================================
-- Reject-response RPC
-- ============================================================
create or replace function reject_response(p_response_id uuid)
returns responses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_response responses;
  v_hospital_id uuid;
begin
  select hospital_id into v_hospital_id
    from blood_requests
    where id = (select request_id from responses where id = p_response_id);

  if v_hospital_id <> auth.uid() then
    raise exception 'Only the requesting hospital may reject a response';
  end if;

  update responses set status = 'rejected' where id = p_response_id returning * into v_response;
  return v_response;
end;
$$;
