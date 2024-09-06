import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { RetrievalQAChain } from "langchain/chains";
import * as dotenv from "dotenv";
import express from 'express'
import multer from 'multer'
import cors from 'cors'


const app = express();
app.use(express.json());

app.use(cors());


dotenv.config();

let chain;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./src/documents");
  },
  filename: function (req, file, cb) {
    cb(null,  file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/upload-files", upload.single("file"), async (req, res) => {
  console.log(req.file.originalname);
  const filename = req.file.originalname;
  chain = await processFile("./src/documents/" + filename);
  console.log(chain)
  res.send('success');
});

app.post("/ask-questions", async (req, res) => {
  console.log(req.body.que);
  const question = req.body.que;
  const answer = await chain.call({
    query: question
  });

  console.log({
    question,
    answer
  });

  // question = "Describe the Multi-head attention layer in detail?"
//    const result = await chain({"query": question})
//    result["result"]
  console.log(answer)

  res.send(answer.text);
});

async function processFile(filePath) {
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splittedDocs = await splitter.splitDocuments(docs);
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "models/embedding-001", // 768 dimensions
    apiKey : "AIzaSyDYsj5QvaL7TyK-YvQBF7t82zpFUpSrYRs"
   
  });

  const vectorStore = await HNSWLib.fromDocuments(splittedDocs, embeddings);
  const vectorStoreRetriever = vectorStore.asRetriever();
  const model = new ChatGoogleGenerativeAI({model_name : "gemini-pro" , apiKey : "AIzaSyDYsj5QvaL7TyK-YvQBF7t82zpFUpSrYRs"})
  const chain = RetrievalQAChain.fromLLM(model, vectorStoreRetriever);

  return chain;


  qa_chain = RetrievalQA.from_chain_type(
    model,
    retriever=vector_index,
    return_source_documents=True

  )
  return qa_chain
     

// question = "Describe the Multi-head attention layer in detail?"
// result = qa_chain({"query": question})
// result["result"]
}

app.get("/", async (req, res) => {
  res.send("Success!!!!!!");
});

app.listen(5001, () => {
  console.log("Server Started");
});
// chroma from documents is not a function error