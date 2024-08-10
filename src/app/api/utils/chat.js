import axios from 'axios';

export const chatCompletion = async (messages, model = "gpt-4o", stream = false) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: model,
        messages: messages,
        stream: stream,
      },
      {
        headers: {
          'Authorization': `Bearer `,
          'Content-Type': 'application/json',
        },
        responseType: stream ? 'stream' : 'json',
      }
    );

    if (stream) {
      return response.data;
    } else {
      const { choices } = response.data;
      return choices[0].message.content;
    }
  } catch (error) {
    throw new Error(`Failed to complete chat: ${error.response ? error.response.data.error.message : error.message}`);
  }
}