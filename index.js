var http = require("http");
var express = require("express");
var jwtsso = require("jwtsso");
var request = require("request");
var xtend = require("xtend");
var url = require("url");

var config = [
    __dirname + "/config.json",
    "/etc/sso-proxy.json",
].reduce(function(memo, configPath) {
    var config;
    try {
        config = require(configPath);
    } catch (err) {
      if (err.code === "MODULE_NOT_FOUND") return memo;
      throw err;
    }
    return xtend(memo, config);
}, {});

var urlOb = url.parse(config.target);
console.log("Config", config);


var app = express();
app.set("view engine", "hbs");

app.use(express.cookieParser());
app.use(express.cookieSession({
  secret: Math.random().toString(36).substring(2)
}));

app.use(jwtsso(xtend({
   // Set max age in seconds for the tokens
   // Defaults to 60 seconds
   maxAge: 120
}, config)));

// We use browser Javascript based redirects to support apps that
// use hash based routing such as Kibana
app.get("/sso-proxy/jsredirect", function(req, res)  {
  res.render("jsredirect");
});

app.get("/sso-proxy/login", function(req, res) {
  if (!req.session.jwt) {
    console.log("Requesting JWT");
    res.requestJwt("/sso-proxy/jsredirect");
    return;
  }

  var prev = req.session.prevUrl;
  if (prev) {
    req.session.prevUrl = null;
    res.redirect(prev);
    return;
  }

  res.redirect("/");
});

app.get("/sso-proxy/logout", function(req, res) {
    if (req.session.jwt) {
      console.log("Logging out");
      req.session = null;
      res.redirect("/sso-proxy/logout");
    } else {
      console.log("Logout ok!");
      res.redirect("/");
    }
});


app.use(function(req, res, next) {
  var jwt = req.session.jwt;

  if (!jwt) {
    req.session.prevUrl = req.url;
    res.render("login", config);
    return;
  }

  var orgOk = config.allowedOrganisationDomains.indexOf(jwt.organisation_domain) !== -1;
  if (!orgOk) {
    console.log(
      "Unauthorized login. Organisation not in",
      config.allowedOrganisationDomains,
      jwt
    );
    return res.status(401).send(
      "Unauthorized." +
      " Your organisation " + jwt.organisation_domain +
      " is not allowed here." +
      " <a href=/sso-proxy/logout>logout</a>"
    );
  }

  if (jwt.user_type != "admin") {
    console.log("Unauthorized login. Bad user type.", jwt);
    return res.status(401).send(
      "Only admins can login here. You are only a " + jwt.user_type +
      " <a href=/sso-proxy/logout>logout</a>"
    );
  }

  var targetUrl = config.target + req.url;
  console.log(new Date(), req.method, targetUrl, jwt.username + "@" + jwt.organisation_domain);

  req.pipe(request({
      url: targetUrl,
      method: req.method,
      headers: xtend({}, req.headers, { host: urlOb.hostname }),
      pool: {}
  })).pipe(res);

});


var server = http.createServer(app);
server.listen(config.port || 1337, function() {
  console.log("http://localhost:" + server.address().port);
});
