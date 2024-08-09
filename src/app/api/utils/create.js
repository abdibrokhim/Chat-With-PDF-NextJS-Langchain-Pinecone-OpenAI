export const createDoc = async (
    client,
    indexName,
    vectorDimension
  ) => {
    // 1. Initiate index existence check
    console.log(`Checking "${indexName}"...`);
  
    try {
      // 2. Get list of existing indexes
      const response = await client.listIndexes();
  
      // Log the result to check its type
      console.log("Existing indexes:", response);

      // Extract the indexes array from the response object
        const existingIndexes = response.indexes || [];

        // 3. Check if the index exists in the extracted array
        const indexExists = existingIndexes.some(index => index.name === indexName);
  
      // 3. Check if the result is an array
      if (!indexExists) {
        // 4. If index doesn't exist, create it
        if (!existingIndexes.includes(indexName)) {
          console.log(`Creating "${indexName}"...`);
  
          // 5. Create index
          const createClient = await client.createIndex(
            {
              name: indexName,
              dimension: vectorDimension,
              metric: "cosine",
              spec: { serverless: { cloud: 'aws', region: 'us-east-1' }},
            },
          );
  
          // 6. Log successful creation
          console.log(`Created with client:`, createClient);
  
          // 7. Wait 60 seconds for index initialization
          await new Promise((resolve) => setTimeout(resolve, 60000));

          // 8. Return indexName on successful creation
            return indexName;
        } else {
          // 8. Log if index already exists
          console.log(`"${indexName}" already exists.`);

            // 9. Return indexName if already exists
            return indexName;
        }
      } else {
        console.error("Unexpected return type from listIndexes:", typeof existingIndexes);
        throw new Error("listIndexes did not return an array");
      }
    } catch (error) {
      console.error("Error creating or checking index:", error);
    }
};