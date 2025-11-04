import React, { useState } from "react";
import { FileText, Server, Shield, Globe, Percent, Calculator, Download, Building2, Mail, Calendar, Cpu, HardDrive, Database, Wifi, TrendingUp, CheckCircle, AlertCircle, Info, Plus, Trash2, Copy, Sparkles, Zap, Target } from "lucide-react";
import styles from "./QuotationGenerator.module.css";

const API_BASE = "http://localhost:9200"; // Change if backend runs elsewhere

// Company Details API Configuration
const COMPANY_API_BASE = "/api"; // Using Vite proxy
const COMPANY_API_TOKEN = import.meta.env.VITE_COMPANY_API_TOKEN;

const initialVM = {
  id: 1,
  name: "VM 1",
  user_vcpus: 1,
  user_ram: 1,
  user_storage: 1,
  quantity: 1,
  antivirus_qty: 0,
  backup_qty: 0,
  db_qty: 0,
  os_type: "linux",
  os_qty: 0,
  bw_choice: "Dedicated 10 MBPS",
  discount_percent: 0,
  apply_discount: false,
};

const initialForm = {
  customer_name: "",
  customer_address: "",
  customer_gstn: "",
  customer_email: "",
  quotation_no: "",
  quotation_date: "",
  vms: [initialVM],
};

function QuotationGenerator({ isDarkMode }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstError, setGstError] = useState("");

  const buildRequestPayload = () => {
  const totalVMs = (form.vms || []).reduce(
    (sum, vm) => sum + Number(vm.quantity || 0),
    0
  );

  const vm_configurations = (form.vms || []).map(vm => ({
    name: vm.name,
    vcpus: Number(vm.user_vcpus || 0),
    ram: Number(vm.user_ram || 0),
    storage: Number(vm.user_storage || 0),
    quantity: Number(vm.quantity || 0),

    // per-VM services & pricing (🔧 important)
    antivirus_qty: Number(vm.antivirus_qty || 0),
    backup_qty: Number(vm.backup_qty || 0),
    db_qty: Number(vm.db_qty || 0),
    os_type: vm.os_type || "linux",
    os_qty: Number(vm.os_qty || 0),
    bw_choice: vm.bw_choice || "Default",
    discount_percent: vm.apply_discount ? Number(vm.discount_percent || 0) : 0,
  }));

  return {
    customer_info: {
      name: form.customer_name,
      address: form.customer_address,
      gstn: form.customer_gstn,
      email: form.customer_email,
    },
    quotation_info: {
      number: form.quotation_no,
      date: form.quotation_date, // keep as YYYY-MM-DD string
    },

    // legacy fields kept for compatibility with older backend paths
    user_vcpus: (form.vms?.[0]?.user_vcpus) ? Number(form.vms[0].user_vcpus) : 1,
    user_ram:   (form.vms?.[0]?.user_ram)   ? Number(form.vms[0].user_ram)   : 1,
    user_storage:(form.vms?.[0]?.user_storage) ? Number(form.vms[0].user_storage) : 1,
    num_vms: totalVMs,

    // the new multi-VM array
    vm_configurations,

    // optional global knobs (only used if backend supports them)
    bw_choice: form.bw_choice || "Default",
    discount_percent: Number(form.discount_percent || 0),
  };
};

  // VM Management Functions
  const addVM = () => {
    const newVM = {
      id: Date.now(),
      name: `VM ${form.vms.length + 1}`,
      user_vcpus: 1,
      user_ram: 1,
      user_storage: 1,
      quantity: 1,
      antivirus_qty: 0,
      backup_qty: 0,
      db_qty: 0,
      os_type: "linux",
      os_qty: 0,
      bw_choice: "Dedicated 10 MBPS",
      discount_percent: 0,
      apply_discount: false,
    };
    setForm(prev => ({
      ...prev,
      vms: [...prev.vms, newVM]
    }));
  };

  const removeVM = (vmId) => {
    if (form.vms.length > 1) {
      setForm(prev => ({
        ...prev,
        vms: prev.vms.filter(vm => vm.id !== vmId)
      }));
    }
  };

  const duplicateVM = (vmId) => {
    const vmToDuplicate = form.vms.find(vm => vm.id === vmId);
    if (vmToDuplicate) {
      const newVM = {
        ...vmToDuplicate,
        id: Date.now(),
        name: `${vmToDuplicate.name} (Copy)`
      };
      setForm(prev => ({
        ...prev,
        vms: [...prev.vms, newVM]
      }));
    }
  };

  const updateVM = (vmId, field, value) => {
    setForm(prev => ({
      ...prev,
      vms: prev.vms.map(vm => 
        vm.id === vmId 
          ? { 
              ...vm, 
              [field]: field === 'name' || field === 'os_type' || field === 'bw_choice' || field === 'apply_discount' 
                ? value 
                : Math.max(0, Number(value)) 
            }
          : vm
      )
    }));
  };

  // Handle GST-based company details fetch
  const fetchCompanyDetails = async (gstNumber) => {
    if (!gstNumber || gstNumber.length < 15) {
      setGstError("Please enter a valid 15-digit GST number");
      return;
    }

    setGstLoading(true);
    setGstError("");

    try {
      const response = await fetch(
        `/api/API/gstin/${gstNumber}/${COMPANY_API_TOKEN}`
      );

      const raw = await response.text();
      console.log("API Raw Response:", raw);

      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(raw); // API gave plain text error like "Invalid token"
      }

      if (data.status_cd !== "1") {
        throw new Error(data.status_desc || "API request failed");
      }

      const companyData = data.data;
      setForm(prev => ({
        ...prev,
        customer_name: companyData.TradeName || companyData.LegalName || "",
        customer_address: `${companyData.AddrBno || ""} ${companyData.AddrSt || ""}, ${companyData.AddrLoc || ""} - ${companyData.AddrPncd || ""}`.trim(),
        customer_email: "",
        quotation_no: `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        quotation_date: new Date().toISOString().split("T")[0],
      }));

    } catch (err) {
      console.error("Company details fetch error:", err);
      setGstError(`Failed to fetch company details: ${err.message}. Please check GST number and try again, or enter details manually.`);
    } finally {
      setGstLoading(false);
    }
  };

  // Handle GST number change with debounced API call
  const handleGstChange = (e) => {
    const gstValue = e.target.value.toUpperCase();
    setForm(prev => ({ ...prev, customer_gstn: gstValue }));
    setGstError("");
    
    // Auto-fetch when GST number is complete (15 characters)
    if (gstValue.length === 15) {
      fetchCompanyDetails(gstValue);
    }
  };

  // Manual fetch trigger
  const handleFetchDetails = () => {
    if (form.customer_gstn) {
      fetchCompanyDetails(form.customer_gstn);
    }
  };

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
    const req = buildRequestPayload();

    const res = await fetch(`${API_BASE}/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Calculation failed (${res.status}): ${text}`);
    }

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
    const req = buildRequestPayload();

    const res = await fetch(`${API_BASE}/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PDF generation failed (${res.status}): ${text}`);
    }

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
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.heroIcon}>
              <Sparkles className={styles.sparkleIcon} />
            </div>
            <h1 className={styles.heroTitle}>Professional VM Quotation Generator</h1>
            <p className={styles.heroSubtitle}>Generate comprehensive virtual machine quotes with real-time pricing and professional documentation</p>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <Server className={styles.statIcon} />
              <span className={styles.statNumber}>{(form.vms || []).reduce((sum, vm) => sum + vm.quantity, 0)}</span>
              <span className={styles.statLabel}>Total VMs</span>
            </div>
            <div className={styles.statItem}>
              <Target className={styles.statIcon} />
              <span className={styles.statNumber}>{(form.vms || []).length}</span>
              <span className={styles.statLabel}>Configurations</span>
            </div>
            <div className={styles.statItem}>
              <Zap className={styles.statIcon} />
              <span className={styles.statNumber}>24/7</span>
              <span className={styles.statLabel}>Support</span>
            </div>
          </div>
        </div>

        <div className={styles.formCard}>
          <form className={styles.quotationForm} onSubmit={handleCalculate}>
            {/* Customer Information Section */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconGroup}>
                  <Building2 className={styles.sectionIcon} />
                </div>
                <div className={styles.sectionContent}>
                  <h2>Customer & Quotation Details</h2>
                  <p className={styles.sectionDescription}>Enter customer information and quotation details to get started</p>
                </div>
              </div>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Customer GSTN
                    {gstLoading && <span className={styles.loadingText}> (Fetching details...)</span>}
                  </label>
                  <div className={styles.gstInputGroup}>
                    <input 
                      className={`${styles.formInput} ${gstError ? styles.inputError : ''}`}
                      name="customer_gstn" 
                      maxLength={15} 
                      value={form.customer_gstn} 
                      onChange={handleGstChange} 
                      placeholder="Enter 15-digit GST number (e.g., 29ABCDE1234F1Z5)"
                      disabled={gstLoading}
                    />
                    <button
                      type="button"
                      onClick={handleFetchDetails}
                      className={styles.fetchBtn}
                      disabled={gstLoading || !form.customer_gstn}
                      title="Fetch company details from GST database"
                    >
                      {gstLoading ? (
                        <div className={styles.spinner}></div>
                      ) : (
                        <Building2 className={styles.fetchIcon} />
                      )}
                    </button>
                  </div>
                  {gstError && (
                    <div className={styles.fieldError}>
                      <AlertCircle className={styles.errorIcon} />
                      <span>{gstError}</span>
                    </div>
                  )}
                  {form.customer_gstn.length === 15 && !gstError && !gstLoading && (
                    <div className={styles.fieldSuccess}>
                      <CheckCircle className={styles.successIcon} />
                      <span>Company details loaded successfully</span>
                    </div>
                  )}
                </div>
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
                    disabled={gstLoading}
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
                    disabled={gstLoading}
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
                    disabled={gstLoading}
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
                    disabled={gstLoading}
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
                    disabled={gstLoading}
                  />
                </div>
              </div>
              
              <div className={styles.apiInfo}>
                <Info className={styles.infoIcon} />
                <div>
                  <strong>Smart Auto-fill Feature:</strong> Enter a complete 15-digit GST number to automatically fetch and populate company details from our integrated GST database. The system will auto-generate quotation numbers and dates for seamless workflow.
                </div>
              </div>
            </div>

            {/* VM Requirements Section */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconGroup}>
                  <Server className={styles.sectionIcon} />
                </div>
                <div className={styles.sectionContent}>
                  <h2>Virtual Machine Configurations</h2>
                  <p className={styles.sectionDescription}>Design your perfect VM setup with flexible configuration options</p>
                </div>
                <div className={styles.vmSummary}>
                  <div className={styles.vmSummaryItem}>
                    <span className={styles.vmCount}>{(form.vms || []).reduce((sum, vm) => sum + vm.quantity, 0)}</span>
                    <span className={styles.vmLabel}>Total VMs</span>
                  </div>
                  <div className={styles.vmSummaryDivider}></div>
                  <div className={styles.vmSummaryItem}>
                    <span className={styles.vmCount}>{(form.vms || []).length}</span>
                    <span className={styles.vmLabel}>Configurations</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.vmManagementHint}>
                <Info className={styles.hintIcon} />
                <div>
                  <strong>Advanced Multi-VM Management:</strong> Create multiple VM configurations with different specifications. Each configuration supports multiple instances with independent service configurations for maximum flexibility.
                </div>
              </div>

              <div className={styles.vmConfigurationsContainer}>
                {(form.vms || []).map((vm, index) => (
                  <div key={vm.id} className={styles.vmConfigCard}>
                    <div className={styles.vmConfigHeader}>
                      <div className={styles.vmConfigTitle}>
                        <div className={styles.vmConfigIconWrapper}>
                          <Server className={styles.vmConfigIcon} />
                        </div>
                        <input
                          type="text"
                          value={vm.name}
                          onChange={(e) => updateVM(vm.id, 'name', e.target.value)}
                          className={styles.vmNameInput}
                          placeholder={`VM ${index + 1}`}
                        />
                        <div className={styles.vmConfigBadge}>
                          <span>Config #{index + 1}</span>
                        </div>
                      </div>
                      <div className={styles.vmConfigActions}>
                        <button
                          type="button"
                          onClick={() => duplicateVM(vm.id)}
                          className={styles.vmActionBtn}
                          title="Duplicate Configuration"
                        >
                          <Copy className={styles.vmActionIcon} />
                        </button>
                        {(form.vms || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVM(vm.id)}
                            className={`${styles.vmActionBtn} ${styles.vmActionBtnDanger}`}
                            title="Remove Configuration"
                          >
                            <Trash2 className={styles.vmActionIcon} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className={styles.vmSpecsSection}>
                      <div className={styles.vmSectionHeader}>
                        <Cpu className={styles.vmSectionIcon} />
                        <h4>Hardware Specifications</h4>
                      </div>
                      
                      <div className={styles.vmConfigGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            <Cpu className={styles.labelIcon} />
                            Virtual CPUs
                          </label>
                          <div className={styles.inputWithUnit}>
                            <input 
                              className={styles.formInput}
                              type="number" 
                              min={1} 
                              value={vm.user_vcpus} 
                              onChange={(e) => updateVM(vm.id, 'user_vcpus', e.target.value)}
                              required 
                            />
                            <span className={styles.inputUnit}>vCPU</span>
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            <HardDrive className={styles.labelIcon} />
                            Memory (RAM)
                          </label>
                          <div className={styles.inputWithUnit}>
                            <input 
                              className={styles.formInput}
                              type="number" 
                              min={1} 
                              value={vm.user_ram} 
                              onChange={(e) => updateVM(vm.id, 'user_ram', e.target.value)}
                              required 
                            />
                            <span className={styles.inputUnit}>GB</span>
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            <Database className={styles.labelIcon} />
                            Storage Space
                          </label>
                          <div className={styles.inputWithUnit}>
                            <input 
                              className={styles.formInput}
                              type="number" 
                              min={1} 
                              value={vm.user_storage} 
                              onChange={(e) => updateVM(vm.id, 'user_storage', e.target.value)}
                              required 
                            />
                            <span className={styles.inputUnit}>GB</span>
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            <Server className={styles.labelIcon} />
                            Instance Quantity
                          </label>
                          <div className={styles.inputWithUnit}>
                            <input 
                              className={styles.formInput}
                              type="number" 
                              min={1} 
                              value={vm.quantity} 
                              onChange={(e) => updateVM(vm.id, 'quantity', e.target.value)}
                              required 
                            />
                            <span className={styles.inputUnit}>VMs</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.vmSpecsSummary}>
                        <div className={styles.specsSummaryItem}>
                          <strong>Hardware Profile:</strong> 
                          <span>{vm.user_vcpus} vCPU • {vm.user_ram}GB RAM • {vm.user_storage}GB Storage</span>
                        </div>
                        <div className={styles.specsSummaryItem}>
                          <strong>Deployment Scale:</strong> 
                          <span>{vm.quantity} instance{vm.quantity !== 1 ? 's' : ''} of this configuration</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Management Services for this VM */}
                    <div className={styles.vmServicesSection}>
                      <div className={styles.vmSectionHeader}>
                        <Shield className={styles.vmSectionIcon} />
                        <h4>Management & Security Services</h4>
                      </div>
                      
                      <div className={styles.vmServicesGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Antivirus Protection</label>
                          <div className={styles.inputWithUnit}>
                            <input 
                              className={styles.formInput}
                              type="number" 
                              min={0} 
                              value={vm.antivirus_qty} 
                              onChange={(e) => updateVM(vm.id, 'antivirus_qty', e.target.value)}
                            />
                            <span className={styles.inputUnit}>per VM</span>
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Backup Management</label>
                          <div className={styles.inputWithUnit}>
                            <input 
                              className={styles.formInput}
                              type="number" 
                              min={0} 
                              value={vm.backup_qty} 
                              onChange={(e) => updateVM(vm.id, 'backup_qty', e.target.value)}
                            />
                            <span className={styles.inputUnit}>per VM</span>
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Database Services</label>
                          <div className={styles.inputWithUnit}>
                            <input 
                              className={styles.formInput}
                              type="number" 
                              min={0} 
                              value={vm.db_qty} 
                              onChange={(e) => updateVM(vm.id, 'db_qty', e.target.value)}
                            />
                            <span className={styles.inputUnit}>per VM</span>
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Operating System</label>
                          <div className={styles.radioGroup}>
                            <label className={styles.radioOption}>
                              <input 
                                type="radio" 
                                name={`os_type_${vm.id}`}
                                value="linux" 
                                checked={vm.os_type === "linux"} 
                                onChange={(e) => updateVM(vm.id, 'os_type', e.target.value)}
                              />
                              <span className={styles.radioCheckmark}></span>
                              Linux
                            </label>
                            <label className={styles.radioOption}>
                              <input 
                                type="radio" 
                                name={`os_type_${vm.id}`}
                                value="windows" 
                                checked={vm.os_type === "windows"} 
                                onChange={(e) => updateVM(vm.id, 'os_type', e.target.value)}
                              />
                              <span className={styles.radioCheckmark}></span>
                              Windows
                            </label>
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            {vm.os_type === "linux" ? "Linux OS Management" : "Windows OS Management"}
                          </label>
                          <div className={styles.inputWithUnit}>
                            <input 
                              className={styles.formInput}
                              type="number" 
                              min={0} 
                              value={vm.os_qty} 
                              onChange={(e) => updateVM(vm.id, 'os_qty', e.target.value)}
                            />
                            <span className={styles.inputUnit}>per VM</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bandwidth & Discount for this VM */}
                    <div className={styles.vmNetworkSection}>
                      <div className={styles.vmSectionHeader}>
                        <Globe className={styles.vmSectionIcon} />
                        <h4>Network & Pricing Options</h4>
                      </div>
                      
                      <div className={styles.vmNetworkGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            <Wifi className={styles.labelIcon} />
                            Bandwidth Package
                          </label>
                          <select 
                            className={styles.formSelect}
                            value={vm.bw_choice} 
                            onChange={(e) => updateVM(vm.id, 'bw_choice', e.target.value)}
                          >
                            {bandwidthOptions.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            <Percent className={styles.labelIcon} />
                            Special Discount
                          </label>
                          <div className={styles.discountSection}>
                            <div className={styles.checkboxGroup}>
                              <label className={styles.checkboxOption}>
                                <input 
                                  type="checkbox" 
                                  checked={vm.apply_discount} 
                                  onChange={(e) => updateVM(vm.id, 'apply_discount', e.target.checked)}
                                />
                                <span className={styles.checkboxCheckmark}></span>
                                Apply Custom Discount
                              </label>
                            </div>
                            {vm.apply_discount && (
                              <div className={styles.inputWithIcon}>
                                <Percent className={styles.inputIcon} />
                                <input 
                                  className={styles.formInput}
                                  type="number" 
                                  min={0} 
                                  max={100} 
                                  step="0.01" 
                                  value={vm.discount_percent} 
                                  onChange={(e) => updateVM(vm.id, 'discount_percent', e.target.value)}
                                  placeholder="Enter discount percentage"
                                />
                                <span className={styles.inputUnit}>%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.vmServicesSummary}>
                        <div className={styles.servicesSummaryRow}>
                          <div className={styles.summaryLabel}>Management Services:</div>
                          <div className={styles.summaryValue}>
                            {vm.antivirus_qty > 0 && <span className={styles.serviceTag}>Antivirus ({vm.antivirus_qty})</span>}
                            {vm.backup_qty > 0 && <span className={styles.serviceTag}>Backup ({vm.backup_qty})</span>}
                            {vm.db_qty > 0 && <span className={styles.serviceTag}>Database ({vm.db_qty})</span>}
                            {vm.os_qty > 0 && <span className={styles.serviceTag}>{vm.os_type === "linux" ? "Linux" : "Windows"} OS ({vm.os_qty})</span>}
                            {(vm.antivirus_qty === 0 && vm.backup_qty === 0 && vm.db_qty === 0 && vm.os_qty === 0) && 
                              <span className={styles.serviceTag}>No additional services</span>}
                          </div>
                        </div>
                        <div className={styles.servicesSummaryRow}>
                          <div className={styles.summaryLabel}>Network & Pricing:</div>
                          <div className={styles.summaryValue}>
                            <span className={styles.serviceTag}>Bandwidth: {vm.bw_choice}</span>
                            {vm.apply_discount && vm.discount_percent > 0 && (
                              <span className={styles.serviceTag}>Discount: {vm.discount_percent}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className={styles.addVmSection}>
                  <div className={styles.addVmContent}>
                    <div className={styles.addVmIcon}>
                      <Plus className={styles.plusIcon} />
                    </div>
                    <div className={styles.addVmText}>
                      <h4>Add New VM Configuration</h4>
                      <p>Create additional VM configurations with different specifications</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addVM}
                    className={styles.addVmBtn}
                  >
                    <Plus className={styles.addVmBtnIcon} />
                    Add Configuration
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.actionSection}>
              <button type="submit" className={styles.btnPrimary} disabled={loading}>
                <div className={styles.btnContent}>
                  {loading ? (
                    <>
                      <div className={styles.loadingSpinner}></div>
                      <span>Calculating Quote...</span>
                    </>
                  ) : (
                    <>
                      <Calculator className={styles.btnIcon} />
                      <span>Generate Professional Quotation</span>
                    </>
                  )}
                </div>
              </button>
              <div className={styles.actionHint}>
                <Info className={styles.hintIcon} />
                <span>All required fields must be completed to generate your detailed quotation</span>
              </div>
            </div>
         
          </form>
        </div>

        {error && (
          <div className={styles.alertMessage + ' ' + styles.errorAlert}>
            <AlertCircle className={styles.alertIcon} />
            <div className={styles.alertContent}>
              <strong>Error Occurred</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {result && (
          <div className={styles.successAlert}>
            <CheckCircle className={styles.alertIcon} />
            <div className={styles.alertContent}>
              <strong>Success!</strong>
              <span>Your professional quotation has been calculated successfully</span>
            </div>
          </div>
        )}

        {result && (
          <div className={styles.resultsCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconGroup}>
                <FileText className={styles.sectionIcon} />
              </div>
              <div className={styles.sectionContent}>
                <h2>Professional Quotation Summary</h2>
                <p className={styles.sectionDescription}>Comprehensive cost breakdown and service details</p>
              </div>
              <div className={styles.summaryBadge}>
                <TrendingUp className={styles.badgeIcon} />
                <span>Enterprise Grade</span>
              </div>
            </div>
            
            <div className={styles.resultsSection}>
              <div className={styles.resultsGroup}>
                <div className={styles.tableHeader}>
                  <Server className={styles.tableIcon} />
                  <h3>Infrastructure Investment</h3>
                </div>
                <Table data={result.vm_table} />
              </div>
              
              <div className={styles.resultsGroup}>
                <div className={styles.tableHeader}>
                  <Shield className={styles.tableIcon} />
                  <h3>Management Services</h3>
                </div>
                <Table data={result.mgmt_table} />
              </div>
              
              <div className={styles.resultsGroup}>
                <div className={styles.tableHeader}>
                  <Calculator className={styles.tableIcon} />
                  <h3>Investment Summary</h3>
                </div>
                <Table data={result.summary} />
              </div>
              
              <div className={styles.downloadSection}>
                <button 
                  onClick={handleDownloadPDF} 
                  className={styles.btnSecondary} 
                  disabled={pdfLoading}
                >
                  <div className={styles.btnContent}>
                    {pdfLoading ? (
                      <>
                        <div className={styles.loadingSpinner}></div>
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className={styles.btnIcon} />
                        <span>Download Professional PDF</span>
                      </>
                    )}
                  </div>
                </button>
                <div className={styles.downloadHint}>
                  <Info className={styles.hintIcon} />
                  <span>Professional PDF includes complete quotation details, terms, and company branding</span>
                </div>
              </div>
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
            <tr key={i} className={i === data.length - 1 ? styles.totalRow : ''}>
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