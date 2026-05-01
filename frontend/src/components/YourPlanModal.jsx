import { useEffect, useState } from "react";
import { api } from "../api/client";

export function YourPlanModal({ open, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (open) {
      loadDocuments();
    }
  }, [open]);

  async function loadDocuments() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await api.get("/user/documents");
      setDocuments(data.documents);
    } catch (err) {
      setError(err.message);
      setDocuments([]);
    } finally {
      setLoading(false);
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

  function downloadDocument(filePath, documentName) {
    const link = document.createElement("a");
    link.href = `http://localhost:5000${filePath}`;
    link.download = documentName || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleDeleteDocument(documentId) {
    if (
      !window.confirm(
        "Are you sure you want to delete this document? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeleting(documentId);
    try {
      await api.delete(`/user/documents/${documentId}`);
      setSuccess("Document deleted successfully.");
      loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card plan-modal">
        <div className="modal-header">
          <h2>Your Plan</h2>
          <button type="button" className="ghost-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <p className="loading-message">Loading your plan documents...</p>
          ) : error ? (
            <>
              <p className="form-error">{error}</p>
              {documents.length > 0 && (
                <div className="plan-documents-list">
                  {documents.map((doc) => (
                    <div className="plan-document-item" key={doc.id}>
                      <div className="document-icon">
                        {doc.document_type.includes("pdf")
                          ? "📄"
                          : doc.document_type.includes("image")
                            ? "🖼️"
                            : doc.document_type.includes("word") ||
                                doc.document_type.includes("text")
                              ? "📝"
                              : "📦"}
                      </div>
                      <div className="document-details">
                        <strong>{doc.document_name}</strong>
                        <p className="doc-meta">
                          {formatFileSize(doc.file_size)} •{" "}
                          {formatDate(doc.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          downloadDocument(doc.file_path, doc.document_name)
                        }
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : documents.length === 0 ? (
            <p className="empty-message">
              No plan document uploaded yet. Check back soon!
            </p>
          ) : (
            <>
              {success && <p className="form-success">{success}</p>}
              <div className="plan-documents-list">
                {documents.map((doc) => (
                  <div className="plan-document-item" key={doc.id}>
                    <div className="document-icon">
                      {doc.document_type.includes("pdf")
                        ? "📄"
                        : doc.document_type.includes("image")
                          ? "🖼️"
                          : doc.document_type.includes("word") ||
                              doc.document_type.includes("text")
                            ? "📝"
                            : "📦"}
                    </div>
                    <div className="document-details">
                      <strong>{doc.document_name}</strong>
                      <p className="doc-meta">
                        {formatFileSize(doc.file_size)} •{" "}
                        {formatDate(doc.created_at)}
                      </p>
                    </div>
                    <div className="document-actions">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          downloadDocument(doc.file_path, doc.document_name)
                        }
                      >
                        Download
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        disabled={deleting === doc.id}
                      >
                        {deleting === doc.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
