const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const router = require('./Router/myRouter'); // Adjust the path as necessary
const session = require('express-session')

// Use body-parser middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set the view engine if you're using templating (e.g., EJS, Pug)
app.set('view engine', 'ejs'); // Or 'pug', 'hbs', etc.
app.set('views', path.join(__dirname, 'views')); // Adjust the views path as necessary

//import session for use in session
app.use(session({secret:'mysession',resave:false,saveUninitialized:'public'}));

//connect public folder
app.use(express.static(path.join(__dirname,'public')))
// Use the router
app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
