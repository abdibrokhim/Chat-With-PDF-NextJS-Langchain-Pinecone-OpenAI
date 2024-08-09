// pages/api/updateIndex.js
import NextCors from 'nextjs-cors';
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { updateDoc } from "../utils/update";
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const client = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY,
});

export default async function handler(req, res) {
  await NextCors(req, res, {
    methods: ['POST'],
    origin: '*',
    optionsSuccessStatus: 200,
  });

  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: 'Error parsing form data' });
        return;
      }

      try {
        const { indexName } = fields;
        const pdfPath = files.file.path;
        const loader = new PDFLoader(pdfPath);
        const docs = await loader.load();
        await updateDoc(client, indexName, docs);
        
        // Clean up the temporary file
        fs.unlinkSync(pdfPath);

        res.status(200).json({ message: 'Index updated successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}