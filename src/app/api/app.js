import express from 'express';
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { createDoc } from "./utils/create.js";
import { updateDoc } from "./utils/update.js";
import { queryDoc } from "./utils/query.js";
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import multer from 'multer';

const app = express();

// Enable CORS for all routes
app.use(cors());

app.use(express.json());

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

const client = new PineconeClient({
  apiKey: "",
});

app.post('/api/createIndex', async (req, res) => {
  try {
    const { indexName, vectorDimension } = { "indexName": uuidv4(), "vectorDimension": 3072 };
    await createDoc(client, indexName, vectorDimension);
    res.status(200).json({ message: 'Index created successfully', indexName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/updateIndex', upload.single('file'), async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Uploaded file details:', req.file);

    const { indexName } = req.body;

    if (!req.file) {
      throw new Error('File upload failed or file is missing');
    }

    const pdfPath = req.file.path;
    console.log('Processing file at path:', pdfPath);

    const loader = new PDFLoader(pdfPath);
    const docs = await loader.load();
    console.log('Document loaded:', docs);

    await updateDoc(client, indexName, docs);
    res.status(200).json({ message: 'Index updated successfully' });
  } catch (error) {
    console.error('Error processing file upload:', error);
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/queryIndex', async (req, res) => {
  try {
    const { indexName, question } = req.body;
    const answer = await queryDoc(client, indexName, question);
    res.status(200).json({ answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});