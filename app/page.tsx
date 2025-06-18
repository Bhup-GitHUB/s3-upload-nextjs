"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [s3Url, setS3Url] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError(null);
    setS3Url(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    setError(null);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Upload failed");
      setS3Url(result.url);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 shadow-lg rounded-xl">
        <h1 className="text-xl font-semibold text-center mb-6">
          Upload Image to S3
        </h1>

        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Select Image</Label>
            <Input
              id="file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="rounded-md max-h-60 w-full object-contain border border-muted"
            />
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>

          {s3Url && (
            <div className="text-sm text-center break-words mt-4 text-green-500">
              ✅ Uploaded URL:{" "}
              <a
                href={s3Url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {s3Url}
              </a>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 text-center">❌ {error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
