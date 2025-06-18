"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");

  const uploadFile = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.url) setUrl(data.url);
  };

  return (
    <main className="p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">🖼️ Upload Image to S3</h1>
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <Button onClick={uploadFile}>Upload</Button>

      {url && (
        <div className="mt-4">
          <p>✅ Uploaded:</p>
          <a href={url} target="_blank" className="text-blue-600 underline">
            {url}
          </a>
        </div>
      )}
    </main>
  );
}
