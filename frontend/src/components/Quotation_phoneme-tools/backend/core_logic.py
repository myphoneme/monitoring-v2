import re
import pandas as pd
from fpdf import FPDF
import tempfile
import os
from num2words import num2words
from datetime import date

# --- Pricing Dictionary ---
PRICING = {
    "vm_configs": {
        "1vCPU_1GB_40GB": {"vCPU": 1, "RAM": 1, "Storage": 40, "Price": 4449},
        "2vCPU_2GB_60GB": {"vCPU": 2, "RAM": 2, "Storage": 60, "Price": 7349},
        "4vCPU_4GB_120GB": {"vCPU": 4, "RAM": 4, "Storage": 120, "Price": 13349},
        "6vCPU_6GB_180GB": {"vCPU": 6, "RAM": 6, "Storage": 180, "Price": 19949},
        "8vCPU_8GB_240GB": {"vCPU": 8, "RAM": 8, "Storage": 240, "Price": 25549},
        "16vCPU_16GB_480GB": {"vCPU": 16, "RAM": 16, "Storage": 480, "Price": 49649},
    },
    "add_ons": {
        "vcpu_unit_price": 2500,
        "ram_per_gb": 849,
        "storage_per_50gb": 499,
    },
    "management": {
        "antivirus": 2083,
        "os_management_linux": 4670,
        "os_management_windows": 1950,
        "backup_management": 1340,
        "database_management": 13440,
    },
    "bandwidth": {
        "Dedicated 10 MBPS": 250000,
        "Default": 0,
    }
}

class PDF(FPDF):
    def header(self):
        pass

    def quotation_header(self, logo_path, customer_info, quotation_info):
        self.set_font("Arial", "BU", 18)
        self.cell(0, 16, "Quotation", ln=True, align="C")
        self.ln(2)
        y_start = self.get_y() + 2
        x_left = self.l_margin
        x_right = x_left + 70
        self.set_xy(x_left, y_start)
        if logo_path and os.path.exists(logo_path):
            self.image(logo_path, x=x_left, y=y_start, w=40)
        self.set_xy(x_left, y_start + 20)
        self.set_font("Arial", "B", 10)
        self.multi_cell(60, 6, "PHONEME SOLUTIONS PRIVATE LIMITED", 0)
        self.set_font("Arial", "", 9)
        self.multi_cell(60, 5, "B-614 6TH FLOOR TOWER B PLOT NO 7\nNoida Pincode 201305\nNoida, 9 201305\nGSTN: 09AAHCP9748G2ZS", 0)
        y_left_end = self.get_y()
        self.set_xy(x_right, y_start + 20)
        self.set_font("Arial", "B", 10)
        self.multi_cell(80, 6, customer_info.get('name', ''), 0)
        self.set_x(x_right)
        self.set_font("Arial", "", 9)
        self.multi_cell(80, 5, customer_info.get('address', ''), 0)
        self.set_x(x_right)
        if customer_info.get('email'):
            self.cell(80, 5, f"Email: {customer_info['email']}", ln=1)
            self.set_x(x_right)
        if customer_info.get('gstn'):
            self.cell(80, 5, f"GSTN: {customer_info['gstn']}", ln=1)
            self.set_x(x_right)
        y_right_end = self.get_y()
        self.set_y(max(y_left_end, y_right_end) + 5)
        self.set_font("Arial", "B", 10)
        self.cell(40, 6, "Quotation No:", 0, 0)
        self.set_font("Arial", "", 10)
        self.cell(40, 6, quotation_info.get('number', ''), 0, 0)
        self.set_font("Arial", "B", 10)
        self.cell(40, 6, "Quotation Date:", 0, 0)
        self.set_font("Arial", "", 10)
        self.cell(40, 6, quotation_info.get('date', ''), 0, 1)
        self.ln(5)

    def add_terms_and_conditions(self):
        self.set_y(-40)
        self.set_font("Arial", "B", 10)
        self.cell(0, 8, "Terms & Conditions", ln=True, align="C")
        self.set_font("Arial", "", 10)
        combined = "Validity: This quotation is valid for 15 days from the date of issue. This is computer generated Quotation Signature is not required"
        self.cell(0, 7, combined, ln=True, align="C")

    def table(self, title, dataframe):
        self.set_font("Arial", "B", 12)
        self.cell(0, 10, title, ln=True)
        self.set_font("Arial", "B", 10)
        table_width = self.w - 2 * self.l_margin
        col_widths = []
        min_col_width = 20
        max_col_width = 60
        total_width = 0
        for col in dataframe.columns:
            max_content_width = max(
                [self.get_string_width(str(col))] + [self.get_string_width(str(val)) for val in dataframe[col]]
            ) + 6
            col_width = min(max(max_content_width, min_col_width), max_col_width)
            col_widths.append(col_width)
            total_width += col_width
        if total_width > table_width:
            scale = table_width / total_width
            col_widths = [w * scale for w in col_widths]
        for i, col in enumerate(dataframe.columns):
            self.cell(col_widths[i], 8, str(col), border=1, align="C")
        self.ln()
        self.set_font("Arial", "", 9)
        for _, row in dataframe.iterrows():
            y_before = self.get_y()
            x_before = self.get_x()
            row_height = 8
            cell_heights = []
            for i, val in enumerate(row):
                val_str = str(val)
                n_lines = max(1, int(self.get_string_width(val_str) / (col_widths[i] - 2)) + 1)
                cell_heights.append(5 * n_lines)
            row_height = max(cell_heights)
            for i, val in enumerate(row):
                val_str = str(val)
                x = self.get_x()
                y = self.get_y()
                self.multi_cell(col_widths[i], 5, val_str, border=1, align="L")
                self.set_xy(x + col_widths[i], y)
            self.ln(row_height)
        self.ln(5)

    def simple_table(self, dataframe):
        self.set_font("Arial", "B", 12)
        self.cell(0, 10, "Final Summary", ln=True)
        self.set_font("Arial", "", 10)
        for _, row in dataframe.iterrows():
            self.cell(100, 8, str(row['Description']), border=1)
            self.cell(60, 8, str(row['Amount (INR)']), border=1)
            self.ln()
        self.ln(5)

    def main_quotation_table(self, data, grand_total, tax, amount_words):
        self.set_font("Arial", "B", 10)
        headers = ["S. No.", "Items/Services", "Qty", "Unit Price", "Taxable Value", "Tax", "Subtotal"]
        table_width = self.w - 2 * self.l_margin
        col_props = [1, 3.5, 1, 1.5, 2, 2.7, 2]
        total_props = sum(col_props)
        col_widths = [table_width * (prop / total_props) for prop in col_props]
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 8, h, border=1, align="C")
        self.ln()
        self.set_font("Arial", "", 8)
        for i, row in enumerate(data, 1):
            row_data = [
                str(i),
                row["items_services"],
                str(row["qty"]),
                f"{row['unit_price']:.2f}",
                f"{row['taxable_value']:.2f}",
                "IGST 18%",
                f"{row['taxable_value'] + row['tax']:.2f}"
            ]
            lines = self.multi_cell(col_widths[1], 5, row_data[1], border=0, align="L", split_only=True)
            row_height = max(8, 5 * len(lines))
            y_start = self.get_y()
            x_start = self.get_x()
            self.set_xy(x_start, y_start)
            self.cell(col_widths[0], row_height, row_data[0], border=1)
            self.set_xy(x_start + col_widths[0], y_start)
            self.multi_cell(col_widths[1], 5, row_data[1], border=1, align="L")
            self.set_xy(x_start + col_widths[0] + col_widths[1], y_start)
            for j in range(2, 7):
                cell_text = row_data[j]
                if j in [3, 4, 5] and len(cell_text) > 15:
                    cell_text = cell_text[:12] + '...'
                self.cell(col_widths[j], row_height, cell_text, border=1, align="R" if j in [3, 5, 6] else "C")
            self.ln(row_height)
        self.set_font("Arial", "B", 10)
        self.cell(sum(col_widths[:4]), 8, "Grand Total:", border=1)
        self.cell(col_widths[4], 8, "", border=1)
        self.cell(col_widths[5], 8, f"INR {tax:,.2f}", border=1, align="R")
        self.cell(col_widths[6], 8, f"INR {grand_total:,.2f}", border=1, align="C")
        self.ln()
        label_width = col_widths[0] + col_widths[1]
        value_width = sum(col_widths[2:])
        self.set_font("Arial", "", 10)
        lines = self.multi_cell(value_width, 8, amount_words, border=0, align="L", split_only=True)
        value_height = 8 * len(lines)
        y_start = self.get_y()
        x_start = self.get_x()
        self.set_xy(x_start, y_start)
        self.set_font("Arial", "B", 10)
        self.cell(label_width, value_height, "Amount in Words:", border=1)
        self.set_xy(x_start + label_width, y_start)
        self.set_font("Arial", "", 10)
        self.multi_cell(value_width, 8, amount_words, border=1)
        self.ln(2)
        self.ln(8)

# --- Core Calculation Logic ---
def get_base_vm(vm_configs, user_vcpu):
    valid = [v for v in vm_configs.values() if v["vCPU"] <= user_vcpu]
    return max(valid, key=lambda x: x["vCPU"]) if valid else min(vm_configs.values(), key=lambda x: x["vCPU"])

def calculate_vm_costs(user_vcpus, user_ram, user_storage, num_vms):
    base_vm = get_base_vm(PRICING["vm_configs"], user_vcpus)
    extra_vcpu = max(0, user_vcpus - base_vm["vCPU"])
    extra_ram = max(0, user_ram - base_vm["RAM"])
    extra_storage = max(0, user_storage - base_vm["Storage"])
    vcpu_cost = extra_vcpu * PRICING["add_ons"]["vcpu_unit_price"]
    ram_cost = extra_ram * PRICING["add_ons"]["ram_per_gb"]
    storage_cost = ((extra_storage + 49) // 50) * PRICING["add_ons"]["storage_per_50gb"]
    per_vm_cost = base_vm["Price"] + vcpu_cost + ram_cost + storage_cost
    total_vm_monthly = per_vm_cost * num_vms
    total_vm_annual = total_vm_monthly * 12
    return {
        "base_vm": base_vm,
        "extra_vcpu": extra_vcpu,
        "extra_ram": extra_ram,
        "extra_storage": extra_storage,
        "vcpu_cost": vcpu_cost,
        "ram_cost": ram_cost,
        "storage_cost": storage_cost,
        "per_vm_cost": per_vm_cost,
        "total_vm_monthly": total_vm_monthly,
        "total_vm_annual": total_vm_annual,
    }

def calculate_management_costs(antivirus_qty, backup_qty, db_qty, os_type, os_qty):
    antivirus_cost = antivirus_qty * PRICING["management"]["antivirus"]
    os_cost = os_qty * PRICING["management"]["os_management_linux" if os_type == "linux" else "os_management_windows"]
    backup_cost = backup_qty * PRICING["management"]["backup_management"]
    db_cost = db_qty * PRICING["management"]["database_management"]
    mgmt_monthly = antivirus_cost + os_cost + backup_cost + db_cost
    mgmt_annual = mgmt_monthly * 12
    return {
        "antivirus_cost": antivirus_cost,
        "os_cost": os_cost,
        "backup_cost": backup_cost,
        "db_cost": db_cost,
        "mgmt_monthly": mgmt_monthly,
        "mgmt_annual": mgmt_annual,
    }

def calculate_final_total(total_vm_annual, mgmt_annual, bandwidth_cost, discount_percent):
    discount_amt = (total_vm_annual + mgmt_annual) * (discount_percent / 100)
    final_total = (total_vm_annual + mgmt_annual + bandwidth_cost - discount_amt)
    return final_total, discount_amt

def get_amount_in_words(amount):
    total_amount = round(amount, 2)
    main_amount_words = num2words(int(total_amount), lang='en_IN').replace(',', '').title()
    decimal_part = int(round((total_amount - int(total_amount)) * 100))
    if decimal_part > 0:
        decimal_words = ' '.join([num2words(int(d), lang='en_IN').title() for d in f'{decimal_part:02d}'])
        main_amount_words += f" Point {decimal_words}"
    main_amount_words += " Rupees Only"
    return main_amount_words

def generate_quotation_pdf(
    logo_path,
    customer_info,
    quotation_info,
    main_items_services,
    main_qty,
    main_unit_price,
    main_taxable_value,
    main_tax,
    main_grand_total,
    main_amount_words,
    df_vm,
    df_mgmt,
    df_summary
):
    pdf = PDF()
    pdf.add_page()
    pdf.quotation_header(logo_path, customer_info, quotation_info)
    pdf.main_quotation_table(
        data=[{
            "items_services": main_items_services,
            "item_description": main_items_services,
            "qty": main_qty,
            "unit_price": main_unit_price,
            "taxable_value": main_taxable_value,
            "tax": float(main_tax),
        }],
        grand_total=main_grand_total,
        tax=main_tax,
        amount_words=main_amount_words
    )
    pdf.add_terms_and_conditions()
    pdf.add_page()
    pdf.table("Infrastructure Cost", df_vm)
    pdf.table("Management Services", df_mgmt)
    pdf.simple_table(df_summary)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        pdf.output(tmp.name)
        with open(tmp.name, "rb") as f:
            pdf_bytes = f.read()
    os.remove(tmp.name)
    return pdf_bytes

# --- DataFrame Builders ---
def build_vm_dataframe(base_vm, extra_vcpu, extra_ram, extra_storage, vcpu_cost, ram_cost, storage_cost, num_vms):
    df_vm_rows = [
        {
            "Item/Specification": f"{base_vm['vCPU']}vCPU {base_vm['RAM']}GB {base_vm['Storage']}GB",
            "Qty": num_vms,
            "Unit Monthly Price": base_vm["Price"],
            "Total Monthly Price": base_vm["Price"] * num_vms,
            "Total Annual Price": base_vm["Price"] * num_vms * 12,
        }
    ]
    if extra_vcpu > 0:
        df_vm_rows.append({
            "Item/Specification": f"Extra vCPU x{extra_vcpu}",
            "Qty": num_vms,
            "Unit Monthly Price": PRICING["add_ons"]["vcpu_unit_price"],
            "Total Monthly Price": vcpu_cost,
            "Total Annual Price": vcpu_cost * 12,
        })
    if extra_ram > 0:
        df_vm_rows.append({
            "Item/Specification": f"Extra RAM x{extra_ram}GB",
            "Qty": num_vms,
            "Unit Monthly Price": PRICING["add_ons"]["ram_per_gb"],
            "Total Monthly Price": ram_cost,
            "Total Annual Price": ram_cost * 12,
        })
    if extra_storage > 0:
        df_vm_rows.append({
            "Item/Specification": f"Extra Storage x{extra_storage}GB",
            "Qty": num_vms,
            "Unit Monthly Price": PRICING["add_ons"]["storage_per_50gb"],
            "Total Monthly Price": storage_cost,
            "Total Annual Price": storage_cost * 12,
        })
    df_vm = pd.DataFrame(df_vm_rows)
    df_vm.index += 1
    return df_vm

def build_mgmt_dataframe(antivirus_qty, antivirus_cost, os_type, os_qty, os_cost, backup_qty, backup_cost, db_qty, db_cost):
    df_mgmt = pd.DataFrame([
        {"Item/Specification": "Antivirus", "Qty": antivirus_qty, "Unit Monthly Price": PRICING["management"]["antivirus"], "Total Monthly Price": antivirus_cost, "Total Annual Price": antivirus_cost * 12},
        {"Item/Specification": f"OS Mgmt ({os_type})", "Qty": os_qty, "Unit Monthly Price": PRICING["management"]["os_management_linux" if os_type == "linux" else "os_management_windows"], "Total Monthly Price": os_cost, "Total Annual Price": os_cost * 12},
        {"Item/Specification": "Backup", "Qty": backup_qty, "Unit Monthly Price": PRICING["management"]["backup_management"], "Total Monthly Price": backup_cost, "Total Annual Price": backup_cost * 12},
        {"Item/Specification": "Database Mgmt", "Qty": db_qty, "Unit Monthly Price": PRICING["management"]["database_management"], "Total Monthly Price": db_cost, "Total Annual Price": db_cost * 12},
    ])
    df_mgmt.index += 1
    return df_mgmt

def build_summary_dataframe(total_vm_annual, mgmt_annual, bw_choice, bandwidth_cost, discount_percent, discount_amt, final_total):
    summary = [
        {"Description": "Total Recurring (Infra + Mgmt)", "Amount (INR)": f"INR {(total_vm_annual + mgmt_annual):,.0f}"},
        {"Description": f"Bandwidth ({bw_choice})", "Amount (INR)": f"INR {bandwidth_cost:,.0f}"},
    ]
    if discount_percent > 0:
        summary.append({"Description": f"Discount ({discount_percent:.2f}%)", "Amount (INR)": f"-INR {discount_amt:,.0f}"})
    summary.append({"Description": "Final Quotation", "Amount (INR)": f"INR {final_total:,.0f}"})
    df_summary = pd.DataFrame(summary)
    df_summary.index += 1
    return df_summary

# --- Bandwidth Cost Helper ---
def get_bandwidth_cost(bw_choice):
    return PRICING["bandwidth"].get(bw_choice, 0) 