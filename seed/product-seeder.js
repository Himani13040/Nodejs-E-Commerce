var ProductSchema= require('../models/product');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/ShoppingCart', function (err) {
  if(err){
    return console.log(err);
  }
  return console.log('Successfully connected to MongoDB');
});

var products= [
  new ProductSchema({
      imagePath:'https://flask-e-commerce-api-heroku.herokuapp.com/static/uploads/ra%2Crelaxed_fit%2Cx2000%2C101010_01c5ca27c6%2Cfront-c%2C295%2C163%2C750%2C1000-bg%2Cf8f8f8.u1.jpg',
      title: 'Women Tee',
      description: 'Women Tee!!!!',
      price: 599
  }),
  new ProductSchema({
      imagePath:'https://flask-e-commerce-api-heroku.herokuapp.com/static/uploads/8442964_9212.jpg',
      title: 'Mens Tshirt',
      description: 'USPA!!!!',
      price: 1299
  }),
  new ProductSchema({
      imagePath:'https://flask-e-commerce-api-heroku.herokuapp.com/static/uploads/bg-job_sm.jpg',
      title: 'Mens Tshirt',
      description: 'This is cool!!!!',
      price: 699
  })
];

var loop=0;
for (var i = 0; i < products.length; i++) {
  products[i].save(function(err, result){
    loop++;
    if(loop === products.length){
      exit();
    }
  });
}

function exit() {
  mongoose.disconnect();
}
