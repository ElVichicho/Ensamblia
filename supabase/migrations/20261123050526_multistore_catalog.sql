-- Public catalog reads; only the server may publish a catalog or claim a sync.
create table public.catalog_versions (
  id uuid primary key default gen_random_uuid(),
  published_at timestamptz not null unique,
  source text not null default 'solotodo',
  product_count integer not null check (product_count > 0 and product_count <= 400)
);
create table public.catalog_state (
  id boolean primary key default true check (id),
  version_id uuid references public.catalog_versions(id)
);
insert into public.catalog_state(id) values (true);
create table public.companies (
  id text primary key,
  name text not null,
  source text not null default 'solotodo',
  active boolean not null default true
);
create table public.catalog_products (
  version_id uuid not null references public.catalog_versions(id) on delete cascade,
  id bigint not null,
  category text not null check (category in ('cpu','motherboard','ram','gpu','storage','psu','case','cooler')),
  data jsonb not null,
  primary key (version_id,id)
);
create table public.product_offers (
  version_id uuid not null,
  product_id bigint not null,
  company_id text not null references public.companies(id),
  price_clp integer not null check (price_clp > 0),
  store_url text not null check (store_url ~ '^https?://'),
  primary key (version_id,product_id,company_id),
  foreign key (version_id,product_id) references public.catalog_products(version_id,id) on delete cascade
);
create index offers_company_idx on public.product_offers(company_id,version_id);
create index products_category_idx on public.catalog_products(version_id,category);
create table public.catalog_sync_runs (
  day date primary key,
  owner uuid not null unique,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','done','failed')),
  error_code text
);
alter table public.catalog_versions enable row level security;
alter table public.catalog_state enable row level security;
alter table public.companies enable row level security;
alter table public.catalog_products enable row level security;
alter table public.product_offers enable row level security;
alter table public.catalog_sync_runs enable row level security;
revoke all on public.catalog_versions,public.catalog_state,public.companies,public.catalog_products,public.product_offers,public.catalog_sync_runs from anon,authenticated;
grant select on public.catalog_versions,public.catalog_state,public.companies,public.catalog_products,public.product_offers to anon,authenticated;
grant all on public.catalog_versions,public.catalog_state,public.companies,public.catalog_products,public.product_offers,public.catalog_sync_runs to service_role;
create policy catalog_state_read on public.catalog_state for select to anon,authenticated using (true);
create policy catalog_version_read on public.catalog_versions for select to anon,authenticated using (id = (select version_id from public.catalog_state where id));
create policy companies_read on public.companies for select to anon,authenticated using (active);
create policy products_read on public.catalog_products for select to anon,authenticated using (version_id = (select version_id from public.catalog_state where id));
create policy offers_read on public.product_offers for select to anon,authenticated using (version_id = (select version_id from public.catalog_state where id));

create function public.get_catalog_snapshot() returns jsonb
language sql stable security invoker set search_path = '' as $$
select jsonb_build_object(
  'updatedAt',to_char(v.published_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'products',(select coalesce(jsonb_agg(p.data order by p.id),'[]'::jsonb) from public.catalog_products p where p.version_id=v.id),
  'offers',(select coalesce(jsonb_object_agg(x.product_id::text,x.offers),'{}'::jsonb) from (
    select o.product_id,jsonb_agg(jsonb_build_object('storeId',c.id,'store',c.name,'storeUrl',o.store_url,'priceCLP',o.price_clp) order by o.price_clp) offers
    from public.product_offers o join public.companies c on c.id=o.company_id
    where o.version_id=v.id group by o.product_id) x)
)
from public.catalog_versions v join public.catalog_state s on s.version_id=v.id where s.id;
$$;
create function public.claim_catalog_sync(p_owner uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare claimed integer;
begin
 insert into public.catalog_sync_runs(day,owner) values ((now() at time zone 'America/Santiago')::date,p_owner) on conflict (day) do nothing;
 get diagnostics claimed = row_count;
 return claimed > 0;
end;
$$;
create function public.fail_catalog_sync(p_owner uuid) returns void
language sql security invoker set search_path = '' as $$
update public.catalog_sync_runs set status='failed',finished_at=now(),error_code='SOURCE_OR_PUBLICATION_FAILED' where owner=p_owner and status='running';
$$;
create function public.publish_catalog(p_owner uuid,p_snapshot jsonb) returns boolean
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
 update public.companies set active = id in (select company_id from public.product_offers where version_id=version);
 update public.catalog_state set version_id=version where id;
 update public.catalog_sync_runs set status='done',finished_at=now() where owner=p_owner;
 -- Retain one previous version for diagnostics; quotes are checked against the active version.
 delete from public.catalog_versions where id not in (select id from public.catalog_versions order by published_at desc limit 2);
 delete from public.catalog_sync_runs where day < current_date-30;
 return true;
end;
$$;
revoke all on function public.get_catalog_snapshot(),public.claim_catalog_sync(uuid),public.fail_catalog_sync(uuid),public.publish_catalog(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.get_catalog_snapshot() to anon,authenticated,service_role;
grant execute on function public.claim_catalog_sync(uuid),public.fail_catalog_sync(uuid),public.publish_catalog(uuid,jsonb) to service_role;
