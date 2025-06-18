import { S3 } from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import formidable from "formidable";
import fs from "fs";
import { Readable } from "stream";
import { IncomingMessage } from "http";

export const config = {
  api: {
    bodyParser: false,
  },
};

const s3 = new S3({
  region: process.env.NEXT_AWS_S3_REGION!,
  accessKeyId: process.env.NEXT_AWS_S3_ACCESS_KEY_ID!,
  secretAccessKey: process.env.NEXT_AWS_S3_SECRET_ACCESS_KEY!,
});

async function nextRequestToNodeRequest(
  req: Request
): Promise<IncomingMessage> {
  const { headers } = req;
  const contentType = headers.get("content-type");
  const contentLength = headers.get("content-length");

  const body = req.body as ReadableStream<Uint8Array>;
  const reader = body.getReader();
  const stream = new Readable({
    async read() {
      const { done, value } = await reader.read();
      if (done) return this.push(null);
      this.push(Buffer.from(value));
    },
  });

  const nodeReq = Object.assign(stream, {
    headers: Object.fromEntries(headers.entries()),
    method: req.method,
    url: "",
  });

  if (contentType) nodeReq.headers["content-type"] = contentType;
  if (contentLength) nodeReq.headers["content-length"] = contentLength;

  return nodeReq as IncomingMessage;
}

export async function POST(req: Request) {
  console.log("🔥 Upload API hit");

  const nodeReq = await nextRequestToNodeRequest(req);

  const form = formidable({ multiples: false });

  const { fileContent, fileName, mimeType } = await new Promise<{
    fileContent: Buffer;
    fileName: string;
    mimeType: string;
  }>((resolve, reject) => {
    form.parse(nodeReq, async (err, fields, files) => {
      if (err) {
        console.error("❌ Formidable error:", err);
        return reject(err);
      }

      const uploaded = files.file;
      const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      if (!file) return reject(new Error("No file uploaded"));

      const fileContent = fs.readFileSync(file.filepath);
      resolve({
        fileContent,
        fileName: file.originalFilename || `upload-${uuidv4()}`,
        mimeType: file.mimetype || "image/jpeg",
      });
    });
  });

  const key = `uploads/${uuidv4()}_${fileName}`;
  try {
    const result = await s3
      .upload({
        Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME!,
        Key: key,
        Body: fileContent,
        ContentType: mimeType,
      })
      .promise();

    return NextResponse.json({ url: result.Location });
  } catch (err) {
    console.error("❌ S3 Upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
