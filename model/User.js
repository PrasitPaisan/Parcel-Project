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
module.exports = {Userdb,userSchema,getCurrentMonth};

