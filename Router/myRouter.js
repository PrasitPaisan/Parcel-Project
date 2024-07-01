const express = require('express');
const router = express.Router();
const path = require('path');
const bodyParser = require('body-parser');
const {Userdb,userSchema,getCurrentMonth,removeDay,countDocumentInMonth,countDocumentInDay,contDocumentInYear} = require('../model/User'); // Adjust the path as necessary
const { default: mongoose } = require('mongoose');
const { render } = require('ejs');

// Use body-parser middleware to parse form data
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());




router.get('/', async (req, res) => {
    res.render('index')
});

router.get('/login',(req,res)=>{
    res.render('login')
})
////ADMIN 
router.post('/admin', async (req, res) => {
    if (req.session.login) {
        try {
            console.log('can access post');
            const yearAndMonth = req.body.DBname;
            console.log(`year and month is ${yearAndMonth}`);

            const db = mongoose.connection.useDb(yearAndMonth);
            const nativeDb = db.db;
            const collections = await nativeDb.listCollections().toArray();
            const collectionNames = collections.map(collection => collection.name);
            console.log(collectionNames)
        
            const documentCount = await countDocumentInMonth(yearAndMonth);
            console.log(documentCount);
            // for check yearandmonth if dont have data will change to use Current time 
            if(yearAndMonth){
                res.render('admin', { dataCollection: collectionNames, document: [] ,counts:documentCount ,timeCurrent:yearAndMonth});
            }else{
                res.render('admin', { dataCollection: collectionNames, document: [] ,counts:documentCount ,timeCurrent:getCurrentMonth()});
            }
        } catch (err) {
            console.error("Error fetching collections:", err);
            res.status(500).send("Internal Server Error try 1 in post");
        }
    } else {
        res.render('login');
    }
});

router.get('/admin', async (req, res) => {
    if (req.session.login) {
        try {
            console.log('can access get');
            const days = req.query.name;

            if (days) {
                // Derive database name from days
                function removeDay(date) {
                    const dateall = date.split('-');
                    return `${dateall[0]}-${dateall[1]}`;
                }
                let yearAndMonth = removeDay(days);
                console.log("Databasename : "+yearAndMonth + " and collectionanme : "+ days);

                // Use the derived database name
                // Uncomment the next line and comment out the fake database name for real usage
                // const db = mongoose.connection.useDb(yearAndMonth);
                // FAKE FOR TEST
                const db = mongoose.connection.useDb(yearAndMonth);

                const nativeDb = db.client.db(yearAndMonth);
                const collections = await nativeDb.listCollections().toArray();
                const collectionNames = collections.map(collection => collection.name);
                console.log(collectionNames);
            

                try {
                    // Find document from days //this code dupicate
                    const Table = db.model(days, userSchema, days);
                    const documents = await Table.find().exec();
                    console.log(documents);
                    // count just One day
                    const documentCount = await countDocumentInDay(documents);
                    console.log(`count in ${days}`);

                    res.render('admin', { dataCollection: collectionNames, document: documents,counts:documentCount ,timeCurrent:days});
                } catch (err) {
                    console.error(`Error fetching documents from ${req.query.name}:`, err);
                    res.status(500).send("Internal Server Error try 2 GET");
                }
            } else {
                res.render('admin', { dataCollection: [], document: [] ,counts:[],timeCurrent:[]});
            }
        } catch (err) {
            console.error("Error fetching collections:", err);
            res.status(500).send("Internal Server Error try 1 GET");
        }
    } else {
        res.render('login');
    }
});


router.get('/admin/logout',(req,res)=>{
    req.session.destroy((error)=>{
        if(error){
            console.error("Error destroying session:", err);
            return res.status(500).send("Internal Server Error");
        }else{
            res.redirect('/admin')
        }
    })
})

router.post('/login/admin',(req,res)=>{
    const username = req.body.username
    const password = req.body.password
    const timelogin = 10*60*1000;
    if(username == "admin" && password == "123" ){
        req.session.username = username
        req.session.password = password
        req.session.login = true
        req.session.cookie.maxAge = timelogin
        res.redirect('/admin')
    }else{
        res.redirect('/login')
    }
})

router.get('/search', async (req, res) => {
    const { date, name, boxNumber } = req.query;

    console.log(`search data is Date : ${date} name : ${name} boxNumber :${boxNumber}`)

    // Create a query object
    const query = {};
    if (date) query.date = date;
    if (name) query.name = name;
    if (boxNumber) query.boxNumber = boxNumber;
    //set up collection name by date it will change to sting type 
    const collectionName = String(date);

    //access and defind database for search 
    const databasename  = removeDay(collectionName)
    console.log(`search in database name is :  ${databasename}`)
    const db = mongoose.connection.useDb(databasename)

    
    try {
        //access the collection in mongoDB
        const Userdb = db.model(collectionName, userSchema, collectionName);

        // Fetch data based on the query object
        const data = await Userdb.find(query).exec();

        console.log("Fetched Data:", data);
        res.render('search', { data: data ,dateLastSearch:date});
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/insert_user', (req, res) => {
    if(req.session.login){
        const {date,company} = req.query
        
        res.render('insertForm',{date:date,company:company});
    }else{
        res.render('login')
    }
    
});

router.post('/saveUser/DB', async (req, res) => {
    console.log('Request Body:', req.body); // Log the incoming request body
    try {
        const { date, name, company: companyInput } = req.body; // Correctly extract company from req.body
        let company = companyInput ? String(companyInput) : '';
        
        // derive database name from the date
        // database yearandmonth
        const databaseName = removeDay(date)
        console.log(`databasename is : ${databaseName}`)

        //set the database connect dynamically
        const db = mongoose.connection.useDb(databaseName);

        // Define collection for document
        const collectionName = String(date);
        const Userdb = db.model(collectionName, userSchema, collectionName);

        // Validate input
        if (!name || typeof name !== 'string') {
            return res.status(400).send('Valid name is required');
        }
        // Fix numberBox
        const dataUser = await Userdb.find().exec();
        let numberBox = dataUser.length + 1;
        const statusBoxDefault = true;

        // Create new user object
        let userData = new Userdb({
            date: new Date(date),
            name: name,
            company: company,
            boxNumber: numberBox,
            status: statusBoxDefault
        });

        // Save user to the database
        await userData.save();
        console.log('Save data:', userData);

        // Redirect to home page
        return res.redirect(`/insert_user?date=${date}&company=${company}`); // Use return to ensure no further code is executed after redirect
    } catch (err) {
        console.error('Error saving data for user insert:', err);

        if (!res.headersSent) { // Check if the response has been sent already
            return res.status(500).send('ERROR saving data for user insert');
        }
    }
});

router.get('/admin/control/user_id',(req,res)=>{
    const {id ,name,company,date,status} = req.query
    console.log(req.query)
    const dataUser = {
        id:id,
        date:date,
        name:name,
        company:company,
        status:status,
    }

    res.render('parcel',{userData:dataUser})
})
router.post('/admin/control/getoutOfUserParcel', async (req, res) => {
    let {date, name, company, status } = req.body;
    const id = req.query.id;
    console.log(req.body);
    console.log(`Date: ${date}, ID: ${id}`);

    // Convert status to boolean
    if(status === "false"){
        status = false;
    }else{
        status = true
    }

    try {
        const databaseName = removeDay(date);
        const db = mongoose.connection.useDb(databaseName);

        const UserCollection = db.model(date, userSchema, date); // Adjust collection name as needed
        const result = await UserCollection.updateOne({ _id: id }, { $set: { name: name, company: company, status: status } });

        console.log(`Update result: ${result}`);
        res.redirect(`/admin?name=${date}`);
    } catch (err) {
        console.error('Error updating status:', err);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;

