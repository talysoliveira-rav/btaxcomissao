"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { reqStr, str } from "@/lib/form";

const customerRow = (fd: FormData) => ({
  name: reqStr(fd, "name"),
  phone: str(fd, "phone"),
  email: str(fd, "email"),
  document: str(fd, "document"),
  notes: str(fd, "notes"),
});

export async function createCustomer(fd: FormData) {
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const { data, error } = await supabase.from("customers").insert({ ...customerRow(fd), org_id: org.id }).select("id").single();
  if (error) throw new Error(error.message);
  redirect(`/app/clientes/${data.id}`);
}

export async function updateCustomer(fd: FormData) {
  const supabase = await createClient();
  const id = reqStr(fd, "id");
  const { error } = await supabase.from("customers").update(customerRow(fd)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/clientes/${id}`);
}

export async function deleteCustomer(fd: FormData) {
  const supabase = await createClient();
  await supabase.from("customers").delete().eq("id", reqStr(fd, "id"));
  redirect("/app/clientes");
}

export async function addAddress(fd: FormData) {
  const { org } = await getOrgContext();
  const customer_id = reqStr(fd, "customer_id");
  const supabase = await createClient();
  const { error } = await supabase.from("customer_addresses").insert({
    org_id: org.id,
    customer_id,
    label: str(fd, "label"),
    street: reqStr(fd, "street"),
    number: str(fd, "number"),
    complement: str(fd, "complement"),
    neighborhood: str(fd, "neighborhood"),
    city: str(fd, "city"),
    state: str(fd, "state"),
    zip: str(fd, "zip"),
    reference: str(fd, "reference"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/clientes/${customer_id}`);
}

export async function removeAddress(fd: FormData) {
  const supabase = await createClient();
  await supabase.from("customer_addresses").delete().eq("id", reqStr(fd, "id"));
  revalidatePath(`/app/clientes/${reqStr(fd, "customer_id")}`);
}

export async function addSpecialDate(fd: FormData) {
  const { org } = await getOrgContext();
  const customer_id = reqStr(fd, "customer_id");
  const [, m, d] = reqStr(fd, "date").split("-").map(Number); // input type=date; o ano é ignorado
  const supabase = await createClient();
  const { error } = await supabase.from("special_dates").insert({
    org_id: org.id,
    customer_id,
    title: reqStr(fd, "title"),
    person_name: str(fd, "person_name"),
    month: m,
    day: d,
    notes: str(fd, "notes"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/clientes/${customer_id}`);
}

export async function removeSpecialDate(fd: FormData) {
  const supabase = await createClient();
  await supabase.from("special_dates").delete().eq("id", reqStr(fd, "id"));
  revalidatePath(`/app/clientes/${reqStr(fd, "customer_id")}`);
}
