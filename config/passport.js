var passport = require('passport');
var User=require('../models/user');
var configAuth = require('../config/auth');
var LocalStrategy= require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;


passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use('local.register', new LocalStrategy({
  passReqToCallback: true
}, function (req, username, password, done) {
  req.checkBody('username', 'Invalid Username!').notEmpty();
  req.checkBody('password', 'Invalid Password!').notEmpty().isLength({min:6});
  req.checkBody('email', 'Invalid Email!').notEmpty().isEmail();
  req.checkBody('Address', 'Invalid Address!').notEmpty().isLength({max:25});
  var errors= req.validationErrors();
  if(errors){
    var messages=[];
    errors.forEach(function (error) {
      messages.push(error.msg);
    });
    return done(null, false, req.flash('error', messages));
  }
  User.findOne({'username':username}, function (err, user) {
    if(err) {return done (err);}
    if(user){
      return done(null, false, {message:'Username already exists!'});
    }
    var newUser= new User();
    newUser.username= username;
    newUser.password= newUser.encryptPassword(password);
    newUser.email=req.body.email;
    newUser.Address=req.body.Address;
    newUser.admin=false;
    newUser.save(function (err, result) {
      if(err) {
        return done (err);
      }
      return done(null, newUser);
    });
  });
}
));

passport.use('local.login', new LocalStrategy ( {
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
}, function (req, username, password, done) {
  req.checkBody('username', 'Invalid Username!').notEmpty();
  req.checkBody('password', 'Invalid Password!').notEmpty();
  var errors= req.validationErrors();
  if(errors){
    var messages=[];
    errors.forEach(function (error) {
      messages.push(error.msg);
    });
    return done(null, false, req.flash('error', messages));
  }
  User.findOne({'username':username}, function (err, user) {
    if(err) {return done (err);}
    if(!user){
      return done(null, false, {message:'No user found!'});
    }
    if(!user.validPassword(password)){
      return done(null, false, {message:'Wrong password!'});
    }
    return done(null, user);
  });
}));

passport.use(new FacebookStrategy({

        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL

    },

    function(token, refreshToken, profile, done) {

        process.nextTick(function() {
            User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                if (err)
                    return done(err);
                if (user) {
                    return done(null, user); 
                } else {
                    var newUser            = new User();
                    newUser.facebook.id    = profile.id;                  
                    newUser.facebook.token = token;                     
                    newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; 
                    newUser.facebook.email = profile.emails[0].value; 
                    newUser.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }

            });
        });

    }));
