from fastapi import FastAPI, File, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
# from datetime import date
# import pandas as pd
from backend_Quotation import core_logic
# import tempfile
import os
from fastapi.responses import FileResponse
import shutil
from Information import TenderAnalyzer
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # For production, specify your frontend URL
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

######################  TISHA   API #######################################

@app.post("/extract-info/")
async def extract_info(file: UploadFile = File(...)):
    # Save uploaded file
    pdf_path = f"temp_{file.filename}"
    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    # Process PDF
    analyzer = TenderAnalyzer(pdf_path)
    analyzer.process_document()
    excel_file = f"{pdf_path}_structured.xlsx"
    analyzer.generate_excel_report(excel_file)
    # Return Excel file
    response = FileResponse(excel_file, filename=os.path.basename(excel_file))
    # Optionally, cleanup files after sending (for production, use background tasks)
    return response

######################  TISHA   API END #######################################

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# app = FastAPI()

# Allow CORS for local React dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class CustomerInfo(BaseModel):
    name: str
    address: str
    gstn: Optional[str] = None
    email: Optional[str] = None

class QuotationInfo(BaseModel):
    number: str
    date: str  # Accept as string for easier frontend integration

class QuotationRequest(BaseModel):
    customer_info: CustomerInfo
    quotation_info: QuotationInfo
    user_vcpus: int
    user_ram: int
    user_storage: int
    num_vms: int
    antivirus_qty: int
    backup_qty: int
    db_qty: int
    os_type: str
    os_qty: int
    bw_choice: str
    discount_percent: float = 0

class CalculationResponse(BaseModel):
    base_vm: dict
    extra_vcpu: int
    extra_ram: int
    extra_storage: int
    vcpu_cost: int
    ram_cost: int
    storage_cost: int
    per_vm_cost: int
    total_vm_monthly: int
    total_vm_annual: int
    antivirus_cost: int
    os_cost: int
    backup_cost: int
    db_cost: int
    mgmt_monthly: int
    mgmt_annual: int
    bandwidth_cost: int
    discount_amt: float
    final_total: float
    summary: list
    vm_table: list
    mgmt_table: list

# --- Helper to convert DataFrame to list of dicts for JSON ---
def df_to_dict(df):
    return df.fillna(0).astype(str).to_dict(orient="records")

# --- Calculate Endpoint ---
@app.post("/calculate", response_model=CalculationResponse)
def calculate_quotation(data: QuotationRequest):
    # VM costs
    vm = core_logic.calculate_vm_costs(data.user_vcpus, data.user_ram, data.user_storage, data.num_vms)
    # Management costs
    mgmt = core_logic.calculate_management_costs(
        data.antivirus_qty, data.backup_qty, data.db_qty, data.os_type, data.os_qty
    )
    # Bandwidth
    bandwidth_cost = core_logic.get_bandwidth_cost(data.bw_choice)
    # Final total
    final_total, discount_amt = core_logic.calculate_final_total(
        vm["total_vm_annual"], mgmt["mgmt_annual"], bandwidth_cost, data.discount_percent
    )
    # Tables
    df_vm = core_logic.build_vm_dataframe(
        vm["base_vm"], vm["extra_vcpu"], vm["extra_ram"], vm["extra_storage"],
        vm["vcpu_cost"], vm["ram_cost"], vm["storage_cost"], data.num_vms
    )
    df_mgmt = core_logic.build_mgmt_dataframe(
        data.antivirus_qty, mgmt["antivirus_cost"], data.os_type, data.os_qty, mgmt["os_cost"],
        data.backup_qty, mgmt["backup_cost"], data.db_qty, mgmt["db_cost"]
    )
    df_summary = core_logic.build_summary_dataframe(
        vm["total_vm_annual"], mgmt["mgmt_annual"], data.bw_choice, bandwidth_cost,
        data.discount_percent, discount_amt, final_total
    )
    return CalculationResponse(
        base_vm=vm["base_vm"],
        extra_vcpu=vm["extra_vcpu"],
        extra_ram=vm["extra_ram"],
        extra_storage=vm["extra_storage"],
        vcpu_cost=vm["vcpu_cost"],
        ram_cost=vm["ram_cost"],
        storage_cost=vm["storage_cost"],
        per_vm_cost=vm["per_vm_cost"],
        total_vm_monthly=vm["total_vm_monthly"],
        total_vm_annual=vm["total_vm_annual"],
        antivirus_cost=mgmt["antivirus_cost"],
        os_cost=mgmt["os_cost"],
        backup_cost=mgmt["backup_cost"],
        db_cost=mgmt["db_cost"],
        mgmt_monthly=mgmt["mgmt_monthly"],
        mgmt_annual=mgmt["mgmt_annual"],
        bandwidth_cost=bandwidth_cost,
        discount_amt=discount_amt,
        final_total=final_total,
        summary=df_to_dict(df_summary),
        vm_table=df_to_dict(df_vm),
        mgmt_table=df_to_dict(df_mgmt),
    )

# --- PDF Generation Endpoint ---
@app.post("/generate-pdf")
def generate_pdf(data: QuotationRequest):
    # VM costs
    vm = core_logic.calculate_vm_costs(data.user_vcpus, data.user_ram, data.user_storage, data.num_vms)
    mgmt = core_logic.calculate_management_costs(
        data.antivirus_qty, data.backup_qty, data.db_qty, data.os_type, data.os_qty
    )
    bandwidth_cost = core_logic.get_bandwidth_cost(data.bw_choice)
    final_total, discount_amt = core_logic.calculate_final_total(
        vm["total_vm_annual"], mgmt["mgmt_annual"], bandwidth_cost, data.discount_percent
    )
    df_vm = core_logic.build_vm_dataframe(
        vm["base_vm"], vm["extra_vcpu"], vm["extra_ram"], vm["extra_storage"],
        vm["vcpu_cost"], vm["ram_cost"], vm["storage_cost"], data.num_vms
    )
    df_mgmt = core_logic.build_mgmt_dataframe(
        data.antivirus_qty, mgmt["antivirus_cost"], data.os_type, data.os_qty, mgmt["os_cost"],
        data.backup_qty, mgmt["backup_cost"], data.db_qty, mgmt["db_cost"]
    )
    df_summary = core_logic.build_summary_dataframe(
        vm["total_vm_annual"], mgmt["mgmt_annual"], data.bw_choice, bandwidth_cost,
        data.discount_percent, discount_amt, final_total
    )
    # Main table for PDF
    main_items_services = f"App server {data.user_vcpus}vCPU {data.user_ram}GB RAM {data.user_storage}GB Storage, Antivirus, OS Managemnt({data.os_type.title()}), Backup Management"
    main_qty = data.num_vms
    main_unit_price = vm["per_vm_cost"]
    main_taxable_value = final_total
    main_tax = round(main_taxable_value * 0.18, 2)
    main_grand_total = main_taxable_value + main_tax
    main_amount_words = core_logic.get_amount_in_words(main_grand_total)
    # Logo path (absolute)
    logo_path = os.path.join(BASE_DIR, "phoneme_logo.png")
    pdf_bytes = core_logic.generate_quotation_pdf(
        logo_path,
        data.customer_info.dict(),
        data.quotation_info.dict(),
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
    )
    return Response(pdf_bytes, media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=vm_quotation.pdf"
    }) 