// src/components/customers/CustomerBulkUpload.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiCall, endpoints } from "@/lib/api";
import { Download, Upload } from "lucide-react";

interface BulkUploadProps {
  onSuccess: () => void;
  onClose: () => void;
}

interface UploadResponse {
  success: boolean;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  details: {
    successful: Array<{
      row: number;
      id: string;
      email: string;
    }>;
    failed: Array<{
      row: number;
      data: any;
      errors: string[];
    }>;
  };
}

export function CustomerBulkUpload({ onSuccess, onClose }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (
      selectedFile?.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError("Please select a valid Excel file (.xlsx)");
    }
  };

  const handleDownloadTemplate = () => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/customers/template`,
      "_blank"
    );
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiCall<UploadResponse>(
        endpoints.customers.bulkUpload,
        "POST",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(response.data);
      if (response.success) {
        onSuccess();
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="text-sm text-red-500 font-medium">{error}</div>}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Upload Excel File</h4>
            <p className="text-sm text-muted-foreground">
              Upload your customer data using our Excel template
            </p>
          </div>
          {/* <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button> */}
        </div>

        <Input
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          disabled={loading}
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || loading}>
            {loading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="text-sm font-medium">Upload Summary</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-2xl font-bold">{result.summary.total}</div>
            </div>
            <div className="p-4 bg-green-100 rounded-lg">
              <div className="text-sm text-green-600">Successful</div>
              <div className="text-2xl font-bold">
                {result.summary.successful}
              </div>
            </div>
            <div className="p-4 bg-red-100 rounded-lg">
              <div className="text-sm text-red-600">Failed</div>
              <div className="text-2xl font-bold">{result.summary.failed}</div>
            </div>
          </div>

          {result.details.failed.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Errors:</div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {result.details.failed.map((failure, index) => (
                  <div
                    key={index}
                    className="text-sm text-red-500 bg-red-50 p-2 rounded"
                  >
                    Row {failure.row}: {failure.errors.join(", ")}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
