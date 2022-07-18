# E-commerce

The app was deployed in heroku, you can visit the site here: http://e-commerce-diego-project.herokuapp.com/

A simple shop site, where you can add products to your cart and order them. Also you can add the products you want to sell, and they would be able to everyone. To get acces to all the fetaures, you should login.

### Some technologies that I used:
- Node.js --> Javascript runtime
- Express.js --> Node.js framework to develop applications
- MongoDb --> NoSQL database. Mongoose was used to make the whole porcess easier.
- EJS --> Templating engine
- Stripe --> (for payments). Really basic implementation
- Bootstrap --> CSS framework

### For security other aspects:
1. CSRF --> People could create fake sites, that can lead to my backend. That would be very unsafe, thats why this protection was implemented. csurf was used to prevent this.
2. Password encryption when stored in the database. Bcrypt.js was used for this. 
3. Environmental variables --> Anyione with the source code, will not have access to this variables.
4. Sessions --> Authentication in the server for the same user.

### Some Documentation:

- express: https://expressjs.com/
- mongoose: https://mongoosejs.com/docs/api.html
- csurf: https://www.npmjs.com/package/csurf
- dotenv: https://www.npmjs.com/package/dotenv
- bcrypt.js: https://www.npmjs.com/package/bcryptjs
- EJS: https://www.npmjs.com/package/ejs
- Stripe: https://stripe.com/docs
- body-parser: https://www.npmjs.com/package/body-parser
- compression: https://www.npmjs.com/package/compression
- connect-flash: https://www.npmjs.com/package/connect-flash
- connect-mongodb-session: https://www.npmjs.com/package/connect-mongodb-session
- express-validator: https://express-validator.github.io/docs/
- mongodb: https://www.npmjs.com/package/mongodb
- multer: https://www.npmjs.com/package/multer
- nodemailer: https://nodemailer.com/about/
- pdfkit: https://www.npmjs.com/package/pdfkit
- nodemon: https://www.npmjs.com/package/nodemon
