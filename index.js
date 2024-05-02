const express = require('express');
const cors = require('cors');
require('dotenv').config()

const app=express()
const port=process.env.PORT||5000

// midelware
app.use(cors())
app.use(express.json())

console.log(process.env.DB_PASS)
console.log(process.env.DB_USER)

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
    // await client.connect();
    // Send a ping to confirm a successful connection
    const servicesCollection=client.db("Doctor").collection("services")
    const checkoutCollection=client.db("Doctor").collection("checkout")
    app.get("/services",async(req,res)=>{
        const cursor = servicesCollection.find();
        const result=await cursor.toArray();
        res.send(result)
    })
    app.get("/checkout/:id",async(req,res)=>{
        const id=req.params.id
        const query={_id:new ObjectId(id)}
        const options = {
            projection: {  title: 1, price: 1 },
          };
        const result=await servicesCollection.findOne(query,options)
        res.send(result)
    })

// checkout collection
app.post("/checkout",async(req,res)=>{
    const items=req.body
    const result = await checkoutCollection.insertOne(items);
    res.send(result)
    console.log(items)
})
// app.get("/checkout",async(req,res)=>{
//     const query= checkoutCollection.find()
//     const result = await query.toArray()
//     res.send(result)
    
// })
app.get("/checkout",async(req,res)=>{
    console.log(req.query)
    let query={}
    if(req.query?.email){
        query={email:req.query.email}
    }
    const result=await checkoutCollection.find(query).toArray()
    res.send(result)
})







    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);













app.get("/",(req,res)=>{
    res.send("car doctor running")
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })