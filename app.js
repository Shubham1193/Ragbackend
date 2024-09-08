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
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

app.use(cors());


dotenv.config();

// let chain;
const userChains = {};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./src/documents");
  },
  filename: function (req, file, cb) {
    cb(null,  file.originalname);
  },
});

const upload = multer({ storage: storage });


// app.post("/userId" , async(req , res) => {
//     const id = uuidv4();
//     res.send(id)
// })

app.post("/upload-files", upload.single("file"), async (req, res) => {
//   console.log(req.file.originalname);
  const filename = req.file.originalname;
  const id = uuidv4()
  userChains[id] = await processFile("./src/documents/" + filename);
  console.log(userChains[id])

  res.json({message : "success" ,  id : id});
});

app.post("/ask-questions", async (req, res) => {
  console.log(req.body.que);
  let id = req.body.id
  const question = req.body.que;
  const answer = await userChains[id].call({
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
 // ci pipe check
}

app.get("/", async (req, res) => {
  res.send("Success!!!!!!");
});

app.listen(5001, () => {
  console.log("Server Started");
});
// chroma from documents is not a function error













// The difference between .id and [id] in JavaScript is how they access properties of an object.

// .id:

// This is the dot notation for accessing a property directly.
// It's used when you know the exact name of the property.
// For example, if you have an object user with a property named id, you would access it like this: user.id.
// [id]:

// This is the bracket notation for accessing a property dynamically.
// It's used when you don't know the exact name of the property beforehand, or when the property name is stored in a variable.
// For example, if you have a variable propertyName that contains the string "id", you would access the property like this: user[propertyName].
// In your code, you were using .id to access the chain stored in the userChains object. This assumes that the object has a property named id. If the property name is stored in a variable or determined dynamically, you would use [id] instead.

// Here's an example to illustrate the difference:

// JavaScript
// const user = {
//   id: 123,
//   name: "John Doe"
// };

// // Using dot notation:
// console.log(user.id); // Output: 123

// // Using bracket notation:
// const propertyName = "name";
// console.log(user[propertyName]); // Output: "John Doe"
// Use code with caution.

// In your specific case, since the userChains object is most likely a plain object, you can use either .id or [id] to access the chain, as long as the property name is indeed "id". However, if the property name is stored in a variable or determined dynamically, you would need to use [id].