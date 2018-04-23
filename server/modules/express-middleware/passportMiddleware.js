/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const config = require('../../config');
const passport = require('passport');
const Strategy = require('passport-wsfed-saml2').Strategy;

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(
  new Strategy(
    Object.assign({ protocol: 'samlp' }, config.getUserValue('local').passport),
    (profile, done) => {
      return done(null, {
        name: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn'].split('@')[0],
        groups: profile['http://schemas.xmlsoap.org/claims/Group']
      });
    }
  )
);

module.exports = passport;
