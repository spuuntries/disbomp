require("dotenv").config();

const Discord = require(`discord.js`),
  client = new Discord.Client({
    intents: [
      "GUILDS",
      "GUILD_MEMBERS",
      "GUILD_MESSAGES",
      "GUILD_MESSAGE_REACTIONS",
    ],
  }),
  procenv = process.env,
  token = procenv.TOKEN,
  express = require("express"),
  app = express(),
  httpServer = require("http").createServer(app),
  io = require("socket.io")(httpServer),
  morgan = require("morgan"),
  twdne = require("twdne.js"),
  slowDown = require("express-slow-down"),
  { DateTime } = require("luxon"),
  enforce = require("express-sslify"),
  db = (() => {
    const Enmap = require("enmap"),
      db = new Enmap({
        name: "db",
      });
    return db;
  })();

app.enable("trust proxy");
// only if behind a reverse proxy

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100,
  delayMs: 1000,
});

var waifu = { img: "/kekboiii.png" };
var trig = "Unknown";
var last = "Unknown";
var othig = "Unknown";
var worship = 0;
var stdt = DateTime.now().toUTC().toHTTP() + " [UTC]";
var pstat = [];

function login() {
  client
    .login(token)
    .then(() => {
      console.log(
        `${new Date()}: ${client.user.tag} v${
          require("./package.json").version
        } ready to remind!`
      );
    })
    .catch(() => {
      login();
    });
}

login();

client.on("ready", () => {
  setInterval(async () => {
    try {
      let res = db.has("nexT");
      if (res) {
        let nextRes = db.get("nexT");
        if (nextRes.t) {
          trig = nextRes.tr;
          othig = nextRes.ot;
          if (
            DateTime.now().diff(DateTime.fromISO(nextRes.t)).toMillis() >= 5000
          ) {
            var bumpchan = await client.channels.fetch(nextRes.c);
            bumpchan.send(
              "Beep Boop, you can prolly bump now, I think <:stoopid:805703208882274374>"
            );
            bumpchan.send(`<:AU_whipbliant:888217559063736321>`);
            last = DateTime.now().toUTC().toHTTP();
            othig = "Unknown";
            switch (res.v) {
              case "ac":
                last = last + " [UTC]";
                break;
              case "db":
                last = last + " [DEBUG] [UTC]";
                break;
              case "mn":
                last = last + " [MANUAL] [UTC]";
                break;

              default:
                break;
            }
            function delK() {
              try {
                db.delete("nexT");
              } catch (e) {
                console.log(
                  DateTime.now().toUTC().toHTTP() +
                    "failed to delete previous trigger, retrying...",
                  e
                );
                setTimeout(() => {
                  delK();
                }, 2000);
              }
            }
            delK();
          }
        }
      }
    } catch (e) {
      console.log(`Failed to get next trigger`, e);
    }
  }, 2000);
  setTimeout(() => {
    var obj = {};
    var mins;
    if (DateTime.now().toJSDate().getMinutes().toString().length == 1) {
      mins = "0" + DateTime.now().toJSDate().getMinutes().toString();
    } else {
      mins = DateTime.now().toJSDate().getMinutes().toString();
    }
    obj[DateTime.now().toJSDate().getHours().toString() + ":" + mins] =
      client.ws.ping;
    pstat.push(obj);
    if (pstat.length > 5) {
      pstat = pstat.slice(Math.max(pstat.length - 5, 0));
    }
  }, 3000);
});

client.on(`messageCreate`, (message) => {
  if (message.author.id == procenv.DID) {
    if (
      message.content.toLowerCase().includes(`bump done`) ||
      message.embeds.find((e) =>
        e.description.toLowerCase().includes("bump done")
      )
    ) {
      console.log(`${new Date()}: Detected trigger, sending in 2 hours.`);
      trig = DateTime.now().toUTC().toHTTP() + " [UTC]";
      othig = DateTime.now().toUTC().plus({ hours: 2 }).toHTTP() + " [UTC]";
      db.set("nexT", {
        t: DateTime.now().plus({ hours: 2 }),
        tr: DateTime.now().toUTC().toHTTP() + " [UTC]",
        ot: DateTime.now().toUTC().plus({ hours: 2 }).toHTTP() + " [UTC]",
        c: message.channel.id,
        v: "ac",
      });
    }
  }
  if (message.author.id == procenv.OID) {
    if (message.content.toLowerCase().includes(`bumptest`)) {
      console.log(`${new Date()}: Detected testing trigger, sending in 2s.`);
      trig = DateTime.now().toUTC().toHTTP() + " [DEBUG] [UTC]";
      othig =
        DateTime.now().toUTC().plus({ seconds: 2 }).toHTTP() + " [DEBUG] [UTC]";
      db.set("nexT", {
        t: DateTime.now().plus({ seconds: 2 }),
        ot:
          DateTime.now().toUTC().plus({ seconds: 2 }).toHTTP() +
          " [DEBUG] [UTC]",
        tr: DateTime.now().toUTC().toHTTP() + " [DEBUG] [UTC]",
        c: message.channel.id,
        v: "db",
      });
    }
    if (message.content.toLowerCase().includes(`trigbump`)) {
      const args = message.content.trim().split(/ +/);
      if (args.length > 1) {
        console.log(
          `${new Date()}: Detected manual trigger, sending in ${Math.round(
            args[1]
          )} minutes.`
        );
        trig = DateTime.now().toJSDate().toString() + " [MANUAL] [UTC]";
        othig =
          DateTime.now()
            .plus({ minutes: Math.round(args[1]) })
            .toHTTP() + " [MANUAL] [UTC]";
        db.set("nexT", {
          t: DateTime.now().plus({ minutes: Math.round(args[1]) }),
          ot:
            DateTime.now()
              .toUTC()
              .plus({ minutes: Math.round(args[1]) })
              .toHTTP() + " [MANUAL] [UTC]",
          tr: DateTime.now().toJSDate().toString() + " [MANUAL] [UTC]",
          c: message.channel.id,
          v: "mn",
        });
      } else {
        console.log(
          `${new Date()}: Detected manual trigger, sending in 2 hours.`
        );
        trig = DateTime.now().toJSDate().toString() + " [MANUAL] [UTC]";
        othig = DateTime.now().plus({ hours: 2 }).toHTTP() + " [MANUAL] [UTC]";
        db.set("nexT", {
          t: DateTime.now().plus({ hours: 2 }),
          tr: DateTime.now().toJSDate().toString() + " [MANUAL] [UTC]",
          ot:
            DateTime.now().toUTC().plus({ hours: 2 }).toHTTP() +
            " [MANUAL] [UTC]",
          c: message.channel.id,
          v: "mn",
        });
      }
    }
  }
});

setInterval(() => {
  twdne.randomWaifu().then((w) => {
    waifu = w;
  });
  var obj = {};
  var mins;
  if (DateTime.now().toJSDate().getMinutes().toString().length == 1) {
    mins = "0" + DateTime.now().toJSDate().getMinutes().toString();
  } else {
    mins = DateTime.now().toJSDate().getMinutes().toString();
  }
  obj[DateTime.now().toJSDate().getHours().toString() + ":" + mins] =
    client.ws.ping;
  pstat.push(obj);
  if (pstat.length > 5) {
    pstat = pstat.slice(Math.max(pstat.length - 5, 0));
  }
}, 60000);

io.on("connection", (socket) => {
  setInterval(() => {
    socket.emit("pingInfo", {
      ping: client.ws.ping,
      uptime: Math.round(process.uptime()),
      last: last,
      god: waifu.img,
      trig: trig,
      stdt: stdt,
      next: othig,
      pstat: pstat,
    });
    socket.emit("updateWorship", {
      num: worship,
    });
  }, 1000);
  socket.on("worship", (arg) => {
    worship = worship + 1;
    socket.emit("updateWorship", {
      num: worship,
    });
  });
});

app.use(enforce.HTTPS({ trustProtoHeader: true }));
app.use(speedLimiter);
app.use(morgan("dev"));
app.use(morgan("combined"));
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("*", (req, res) => {
  res.send("[ERR] 42069 [ERR]");
});

httpServer.listen(procenv.PORT, () => {
  console.log(new Date() + ": Listening on port " + procenv.PORT);
});
