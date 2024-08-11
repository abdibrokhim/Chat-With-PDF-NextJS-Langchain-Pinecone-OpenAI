'use client';

import React, { useState, useRef, useEffect } from 'react';
import { faAdd, faArrowUp, faCoffee, faFilePdf, faRotateRight, faShower, faThumbTack } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I assist you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showFileWindow, setShowFileWindow] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validated, setValidated] = useState(false);
  const [fileName, setFileName] = useState('');
  const [indexName, setIndexName] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const apiEndpoint = 'http://18.144.68.98:3001/';

  const getFileName = () => {
    return fileName.length > 15 ? `${fileName.substring(0, 15)}...` : fileName;
  };

  const createIndex = async () => {
    try {
      const response = await fetch(`${apiEndpoint}api/createIndex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error creating index');
      }

      const data = await response.json();
      setIndexName(data.indexName);
      console.log('Index created successfully:', data.indexName);
      return data.indexName;
    } catch (error) {
      console.error('Error creating index:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, there was an error creating the index. Please try again.' }]);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    setLoading(true);
    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    setInput('');

    try {
      if (!indexName) {
        throw new Error('No index available. Please upload a file first.');
      }

      const response = await fetch(`${apiEndpoint}api/queryIndex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ indexName, question: input }),
      });

      if (!response.ok) {
        throw new Error('Error querying index');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.answer }]);
    } catch (error: any) {
      console.error('Error querying index:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: error.message }]);
    } finally {
      setLoading(false);
    }
  };

  const chatCompletion = async () => {
    try {
      const response = await fetch(`${apiEndpoint}api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input, stream: true }),
      });
  
      if (!response.ok) {
        throw new Error('Error completing chat');
      }
  
      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let botMessageIndex: any = null;

      // console.log('=====================');
      // console.log('reader:', reader);
      
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        console.log('=====================');
        console.log('chunk:', chunk);
  
        // Parse each chunk as JSON to extract the content
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line === 'data: [DONE]') {
            break;
          }
          const parsedData = JSON.parse(line.replace(/^data: /, ''));
          const content = parsedData.choices[0].delta?.content;

          if (content) {
            fullText += content;
            
            // Update the message in the state
            if (botMessageIndex === null) {
              setMessages(prev => {
                const newMessages = [...prev, { sender: 'bot', text: fullText }];
                botMessageIndex = newMessages.length - 1;
                return newMessages;
              });
            } else {
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[botMessageIndex].text = fullText;
                return newMessages;
              });
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error completing chat:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: error.message }]);
    }
  };

  const updateIndex = async (file: any) => {
    console.log('Uploading file...');

    setProcessing(true);

    try {
      let currentIndexName = indexName;
      if (!currentIndexName) {
        currentIndexName = await createIndex();
        if (!currentIndexName) throw new Error('Failed to create index');
      }

      if (!file) {
        throw new Error('No file selected');
      }
  
      const formData = new FormData();
      formData.append('file', file);
      formData.append('indexName', currentIndexName);
  
      const response = await fetch(`${apiEndpoint}api/updateIndex`, {
        method: 'POST',
        body: formData, // No need to stringify or set Content-Type
      });
  
      if (!response.ok) {
        throw new Error('Error uploading file');
      }
  
      console.log('File uploaded successfully');
      setValidated(true);
      setIndexName(currentIndexName);
      setMessages(prev => [...prev, { sender: 'bot', text: 'File uploaded and processed successfully. You can now ask questions about its content.' }]);
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, there was an error uploading the file. Please try again.' }]);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      console.log('Selected file:', file);
      if (file) {
        setSelectedFile(file);
        setFileName(file.name);
        updateIndex(file);
      }
    }
  };

  const startOver = () => {
    console.log('Starting over...');
    console.log('initializing...');
    setMessages([{ sender: 'bot', text: 'Hello! How can I assist you today?' }]);
    setInput('');
    setLoading(false);
    setProcessing(false);
    setShowFileWindow(false);
    setSelectedFile(null);
    setValidated(false);
    setFileName('');
    setIndexName('');
  }

  const cleanChat = () => {
    console.log('Cleaning chat...');
    setMessages([{ sender: 'bot', text: 'Hello! How can I assist you today?' }]);
    setInput('');
  }

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (validated) {
        setMessages(prev => [...prev, { sender: 'user', text: input }]);
        handleSendMessage();
      } else {
        setMessages(prev => [...prev, { sender: 'user', text: input }]);
        chatCompletion();
      }
    }
  };

  const handleInput = (e: any) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const loader = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
      <circle cx={4} cy={12} r={3} fill="currentColor">
        <animate id="svgSpinners3DotsScale0" attributeName="r" begin="0;svgSpinners3DotsScale1.end-0.25s" dur="0.75s" values="3;.2;3" />
      </circle>
      <circle cx={12} cy={12} r={3} fill="currentColor">
        <animate attributeName="r" begin="svgSpinners3DotsScale0.end-0.6s" dur="0.75s" values="3;.2;3" />
      </circle>
      <circle cx={20} cy={12} r={3} fill="currentColor">
        <animate id="svgSpinners3DotsScale1" attributeName="r" begin="svgSpinners3DotsScale0.end-0.45s" dur="0.75s" values="3;.2;3" />
      </circle>
    </svg>
  );

  return (
    <main className="flex min-h-screen flex-col justify-between">
      <div className='flex flex-col gap-4 fixed top-4 left-4'>
        <button
          onClick={startOver}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#eeeeee] text-black shadow cursor-pointer "
          >
          <FontAwesomeIcon icon={faRotateRight} />
        </button>
        <button
          onClick={cleanChat}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#eeeeee] text-black shadow cursor-pointer "
          >
          <FontAwesomeIcon icon={faShower} />
        </button>
      </div>
      <div className='flex flex-col gap-4 fixed top-4 right-4'>
        <button
          onClick={() => window.open('https://buymeacoffee.com/abdibrokhim', '_blank')}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#eeeeee] text-black shadow cursor-pointer "
          >
          <FontAwesomeIcon icon={faCoffee} />
        </button>
        <button
          onClick={() => window.open('https://github.com/abdibrokhim/Chat-With-PDF-NextJS-Langchain-Pinecone-OpenAI', '_blank')}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#eeeeee] text-black shadow cursor-pointer "
          >
          <FontAwesomeIcon icon={faGithub} />
        </button>
        <button
          onClick={() => window.open('https://linkedin.com/in/abdibrokhim', '_blank')}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#eeeeee] text-black shadow cursor-pointer "
          >
          <FontAwesomeIcon icon={faLinkedin} />
        </button>
      </div>
      <div className="w-full lg:max-w-5xl px-16 lg:px-0 mx-auto">
        <div className="mb-32 w-full lg:text-left overflow-auto">
          <div className="overflow-y-auto flex-1 p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 mb-2 rounded-lg ${
                  message.sender === 'bot' ? 'bg-[#1e1e1e]' : 'bg-[#2e2e2e]'
                } text-white max-w-full`}
              >
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-[80%] lg:max-w-5xl mx-auto flex items-center p-2 mb-8 fixed bottom-0 left-0 right-0 shadow-lg gap-4 bg-[#2e2e2e] rounded-full">
        <button
          disabled={loading}
          onClick={() => setShowFileWindow(!showFileWindow)}
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-[#4e4e4e] text-black shadow ${
            loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {!loading 
            ? <FontAwesomeIcon icon={faAdd} />
            : <span className='flex justify-center items-center text-white'>{loader()}</span>
          }
        </button>
        <textarea
          tabIndex={0}
          ref={textareaRef}
          className="flex-1 resize-none border-none focus:ring-0 outline-none bg-transparent text-white"
          placeholder="Type your message..."
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          style={{ minHeight: '24px', maxHeight: '128px' }}
        />
        <button
          disabled={loading || input === ''}
          onClick={validated ? handleSendMessage : chatCompletion}
          className={`flex items-center justify-center w-10 h-10 rounded-full shadow ${
            loading || input === '' ? 'cursor-not-allowed bg-[#4e4e4e] text-black'  : 'cursor-pointer bg-[#eeeeee] text-black'}`}
        >
          {!loading 
            ? <FontAwesomeIcon icon={faArrowUp} />
            : <span className='flex justify-center items-center text-white'>{loader()}</span>
          }
        </button>
        {showFileWindow && (
          <div className="absolute left-0 top-[-150px] mt-8 w-72 p-2 bg-[#2e2e2e] text-white text-sm rounded shadow-md z-50">
            <div>
              <div className='flex gap-3 p-2 items-center'>
                <FontAwesomeIcon icon={faThumbTack} />
                <div className="flex items-center">
                  Current file: 
                  {selectedFile ? (
                    <>
                      {processing 
                        ? <span className='ml-8 flex justify-center items-center'>{loader()}</span>
                        : validated 
                          ? <span className='ml-1 bg-[#4e4e4e] p-1 rounded'>{getFileName()}</span>
                          : 'Error'
                      }
                    </>
                  ) : (<span className='ml-8'>...</span>)}
                </div>
              </div>
              <div className='flex m-auto items-center justify-center w-64 h-[1px] bg-[#4e4e4e]'></div>
              <label
                htmlFor="fileInput"
                className="mt-2 flex p-2 items-center gap-3 rounded-md hover:bg-[#4e4e4e] transition-colors duration-200 text-white cursor-pointer text-sm flex-shrink-0"
              >
                <FontAwesomeIcon icon={faFilePdf} />
                <span>Upload from computer</span>
                <input
                  id="fileInput"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}