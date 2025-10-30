import React, { useRef, useState } from 'react';
import { Upload, File, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { extractTextFromFile, ExtractedFile } from '../utils/fileExtractor';

interface FileUploadProps {
  onFileUploaded: (file: ExtractedFile) => void;
  uploadedFiles: ExtractedFile[];
  onRemoveFile: (fileName: string) => void;
}

export function FileUpload({ onFileUploaded, uploadedFiles, onRemoveFile }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (10MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('File size must be less than 100MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const extractedFile = await extractTextFromFile(file);
      onFileUploaded(extractedFile);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('text')) return '📃';
    return '📄';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="flex flex-col items-center space-y-3">
            {isUploading ? (
              <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-slate-600 group-hover:text-slate-900 transition-colors" />
            )}

            <div className="text-center">
              <p className="text-slate-900 font-semibold">
                {isUploading ? 'Processing file...' : 'Upload any document'}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Any file type up to 100MB - PDF, DOCX, images, spreadsheets, presentations, and more
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{uploadError}</span>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-900 flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Uploaded Documents ({uploadedFiles.length})</span>
          </h4>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl group hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-lg">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.size)} • {file.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <button
                    onClick={() => onRemoveFile(file.name)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}