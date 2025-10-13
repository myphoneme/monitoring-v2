import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, Download, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import ReactPaginate from 'react-paginate';
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
                  <label>VM Name *</label>
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
                  <label>IP Address *</label>
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
    </div>
  );
};

export default VMMaster;