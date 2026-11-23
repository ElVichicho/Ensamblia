create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
-- The dashboard's automatic-RLS event trigger must not be a public RPC.
revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
create policy sync_runs_server_only on public.catalog_sync_runs for all to service_role using (true) with check (true);

do $$ begin
 if not exists(select 1 from vault.secrets where name='ensamblia_catalog_sync_secret') then
  perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'ensamblia_catalog_sync_secret','Authorization for the daily production catalog sync');
 end if;
end $$;
create function public.request_catalog_sync() returns bigint
language plpgsql security invoker set search_path = '' as $$
declare token text; request_id bigint;
begin
 select decrypted_secret into token from vault.decrypted_secrets where name='ensamblia_catalog_sync_secret';
 if token is null then raise exception 'Catalog sync authorization is not configured'; end if;
 select net.http_post(
  url:='https://ensamblia.vercel.app/api/catalog/sync',
  headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||token),
  body:='{}'::jsonb, timeout_milliseconds:=180000
 ) into request_id;
 return request_id;
end;
$$;
revoke all on function public.request_catalog_sync() from public,anon,authenticated,service_role;
select cron.schedule('ensamblia-daily-catalog','0 9 * * *','select public.request_catalog_sync();');
-- Activate only after the production endpoint is deployed and verified.
select cron.alter_job(jobid,active:=false) from cron.job where jobname='ensamblia-daily-catalog';
