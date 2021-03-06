'use strict';

// Imports dependencies and set up http server
const express = require('express'),
  bodyParser = require('body-parser'),
  app = express() // creates express http server
    .use(bodyParser.json()) // support json encoded bodies
    .use(bodyParser.urlencoded({ extended: true })),
  { handleMessage, handlePostback } = require('./client/messenger'),
  { handleCommand } = require('./client/slack'); // support encoded bodies

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () =>
  console.log('Webhook is listening...')
);

/****************************************
 *                                      *
 *              MESSENGER               *
 *                                      *
 ****************************************/

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  console.log('Trying to get...');
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {
  // Parse the request body from the POST
  const { body } = req;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
      // Get the webhook event. entry.messaging is an array, but
      // will only ever contain one event, so we get index 0
      const webhook_event = entry.messaging[0];

      console.log('\n\n--> webhook_event : ', webhook_event);

      // Get the sender PSID
      const sender_psid = webhook_event.sender.id;

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

/****************************************
 *                                      *
 *              SLACK                   *
 *                                      *
 ****************************************/

// Accepts POST requests at /slackhook endpoint
app.post('/slackhook', async (req, res) => {
  // Parse the body from the POST request
  const { body } = req;

  console.log('\n\n--> slackhook body : ', body);

  const message = await handleCommand(body);

  // Return a '200 OK' response to all events
  res.status(200).send({
    response_type: 'in_channel', //controls the message's visibility
    ...message
  });
});
