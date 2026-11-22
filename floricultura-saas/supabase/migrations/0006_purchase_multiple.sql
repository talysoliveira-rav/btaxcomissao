-- Lista de compras: múltiplo em que o fornecedor vende (ex.: maço de 20 hastes)
alter table supplies
  add column purchase_multiple numeric(12,2) not null default 1 check (purchase_multiple > 0);
