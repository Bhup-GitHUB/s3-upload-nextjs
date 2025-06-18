"use client";

import { useState } from "react";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [s3Url, setS3Url] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setS3Url(null);
      setError(null);
    }
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
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>Upload Image to S3</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <br />
      <br />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      <br />
      <br />
      {s3Url && (
        <div>
          <strong>Uploaded Image URL:</strong>{" "}
          <a href={s3Url} target="_blank" rel="noopener noreferrer">
            {s3Url}
          </a>
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  );
}
