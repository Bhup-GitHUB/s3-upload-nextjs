import { S3 } from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import formidable, { File } from "formidable";
import fs from "fs";

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

export async function POST(req: NextRequest) {
  const form = formidable({ multiples: false });

  const buffer = await new Promise<{
    fileContent: Buffer;
    fileName: string;
    mimeType: string;
  }>((resolve, reject) => {
    form.parse(req as any, async (err, fields, files) => {
      if (err) return reject(err);

      const uploaded = files.file;
      const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      if (!file) return reject(new Error("No file uploaded"));
      if (!file) return reject(new Error("No file uploaded"));

      const fileContent = fs.readFileSync(file.filepath);

      resolve({
        fileContent,
        fileName: file.originalFilename || `upload-${uuidv4()}`,
        mimeType: file.mimetype || "image/jpeg",
      });
    });
  });

  const key = `uploads/${uuidv4()}_${buffer.fileName}`;

  const params = {
    Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME!,
    Key: key,
    Body: buffer.fileContent,
    ContentType: buffer.mimeType,
  };

  try {
    const data = await s3.upload(params).promise();
    return NextResponse.json({ url: data.Location });
  } catch (err) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
