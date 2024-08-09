// pages/api/queryIndex.js
import NextCors from 'nextjs-cors';
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { queryDoc } from "../utils/query";

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
      const { indexName, question } = req.body;
      const answer = await queryDoc(client, indexName, question);
      res.status(200).json({ answer });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}