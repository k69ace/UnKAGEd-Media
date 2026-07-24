// Hand-written to match supabase/migrations/*.sql exactly, in the same
// shape `mcp__Supabase__generate_typescript_types` would produce. Written
// by hand because Supabase MCP access was gated behind a stuck tool
// permission when this was needed — regenerate from the live schema and
// replace this file wholesale once that's available; do not hand-edit
// individual fields out of sync with the migrations afterward.

export type AppRole = "catering_admin" | "manager_owner" | "sales_manager" | "chef" | "reporting_readonly";
export type LineItemCategory =
  | "menu_item" | "package" | "beverage" | "alcohol" | "rental" | "linen"
  | "delivery" | "setup" | "pickup" | "travel" | "staffing" | "admin_fee"
  | "service_charge" | "other";
export type EstimateStatus = "draft" | "sent" | "approved" | "won" | "lost" | "cancelled";
export type ChargeType = "flat" | "percent";
export type ChargeBase =
  | "discounted_subtotal"
  | "discounted_subtotal_excluding_alcohol"
  | "discounted_subtotal_plus_service_charge";

interface Table<Row, Insert, Update> {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      organizations: Table<
        { id: string; name: string; created_at: string; updated_at: string },
        { id?: string; name: string; created_at?: string; updated_at?: string },
        { id?: string; name?: string; created_at?: string; updated_at?: string }
      >;
      locations: Table<
        {
          id: string; organization_id: string; name: string; address: string | null;
          timezone: string; is_active: boolean; created_at: string; updated_at: string;
        },
        {
          id?: string; organization_id: string; name: string; address?: string | null;
          timezone?: string; is_active?: boolean; created_at?: string; updated_at?: string;
        },
        Partial<{
          id: string; organization_id: string; name: string; address: string | null;
          timezone: string; is_active: boolean; created_at: string; updated_at: string;
        }>
      >;
      profiles: Table<
        {
          id: string; organization_id: string; location_id: string | null; role: AppRole;
          full_name: string; email: string; is_active: boolean; created_at: string; updated_at: string;
        },
        {
          id: string; organization_id: string; location_id?: string | null; role: AppRole;
          full_name: string; email: string; is_active?: boolean; created_at?: string; updated_at?: string;
        },
        Partial<{
          id: string; organization_id: string; location_id: string | null; role: AppRole;
          full_name: string; email: string; is_active: boolean; created_at: string; updated_at: string;
        }>
      >;
      invites: Table<
        {
          id: string; organization_id: string; email: string | null; role: AppRole; token: string;
          created_by: string | null; expires_at: string; accepted_at: string | null;
          revoked_at: string | null; created_at: string;
        },
        {
          id?: string; organization_id: string; email?: string | null; role?: AppRole; token: string;
          created_by?: string | null; expires_at?: string; accepted_at?: string | null;
          revoked_at?: string | null; created_at?: string;
        },
        Partial<{
          id: string; organization_id: string; email: string | null; role: AppRole; token: string;
          created_by: string | null; expires_at: string; accepted_at: string | null;
          revoked_at: string | null; created_at: string;
        }>
      >;
      customers: Table<
        {
          id: string; organization_id: string; name: string; company_name: string | null;
          notes: string | null; created_at: string; updated_at: string; created_by: string | null;
        },
        {
          id?: string; organization_id: string; name: string; company_name?: string | null;
          notes?: string | null; created_at?: string; updated_at?: string; created_by?: string | null;
        },
        Partial<{
          id: string; organization_id: string; name: string; company_name: string | null;
          notes: string | null; created_at: string; updated_at: string; created_by: string | null;
        }>
      >;
      contacts: Table<
        {
          id: string; organization_id: string; customer_id: string; first_name: string;
          last_name: string; email: string | null; phone: string | null; is_primary: boolean;
          created_at: string; updated_at: string;
        },
        {
          id?: string; organization_id: string; customer_id: string; first_name: string;
          last_name: string; email?: string | null; phone?: string | null; is_primary?: boolean;
          created_at?: string; updated_at?: string;
        },
        Partial<{
          id: string; organization_id: string; customer_id: string; first_name: string;
          last_name: string; email: string | null; phone: string | null; is_primary: boolean;
          created_at: string; updated_at: string;
        }>
      >;
      tax_rules: Table<
        {
          id: string; organization_id: string; name: string; rate: number;
          applies_by_default_to_category: LineItemCategory | null; is_active: boolean;
          created_at: string; updated_at: string;
        },
        {
          id?: string; organization_id: string; name: string; rate: number;
          applies_by_default_to_category?: LineItemCategory | null; is_active?: boolean;
          created_at?: string; updated_at?: string;
        },
        Partial<{
          id: string; organization_id: string; name: string; rate: number;
          applies_by_default_to_category: LineItemCategory | null; is_active: boolean;
          created_at: string; updated_at: string;
        }>
      >;
      event_types: Table<
        { id: string; organization_id: string; name: string; sort_order: number; is_active: boolean },
        { id?: string; organization_id: string; name: string; sort_order?: number; is_active?: boolean },
        Partial<{ id: string; organization_id: string; name: string; sort_order: number; is_active: boolean }>
      >;
      service_styles: Table<
        { id: string; organization_id: string; name: string; sort_order: number; is_active: boolean },
        { id?: string; organization_id: string; name: string; sort_order?: number; is_active?: boolean },
        Partial<{ id: string; organization_id: string; name: string; sort_order: number; is_active: boolean }>
      >;
      staffing_roles: Table<
        {
          id: string; organization_id: string; name: string; default_rate_per_hour: number | null;
          default_ratio_guests_per_staff: number | null; is_active: boolean;
        },
        {
          id?: string; organization_id: string; name: string; default_rate_per_hour?: number | null;
          default_ratio_guests_per_staff?: number | null; is_active?: boolean;
        },
        Partial<{
          id: string; organization_id: string; name: string; default_rate_per_hour: number | null;
          default_ratio_guests_per_staff: number | null; is_active: boolean;
        }>
      >;
      organization_settings: Table<
        {
          organization_id: string; default_profit_target_percent: number | null;
          approval_threshold_amount: number | null; approval_below_margin_percent: number | null;
          chef_review_required: boolean; service_charge_enabled: boolean;
          service_charge_type: ChargeType | null; service_charge_value: number | null;
          service_charge_base: "discounted_subtotal" | "discounted_subtotal_excluding_alcohol";
          service_charge_tax_rule_id: string | null; gratuity_enabled: boolean;
          gratuity_type: ChargeType | null; gratuity_value: number | null;
          gratuity_base: ChargeBase; gratuity_tax_rule_id: string | null; updated_at: string;
        },
        {
          organization_id: string; default_profit_target_percent?: number | null;
          approval_threshold_amount?: number | null; approval_below_margin_percent?: number | null;
          chef_review_required?: boolean; service_charge_enabled?: boolean;
          service_charge_type?: ChargeType | null; service_charge_value?: number | null;
          service_charge_base?: "discounted_subtotal" | "discounted_subtotal_excluding_alcohol";
          service_charge_tax_rule_id?: string | null; gratuity_enabled?: boolean;
          gratuity_type?: ChargeType | null; gratuity_value?: number | null;
          gratuity_base?: ChargeBase; gratuity_tax_rule_id?: string | null; updated_at?: string;
        },
        Partial<{
          organization_id: string; default_profit_target_percent: number | null;
          approval_threshold_amount: number | null; approval_below_margin_percent: number | null;
          chef_review_required: boolean; service_charge_enabled: boolean;
          service_charge_type: ChargeType | null; service_charge_value: number | null;
          service_charge_base: "discounted_subtotal" | "discounted_subtotal_excluding_alcohol";
          service_charge_tax_rule_id: string | null; gratuity_enabled: boolean;
          gratuity_type: ChargeType | null; gratuity_value: number | null;
          gratuity_base: ChargeBase; gratuity_tax_rule_id: string | null; updated_at: string;
        }>
      >;
      catering_package_templates: Table<
        {
          id: string; organization_id: string; name: string; description: string | null;
          base_per_person_price: number | null; service_style_id: string | null; is_active: boolean;
          created_at: string; updated_at: string; created_by: string | null;
        },
        {
          id?: string; organization_id: string; name: string; description?: string | null;
          base_per_person_price?: number | null; service_style_id?: string | null; is_active?: boolean;
          created_at?: string; updated_at?: string; created_by?: string | null;
        },
        Partial<{
          id: string; organization_id: string; name: string; description: string | null;
          base_per_person_price: number | null; service_style_id: string | null; is_active: boolean;
          created_at: string; updated_at: string; created_by: string | null;
        }>
      >;
      catering_package_template_line_items: Table<
        {
          id: string; template_id: string; category: LineItemCategory; description: string;
          quantity: number; unit: string; unit_price: number; unit_cost: number | null;
          is_taxable: boolean; tax_rule_id: string | null; sort_order: number;
        },
        {
          id?: string; template_id: string; category: LineItemCategory; description: string;
          quantity?: number; unit?: string; unit_price?: number; unit_cost?: number | null;
          is_taxable?: boolean; tax_rule_id?: string | null; sort_order?: number;
        },
        Partial<{
          id: string; template_id: string; category: LineItemCategory; description: string;
          quantity: number; unit: string; unit_price: number; unit_cost: number | null;
          is_taxable: boolean; tax_rule_id: string | null; sort_order: number;
        }>
      >;
      catering_estimates: Table<
        {
          id: string; organization_id: string; location_id: string | null; customer_id: string;
          contact_id: string | null; event_date: string | null; event_start_time: string | null;
          event_end_time: string | null; venue_name: string | null; venue_address: string | null;
          event_type_id: string | null; service_style_id: string | null;
          guest_count_estimated: number | null; guest_count_guaranteed: number | null;
          status: EstimateStatus; version: number; previous_version_id: string | null;
          profit_target_percent: number | null; deposit_amount: number | null;
          deposit_due_date: string | null; payment_schedule_json: unknown;
          minimum_spend_required: number | null; discount_amount: number; discount_reason: string | null;
          internal_notes: string | null; customer_facing_notes: string | null;
          approved_by: string | null; approved_at: string | null; created_by: string | null;
          updated_by: string | null; created_at: string; updated_at: string;
          chef_reviewed_at: string | null; chef_reviewed_by: string | null;
        },
        {
          id?: string; organization_id: string; location_id?: string | null; customer_id: string;
          contact_id?: string | null; event_date?: string | null; event_start_time?: string | null;
          event_end_time?: string | null; venue_name?: string | null; venue_address?: string | null;
          event_type_id?: string | null; service_style_id?: string | null;
          guest_count_estimated?: number | null; guest_count_guaranteed?: number | null;
          status?: EstimateStatus; version?: number; previous_version_id?: string | null;
          profit_target_percent?: number | null; deposit_amount?: number | null;
          deposit_due_date?: string | null; payment_schedule_json?: unknown;
          minimum_spend_required?: number | null; discount_amount?: number; discount_reason?: string | null;
          internal_notes?: string | null; customer_facing_notes?: string | null;
          approved_by?: string | null; approved_at?: string | null; created_by?: string | null;
          updated_by?: string | null; created_at?: string; updated_at?: string;
          chef_reviewed_at?: string | null; chef_reviewed_by?: string | null;
        },
        Partial<{
          id: string; organization_id: string; location_id: string | null; customer_id: string;
          contact_id: string | null; event_date: string | null; event_start_time: string | null;
          event_end_time: string | null; venue_name: string | null; venue_address: string | null;
          event_type_id: string | null; service_style_id: string | null;
          guest_count_estimated: number | null; guest_count_guaranteed: number | null;
          status: EstimateStatus; version: number; previous_version_id: string | null;
          profit_target_percent: number | null; deposit_amount: number | null;
          deposit_due_date: string | null; payment_schedule_json: unknown;
          minimum_spend_required: number | null; discount_amount: number; discount_reason: string | null;
          internal_notes: string | null; customer_facing_notes: string | null;
          approved_by: string | null; approved_at: string | null; created_by: string | null;
          updated_by: string | null; created_at: string; updated_at: string;
          chef_reviewed_at: string | null; chef_reviewed_by: string | null;
        }>
      >;
      catering_estimate_line_items: Table<
        {
          id: string; estimate_id: string; category: LineItemCategory; description: string;
          quantity: number; unit: string; unit_price: number; unit_cost: number | null;
          is_taxable: boolean; tax_rule_id: string | null; sort_order: number;
          created_at: string; updated_at: string;
        },
        {
          id?: string; estimate_id: string; category: LineItemCategory; description: string;
          quantity?: number; unit?: string; unit_price?: number; unit_cost?: number | null;
          is_taxable?: boolean; tax_rule_id?: string | null; sort_order?: number;
          created_at?: string; updated_at?: string;
        },
        Partial<{
          id: string; estimate_id: string; category: LineItemCategory; description: string;
          quantity: number; unit: string; unit_price: number; unit_cost: number | null;
          is_taxable: boolean; tax_rule_id: string | null; sort_order: number;
          created_at: string; updated_at: string;
        }>
      >;
      catering_estimate_staffing: Table<
        {
          id: string; estimate_id: string; staffing_role_id: string; quantity: number;
          hours: number; rate_per_hour: number; notes: string | null;
          created_at: string; updated_at: string;
        },
        {
          id?: string; estimate_id: string; staffing_role_id: string; quantity?: number;
          hours?: number; rate_per_hour?: number; notes?: string | null;
          created_at?: string; updated_at?: string;
        },
        Partial<{
          id: string; estimate_id: string; staffing_role_id: string; quantity: number;
          hours: number; rate_per_hour: number; notes: string | null;
          created_at: string; updated_at: string;
        }>
      >;
      catering_estimate_guest_count_history: Table<
        {
          id: string; estimate_id: string; guest_count_estimated: number | null;
          guest_count_guaranteed: number | null; changed_by: string | null; changed_at: string;
        },
        {
          id?: string; estimate_id: string; guest_count_estimated?: number | null;
          guest_count_guaranteed?: number | null; changed_by?: string | null; changed_at?: string;
        },
        Partial<{
          id: string; estimate_id: string; guest_count_estimated: number | null;
          guest_count_guaranteed: number | null; changed_by: string | null; changed_at: string;
        }>
      >;
      audit_log: Table<
        {
          id: string; organization_id: string; entity_type: string; entity_id: string;
          action: string; actor_id: string | null; changes: unknown; created_at: string;
        },
        Record<string, never>,
        Record<string, never>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
      line_item_category: LineItemCategory;
      estimate_status: EstimateStatus;
    };
  };
}
