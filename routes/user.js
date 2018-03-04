var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport= require('passport');
var multer= require('multer');

var Cart= require('../models/cart');
var Order= require('../models/order');

var csrfProtection=csrf();

router.use(csrfProtection);

router.get('/profile', isLoggedIn, function (req, res, next) {
    Order.find({user: req.user}, function(err, orders) {
        if (err) {
            return res.write('Error!');
        }
        var cart;
        orders.forEach(function(order) {
            cart = new Cart(order.cart);
            order.items = cart.generateArray();
        });
        res.render('user/profile', { orders: orders});
    });
});

router.get('/account', isLoggedIn, function (req, res, next) {
  var successMsg=req.flash('success')[0];
  res.render('user/account', {successMsg:successMsg, noMessage: !successMsg});
});

router.get('/logout',isLoggedIn, function (req, res, next) {
  req.logout();
  req.flash('success', 'You have been logged out successfully!')
  res.redirect('/');
});

router.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));
    router.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : 'user/profile',
            failureRedirect : 'user/login'
        }));


router.use('/' ,notLoggedIn, function (req, res, next) {
  next();
});

router.get('/register', function (req, res, next) {
  var messages= req.flash('error');
  res.render('user/register', {csrfToken: req.csrfToken(), messages:messages, hasErrors:messages.length>0, title:'Register'});
});

router.post('/register' ,passport.authenticate('local.register', {
  failureRedirect: '/user/register',
  failureFlash: true
}), function (req, res, next) {
    if(req.session.oldUrl){
      var oldUrl=req.session.oldUrl;
      req.session.oldUrl=null;
      res.redirect(oldUrl);
    }else{
    res.redirect('/');
    }
});

router.get('/login', function (req, res, next) {
  var messages= req.flash('error');
  res.render('user/login', {csrfToken: req.csrfToken(), messages:messages, hasErrors:messages.length>0, title:'Login'});
});

router.post('/login', passport.authenticate('local.login', {
  failureRedirect: '/user/login',
  failureFlash: true
}), function (req, res, next) {
    if(req.session.oldUrl){
      var oldUrl=req.session.oldUrl;
      req.session.oldUrl=null;
      res.redirect(oldUrl);
    }else{
      if(req.user.admin){
        res.redirect('/admin');
      }
      else{
      console.log(req.user);
      req.flash('success', 'Welcome to shoping cart!! '+ req.user.username);
      res.redirect('/');
    }
  }
});

function isLoggedIn(req, res, next) {
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}

function notLoggedIn(req, res, next) {
  if(!req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}

module.exports = router;
