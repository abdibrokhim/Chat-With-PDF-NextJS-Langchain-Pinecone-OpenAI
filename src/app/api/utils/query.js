import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { loadQAStuffChain } from "langchain/chains";
import { Document } from "langchain/document";

export const queryDoc = async (
  client,
  indexName,
  question
) => {
  console.log("Querying Pinecone vector store...");
  
  const index = client.Index(indexName);

  // Generate the query embedding
  const queryEmbedding = await new OpenAIEmbeddings({
    apiKey: "",
    batchSize: 512,
    model: "text-embedding-3-large",
  }).embedQuery(question);

//   console.log(queryEmbedding);

  // Make the query to Pinecone
  let queryResponse = await index.query({
    topK: 10,
    vector: queryEmbedding,
    includeMetadata: true,
    includeValues: true,
  });

  console.log(`Found ${queryResponse.matches.length} matches...`);
  console.log(`Asking question: ${question}...`);

  if (queryResponse.matches.length) {
    const llm = new ChatOpenAI({
      apiKey: "",
      model: "gpt-4o",
    });

    const chain = loadQAStuffChain(llm);
    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.pageContent)
      .join(" ");
    
    const result = await chain.call({
      input_documents: [new Document({ pageContent: concatenatedPageContent })],
      question: question,
    });

    console.log(`Answer: ${result.text}`);
    return result.text;
  } else {
    console.log("No matches found, GPT-3 will not be queried.");
  }
};
