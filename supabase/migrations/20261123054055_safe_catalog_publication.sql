create or replace function public.publish_catalog(p_owner uuid,p_snapshot jsonb) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare version uuid; stamp timestamptz; category_count integer;
begin
 perform 1 from public.catalog_sync_runs where owner=p_owner and status='running' and started_at > now()-interval '10 minutes' for update;
 if not found then raise exception 'Sync claim is invalid or expired'; end if;
 -- Serialize publication and reject an older catalog.
 perform 1 from public.catalog_state where id for update;
 stamp := (p_snapshot->>'updatedAt')::timestamptz;
 if stamp > now()+interval '1 minute' or exists(select 1 from public.catalog_versions v join public.catalog_state s on s.version_id=v.id where v.published_at >= stamp) then raise exception 'Invalid catalog date'; end if;
 if jsonb_array_length(p_snapshot->'products') not between 6 and 400 then raise exception 'Invalid product count'; end if;
 select count(distinct p->>'category') into category_count from jsonb_array_elements(p_snapshot->'products') p;
 if category_count <> 8 or exists(select 1 from jsonb_array_elements(p_snapshot->'products') p group by p->>'category' having count(*)>50) then raise exception 'Invalid category coverage'; end if;
 insert into public.catalog_versions(published_at,product_count) values(stamp,jsonb_array_length(p_snapshot->'products')) returning id into version;
 insert into public.companies(id,name)
 select distinct o->>'storeId',o->>'store' from jsonb_each(p_snapshot->'offers') e cross join lateral jsonb_array_elements(e.value) o
 on conflict(id) do update set name=excluded.name,active=true;
 insert into public.catalog_products(version_id,id,category,data)
 select version,(p->>'id')::bigint,p->>'category',p from jsonb_array_elements(p_snapshot->'products') p;
 insert into public.product_offers(version_id,product_id,company_id,price_clp,store_url)
 select version,e.key::bigint,o->>'storeId',(o->>'priceCLP')::integer,o->>'storeUrl'
 from jsonb_each(p_snapshot->'offers') e cross join lateral jsonb_array_elements(e.value) o;
 if exists(select 1 from public.catalog_products p where p.version_id=version and not exists(select 1 from public.product_offers o where o.version_id=version and o.product_id=p.id)) then raise exception 'Product without an offer'; end if;
 update public.companies set active = id in (select company_id from public.product_offers where version_id=version) where active is distinct from (id in (select company_id from public.product_offers where version_id=version));
 update public.catalog_state set version_id=version where id;
 update public.catalog_sync_runs set status='done',finished_at=now() where owner=p_owner;
 -- Retain one previous version for diagnostics; quotes are checked against the active version.
 delete from public.catalog_versions where id not in (select id from public.catalog_versions order by published_at desc limit 2);
 delete from public.catalog_sync_runs where day < current_date-30;
 return true;
end;
$$;
