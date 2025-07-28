import React, { useState } from "react";
import "./QuotationGenerator.css";

const API_BASE = "http://localhost:9100"; // Change if backend runs elsewhere

const initialForm = {
  customer_name: "",
  customer_address: "",
  customer_gstn: "",
  customer_email: "",
  quotation_no: "",
  quotation_date: "",
  user_vcpus: 1,
  user_ram: 1,
  user_storage: 1,
  num_vms: 1,
  antivirus_qty: 0,
  backup_qty: 0,
  db_qty: 0,
  os_type: "linux",
  os_qty: 0,
  bw_choice: "Dedicated 10 MBPS",
  discount_percent: 0,
  apply_discount: false,
};

function QuotationGenerator({ isDarkMode }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle number input
  const handleNumber = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: Math.max(0, Number(value)) }));
  };

  // Handle radio
  const handleRadio = (e) => {
    setForm((prev) => ({ ...prev, os_type: e.target.value }));
  };

  // Handle discount toggle
  const handleDiscount = (e) => {
    setForm((prev) => ({
      ...prev,
      apply_discount: e.target.checked,
      discount_percent: e.target.checked ? prev.discount_percent : 0,
    }));
  };

  // Handle API call
  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const req = {
        customer_info: {
          name: form.customer_name,
          address: form.customer_address,
          gstn: form.customer_gstn,
          email: form.customer_email,
        },
        quotation_info: {
          number: form.quotation_no,
          date: form.quotation_date,
        },
        user_vcpus: Number(form.user_vcpus),
        user_ram: Number(form.user_ram),
        user_storage: Number(form.user_storage),
        num_vms: Number(form.num_vms),
        antivirus_qty: Number(form.antivirus_qty),
        backup_qty: Number(form.backup_qty),
        db_qty: Number(form.db_qty),
        os_type: form.os_type,
        os_qty: Number(form.os_qty),
        bw_choice: form.bw_choice,
        discount_percent: form.apply_discount ? parseFloat(form.discount_percent) : 0,
      };
      const res = await fetch(`${API_BASE}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error("Calculation failed");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    setError("");
    try {
      const req = {
        customer_info: {
          name: form.customer_name,
          address: form.customer_address,
          gstn: form.customer_gstn,
          email: form.customer_email,
        },
        quotation_info: {
          number: form.quotation_no,
          date: form.quotation_date,
        },
        user_vcpus: Number(form.user_vcpus),
        user_ram: Number(form.user_ram),
        user_storage: Number(form.user_storage),
        num_vms: Number(form.num_vms),
        antivirus_qty: Number(form.antivirus_qty),
        backup_qty: Number(form.backup_qty),
        db_qty: Number(form.db_qty),
        os_type: form.os_type,
        os_qty: Number(form.os_qty),
        bw_choice: form.bw_choice,
        discount_percent: form.apply_discount ? parseFloat(form.discount_percent) : 0,
      };
      const res = await fetch(`${API_BASE}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vm_quotation.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Error occurred");
    } finally {
      setPdfLoading(false);
    }
  };

  // Bandwidth options
  const bandwidthOptions = [
    "Dedicated 10 MBPS",
    "Default",
  ];

  return (
    <div className={isDarkMode ? 'dark-mode' : ''}>
      <div className="quotation-container">
        <div className="section-card">
          <form className="quotation-form" onSubmit={handleCalculate}>
            <div className="section-header"><span className="icon">📝</span>Quotation & Customer Info</div>
            <div className="form-row form-row-3">
              <div className="form-col">
                <label>Customer Company Name
                  <input name="customer_name" maxLength={50} value={form.customer_name} onChange={handleChange} required />
                </label>
              </div>
              <div className="form-col">
                <label>Customer GSTN
                  <input name="customer_gstn" maxLength={20} value={form.customer_gstn} onChange={handleChange} />
                </label>
              </div>
              <div className="form-col">
                <label>Customer Email (optional)
                  <input name="customer_email" maxLength={40} value={form.customer_email} onChange={handleChange} />
                </label>
              </div>
            </div>
            <div className="form-row form-row-3">
              <div className="form-col">
                <label>Customer Address
                  <textarea name="customer_address" maxLength={120} value={form.customer_address} onChange={handleChange} required />
                </label>
              </div>
              <div className="form-col">
                <label>Quotation No.
                  <input name="quotation_no" maxLength={20} value={form.quotation_no} onChange={handleChange} required />
                </label>
              </div>
              <div className="form-col">
                <label>Quotation Date
                  <input name="quotation_date" type="date" value={form.quotation_date} onChange={handleChange} required />
                </label>
              </div>
            </div>

            <div className="section-header"><span className="icon">💻</span>VM Requirements</div>
            <div className="vm-hint">
              Enter your VM requirement like: <span className="vm-example">8vCPU 32GB RAM 1000GB Storage</span>
            </div>
            <div className="form-row">
              <div className="form-col">
                <label>How many VMs?
                  <input name="num_vms" type="number" min={1} value={form.num_vms} onChange={handleNumber} required />
                </label>
                <label>No. of vCPUs
                  <input name="user_vcpus" type="number" min={1} value={form.user_vcpus} onChange={handleNumber} required />
                </label>
              </div>
              <div className="form-col">
                <label>RAM (GB)
                  <input name="user_ram" type="number" min={1} value={form.user_ram} onChange={handleNumber} required />
                </label>
                <label>Storage (GB)
                  <input name="user_storage" type="number" min={1} value={form.user_storage} onChange={handleNumber} required />
                </label>
              </div>
            </div>
            {result && result.base_vm && (
              <div className="base-vm-info">
                Selected Base VM: {result.base_vm.vCPU}vCPU | {result.base_vm.RAM}GB RAM | {result.base_vm.Storage}GB → ₹{result.base_vm.Price.toLocaleString()} / mo
              </div>
            )}

            <div className="section-header"><span className="icon">🛡️</span>Management Services</div>
            <div className="form-row">
              <div className="form-col">
                <label>Antivirus (VMs)
                  <input name="antivirus_qty" type="number" min={0} value={form.antivirus_qty} onChange={handleNumber} />
                </label>
                <label>Backup Management VMs
                  <input name="backup_qty" type="number" min={0} value={form.backup_qty} onChange={handleNumber} />
                </label>
                <label>Databases to Manage
                  <input name="db_qty" type="number" min={0} value={form.db_qty} onChange={handleNumber} />
                </label>
              </div>
              <div className="form-col">
                <label>OS Type</label>
                <div className="radio-row">
                  <label><input type="radio" name="os_type" value="linux" checked={form.os_type === "linux"} onChange={handleRadio} /> linux</label>
                  <label><input type="radio" name="os_type" value="windows" checked={form.os_type === "windows"} onChange={handleRadio} /> windows</label>
                </div>
                <label>{form.os_type === "linux" ? "Linux OS Mgmt VMs" : "Windows OS Mgmt vCPUs"}
                  <input name="os_qty" type="number" min={0} value={form.os_qty} onChange={handleNumber} />
                </label>
              </div>
            </div>

            <div className="section-header"><span className="icon">🌐</span>Bandwidth & <span className="icon">💸</span>Discount</div>
            <div className="form-row">
              <div className="form-col">
                <h2>Bandwidth (Annual)</h2>
                <label>Bandwidth
                  <select name="bw_choice" value={form.bw_choice} onChange={handleChange}>
                    {bandwidthOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-col">
                <h2>Optional Discount</h2>
                <label>
                  <input type="checkbox" checked={form.apply_discount} onChange={handleDiscount} /> Apply Discount?
                </label>
                {form.apply_discount && (
                  <label>Discount (%)
                    <input name="discount_percent" type="number" min={0} max={100} step="0.01" value={form.discount_percent} onChange={handleNumber} />
                  </label>
                )}
              </div>
            </div>
            <button type="submit" disabled={loading}>{loading ? "Calculating..." : "Calculate Quotation"}</button>
          </form>
        </div>
        {error && <div className="error">{error}</div>}
        {result && (
          <div className="section-card">
            <div className="section-header"><span className="icon">📊</span>Quotation Summary</div>
            <div className="results-section">
              <h3>Infrastructure Cost</h3>
              <Table data={result.vm_table} />
              <h3>Management Services</h3>
              <Table data={result.mgmt_table} />
              <h3>Final Summary</h3>
              <Table data={result.summary} />
              <button onClick={handleDownloadPDF} disabled={pdfLoading}>{pdfLoading ? "Generating PDF..." : "Download Final Quotation as PDF"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Table({ data }) {
  if (!data || data.length === 0) return null;
  const headers = Object.keys(data[0]);
  return (
    <table className="quotation-table">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {headers.map((h) => (
              <td key={h}>{row[h]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default QuotationGenerator; 