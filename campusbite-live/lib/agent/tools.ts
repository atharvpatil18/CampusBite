import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { CURRENT_STUDENT_ID, formatSlot } from "../campusbite";
import { getSupabase } from "../supabase";

const getMenu = defineTool({
  name: "getMenu",
  description:
    "Use this when the user asks what food or drinks are available, or wants to filter the menu by category, vegetarian status, or price.",
  schema: z.object({
    category: z
      .enum(["meal", "snack", "drink", "sweet"])
      .optional()
      .describe("Optional menu category to include"),
    veg_only: z.boolean().optional().describe("Only return vegetarian items when true"),
    max_price: z.number().int().min(0).optional().describe("Only return items priced at or below this amount in rupees"),
  }),
  run: async ({ category, veg_only, max_price }) => {
    let query = getSupabase()
      .from("menu_items")
      .select("id, name, category, price, is_veg, stock, description")
      .gt("stock", 0)
      .order("category", { ascending: true })
      .order("price", { ascending: true });

    if (category) query = query.eq("category", category);
    if (veg_only) query = query.eq("is_veg", true);
    if (max_price !== undefined) query = query.lte("price", max_price);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { count: data.length, items: data };
  },
});

const getWalletBalance = defineTool({
  name: "getWalletBalance",
  description: "Use this when the user asks about their wallet balance or whether they can afford an order.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("wallets")
      .select("name, balance")
      .eq("student_id", CURRENT_STUDENT_ID)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error(`Wallet not found for student ${CURRENT_STUDENT_ID}`);
    return data;
  },
});

const getPickupSlots = defineTool({
  name: "getPickupSlots",
  description: "Use this when the user asks about available canteen pickup times or needs to choose a pickup slot.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("pickup_slots")
      .select("id, slot_time, capacity, booked")
      .order("slot_time", { ascending: true });
    if (error) throw new Error(error.message);

    const slots = data
      .map((slot) => ({ slot_id: slot.id, time: formatSlot(slot.slot_time), free: slot.capacity - slot.booked }))
      .filter((slot) => slot.free > 0);
    return { count: slots.length, slots };
  },
});

const getMyOrders = defineTool({
  name: "getMyOrders",
  description: "Use this when the user asks about their recent orders, order status, pickup time, or ordered items.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("orders")
      .select("id, status, total, pickup_slots(slot_time), order_items(quantity, menu_items(name))")
      .eq("student_id", CURRENT_STUDENT_ID)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);

    const orders = data.map((order) => {
      const pickupSlot = Array.isArray(order.pickup_slots) ? order.pickup_slots[0] : order.pickup_slots;
      const items = (order.order_items ?? []).map((item) => {
        const menuItem = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items;
        return { name: menuItem?.name ?? "Unknown item", quantity: item.quantity };
      });
      return {
        id: order.id,
        status: order.status,
        total: order.total,
        pickup_time: pickupSlot?.slot_time ? formatSlot(pickupSlot.slot_time) : null,
        items,
      };
    });

    return { count: orders.length, orders };
  },
});

const placeOrder = defineTool({
  name: "placeOrder",
  description: "Use this when the user confirms an order with selected menu items and a pickup slot.",
  writes: true,
  schema: z.object({
    items: z
      .array(
        z.object({
          menu_item_id: z.number().int().positive().describe("The menu item id"),
          quantity: z.number().int().min(1).max(5).describe("Quantity of this menu item, from 1 to 5"),
        })
      )
      .min(1)
      .describe("At least one menu item to order"),
    slot_id: z.number().int().positive().describe("The pickup slot id"),
  }),
  run: async ({ items, slot_id }) => {
    const { data, error } = await getSupabase().rpc("place_order", {
      p_student_id: CURRENT_STUDENT_ID,
      p_slot_id: slot_id,
      p_items: items,
    });
    if (error) throw new Error(error.message);
    return data;
  },
});

const cancelOrder = defineTool({
  name: "cancelOrder",
  description: "Use this when the user asks to cancel one of their orders.",
  writes: true,
  schema: z.object({
    order_id: z.number().int().positive().describe("The order id to cancel"),
  }),
  run: async ({ order_id }) => {
    const { data, error } = await getSupabase().rpc("cancel_order", {
      p_student_id: CURRENT_STUDENT_ID,
      p_order_id: order_id,
    });
    if (error) throw new Error(error.message);
    return data;
  },
});

export const tools: AgentTool[] = [
  getMenu,
  getWalletBalance,
  getPickupSlots,
  getMyOrders,
  placeOrder,
  cancelOrder,
];
