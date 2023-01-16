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
const Joi = joi

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db ; 

const participantSchema = Joi.object({
    name:Joi.string().required()
})

const messageSchema = Joi.object({
    to: Joi.string().required(),
    text: Joi.string().required(),
    type: Joi.string().valid("message","private_message").required()
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
   const participantValidation = participantSchema.validate({name});
   const date = dayjs().format("hh:mm:ss");
   const lastStatus = Date.now();

   if(participantValidation.error) return res.status(422).send("Nome invalido")

   try{
    const checkExistingUser = await db
    .collection("participants").findOne({name: name})
    if(checkExistingUser) return res.status(409).send("Nome já existente");

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
   try{
     const participantsList = await db
    .collection("participants").find().toArray()
    res.send(participantsList)
   }
   catch(error){
    res.status(500).send("Houve algum erro com o banco de dados")
   }
})

app.post("/messages", async (req,res) =>{
    const {to, text,type} = req.body;
    const from = req.headers.user;
    const messageValidation = messageSchema.validate({to, text, type});
    const time = dayjs(Date.now()).format("hh:mm:ss");

    const checkUserOnline = await db.collection("participants").findOne({name: from});

    if(!checkUserOnline) return res.status(422).send("Usuário não encontrado, tente se conectar novamente");

    if(messageValidation.error) return res.status(422).send("Mensagem inválida");

    try{
        await db.collection("messages").insertOne({
            to,
            text,
            type,
            from,
            time
        });
        res.status(201).send("Mensagem enviada");
    }
    catch(error){
        console.log(error);
        res.status(422).send("Ocorreu um erro no servidor");
    }
})

app.get("/messages", async (req,res)=>{
    const {user} = req.headers;
    const limit = req.query.limit;
    const messageList = await db.collection("messages").find().toArray();
    let messagesFilter = {$or: [{to: "Todos"},{to:user},{from:user}]};
    let messages;
    const limitSchema = Joi.number().positive()
    const limitValidation = limitSchema.validate(limit)
    if(limitValidation.error){
        return res.status(422).send("limite invalido")
    }
   
try{
    if(!limit){
       messages = await db.collection("messages").find(messagesFilter).toArray();
    }else{
      messages = await db.collection("messages").find(messagesFilter).sort({_id:-1}).limit(parseInt(limit)).toArray();
    }

    res.status(200).send(messages);

}catch(error){
    console.log(error);
    res.status(500).send("Houve algum erro com o banco de dados")
}
});


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