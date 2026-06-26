-- Top Planejados V104.1 - Recibo no contrato + acesso assistido do admin
-- Rode no Supabase SQL Editor depois da migration_v104.sql.
-- Não apaga dados.

-- Permite que administrador ativo acesse/edite dados de outros usuários pelo modo assistido da aba Admin.
-- O usuário comum continua vendo somente os próprios dados pelas políticas antigas.

-- Configurações da empresa por usuário
drop policy if exists user_company_admin_select on public.user_company_settings;
drop policy if exists user_company_admin_insert on public.user_company_settings;
drop policy if exists user_company_admin_update on public.user_company_settings;
drop policy if exists user_company_admin_delete on public.user_company_settings;
create policy user_company_admin_select on public.user_company_settings for select using (public.is_admin());
create policy user_company_admin_insert on public.user_company_settings for insert with check (public.is_admin());
create policy user_company_admin_update on public.user_company_settings for update using (public.is_admin()) with check (public.is_admin());
create policy user_company_admin_delete on public.user_company_settings for delete using (public.is_admin());

-- Tabelas principais com created_by
do $$
declare
  tbl text;
  policy_prefix text;
begin
  foreach tbl in array array['clients','projects','services','transactions','inventory_items','payroll_records','payroll_employees','suppliers'] loop
    policy_prefix := tbl || '_admin';
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_select', tbl);
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_insert', tbl);
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_update', tbl);
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_delete', tbl);
    execute format('create policy %I on public.%I for select using (public.is_admin())', policy_prefix || '_select', tbl);
    execute format('create policy %I on public.%I for insert with check (public.is_admin())', policy_prefix || '_insert', tbl);
    execute format('create policy %I on public.%I for update using (public.is_admin()) with check (public.is_admin())', policy_prefix || '_update', tbl);
    execute format('create policy %I on public.%I for delete using (public.is_admin())', policy_prefix || '_delete', tbl);
  end loop;
end $$;

select 'v104.1 recibo e admin assistido ok' as status;
