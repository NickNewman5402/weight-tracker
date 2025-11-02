require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');     // use Mongoose instead of MongoClient
const api = require('./api.js');

const app = express();
app.use(cors());
app.use(express.json());

// Connect with Mongoose
const url = process.env.MONGODB_URI;
console.log('MongoDB URI loaded:', !!url);

mongoose.connect(url)
  .then(() => {
    console.log('✅ Mongoose connected');
    console.log('DB name:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    const User = require('./models/user');
    const Card = require('./models/card');
    console.log('User model collection:', User.collection.name);
    console.log('Card  model collection:', Card.collection.name);
    User.estimatedDocumentCount().then(c => console.log('Users count:', c)).catch(console.error);
    Card.estimatedDocumentCount().then(c => console.log('Cards count:', c)).catch(console.error);
    mongoose.connection.db.listCollections().toArray()
    .then(cols => console.log('Collections in DB:', cols.map(c => c.name)))
    .catch(err => console.error('listCollections error:', err));
  })
  .catch(err => console.log('Mongo connect error:', err));



  
// Pass mongoose to API wiring
api.setApp(app, mongoose);


app.use((req, res, next) => 
            {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader(
                    'Access-Control-Allow-Headers',
                    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
                );
                res.setHeader(
                    'Access-Control-Allow-Methods',
                    'GET, POST, PATCH, DELETE, OPTIONS'
                );
                next();
                
            }
        );
        
        app.listen(5000, () => console.log('Server running on port 5000'));
        
        
/***************************************************************************************************************************************************/

//                                                          APIs MOVED TO api.js
        // var cardList = 
        // [
        //     'Roy Campanella',
        //     'Paul Molitor',
        //     'Tony Gwynn',
        //     'Dennis Eckersley',
        //     'Reggie Jackson',
        //     'Gaylord Perry',
        //     'Buck Leonard',
        //     'Rollie Fingers',
        //     'Charlie Gehringer',
        //     'Wade Boggs',
        //     'Carl Hubbell',
        //     'Dave Winfield',
        //     'Jackie Robinson',
        //     'Ken Griffey, Jr.',
        //     'Al Simmons',
        //     'Chuck Klein',
        //     'Mel Ott',
        //     'Mark McGwire',
        //     'Nolan Ryan',
        //     'Ralph Kiner',
        //     'Yogi Berra',
        //     'Goose Goslin',
        //     'Greg Maddux',
        //     'Frankie Frisch',
        //     'Ernie Banks',
        //     'Ozzie Smith',
        //     'Hank Greenberg',
        //     'Kirby Puckett',
        //     'Bob Feller',
        //     'Dizzy Dean',
        //     'Joe Jackson',
        //     'Sam Crawford',
        //     'Barry Bonds',
        //     'Duke Snider',
        //     'George Sisler',
        //     'Ed Walsh',
        //     'Tom Seaver',
        //     'Willie Stargell',
        //     'Bob Gibson',
        //     'Brooks Robinson',
        //     'Steve Carlton',
        //     'Joe Medwick',
        //     'Nap Lajoie',
        //     'Cal Ripken, Jr.',
        //     'Mike Schmidt',
        //     'Eddie Murray',
        //     'Tris Speaker',
        //     'Al Kaline',
        //     'Sandy Koufax',
        //     'Willie Keeler',
        //     'Pete Rose',
        //     'Robin Roberts',
        //     'Eddie Collins',
        //     'Lefty Gomez',
        //     'Lefty Grove',
        //     'Carl Yastrzemski',
        //     'Frank Robinson',
        //     'Juan Marichal',
        //     'Warren Spahn',
        //     'Pie Traynor',
        //     'Roberto Clemente',
        //     'Harmon Killebrew',
        //     'Satchel Paige',
        //     'Eddie Plank',
        //     'Josh Gibson',
        //     'Oscar Charleston',
        //     'Mickey Mantle',
        //     'Cool Papa Bell',
        //     'Johnny Bench',
        //     'Mickey Cochrane',
        //     'Jimmie Foxx',
        //     'Jim Palmer',
        //     'Cy Young',
        //     'Eddie Mathews',
        //     'Honus Wagner',
        //     'Paul Waner',
        //     'Grover Alexander',
        //     'Rod Carew',
        //     'Joe DiMaggio',
        //     'Joe Morgan',
        //     'Stan Musial',
        //     'Bill Terry',
        //     'Rogers Hornsby',
        //     'Lou Brock',
        //     'Ted Williams',
        //     'Bill Dickey',
        //     'Christy Mathewson',
        //     'Willie McCovey',
        //     'Lou Gehrig',
        //     'George Brett',
        //     'Hank Aaron',
        //     'Harry Heilmann',
        //     'Walter Johnson',
        //     'Roger Clemens',
        //     'Ty Cobb',
        //     'Whitey Ford',
        //     'Willie Mays',
        //     'Rickey Henderson',
        //     'Babe Ruth'
        //     ];


// app.post('/api/login', async (req, res, next) => 
    //             {
//             // incoming: login, password
//             // outgoing: id, firstName, lastName, error
                
//             var error = '';

//             const { login, password } = req.body;

//             const db = client.db('COP4331Cards');
//             const results = await db.collection('Users').find({Login:login,Password:password}).toArray();

//             var id = -1;
//             var fn = '';
//             var ln = '';

//             if( results.length > 0 )
//             {
//                 id = results[0].UserID;
//                 fn = results[0].FirstName;
//                 ln = results[0].LastName;
//             }

//             var ret = { id:id, firstName:fn, lastName:ln, error:''};
//             res.status(200).json(ret);
//             }
//         );




// // ---------------------------
// // Add Card
// // incoming: userId, card
// // outgoing: error
// // ---------------------------
// app.post('/api/addcard', async (req, res, next) =>
//             {
//                 // incoming: userId, color
//                 // outgoing: error
                    
//                 const { userId, card } = req.body;

//                 const newCard = {Card:card,UserId:userId};
//                 var error = '';

//                 try
//                 {
//                     const db = client.db('COP4331Cards');
//                     const result = db.collection('Cards').insertOne(newCard);
//                 }
//                 catch(e)
//                 {
//                     error = e.toString();
//                 }

//                 cardList.push( card );

//                 var ret = { error: error };
//                 res.status(200).json(ret);
//             }
//         );



// // ---------------------------
// // Search Cards
// // incoming: userId, search
// // outgoing: results[], error
// // ---------------------------

// app.post('/api/searchcards', async (req, res, next) => 
// {
//   // incoming: userId, search
//   // outgoing: results[], error

//   var error = '';

//   const { userId, search } = req.body;
//   var _search = search.toLowerCase().trim();
//   var _ret = [];

//   for( var i=0; i<cardList.length; i++ )
//   {
//     var lowerFromList = cardList[i].toLocaleLowerCase();
//     if( lowerFromList.indexOf( _search ) >= 0 )
//     {
//       _ret.push( cardList[i] );
//     }
//   }

//   var ret = {results:_ret, error:''};
//   res.status(200).json(ret);
// });

// // app.post('/api/searchcards', async (req, res, next) => 
// //             {
// //                 // incoming: userId, search
// //                 // outgoing: results[], error

// //                 var error = '';

// //                 const { userId, search } = req.body;

// //                 var _search = search.trim();
                
// //                 const db = client.db('COP4331Cards');
// //                 const results = await db.collection('Cards').find({"Card":{$regex:_search+'.*', $options:'i'}}).toArray();
                
// //                 var _ret = [];
// //                 for( var i=0; i<results.length; i++ )
// //                 {
// //                     _ret.push( results[i].Card );
// //                 }
                
// //                 var ret = {results:_ret, error:error};
// //                 res.status(200).json(ret);
// //             }
// //         );

