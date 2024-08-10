import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import * as dotenv from "dotenv";
import { createDoc } from "./utils/create.js";
import { updateDoc } from "./utils/update.js";
import { queryDoc } from "./utils/query.js";
// 6. Load environment variables
// dotenv.config();
// 7. Set up DirectoryLoader to load documents from the ./documents directory
const pdfPath = "../../../paper.pdf";

const loader = new PDFLoader(pdfPath);
const docs = await loader.load();
// 8. Set up variables for the filename, question, and index settings
const question = "Tell me something interesting about the paper author Shalaginov et al. (2018)";
const indexName = "rag-pinecone";
const vectorDimension = 3072;
// 9. Initialize Pinecone client with API key and environment
const client = new PineconeClient({apiKey: "",});
// 10. Run the main async function
(async () => {
// 11. Check if Pinecone index exists and create if necessary
  await createDoc(client, indexName, vectorDimension);
// 12. Update Pinecone vector store with document embeddings
  await updateDoc(client, indexName, docs);
// 13. Query Pinecone vector store and GPT model for an answer
  await queryDoc(client, indexName, question);
})();