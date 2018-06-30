'use strict';

require('dotenv').config();
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const useragent = require('useragent');
const redis = require('redis');
const WebSocket = require('ws');

const pub = redis.createClient();
const sub = redis.createClient();

const getSiteData = require('./utils/getSiteData');
const getLocalityData = require('./utils/getLocalityData');
const auth = require('./utils/auth');

const PORT = process.env.PORT || 8084;
const wss = new WebSocket.Server({ noServer: true });

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/api/v1/log', auth, async (req, res) => {
  const { data } = req.body;
  const agent = useragent.parse(req.get('user-agent'));

  const saveData = {
    timestamp: data.attributes.timestamp,
    device: {
      userAgent: req.get('user-agent'),
      browser: agent.toAgent(),
      device: agent.os.toString()
    },
    site: await getSiteData(data.attributes.url),
    location: await getLocalityData(data.attributes.location),
  };

  pub.publish('track matt', JSON.stringify(saveData));

  res.json({
    data: {
      type: 'url',
      attributes: saveData
    }
  });
});

wss.on('connection', (ws) => {
  console.log('A client is connected to Track Matt');
  sub.on('message', (channel, message) => {
    ws.send(message);
  });

  sub.subscribe('track matt');
});

server.on('upgrade', (req, sock, head) => {
  console.log(req.url);
  if (req.url === '/tracker') {
    wss.handleUpgrade(req, sock, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    sock.destroy();
  }
});

server.listen(PORT, () => {
  console.log('Track Matt API is up and running and listening on port %s', PORT);
});
