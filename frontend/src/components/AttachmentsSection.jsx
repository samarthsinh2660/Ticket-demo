import React, { useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileText, FileImage, File, Download, Trash2, Paperclip, UploadCloud, AlertCircle } from 'lucide-react';

export default function AttachmentsSection({ ticketId, attachments = [], onAttachmentChange, readOnly = false }) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return <FileImage className="w-5 h-5 text-blue-500 flex-shrink-0" />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      return <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />;
    }
    return <File className="w-5 h-5 text-slate-500 flex-shrink-0" />;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');

    // Client-side validations
    const allowedExts = ['jpg', 'jpeg', 'png', 'pdf', 'txt', 'doc', 'docx'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedExts.includes(ext)) {
      setError('Only jpg, jpeg, png, pdf, txt, doc, and docx files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }

    if (attachments.length >= 5) {
      setError('Maximum of 5 attachments allowed per ticket.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      await api.post(`/tickets/${ticketId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (onAttachmentChange) onAttachmentChange();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload attachment.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      setError('');
      const response = await api.get(`/attachments/${attachment.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.originalFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download attachment.');
    }
  };

  const handleDelete = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;

    try {
      setError('');
      await api.delete(`/attachments/${attachmentId}`);
      if (onAttachmentChange) onAttachmentChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete attachment.');
    }
  };

  const canDelete = (attachment) => {
    if (readOnly) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'CUSTOMER' && attachment.uploadedById === user.id) return true;
    // support staff (employee) can delete if assigned to ticket (readOnly handles overall permission block)
    if (user.role === 'EMPLOYEE') return true;
    return false;
  };

  return (
    <div className="space-y-4 bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1.5">
          <Paperclip className="w-4 h-4 text-indigo-500" />
          <span>Attachments</span>
        </h5>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {attachments.length} / 5 Files
        </span>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-xs">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Attachment List */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {attachments.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 py-3 italic">
            No files attached to this ticket yet.
          </p>
        ) : (
          attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-2.5 rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all duration-200"
            >
              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                {getFileIcon(att.originalFileName)}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-700 dark:text-gray-200 truncate" title={att.originalFileName}>
                    {att.originalFileName}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {formatFileSize(att.fileSize)} • By {att.uploadedBy?.name || 'User'} ({att.uploadedBy?.role || 'Guest'})
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(att)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
                {canDelete(att) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(att.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                    title="Delete File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Zone */}
      {!readOnly && attachments.length < 5 && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".jpg,.jpeg,.png,.pdf,.txt,.doc,.docx"
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center py-4 px-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 hover:border-indigo-400 dark:hover:border-indigo-800 transition-all duration-200 text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadCloud className="w-7 h-7 text-indigo-500 mb-1" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {uploading ? 'Uploading File...' : 'Click to Upload Attachment'}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
              Supports JPG, PNG, PDF, TXT, DOC up to 10 MB
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
