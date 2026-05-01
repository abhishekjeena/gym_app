import { useEffect, useState } from "react";
import { api } from "../api/client";

export function ClientDocumentsModal({ client, onClose }) {
  const [documentName, setDocumentName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadDocuments();
  }, [client.id]);

  async function loadDocuments() {
    try {
      const data = await api.get(`/admin/clients/${client.id}/documents`);
      setDocuments(data.documents);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!documentName.trim() || !selectedFile) {
      setError("Please provide both a document name and file.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("clientId", client.id);
      formData.append("documentName", documentName);
      formData.append("file", selectedFile);

      await api.post(`/admin/clients/${client.id}/documents`, formData);

      setSuccess("Document uploaded successfully!");
      setDocumentName("");
      setSelectedFile(null);
      loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(documentId) {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      await api.delete(`/admin/documents/${documentId}`);
      loadDocuments();
    } catch (err) {
      setError(err.message);
    }
  }

  function formatFileSize(bytes) {
    if (!bytes) return "Unknown";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }

  function formatDate(dateString) {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card document-modal">
        <div className="modal-header">
          <h2>Manage Documents for {client.full_name}</h2>
          <button type="button" className="ghost-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-content">
          <section className="upload-section">
            <h3>Upload New Document</h3>
            {error && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}

            <form onSubmit={handleUpload} className="document-upload-form">
              <div className="form-group">
                <label htmlFor="doc-name">Document Name *</label>
                <input
                  id="doc-name"
                  type="text"
                  placeholder="e.g., Monthly Fitness Plan, Progress Report"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="doc-file">Select File *</label>
                <input
                  id="doc-file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                  accept="*/*"
                />
                {selectedFile && (
                  <p className="file-info">
                    Selected: {selectedFile.name} (
                    {formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={loading || !documentName.trim() || !selectedFile}
              >
                {loading ? "Uploading..." : "Upload Document"}
              </button>
            </form>
          </section>

          <section className="documents-list-section">
            <h3>Uploaded Documents ({documents.length})</h3>
            {documents.length === 0 ? (
              <p className="empty-message">No documents uploaded yet</p>
            ) : (
              <div className="documents-list">
                {documents.map((doc) => (
                  <div className="document-item" key={doc.id}>
                    <div className="document-info">
                      <strong>{doc.document_name}</strong>
                      <p className="doc-meta">
                        Type: {doc.document_type} | Size:{" "}
                        {formatFileSize(doc.file_size)}
                      </p>
                      <p className="doc-date">
                        Uploaded: {formatDate(doc.created_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => handleDelete(doc.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
