import React, { useState, useEffect } from 'react';
import { Upload, Search, Edit, Trash2, X, AlertCircle, CheckCircle, XCircle, FileText, Download, Calendar } from 'lucide-react';
import ReactPaginate from 'react-paginate';
import { uploadLog } from '../../services/api';
import styles from '../../styles/LogViewer.module.css';

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [flashMessage, setFlashMessage] = useState(null);

  useEffect(() => {
    const filtered = logs.filter(log =>
      log.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.file_path.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLogs(filtered);
    setCurrentPage(0);
  }, [searchTerm, logs]);

  const showFlashMessage = (message, type = 'success') => {
    setFlashMessage({ message, type });
    setTimeout(() => setFlashMessage(null), 5000);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showFlashMessage('Please select a file to upload', 'error');
      return;
    }

    try {
      setUploading(true);
      const response = await uploadLog(selectedFile);

      console.log('Upload successful:', response);

      const newLog = {
        id: Date.now(),
        file_name: response.file_name,
        file_path: response.file_path,
        file_url: response.file_url,
        uploaded_at: new Date().toISOString()
      };

      setLogs(prev => [newLog, ...prev]);
      setSelectedFile(null);
      showFlashMessage(`Log "${response.file_name}" uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      showFlashMessage('Failed to upload log file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (log) => {
    setSelectedLog(log);
    setShowEditModal(true);
  };

  const handleDelete = (log) => {
    setSelectedLog(log);
    setShowDeleteModal(true);
  };

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  const offset = currentPage * pageSize;
  const currentPageData = filteredLogs.slice(offset, offset + pageSize);
  const pageCount = Math.ceil(filteredLogs.length / pageSize);

  return (
    <div className={styles.logViewer}>
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
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>Log Viewer</h2>
          <p className={styles.subtitle}>Upload and manage system logs</p>
        </div>
      </div>

      <div className={styles.uploadSection}>
        <div className={styles.uploadCard}>
          <div
            className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''} ${selectedFile ? styles.hasFile : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="fileInput"
              className={styles.fileInput}
              onChange={handleFileChange}
              accept=".log,.txt"
            />

            {!selectedFile ? (
              <>
                <Upload className={styles.uploadIcon} />
                <p className={styles.dropText}>Drag and drop your log file here</p>
                <p className={styles.dropSubtext}>or</p>
                <label htmlFor="fileInput" className={styles.browseButton}>
                  Browse Files
                </label>
                <p className={styles.dropHint}>Supported formats: .log, .txt</p>
              </>
            ) : (
              <>
                <FileText className={styles.fileIcon} />
                <p className={styles.fileName}>{selectedFile.name}</p>
                <p className={styles.fileSize}>
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
                <button
                  className={styles.removeButton}
                  onClick={() => setSelectedFile(null)}
                >
                  <X size={16} /> Remove
                </button>
              </>
            )}
          </div>

          <button
            className={styles.uploadButton}
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <div className={styles.spinner}></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className={styles.buttonIcon} />
                Upload Log
              </>
            )}
          </button>
        </div>
      </div>

      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.statsInfo}>
            <span className={styles.statsText}>
              Total Logs: <strong>{logs.length}</strong>
            </span>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className={styles.noData}>
            <FileText className={styles.noDataIcon} />
            <p>No logs uploaded yet</p>
            <p className={styles.noDataSubtext}>Upload your first log file to get started</p>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>File Path</th>
                    <th>File URL</th>
                    <th>Upload Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPageData.map(log => (
                    <tr key={log.id} className={styles.tableRow}>
                      <td className={styles.fileName}>
                        <FileText className={styles.tableFileIcon} />
                        {log.file_name}
                      </td>
                      <td className={styles.filePath}>{log.file_path}</td>
                      <td className={styles.fileUrl}>
                        <a href={log.file_url} target="_blank" rel="noopener noreferrer" className={styles.urlLink}>
                          <Download size={14} /> View
                        </a>
                      </td>
                      <td>
                        <Calendar className={styles.dateIcon} />
                        {new Date(log.uploaded_at).toLocaleString()}
                      </td>
                      <td className={styles.actions}>
                        <button
                          onClick={() => handleEdit(log)}
                          className={`${styles.actionButton} ${styles.edit} ${styles.disabled}`}
                          title="Feature not available - API not implemented"
                          disabled
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(log)}
                          className={`${styles.actionButton} ${styles.delete} ${styles.disabled}`}
                          title="Feature not available - API not implemented"
                          disabled
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      </div>

      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4>Edit Log</h4>
              <button
                onClick={() => setShowEditModal(false)}
                className={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.infoMessage}>
                <AlertCircle className={styles.infoIcon} />
                <div>
                  <p className={styles.infoTitle}>Feature Coming Soon</p>
                  <p className={styles.infoText}>
                    The edit log functionality is currently under development.
                    The backend API for editing logs has not been created yet.
                  </p>
                </div>
              </div>
              <div className={styles.logDetails}>
                <p><strong>File Name:</strong> {selectedLog?.file_name}</p>
                <p><strong>File Path:</strong> {selectedLog?.file_path}</p>
                <p><strong>Uploaded:</strong> {new Date(selectedLog?.uploaded_at).toLocaleString()}</p>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setShowEditModal(false)} className={styles.closeModalButton}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4>Delete Log</h4>
              <button
                onClick={() => setShowDeleteModal(false)}
                className={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.infoMessage}>
                <AlertCircle className={styles.infoIcon} />
                <div>
                  <p className={styles.infoTitle}>Feature Coming Soon</p>
                  <p className={styles.infoText}>
                    The delete log functionality is currently under development.
                    The backend API for deleting logs has not been created yet.
                  </p>
                </div>
              </div>
              <div className={styles.logDetails}>
                <p><strong>File Name:</strong> {selectedLog?.file_name}</p>
                <p><strong>File Path:</strong> {selectedLog?.file_path}</p>
                <p><strong>Uploaded:</strong> {new Date(selectedLog?.uploaded_at).toLocaleString()}</p>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setShowDeleteModal(false)} className={styles.closeModalButton}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogViewer;