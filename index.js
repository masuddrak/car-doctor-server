const express = require('express');
const cors = require('cors');
require('dotenv').config()
const cookieParser = require('cookie-parser')
const jwt = require("jsonwebtoken")
const app = express()
const port = process.env.PORT || 5000

// midelware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true,

}))
app.use(express.json())
app.use(cookieParser())

const logger=async(req,res,next)=>{
next()
}
const verifyTokenJwt=async(req,res,next)=>{
    const token=req.cookies.cokkieToken
    let randomNumber = process.env.ACCE_TOKEN
    console.log("client token",token)
    if(!token){
        res.status(403).send({message:"not Authorization user"})
    }
    jwt.verify(token, randomNumber, function(err, decoded) {
        if(err){
            return res.status(403).send({message:"not Authorization user"})
        }
        console.log("hello",decoded) // bar
        req.user=decoded
        next()
      });
    
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kaocfbi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
       
        const servicesCollection = client.db("Doctor").collection("services")
        const checkoutCollection = client.db("Doctor").collection("checkout")
        // jwt token create
        app.post("/createtoken", async (req, res) => {
            const user = req.body
            let randomNumber = process.env.ACCE_TOKEN
            const token = await jwt.sign(user, randomNumber, { expiresIn: '1h' });
            res.cookie('cokkieToken', token, { httpOnly: true, secure: true })
            res.send("success")
            console.log(user)
        })
        // /services
        app.get("/services", async (req, res) => {
            const cursor = servicesCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })
        app.get("/checkout/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: { title: 1, price: 1 },
            };
            const result = await servicesCollection.findOne(query, options)
            res.send(result)
        })

        // checkout collection
        app.post("/checkout", async (req, res) => {
            const items = req.body
            const result = await checkoutCollection.insertOne(items);
            res.send(result)
            console.log(items)
        })
        app.get("/checkout", async (req, res) => {
            const query = checkoutCollection.find()
            const result = await query.toArray()
            res.send(result)

        })
        app.get("/checkoutEmail",verifyTokenJwt, async (req, res) => {
            console.log(req.cookies.cokkieToken,req.user)
            if(req.query.email !==req.user.email){
                return res.status(403).send({message:"not Authorization user"})
            }
            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await checkoutCollection.find(query).toArray()
            res.send(result)
        })
        app.delete("/checkout/:id", async (req, res) => {
            const deleteItem = req.params.id
            const query = { _id: new ObjectId(deleteItem) }
            const result = await checkoutCollection.deleteOne(query)
            res.send(result)
        })
        app.patch("/checkout/:id", async (req, res) => {
            const deleteItem = req.params.id
            const updateReq = req.body
            console.log(updateReq)
            const query = { _id: new ObjectId(deleteItem) }
            const updateDoc = {
                $set: {
                    status: updateReq.status
                },
            };
            const result = await checkoutCollection.updateOne(query, updateDoc)
            res.send(result)
        })







        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
    }
}
run().catch(console.dir);













app.get("/", (req, res) => {
    res.send("car doctor running")
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})