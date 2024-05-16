const express = require('express');
const cors = require('cors');
require('dotenv').config()
const cookieParser = require('cookie-parser')
const jwt = require("jsonwebtoken")
const app = express()
const port = process.env.PORT || 5000
const multer = require('multer')

// midelware
const corsOptions = {
    origin: ['http://localhost:5173'],
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))

app.use(express.json())
app.use(cookieParser())
// multer code

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})
const upload = multer({ storage: storage })

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
// verify token
const verifyToken = (req, res, next) => {
    const tokenGet = req?.cookies?.MyToken
    if (!tokenGet) {
        return res.status(401).send("unAuthorize access")
    }
    jwt.verify(tokenGet, process.env.ACCE_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send("unAuthorize access")
        }
        req.user = decoded
        next()
    });
    console.log(tokenGet)

}
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)

        const servicesCollection = client.db("Doctor").collection("services")
        const checkoutCollection = client.db("Doctor").collection("checkout")
        // create json web token
        app.post("/jwt", async (req, res) => {
            const user = req.body
            // console.log("jwt user", user)
            const token = jwt.sign(user, process.env.ACCE_TOKEN, { expiresIn: '1h' });
            res.cookie("MyToken", token, { httpOnly: true, secure: true, sameSite: "none" })
                .send({ success: true })
        })
        app.post("/logout", async (req, res) => {
            const user = req.body
            res.clearCookie("MyToken", { maxAge: 0 }).send({ success: true })
            // console.log("logut user", user)
        })

        // /services
        app.get("/services", async (req, res) => {
            const filter = req.query
            console.log(filter)
            const query = {
                title: {
                    $regex: filter.search,
                    $options: "i"
                }
            }
            const options = {
                sort: {
                    price: filter.act === "acending" ? 1 : -1
                }
            }
            const cursor = servicesCollection.find(query, options);
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
        })
        app.get("/checkout", async (req, res) => {
            const query = checkoutCollection.find()
            const result = await query.toArray()
            res.send(result)

        })
        app.get("/checkoutEmail", verifyToken, async (req, res) => {
            // console.log("reques user", req.query)
            // console.log("token reques user", req.user)
            if (req.query.email !== req.user.email) {
                return res.status(403).send("forbidden...")
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