-- Endurecimento de segurança (alertas do Supabase Advisor)

-- 1) search_path fixo nas funções de trigger
alter function set_order_number() set search_path = public;
alter function apply_stock_movement() set search_path = public;
alter function recalc_order_subtotal() set search_path = public;
alter function on_order_status_change() set search_path = public;
alter function on_order_created() set search_path = public;

-- 2) Nenhuma função do app é chamável sem login
revoke execute on all functions in schema public from anon, public;

-- 3) handle_new_user só roda como trigger; não deve ser exposta via RPC
revoke execute on function handle_new_user() from authenticated;

-- 4) Usuários logados continuam podendo usar as RPCs do app e os helpers de RLS
grant execute on function
  is_member(uuid), is_admin(uuid),
  create_organization(text, text),
  receive_supply(uuid, numeric, numeric, text, date),
  discard_batch(uuid, text),
  find_user_by_email(uuid, text),
  add_member(uuid, uuid, member_role),
  upcoming_special_dates(uuid, int)
to authenticated;

-- 5) Funções criadas no futuro também não ficam abertas para anon
alter default privileges in schema public revoke execute on functions from anon, public;
