var express = require('express');
var router = express.Router();

var Cart= require('../models/cart');
var ProductSchema= require('../models/product');
var Order= require('../models/order');
var user= require('../routes/user');

/* GET home page. */
router.get('/', function(req, res, next) {
  var successMsg=req.flash('success')[0];
  ProductSchema.find(function (err, docs) {
    var productChunks=[];
    var chunkSize=3;
    for (var i = 0; i < docs.length; i+=chunkSize) {
      productChunks.push(docs.slice(i, i+chunkSize));
    }
    res.render('products/index', { title: 'ShoppingCart', products: productChunks, successMsg:successMsg, noMessage: !successMsg});
  });
});

router.get('/addToCart/:id', function (req, res, next) {
  var productId=req.params.id;
  var cart= new Cart(req.session.cart ? req.session.cart : {});

  ProductSchema.findById(productId, function (err, product) {
    if(err){
      return res.redirect('/');
    }
    cart.add(product, product.id);
    req.session.cart= cart;
    console.log(req.session.cart);
    res.redirect('/');
  });
});

router.get('/reduce/:id', function (req, res, next) {
  var productId=req.params.id;
  var cart= new Cart(req.session.cart ? req.session.cart : {});
  cart.reduceByOne(productId);
  req.session.cart= cart;
  res.redirect('/cart');
});

router.get('/remove/:id', function (req, res, next) {
  var productId=req.params.id;
  var cart= new Cart(req.session.cart ? req.session.cart : {});
  cart.removeItem(productId);
  req.session.cart= cart;
  res.redirect('/cart');
});

router.get('/cart', function (req, res, next) {
  if (!req.session.cart) {
    return res.render('products/cart',{products: null});
  }
  var cart= new Cart(req.session.cart);
  res.render('products/cart',{products: cart.generateArray(), totalPrice: cart.totalPrice});
});

router.get('/checkout',isLoggedIn, function (req, res, next) {
  if (!req.session.cart) {
    return res.redirect('/cart');
  }
  var cart= new Cart(req.session.cart);
  var errMsg= req.flash('error')[0];
  res.render('products/checkout',{total:cart.totalPrice, errMsg:errMsg, noError:!errMsg});
});

router.post('/checkout',isLoggedIn, function(req, res, next){
  if (!req.session.cart) {
    return res.redirect('/cart');
  }
  var cart= new Cart(req.session.cart);
  var stripe = require("stripe")(
  "sk_test_G0vj5qtsnqmAF3NESy4uON4e"
);

stripe.charges.create({
  amount: cart.totalPrice * 100,
  currency: "usd",
  source: req.body.stripeToken, // obtained with Stripe.js
  description: "Test Charge"
}, function(err, charge) {
  if(err) {
    req.flash('error', err.message);
      res.redirect('/checkout');
  }
  var order= new Order({
    user:req.user,
    cart :cart,
    address: req.body.address,
    name: req.body.name,
    paymentId: charge.id
  });
  order.save(function(err, result){
    if(err){
      return res.redirect('/checkout');
    }
    req.flash('success', 'Order has been placed!!');
    req.session.cart=null;
    res.redirect('/');
  });
});
});

function isLoggedIn(req, res, next) {
  if(req.isAuthenticated()){
    return next();
  }
  req.session.oldUrl=req.url;
  res.redirect('/user/login');
}

module.exports = router;
