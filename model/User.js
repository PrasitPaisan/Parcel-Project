//use mongoose
const mongoose = require('mongoose')

//function for return current time 
function getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based

    return `${year}-${month}`;
}

function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getYear(date){
    if (!date) {
        return null; // Or handle this case as needed
    }
    const dateall = date.split('-');
    return `${dateall[0]}`;
}

function removeDay(date) {
    if (!date) {
        return null; // Or handle this case as needed
    }
    const dateall = date.split('-');
    return `${dateall[0]}-${dateall[1]}`;
}

async function countDocumentInDay(documents) {
    let received = 0;
    let noreceived = 0;

    for (const document of documents) {
        if (document.status === true) {
            noreceived += 1;
        } else if (document.status === false) {
            received += 1;
        } else {
            console.log(`This data can't be counted! Name: ${document.name}`);
        }
    }

    return { received, noreceived, total: received + noreceived };
}

// This function counts documents for all days in the given month
async function countDocumentInMonth(yearAndMonth) {
    let received = 0;
    let noreceived = 0;

    const db = mongoose.connection.useDb(yearAndMonth);
    const nativeDb = db.db;
    const collections = await nativeDb.listCollections().toArray();
    const collectionNames = collections.map(collection => collection.name);

    for (const collectionName of collectionNames) {
        const tableName = db.model(collectionName, userSchema, collectionName);
        const documents = await tableName.find().exec();
        //count day from function find doc. in day 
        const dayCount = await countDocumentInDay(documents);
        received += dayCount.received;
        noreceived += dayCount.noreceived;
    }

    return { received, noreceived, total: received + noreceived };
}



async function contDocumentInYear(dateOrMonth) {
    const year = getYear(dateOrMonth); // Assuming getYear is a function that extracts the year from dateOrMonth
    const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    let received = 0;
    let noreceived = 0;

    for (const month of months) {
        const yearAndMonth = `${year}-${month}`;
        const monthCount = await countDocumentInMonth(yearAndMonth);
        received += monthCount.received;
        noreceived += monthCount.noreceived;
    }

    return { received, noreceived, total: received + noreceived };
}


//connect mongodb
// เชื่อมต่อ MongoDB
const presentMonth = getCurrentMonth()
const presentDate = getCurrentDate()
const dbUrl = `mongodb://localhost:27017/${presentMonth}`;
mongoose.connect(dbUrl).catch(error => {
    console.error("Error connecting to MongoDB:", error);
});



//design Screma
let userSchema = new mongoose.Schema({
    date:Date,
    name:String,
    company:String,
    boxNumber:Number,
    status:Boolean
    

})
// ,{collection:}
//  create model
let Userdb = mongoose.model(`${presentDate}`,userSchema)


//create model for save data
module.exports.saveUser = async function(model,document){
    const user = new Userdb(document);
    await user.save()
}

//export
module.exports = {Userdb,userSchema,getCurrentMonth,countDocumentInDay,countDocumentInMonth,contDocumentInYear,removeDay};

