export type MemberRole = "owner" | "admin" | "staff";
export type OrderStatus = "novo" | "confirmado" | "em_producao" | "pronto" | "em_rota" | "entregue" | "cancelado";
export type DeliveryPeriod = "manha" | "tarde" | "noite" | "horario";
export type Fulfillment = "entrega" | "retirada";
export type PaymentStatus = "pendente" | "pago" | "estornado";
export type StockMovementType = "entrada" | "saida" | "perda" | "ajuste" | "consumo_pedido" | "estorno_pedido";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  document: string | null;
  address: string | null;
  delivery_fee_default: number;
  storefront_enabled: boolean;
  tagline: string | null;
  store_description: string | null;
  whatsapp: string | null;
  instagram: string | null;
  opening_hours: string | null;
  delivery_area: string | null;
  logo_url: string | null;
  cover_url: string | null;
};

export type PriceMode = "exato" | "a_partir_de" | "sob_consulta";

export type ProductImage = {
  id: string;
  product_id: string;
  path: string;
  thumb_path: string | null;
  url: string;
  thumb_url: string | null;
  position: number;
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  document: string | null;
  notes: string | null;
  created_at: string;
};

export type CustomerAddress = {
  id: string;
  customer_id: string;
  label: string | null;
  street: string;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  reference: string | null;
};

export type SpecialDate = {
  id: string;
  customer_id: string;
  title: string;
  person_name: string | null;
  month: number;
  day: number;
  remind_days_before: number;
  notes: string | null;
};

export type UpcomingDate = {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string | null;
  title: string;
  person_name: string | null;
  next_date: string;
  days_until: number;
};

export type Supply = {
  id: string;
  category_id: string | null;
  name: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost: number;
  shelf_life_days: number | null;
  active: boolean;
  supply_categories?: { name: string } | null;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  image_url: string | null;
  sku: string | null;
  active: boolean;
  price_mode: PriceMode;
  show_in_store: boolean;
  featured: boolean;
  sort_order: number;
};

export type Driver = {
  id: string;
  name: string;
  phone: string | null;
  vehicle: string | null;
  active: boolean;
};

export type Order = {
  id: string;
  number: number;
  customer_id: string | null;
  status: OrderStatus;
  fulfillment: Fulfillment;
  channel: string | null;
  delivery_date: string | null;
  delivery_period: DeliveryPeriod | null;
  delivery_time: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_reference: string | null;
  driver_id: string | null;
  card_message: string | null;
  card_signature: string | null;
  anonymous: boolean;
  internal_notes: string | null;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: string | null;
  payment_status: PaymentStatus;
  stock_consumed: boolean;
  delivered_at: string | null;
  delivery_proof: string | null;
  created_at: string;
  customers?: { name: string; phone: string | null } | null;
  drivers?: { name: string } | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
};
