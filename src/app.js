import express from "express";
import cors from "cors";
import dotenv from "dotenv"
import dayjs from "dayjs"
import { MongoClient} from "mongodb"
import joi from "joi"

dotenv.config()

const app = express();
app.use(cors());
app.use(express.json());
//const users = [];
const Joi = joi

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db ; 

const participantSchema = Joi.object({
    name:Joi.string().required()
})

async function startServer(){
    try{
    await mongoClient.connect()
    db = mongoClient.db()
    console.log('Conectou com o mongodb')
}catch (error){
    console.log(error)
}

app.post("/participants", async (req,res)=>{
   const {name} = req.body;
   const participantValidation = participantSchema.validate({name})
   const date = dayjs().format("hh:mm:ss")
   const lastStatus = Date.now()

   if(participantValidation.error){
    return res.status(422).send("Nome invalido")
   }

   try{
    const checkExistingParticipant = await db
    .collection("participants").findOne({name: name})
    if(checkExistingParticipant){
        return res.status(409).send("Nome já existente")
    }

    await db.collection("participants").insertOne({name, lastStatus});
    await db.collection("messages").insertOne({
        from: name, 
        to: 'Todos', 
        text: 'entra na sala...', 
        type: 'status', 
        time: date});

        res.status(201).send("Usuario Criado"); //apagar a msg depois
   }catch(error){
    console.log(error);
    res.status(422).send("Ocorreu um erro no servidor")
   }
});

app.get("/participants",async (req, res) => {
    const participantsList = await db
    .collection("participants").find().toArray()
    res.send(participantsList)
})

const PORT = 5000;
app.listen(PORT, ()=> console.log(`Servidor conectado a porta ${PORT}`));
}

startServer();
/* 200: Ok => Significa que deu tudo certo com a requisição
201: Created => Sucesso na criação do recurso
301: Moved Permanently => Significa que o recurso que você está tentando acessar foi movido pra outra URL
401: Unauthorized => Significa que você não tem acesso a esse recurso
404: Not Found => Significa que o recurso pedido não existe
409: Conflict => Significa que o recurso que você está tentando inserir já foi inserido
422: Unprocessable Entity => Significa que a requisição enviada não está no formato esperado
500: Internal Server Error => Significa que ocorreu algum erro desconhecido no servidor */