-- Lets a responder (donor or hospital) notify the requesting hospital that
-- someone responded, without exposing the hospital's contact info to anyone
-- who hasn't actually responded to that specific request.
create or replace function get_request_owner_contact(p_request_id uuid)
returns table (phone text, name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from responses
    where request_id = p_request_id and responder_id = auth.uid()
  ) then
    raise exception 'Only a responder to this request may fetch owner contact info';
  end if;

  return query
    select p.phone, p.name
    from blood_requests br
    join profiles p on p.id = br.hospital_id
    where br.id = p_request_id;
end;
$$;
