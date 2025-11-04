import React, { useState, useEffect } from 'react';
import { Upload, Search, Edit, Trash2, X, AlertCircle, CheckCircle, XCircle, FileText, Download, Calendar, RefreshCw } from 'lucide-react';
import ReactPaginate from 'react-paginate';
import { uploadLog, getLogsList, downloadLog } from '../../services/api';
import styles from '../../styles/LogViewer.module.css';

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [flashMessage, setFlashMessage] = useState(null);
  const [logsPath, setLogsPath] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    const filtered = logs.filter(log =>
      log.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLogs(filtered);
    setCurrentPage(0);
  }, [searchTerm, logs]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await getLogsList();
      setLogs(response.files || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      showFlashMessage('Failed to load logs', 'error');
    } finally {
      setLoading(false);
    }
  };

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
      await uploadLog(selectedFile);
      setSelectedFile(null);
      showFlashMessage(`Log "${selectedFile.name}" uploaded successfully!`);
      fetchLogs();
    } catch (error) {
      console.error('Upload error:', error);
      showFlashMessage('Failed to upload log file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const blob = await downloadLog(filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showFlashMessage(`Downloaded "${filename}"!`);
    } catch (error) {
      console.error('Download error:', error);
      showFlashMessage('Failed to download log file', 'error');
    }
  };

  const handleRefresh = async () => {
    await fetchLogs();
    showFlashMessage('Logs refreshed!');
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
                <div className={styles.dropTextContainer}>
                  <p className={styles.dropText}>Drag & drop log file here</p>
                  <p className={styles.dropSubtext}>or browse to select (.log, .txt)</p>
                </div>
                <label htmlFor="fileInput" className={styles.browseButton}>
                  Browse
                </label>
              </>
            ) : (
              <>
                <FileText className={styles.fileIcon} />
                <div className={styles.fileNameContainer}>
                  <p className={styles.fileName}>{selectedFile.name}</p>
                  <p className={styles.fileSize}>
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  className={styles.removeButton}
                  onClick={() => setSelectedFile(null)}
                >
                  <X size={12} /> Remove
                </button>
              </>
            )}
          </div>
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
              Upload
            </>
          )}
        </button>
      </div>

      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search logs by filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.statsInfo}>
            <span className={styles.statsText}>
              Total Logs: <strong>{logs.length}</strong>
            </span>
            <button
              onClick={handleRefresh}
              className={styles.refreshButton}
              title="Refresh logs list"
            >
              <RefreshCw size={18} />
            </button>
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
                    <th>Size (KB)</th>
                    <th>Modified Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPageData.map((log, idx) => (
                    <tr key={idx} className={styles.tableRow}>
                      <td className={styles.fileName}>
                        <FileText className={styles.tableFileIcon} />
                        {log.name}
                      </td>
                      <td className={styles.fileSize}>{log.size_kb.toFixed(2)}</td>
                      <td>
                        <Calendar className={styles.dateIcon} />
                        {log.modified}
                      </td>
                      <td className={styles.actions}>
                        <button
                          onClick={() => handleDownload(log.name)}
                          className={`${styles.actionButton} ${styles.download}`}
                          title="Download log file"
                        >
                          <Download size={16} />
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

    </div>
  );
};

export default LogViewer;