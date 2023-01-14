import express from "express";
import cors from "cors";
import dotenv from "dotenv"
//import dayjs from "dayjs"
//import { MongoClient} from'mongodb';

dotenv.config()

const server = express();
server.use(express.json());
server.use(cors());


//const DATABASE_URL = "mongodb://127.0.0.1:27017/?compressors=disabled&gssapiServiceName=mongodb";

/* const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

try{
    await mongoClient.connect()
    db = mongoClient.db("nomedobanco")
    console.log('Conectou com o mongodb')
}catch (error){
    console.log('Erro na conexao com o banco de dados')
}
 */

const users = [];

server.post("/sign-up",(req,res)=>{
   const newUser = req.body;
   users.push(newUser);
   console.log(users)
    return res.send('OK!');
});

const PORT = 5000;
server.listen(PORT, ()=> console.log(`Servidor conectado a porta ${PORT}`));