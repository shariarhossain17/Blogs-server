const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  // console.log(token);
  jwt.verify(token, process.env.JWT_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.plsay.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const blogsUser = client.db("Blogs").collection("user");
    const blogCollection = client.db("Blogs").collection("blog");


    // get user data specific
    app.get('/userData/:email',verifyJwt,async(req,res)=>{
      const email = req.params.email;
      const filter = {email:email};
      const result = await blogsUser.findOne(filter)
      res.send(result)
    })
    // update user
    app.patch("/user/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const userUpdate = req.body;
      const filter = { email: email };  
      const updateDoc = {
        $set: userUpdate,
      };
      const result = await blogsUser.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.delete("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = blogCollection.deleteOne(filter);
      res.send(result);
    });
    // specefic user post
    app.get("/blogsuserspost/:email",verifyJwt, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email
      if(decodedEmail === email){
        const filter = { email: email };
        const blogs = blogCollection.find(filter);
        const result = await blogs.toArray();
        res.send(result);
      }
      else{
        return res.status(403).send({ message: "forbidden access" });
      }
     
    });
    // get all user
    app.get("/blog", async (req, res) => {
      const result = await blogCollection.find().toArray();
      res.send(result);
    });
    // specific blog
    app.get("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const filterId = { _id: ObjectId(id) };
      const result = await blogCollection.findOne(filterId);
      res.send(result);
    });
    // recent blog post
    app.get("/recent", async (req, res) => {
      const result = (await blogCollection.find().toArray()).reverse();
      res.send(result);
    });
    // post user
    app.post("/blog", async (req, res) => {
      const blog = req.body;
      const result = await blogCollection.insertOne(blog);
      res.send(result);
    });
    // put all user
    app.put("/bloguser/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };

      const result = await blogsUser.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.JWT_TOKEN, {
        expiresIn: "1d",
      });

      res.send({ result, token });
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Blogs server");
});
app.listen(port, () => {
  console.log(`blog server running ${port}`);
});
