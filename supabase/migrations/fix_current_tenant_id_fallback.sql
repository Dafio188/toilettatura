-- Rende current_tenant_id resiliente quando il browser non invia x-tenant-id.
-- Ordine di risoluzione:
-- 1) header x-tenant-id esplicito
-- 2) user_metadata.tenant_id, ma solo se l'utente appartiene davvero a quel tenant
-- 3) fallback automatico se l'utente appartiene a un solo tenant

create or replace function public.current_tenant_id()
returns uuid
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_tenant_id text;
  v_single_membership uuid;
  v_membership_count integer;
begin
  v_tenant_id := current_setting('request.headers', true)::jsonb ->> 'x-tenant-id';
  if v_tenant_id is not null and v_tenant_id <> '' then
    return v_tenant_id::uuid;
  end if;

  if auth.uid() is null then
    return null;
  end if;

  v_tenant_id := auth.jwt() -> 'user_metadata' ->> 'tenant_id';
  if v_tenant_id is not null and v_tenant_id <> '' then
    if exists (
      select 1
      from public.tenant_customers tc
      where tc.customer_id = auth.uid()
        and tc.tenant_id = v_tenant_id::uuid
    ) then
      return v_tenant_id::uuid;
    end if;
  end if;

  select count(*), min(tc.tenant_id)
    into v_membership_count, v_single_membership
  from public.tenant_customers tc
  where tc.customer_id = auth.uid();

  if v_membership_count = 1 then
    return v_single_membership;
  end if;

  return null;
end;
$$;
