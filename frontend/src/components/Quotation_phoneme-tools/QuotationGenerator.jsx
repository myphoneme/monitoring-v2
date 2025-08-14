import React, { useState } from "react";
import { FileText, Server, Shield, Globe, Percent, Calculator, Download, Building2, Mail, Calendar, Cpu, HardDrive, Database, Wifi } from "lucide-react";
import styles from "./QuotationGenerator.module.css";

const API_BASE = "http://localhost:9200"; // Change if backend runs elsewhere

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
    const { name, value, type } = e.target;
    const checked = e.target.checked;
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
    <div className={`${styles.quotationWrapper} ${isDarkMode ? styles.darkMode : ''}`}>
      <div className={styles.quotationContainer}>
        <div className={styles.formCard}>
          <form className={styles.quotationForm} onSubmit={handleCalculate}>
            {/* Customer Information Section */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <Building2 className={styles.sectionIcon} />
                <h2>Quotation & Customer Info</h2>
              </div>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Customer Company Name</label>
                  <input 
                    className={styles.formInput}
                    name="customer_name" 
                    maxLength={50} 
                    value={form.customer_name} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter company name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Customer GSTN</label>
                  <input 
                    className={styles.formInput}
                    name="customer_gstn" 
                    maxLength={20} 
                    value={form.customer_gstn} 
                    onChange={handleChange} 
                    placeholder="Enter GSTN number"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Customer Email (optional)</label>
                  <input 
                    className={styles.formInput}
                    name="customer_email" 
                    type="email"
                    maxLength={40} 
                    value={form.customer_email} 
                    onChange={handleChange} 
                    placeholder="customer@example.com"
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Customer Address</label>
                  <textarea 
                    className={styles.formTextarea}
                    name="customer_address" 
                    maxLength={120} 
                    value={form.customer_address} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter complete address"
                    rows={2}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Quotation No.</label>
                  <input 
                    className={styles.formInput}
                    name="quotation_no" 
                    maxLength={20} 
                    value={form.quotation_no} 
                    onChange={handleChange} 
                    required 
                    placeholder="QT-2024-001"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Quotation Date</label>
                  <input 
                    className={styles.formInput}
                    name="quotation_date" 
                    type="date" 
                    value={form.quotation_date} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* VM Requirements Section */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <Server className={styles.sectionIcon} />
                <h2>VM Requirements</h2>
              </div>
              
              <div className={styles.vmHint}>
                Enter your VM requirement like: <strong>8vCPU 32GB RAM 1000GB Storage</strong>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>How many VMs?</label>
                  <input 
                    className={styles.formInput}
                    name="num_vms" 
                    type="number" 
                    min={1} 
                    value={form.num_vms} 
                    onChange={handleNumber} 
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>RAM (GB)</label>
                  <input 
                    className={styles.formInput}
                    name="user_ram" 
                    type="number" 
                    min={1} 
                    value={form.user_ram} 
                    onChange={handleNumber} 
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>No. of vCPUs</label>
                  <input 
                    className={styles.formInput}
                    name="user_vcpus" 
                    type="number" 
                    min={1} 
                    value={form.user_vcpus} 
                    onChange={handleNumber} 
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Storage (GB)</label>
                  <input 
                    className={styles.formInput}
                    name="user_storage" 
                    type="number" 
                    min={1} 
                    value={form.user_storage} 
                    onChange={handleNumber} 
                    required 
                  />
                </div>
              </div>

              {result && result.base_vm && (
                <div className={styles.baseVmInfo}>
                  <Server className={styles.vmIcon} />
                  <div>
                    <strong>Selected Base VM:</strong> {result.base_vm.vCPU}vCPU | {result.base_vm.RAM}GB RAM | {result.base_vm.Storage}GB
                    <div className={styles.vmPrice}>₹{result.base_vm.Price.toLocaleString()} / month</div>
                  </div>
                </div>
              )}
            </div>

            {/* Management Services Section */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <Shield className={styles.sectionIcon} />
                <h2>Management Services</h2>
              </div>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Antivirus (VMs)</label>
                  <input 
                    className={styles.formInput}
                    name="antivirus_qty" 
                    type="number" 
                    min={0} 
                    value={form.antivirus_qty} 
                    onChange={handleNumber} 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>OS Type</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioOption}>
                      <input 
                        type="radio" 
                        name="os_type" 
                        value="linux" 
                        checked={form.os_type === "linux"} 
                        onChange={handleRadio} 
                      />
                      <span className={styles.radioCheckmark}></span>
                      linux
                    </label>
                    <label className={styles.radioOption}>
                      <input 
                        type="radio" 
                        name="os_type" 
                        value="windows" 
                        checked={form.os_type === "windows"} 
                        onChange={handleRadio} 
                      />
                      <span className={styles.radioCheckmark}></span>
                      windows
                    </label>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Backup Management VMs</label>
                  <input 
                    className={styles.formInput}
                    name="backup_qty" 
                    type="number" 
                    min={0} 
                    value={form.backup_qty} 
                    onChange={handleNumber} 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    {form.os_type === "linux" ? "Linux OS Mgmt VMs" : "Windows OS Mgmt vCPUs"}
                  </label>
                  <input 
                    className={styles.formInput}
                    name="os_qty" 
                    type="number" 
                    min={0} 
                    value={form.os_qty} 
                    onChange={handleNumber} 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Databases to Manage</label>
                  <input 
                    className={styles.formInput}
                    name="db_qty" 
                    type="number" 
                    min={0} 
                    value={form.db_qty} 
                    onChange={handleNumber} 
                  />
                </div>
              </div>
            </div>

            {/* Bandwidth & Discount Section */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <Globe className={styles.sectionIcon} />
                <h2>Bandwidth & <Percent className={styles.discountIcon} /> Discount</h2>
              </div>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Bandwidth (Annual)</label>
                  <select 
                    className={styles.formSelect}
                    name="bw_choice" 
                    value={form.bw_choice} 
                    onChange={handleChange}
                  >
                    {bandwidthOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Optional Discount</label>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxOption}>
                      <input 
                        type="checkbox" 
                        checked={form.apply_discount} 
                        onChange={handleDiscount} 
                      />
                      <span className={styles.checkboxCheckmark}></span>
                      Apply Discount?
                    </label>
                  </div>
                  {form.apply_discount && (
                    <input 
                      className={styles.formInput}
                      name="discount_percent" 
                      type="number" 
                      min={0} 
                      max={100} 
                      step="0.01" 
                      value={form.discount_percent} 
                      onChange={handleNumber} 
                      placeholder="Enter discount percentage"
                    />
                  )}
                </div>
              </div>
            </div>

            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? "Calculating..." : "Calculate Quotation"}
            </button>
          </form>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <span className={styles.errorText}>{error}</span>
          </div>
        )}

        {result && (
          <div className={styles.resultsCard}>
            <div className={styles.sectionHeader}>
              <FileText className={styles.sectionIcon} />
              <h2>Quotation Summary</h2>
            </div>
            <div className={styles.resultsSection}>
              <div className={styles.resultsGroup}>
                <h3>Infrastructure Costs</h3>
                <Table data={result.vm_table} />
              </div>
              
              <div className={styles.resultsGroup}>
                <h3>Management Services</h3>
                <Table data={result.mgmt_table} />
              </div>
              
              <div className={styles.resultsGroup}>
                <h3>Final Summary</h3>
                <Table data={result.summary} />
              </div>
              
              <button 
                onClick={handleDownloadPDF} 
                className={styles.btnSecondary} 
                disabled={pdfLoading}
              >
                <Download className={styles.btnIcon} />
                {pdfLoading ? "Generating PDF..." : "Download PDF Quotation"}
              </button>
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
    <div className={styles.tableWrapper}>
      <table className={styles.quotationTable}>
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
    </div>
  );
}

export default QuotationGenerator;