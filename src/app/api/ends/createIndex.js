// pages/api/createIndex.js
import NextCors from 'nextjs-cors';
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { createDoc } from "../utils/create";
import { v4 as uuidv4 } from 'uuid';

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
    try {
      const { indexName, vectorDimension } = { "indexName": uuidv4(), "vectorDimension": 3072 };
      await createDoc(client, indexName, vectorDimension);
      res.status(200).json({ message: 'Index created successfully', indexName });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}