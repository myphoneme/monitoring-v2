import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, Download, Upload, CheckCircle, AlertCircle, XCircle, FileSpreadsheet } from 'lucide-react';
import ReactPaginate from 'react-paginate';
import * as XLSX from 'xlsx';
import { fetchVMMasterData, createVM, updateVM, deleteVM } from '../../services/api';
import styles from '../../styles/VMMaster.module.css';

const VMMaster = () => {
  const [vms, setVms] = useState([]);
  const [filteredVms, setFilteredVms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVM, setEditingVM] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [flashMessage, setFlashMessage] = useState(null);
  const [formData, setFormData] = useState({
    vm_name: '',
    ip: '',
    username: '',
    password: '',
    project_name: '',
    cluster: '',
    node: '',
    remarks: ''
  });

  // Excel upload states
  const fileInputRef = useRef(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    loadVMData();
  }, []);

  const showFlashMessage = (message, type = 'success') => {
    setFlashMessage({ message, type });
    setTimeout(() => setFlashMessage(null), 5000);
  };

  const loadVMData = async () => {
    try {
      setLoading(true);
      const data = await fetchVMMasterData();
      const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setVms(sortedData);
      setFilteredVms(sortedData);
    } catch (error) {
      console.error('Error fetching VM master data:', error);
      showFlashMessage('Failed to load VM data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = vms.filter(vm => 
      vm.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vm.vm_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vm.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVms(filtered);
    setCurrentPage(0); // Reset to first page when filtering
  }, [searchTerm, vms]);

  const handleExport = () => {
    const csv = [
      ['VM Name', 'IP', 'Username', 'Project', 'Cluster', 'Node', 'Remarks', 'Created At'],
      ...filteredVms.map(vm => [
        vm.vm_name, vm.ip, vm.username, vm.project_name || '', 
        vm.cluster || '', vm.node || '', vm.remarks || '',
        new Date(vm.created_at).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vm_master_list.csv';
    a.click();
    URL.revokeObjectURL(url);
    showFlashMessage('VM data exported successfully!');
  };

  const handleAddNew = () => {
    setEditingVM(null);
    setFormData({
      vm_name: '',
      ip: '',
      username: '',
      password: '',
      project_name: '',
      cluster: '',
      node: '',
      remarks: ''
    });
    setShowModal(true);
  };

  const handleEdit = (vm) => {
    setEditingVM(vm);
    setFormData({
      vm_name: vm.vm_name || '',
      ip: vm.ip || '',
      username: vm.username || '',
      password: vm.password || '',
      project_name: vm.project_name || '',
      cluster: vm.cluster || '',
      node: vm.node || '',
      remarks: vm.remarks || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (vm) => {
    setConfirmDelete(vm);
  };

  const confirmDeleteAction = async () => {
    try {
      await deleteVM(confirmDelete.id);
      setConfirmDelete(null);
      loadVMData();
      showFlashMessage(`VM "${confirmDelete.vm_name}" deleted successfully!`);
    } catch (error) {
      console.error('Error deleting VM:', error);
      showFlashMessage('Failed to delete VM', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVM) {
        await updateVM(editingVM.id, formData);
        showFlashMessage(`VM "${formData.vm_name}" updated successfully!`);
      } else {
        await createVM(formData);
        showFlashMessage(`VM "${formData.vm_name}" created successfully!`);
      }
      setShowModal(false);
      loadVMData();
    } catch (error) {
      console.error('Error saving VM:', error);
      showFlashMessage('Failed to save VM', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Excel Upload Handlers
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      showFlashMessage('Please upload a valid Excel file (.xlsx, .xls) or CSV file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          showFlashMessage('The uploaded file is empty', 'error');
          return;
        }

        // Map Excel columns to VM fields (case-insensitive)
        const mappedData = jsonData.map((row, index) => {
          const mappedRow = {
            rowIndex: index + 1,
            vm_name: row['VM Name'] || row['vm_name'] || row['VM_Name'] || row['vmname'] || row['Name'] || '',
            ip: row['IP Address'] || row['ip'] || row['IP'] || row['ip_address'] || '',
            username: row['Username'] || row['username'] || row['User'] || row['user'] || '',
            password: row['Password'] || row['password'] || row['Pass'] || row['pass'] || '',
            project_name: row['Project Name'] || row['Project'] || row['project_name'] || row['project'] || '',
            cluster: row['Cluster'] || row['cluster'] || '',
            node: row['Node'] || row['node'] || '',
            remarks: row['Remarks'] || row['remarks'] || row['Notes'] || row['notes'] || '',
            isValid: true,
            errors: []
          };

          // Validate required fields
          if (!mappedRow.vm_name) {
            mappedRow.isValid = false;
            mappedRow.errors.push('VM Name is required');
          }
          if (!mappedRow.ip) {
            mappedRow.isValid = false;
            mappedRow.errors.push('IP Address is required');
          }

          // Check for duplicate IP in existing VMs
          const existingVM = vms.find(vm => vm.ip === mappedRow.ip);
          if (existingVM) {
            mappedRow.isValid = false;
            mappedRow.errors.push(`IP already exists (${existingVM.vm_name})`);
          }

          return mappedRow;
        });

        setUploadData(mappedData);
        setShowUploadModal(true);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        showFlashMessage('Error parsing file. Please check the format.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);

    // Reset file input
    e.target.value = '';
  };

  const handleUploadConfirm = async () => {
    const validData = uploadData.filter(row => row.isValid);

    if (validData.length === 0) {
      showFlashMessage('No valid VMs to upload', 'error');
      return;
    }

    setUploadLoading(true);
    setUploadProgress({ current: 0, total: validData.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validData.length; i++) {
      const vmData = {
        vm_name: validData[i].vm_name,
        ip: validData[i].ip,
        username: validData[i].username || '',
        password: validData[i].password || '',
        project_name: validData[i].project_name || '',
        cluster: validData[i].cluster || '',
        node: validData[i].node || '',
        remarks: validData[i].remarks || ''
      };

      try {
        await createVM(vmData);
        successCount++;
      } catch (error) {
        console.error(`Error creating VM ${vmData.vm_name}:`, error);
        failCount++;
      }

      setUploadProgress({ current: i + 1, total: validData.length });
    }

    setUploadLoading(false);
    setShowUploadModal(false);
    setUploadData([]);
    loadVMData();

    if (failCount === 0) {
      showFlashMessage(`Successfully added ${successCount} VMs!`, 'success');
    } else {
      showFlashMessage(`Added ${successCount} VMs. ${failCount} failed.`, 'warning');
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'VM Name': 'Example-VM-1',
        'IP Address': '192.168.1.100',
        'Username': 'admin',
        'Password': '',
        'Project Name': 'Project A',
        'Cluster': 'Cluster 1',
        'Node': 'Node 1',
        'Remarks': 'Sample VM'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'VM Template');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }
    ];

    XLSX.writeFile(workbook, 'VM_Upload_Template.xlsx');
    showFlashMessage('Template downloaded successfully!');
  };

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  // Pagination logic
  const offset = currentPage * pageSize;
  const currentPageData = filteredVms.slice(offset, offset + pageSize);
  const pageCount = Math.ceil(filteredVms.length / pageSize);

  return (
    <div className={styles.vmMaster}>
      {/* Flash Message */}
      {flashMessage && (
        <div className={`${styles.flashMessage} ${styles[flashMessage.type]}`}>
          <div className={styles.flashContent}>
            {flashMessage.type === 'success' && <CheckCircle className={styles.flashIcon} />}
            {flashMessage.type === 'error' && <XCircle className={styles.flashIcon} />}
            {flashMessage.type === 'warning' && <AlertCircle className={styles.flashIcon} />}
            <span>{flashMessage.message}</span>
            <button 
              onClick={() => setFlashMessage(null)}
              className={styles.flashClose}
            >
              <X size={8} />
            </button>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>VM Master Management</h2>
          <p className={styles.subtitle}>Manage your virtual machine configurations</p>
        </div>
        
        <div className={styles.controls}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search VMs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button onClick={handleExport} className={styles.exportButton}>
            <Download className={styles.buttonIcon} />
            Export CSV
          </button>
          <button onClick={() => fileInputRef.current?.click()} className={styles.uploadButton}>
            <Upload className={styles.buttonIcon} />
            Upload Excel
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
          />
          <button onClick={handleAddNew} className={styles.addButton}>
            <Plus className={styles.buttonIcon} />
            Add VM
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading VMs...</p>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>VM Name</th>
                  <th>IP Address</th>
                  <th>Username</th>
                  <th>Project</th>
                  <th>Cluster</th>
                  <th>Node</th>
                  <th>Remarks</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentPageData.map(vm => (
                  <tr key={vm.id} className={styles.tableRow}>
                    <td className={styles.vmName}>{vm.vm_name}</td>
                    <td className={styles.ip}>{vm.ip}</td>
                    <td>{vm.username}</td>
                    <td>{vm.project_name || 'N/A'}</td>
                    <td>{vm.cluster || 'N/A'}</td>
                    <td>{vm.node || 'N/A'}</td>
                    <td className={styles.remarks}>{vm.remarks || 'N/A'}</td>
                    <td>{new Date(vm.created_at).toLocaleDateString()}</td>
                    <td className={styles.actions}>
                      <button 
                        onClick={() => handleEdit(vm)}
                        className={`${styles.actionButton} ${styles.edit}`}
                        title="Edit VM"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(vm)}
                        className={`${styles.actionButton} ${styles.delete}`}
                        title="Delete VM"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredVms.length === 0 && (
              <div className={styles.noData}>
                <p>No VMs found matching your search criteria</p>
              </div>
            )}
          </div>

          {pageCount > 1 && (
            <div className={styles.paginationContainer}>
              <ReactPaginate
                previousLabel="← Previous"
                nextLabel="Next →"
                breakLabel="..."
                pageCount={pageCount}
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                onPageChange={handlePageClick}
                containerClassName={styles.pagination}
                activeClassName={styles.active}
                previousClassName={styles.previous}
                nextClassName={styles.next}
                disabledClassName={styles.disabled}
                breakClassName={styles.break}
                forcePage={currentPage}
              />
            </div>
          )}
        </>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h4>{editingVM ? 'Edit VM Configuration' : 'Add New VM'}</h4>
              <button 
                onClick={() => setShowModal(false)}
                className={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>VM Name <span className={styles.asterisk}>*</span></label>
                  <input
                    type="text"
                    name="vm_name"
                    value={formData.vm_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter VM name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>IP Address <span className={styles.asterisk}>*</span></label>
                  <input
                    type="text"
                    name="ip"
                    value={formData.ip}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 192.168.1.100"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Project Name</label>
                  <input
                    type="text"
                    name="project_name"
                    value={formData.project_name}
                    onChange={handleInputChange}
                    placeholder="Enter project name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Cluster</label>
                  <input
                    type="text"
                    name="cluster"
                    value={formData.cluster}
                    onChange={handleInputChange}
                    placeholder="Enter cluster name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Node</label>
                  <input
                    type="text"
                    name="node"
                    value={formData.node}
                    onChange={handleInputChange}
                    placeholder="Enter node name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter any remarks or notes"
                  />
                </div>
              </div>

              <div className={styles.mandatoryText}>
                All fields marked with <span className={styles.asterisk}>*</span> are mandatory
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  <Save className={styles.buttonIcon} />
                  {editingVM ? 'Update VM' : 'Create VM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <div className={styles.confirmHeader}>
              <AlertCircle className={styles.confirmIcon} />
              <h3>Confirm Deletion</h3>
            </div>
            <p>Are you sure you want to delete <strong>"{confirmDelete.vm_name}"</strong>?</p>
            <p className={styles.confirmWarning}>This action cannot be undone.</p>
            <div className={styles.confirmActions}>
              <button onClick={() => setConfirmDelete(null)} className={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={confirmDeleteAction} className={styles.deleteButton}>
                <Trash2 className={styles.buttonIcon} />
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Preview Modal */}
      {showUploadModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.uploadModal}>
            <div className={styles.modalHeader}>
              <div className={styles.uploadModalTitle}>
                <FileSpreadsheet className={styles.uploadIcon} />
                <h4>Upload Preview</h4>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadData([]);
                }}
                className={styles.closeButton}
                disabled={uploadLoading}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.uploadSummary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Rows:</span>
                <span className={styles.summaryValue}>{uploadData.length}</span>
              </div>
              <div className={`${styles.summaryItem} ${styles.valid}`}>
                <CheckCircle size={16} />
                <span className={styles.summaryLabel}>Valid:</span>
                <span className={styles.summaryValue}>{uploadData.filter(r => r.isValid).length}</span>
              </div>
              <div className={`${styles.summaryItem} ${styles.invalid}`}>
                <XCircle size={16} />
                <span className={styles.summaryLabel}>Invalid:</span>
                <span className={styles.summaryValue}>{uploadData.filter(r => !r.isValid).length}</span>
              </div>
            </div>

            {uploadLoading && (
              <div className={styles.uploadProgressContainer}>
                <div className={styles.uploadProgressBar}>
                  <div
                    className={styles.uploadProgressFill}
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
                <span className={styles.uploadProgressText}>
                  Uploading {uploadProgress.current} of {uploadProgress.total}...
                </span>
              </div>
            )}

            <div className={styles.uploadTableContainer}>
              <table className={styles.uploadTable}>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Status</th>
                    <th>VM Name</th>
                    <th>IP Address</th>
                    <th>Username</th>
                    <th>Project</th>
                    <th>Cluster</th>
                    <th>Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadData.map((row, index) => (
                    <tr key={index} className={row.isValid ? styles.validRow : styles.invalidRow}>
                      <td>{row.rowIndex}</td>
                      <td>
                        {row.isValid ? (
                          <CheckCircle size={16} className={styles.validIcon} />
                        ) : (
                          <XCircle size={16} className={styles.invalidIcon} />
                        )}
                      </td>
                      <td>{row.vm_name || '-'}</td>
                      <td>{row.ip || '-'}</td>
                      <td>{row.username || '-'}</td>
                      <td>{row.project_name || '-'}</td>
                      <td>{row.cluster || '-'}</td>
                      <td className={styles.errorCell}>
                        {row.errors.length > 0 ? row.errors.join(', ') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.uploadActions}>
              <button
                onClick={handleDownloadTemplate}
                className={styles.templateButton}
                disabled={uploadLoading}
              >
                <Download size={16} />
                Download Template
              </button>
              <div className={styles.uploadActionButtons}>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadData([]);
                  }}
                  className={styles.cancelButton}
                  disabled={uploadLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadConfirm}
                  className={styles.confirmUploadButton}
                  disabled={uploadLoading || uploadData.filter(r => r.isValid).length === 0}
                >
                  <Upload size={16} />
                  {uploadLoading ? 'Uploading...' : `Upload ${uploadData.filter(r => r.isValid).length} VMs`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VMMaster;