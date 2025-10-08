from fastapi import FastAPI, File, UploadFile, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import os
import shutil
from datetime import datetime

from app import core_logic
from Information import TenderAnalyzer

app = FastAPI()

# CORS (dev-friendly; tighten for prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

######################  TISHA   API #######################################
@app.post("/extract-info/")
async def extract_info(file: UploadFile = File(...)):
    pdf_path = f"temp_{file.filename}"
    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    analyzer = TenderAnalyzer(pdf_path)
    analyzer.process_document()
    excel_file = f"{pdf_path}_structured.xlsx"
    analyzer.generate_excel_report(excel_file)

    return FileResponse(excel_file, filename=os.path.basename(excel_file))
######################  TISHA   API END ###################################

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ---------- Models ----------
class CustomerInfo(BaseModel):
    name: str
    address: str
    gstn: Optional[str] = None
    email: Optional[str] = None


class QuotationInfo(BaseModel):
    number: str
    date: str  # keep as string (YYYY-MM-DD)


class VMConfiguration(BaseModel):
    # Per-VM config (matches your React payload)
    name: Optional[str] = "VM"
    vcpus: int = Field(..., ge=0)
    ram: int = Field(..., ge=0)
    storage: int = Field(..., ge=0)
    quantity: int = Field(..., ge=0)

    antivirus_qty: int = 0
    backup_qty: int = 0
    db_qty: int = 0
    os_type: str = "linux"     # "linux" | "windows"
    os_qty: int = 0
    bw_choice: str = "Default" # "Default" | "Dedicated 10 MBPS"
    discount_percent: float = 0.0


class QuotationRequest(BaseModel):
    customer_info: CustomerInfo
    quotation_info: QuotationInfo

    # Legacy single-VM fields (optional for backward compatibility)
    user_vcpus: Optional[int] = 1
    user_ram: Optional[int] = 1
    user_storage: Optional[int] = 1
    num_vms: Optional[int] = 1

    # Legacy single-VM service knobs (optional)
    antivirus_qty: Optional[int] = 0
    backup_qty: Optional[int] = 0
    db_qty: Optional[int] = 0
    os_type: Optional[str] = "linux"
    os_qty: Optional[int] = 0

    # A global bandwidth/discount (optional, used if per-VM not present)
    bw_choice: Optional[str] = None
    discount_percent: Optional[float] = 0.0

    # New multi-VM array (preferred)
    vm_configurations: Optional[List[VMConfiguration]] = []


# ---------- Helpers ----------
def df_to_dict(df):
    return df.fillna(0).astype(str).to_dict(orient="records")


def _label_items_with_vm_name(df, vm_name: str):
    """Prefix the Item/Specification with the VM name to make tables readable."""
    if df is None or df.empty:
        return df
    df = df.copy()
    if "Item/Specification" in df.columns:
        df["Item/Specification"] = df["Item/Specification"].apply(
            lambda s: f"{vm_name}: {s}"
        )
    return df


def _aggregate_multi_vm(req: QuotationRequest):
    """
    Run core_logic per VM configuration & aggregate totals and tables.
    We do not change core_logic; we just sum results here.
    """
    total_vm_annual_sum = 0
    total_mgmt_annual_sum = 0
    vm_table_frames = []
    mgmt_table_frames = []

    # Decide bandwidth:
    # 1) If global bw_choice is given, use that once.
    # 2) Else, if any VM has non-default choice, use the max priced choice once.
    if req.bw_choice:
        bandwidth_cost = core_logic.get_bandwidth_cost(req.bw_choice)
        bandwidth_desc = req.bw_choice
    else:
        # collect non-default choices across VMs
        choices = [vm.bw_choice for vm in req.vm_configurations or [] if vm.bw_choice and vm.bw_choice != "Default"]
        if choices:
            # choose the highest priced one (once)
            unique = list(set(choices))
            priced = [(ch, core_logic.get_bandwidth_cost(ch)) for ch in unique]
            priced.sort(key=lambda x: x[1], reverse=True)
            bandwidth_desc, bandwidth_cost = priced[0][0], priced[0][1]
        else:
            bandwidth_desc, bandwidth_cost = "Default", 0

    # Discount:
    # - We accumulate per-VM discount on (infra + mgmt) and subtract at the end.
    total_discount_amt = 0.0

    # Run each VM
    for vm in (req.vm_configurations or []):
        vm_cost = core_logic.calculate_vm_costs(
            user_vcpus=vm.vcpus,
            user_ram=vm.ram,
            user_storage=vm.storage,
            num_vms=vm.quantity,
        )

        mgmt_cost = core_logic.calculate_management_costs(
            antivirus_qty=vm.antivirus_qty,
            backup_qty=vm.backup_qty,
            db_qty=vm.db_qty,
            os_type=vm.os_type,
            os_qty=vm.os_qty,
        )

        # Aggregate totals
        total_vm_annual_sum += vm_cost["total_vm_annual"]
        total_mgmt_annual_sum += mgmt_cost["mgmt_annual"]

        # Per-VM discount against infra + mgmt
        per_vm_subtotal = vm_cost["total_vm_annual"] + mgmt_cost["mgmt_annual"]
        per_vm_discount = per_vm_subtotal * (float(vm.discount_percent or 0) / 100.0)
        total_discount_amt += per_vm_discount

        # Build/label tables per VM and append
        df_vm = core_logic.build_vm_dataframe(
            vm_cost["base_vm"],
            vm_cost["extra_vcpu"],
            vm_cost["extra_ram"],
            vm_cost["extra_storage"],
            vm_cost["vcpu_cost"],
            vm_cost["ram_cost"],
            vm_cost["storage_cost"],
            vm.quantity,
        )
        df_vm = _label_items_with_vm_name(df_vm, vm.name or "VM")
        vm_table_frames.append(df_vm)

        df_mgmt = core_logic.build_mgmt_dataframe(
            vm.antivirus_qty,
            mgmt_cost["antivirus_cost"],
            vm.os_type,
            vm.os_qty,
            mgmt_cost["os_cost"],
            vm.backup_qty,
            mgmt_cost["backup_cost"],
            vm.db_qty,
            mgmt_cost["db_cost"],
        )
        df_mgmt = _label_items_with_vm_name(df_mgmt, vm.name or "VM")
        mgmt_table_frames.append(df_mgmt)

    # Fall back to legacy single-VM if vm_configurations is empty
    if not (req.vm_configurations and len(req.vm_configurations) > 0):
        vm_cost = core_logic.calculate_vm_costs(
            user_vcpus=int(req.user_vcpus or 1),
            user_ram=int(req.user_ram or 1),
            user_storage=int(req.user_storage or 1),
            num_vms=int(req.num_vms or 1),
        )
        mgmt_cost = core_logic.calculate_management_costs(
            antivirus_qty=int(req.antivirus_qty or 0),
            backup_qty=int(req.backup_qty or 0),
            db_qty=int(req.db_qty or 0),
            os_type=(req.os_type or "linux"),
            os_qty=int(req.os_qty or 0),
        )

        total_vm_annual_sum += vm_cost["total_vm_annual"]
        total_mgmt_annual_sum += mgmt_cost["mgmt_annual"]

        # Use the global discount (legacy)
        total_discount_amt += (vm_cost["total_vm_annual"] + mgmt_cost["mgmt_annual"]) * (
            float(req.discount_percent or 0) / 100.0
        )

        df_vm = core_logic.build_vm_dataframe(
            vm_cost["base_vm"],
            vm_cost["extra_vcpu"],
            vm_cost["extra_ram"],
            vm_cost["extra_storage"],
            vm_cost["vcpu_cost"],
            vm_cost["ram_cost"],
            vm_cost["storage_cost"],
            int(req.num_vms or 1),
        )
        vm_table_frames.append(df_vm)

        df_mgmt = core_logic.build_mgmt_dataframe(
            int(req.antivirus_qty or 0),
            mgmt_cost["antivirus_cost"],
            (req.os_type or "linux"),
            int(req.os_qty or 0),
            mgmt_cost["os_cost"],
            int(req.backup_qty or 0),
            mgmt_cost["backup_cost"],
            int(req.db_qty or 0),
            mgmt_cost["db_cost"],
        )
        mgmt_table_frames.append(df_mgmt)

        # If bandwidth not decided earlier, use legacy global
        if req.bw_choice is not None:
            bandwidth_desc = req.bw_choice
            bandwidth_cost = core_logic.get_bandwidth_cost(req.bw_choice)

    # Concatenate tables
    import pandas as pd
    df_vm_all = pd.concat(vm_table_frames, ignore_index=False) if vm_table_frames else pd.DataFrame()
    df_mgmt_all = pd.concat(mgmt_table_frames, ignore_index=False) if mgmt_table_frames else pd.DataFrame()

    # Summary / final total
    total_without_discount = total_vm_annual_sum + total_mgmt_annual_sum
    final_total = total_without_discount + bandwidth_cost - total_discount_amt

    df_summary = core_logic.build_summary_dataframe(
        total_vm_annual=total_vm_annual_sum,
        mgmt_annual=total_mgmt_annual_sum,
        bw_choice=bandwidth_desc,
        bandwidth_cost=bandwidth_cost,
        discount_percent=(0.0),  # the summary table prints only one discount line; we add an explicit row below
        discount_amt=0.0,
        final_total=final_total
    )

    # Add a single combined “Discount” line (sum of all per-VM discounts)
    if total_discount_amt > 0:
        extra = pd.DataFrame(
            [{"Description": "Discount (combined)", "Amount (INR)": f"-INR {total_discount_amt:,.0f}"}]
        )
        df_summary = pd.concat([df_summary.iloc[[0]],  # Total Recurring
                                df_summary.iloc[[1]],  # Bandwidth
                                extra,
                                df_summary.iloc[[2]]], # Final Quotation
                               ignore_index=True)

    return df_vm_all, df_mgmt_all, df_summary, {
        "total_vm_annual": total_vm_annual_sum,
        "mgmt_annual": total_mgmt_annual_sum,
        "bandwidth_cost": bandwidth_cost,
        "discount_amt": total_discount_amt,
        "final_total": final_total,
    }


# ---------- Endpoints ----------
@app.post("/calculate")
def calculate_quotation(data: QuotationRequest):
    df_vm, df_mgmt, df_summary, totals = _aggregate_multi_vm(data)

    # Convert tables to JSON-friendly lists:
    vm_table = df_to_dict(df_vm) if not df_vm.empty else []
    mgmt_table = df_to_dict(df_mgmt) if not df_mgmt.empty else []
    summary = df_to_dict(df_summary) if not df_summary.empty else []

    # Minimal legacy block so older UI won’t crash
    legacy = {
        "base_vm": {},
        "extra_vcpu": 0,
        "extra_ram": 0,
        "extra_storage": 0,
        "vcpu_cost": 0,
        "ram_cost": 0,
        "storage_cost": 0,
        "per_vm_cost": 0,
        "total_vm_monthly": 0,
        "total_vm_annual": totals["total_vm_annual"],
        "antivirus_cost": 0,
        "os_cost": 0,
        "backup_cost": 0,
        "db_cost": 0,
        "mgmt_monthly": 0,
        "mgmt_annual": totals["mgmt_annual"],
        "bandwidth_cost": totals["bandwidth_cost"],
        "discount_amt": totals["discount_amt"],
        "final_total": totals["final_total"],
    }

    return {
        **legacy,
        "summary": summary,
        "vm_table": vm_table,
        "mgmt_table": mgmt_table,
    }


@app.post("/generate-pdf")
def generate_pdf(data: QuotationRequest):
    import pandas as pd

    # Aggregate numbers/tables once
    df_vm, df_mgmt, df_summary, totals = _aggregate_multi_vm(data)

    # ---- Build multi-row main table ----
    rows = []
    taxable_sum = 0.0
    tax_sum = 0.0

    # For each VM config, compute (infra + mgmt - per-VM discount) as a row
    if data.vm_configurations and len(data.vm_configurations) > 0:
        for vm in data.vm_configurations:
            vm_cost = core_logic.calculate_vm_costs(vm.vcpus, vm.ram, vm.storage, vm.quantity)
            mgmt_cost = core_logic.calculate_management_costs(
                vm.antivirus_qty, vm.backup_qty, vm.db_qty, vm.os_type, vm.os_qty
            )
            per_vm_subtotal = vm_cost["total_vm_annual"] + mgmt_cost["mgmt_annual"]
            per_vm_discount = per_vm_subtotal * (float(vm.discount_percent or 0) / 100.0)
            taxable = float(per_vm_subtotal - per_vm_discount)
            tax = round(taxable * 0.18, 2)

            desc = (
                f"{vm.name or 'VM'} {vm.vcpus}vCPU {vm.ram}GB RAM {vm.storage}GB Storage, "
                f"Mgmt & Security Services"
                + (f", Discount {vm.discount_percent:.2f}%" if vm.discount_percent else "")
            )

            rows.append({
                "items_services": desc,
                "qty": vm.quantity,
                # You can show 0.00 here if you don't want to expose per-VM unit
                "unit_price": taxable / vm.quantity ,
                "taxable_value": taxable,
                "tax": tax,
            })
            taxable_sum += taxable
            tax_sum += tax

    # Add one Bandwidth row if there is any bandwidth charge
    if totals["bandwidth_cost"] > 0:
        bw_desc = df_summary.iloc[1]["Description"] if not df_summary.empty and len(df_summary) > 1 else "Bandwidth"
        taxable = float(totals["bandwidth_cost"])
        tax = round(taxable * 0.18, 2)

        rows.append({
            "items_services": f"{bw_desc}",
            "qty": 1,
            "unit_price": 0.0,
            "taxable_value": taxable,
            "tax": tax,
        })
        taxable_sum += taxable
        tax_sum += tax

    # Fallback to legacy single line if no rows were built
    if not rows:
        # Legacy single VM printable line (kept as backup)
        main_items_services = "Virtual Machines, Management & Security Services"
        main_qty = int(data.num_vms or 1)
        taxable_sum = float(totals["final_total"])
        tax_sum = round(taxable_sum * 0.18, 2)
        rows = [{
            "items_services": main_items_services,
            "qty": main_qty,
            "unit_price": 0.0,
            "taxable_value": taxable_sum,
            "tax": tax_sum,
        }]

    grand_total = taxable_sum + tax_sum
    amount_words = core_logic.get_amount_in_words(grand_total)

    # ---- Render PDF manually using core_logic.PDF so we can pass multiple rows ----
    from app.core_logic import PDF as CLPDF

    logo_path = os.path.join(BASE_DIR, "phoneme_logo.png")
    pdf = CLPDF()
    pdf.add_page()
    pdf.quotation_header(logo_path, data.customer_info.dict(), data.quotation_info.dict())
    pdf.main_quotation_table(rows, grand_total, tax_sum, amount_words)
    pdf.add_terms_and_conditions()

    # Page 2: detailed tables
    pdf.add_page()
    if not df_vm.empty:
        pdf.table("Infrastructure Cost", df_vm)
    if not df_mgmt.empty:
        pdf.table("Management Services", df_mgmt)
    if not df_summary.empty:
        pdf.simple_table(df_summary)

    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        pdf.output(tmp.name)
        with open(tmp.name, "rb") as f:
            pdf_bytes = f.read()
    os.remove(tmp.name)

    return Response(
        pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=vm_quotation.pdf"},
    )


# ---------- VM Monitoring Endpoints ----------
class VMStatus(BaseModel):
    id: Optional[int] = None
    ip: str
    status: str  # "reachable" or "not reachable"
    created_at: Optional[datetime] = None
    vm_master: Optional[dict] = None

class VMMaster(BaseModel):
    id: Optional[int] = None
    vm_name: str
    ip: str
    project_name: Optional[str] = None
    cluster: Optional[str] = None
    created_at: Optional[datetime] = None

# In-memory storage for demo purposes (replace with database in production)
vm_status_data = []
vm_master_data = [
    {
        "id": 1,
        "vm_name": "Web Server 1",
        "ip": "192.168.1.10",
        "project_name": "E-commerce Platform",
        "cluster": "Production",
        "created_at": datetime.now().isoformat()
    },
    {
        "id": 2,
        "vm_name": "Database Server",
        "ip": "192.168.1.11",
        "project_name": "E-commerce Platform",
        "cluster": "Production",
        "created_at": datetime.now().isoformat()
    },
    {
        "id": 3,
        "vm_name": "Test Server",
        "ip": "192.168.1.20",
        "project_name": "Development",
        "cluster": "Testing",
        "created_at": datetime.now().isoformat()
    }
]

# Add some sample status data
vm_status_data = [
    {
        "id": 1,
        "ip": "192.168.1.10",
        "status": "reachable",
        "created_at": datetime.now().isoformat(),
        "vm_master": vm_master_data[0]
    },
    {
        "id": 2,
        "ip": "192.168.1.11",
        "status": "reachable",
        "created_at": datetime.now().isoformat(),
        "vm_master": vm_master_data[1]
    },
    {
        "id": 3,
        "ip": "192.168.1.20",
        "status": "not reachable",
        "created_at": datetime.now().isoformat(),
        "vm_master": vm_master_data[2]
    }
]

@app.get("/status")
async def get_vm_status():
    """Get VM status data"""
    return vm_status_data

@app.get("/vm")
async def get_vm_master():
    """Get VM master data"""
    return vm_master_data

@app.post("/vm")
async def create_vm(vm_data: VMMaster):
    """Create a new VM"""
    vm_data.id = len(vm_master_data) + 1
    vm_data.created_at = datetime.now()
    vm_master_data.append(vm_data.dict())
    return vm_data

@app.put("/vm/{vm_id}")
async def update_vm(vm_id: int, vm_data: VMMaster):
    """Update a VM"""
    for i, vm in enumerate(vm_master_data):
        if vm.get("id") == vm_id:
            vm_data.id = vm_id
            vm_data.created_at = vm.get("created_at", datetime.now())
            vm_master_data[i] = vm_data.dict()
            return vm_data
    raise HTTPException(status_code=404, detail="VM not found")

@app.delete("/vm/{vm_id}")
async def delete_vm(vm_id: int):
    """Delete a VM"""
    for i, vm in enumerate(vm_master_data):
        if vm.get("id") == vm_id:
            deleted_vm = vm_master_data.pop(i)
            return {"message": "VM deleted successfully", "vm": deleted_vm}
    raise HTTPException(status_code=404, detail="VM not found")

@app.post("/status")
async def create_vm_status(status_data: VMStatus):
    """Create a new VM status entry"""
    status_data.id = len(vm_status_data) + 1
    status_data.created_at = datetime.now()
    vm_status_data.append(status_data.dict())
    return status_data