import fs from 'fs';

import test from 'ava';
import LambdaTester from 'lambda-tester';
import fetchMock from 'fetch-mock';

import { handler } from '../index.js';

test.serial('handling "ask subway status to check on the <subway-line> line?" and the service is not good', async t => {
  t.plan(3);

  const statusOfLineEvent = JSON.parse(fs.readFileSync(process.cwd() + '/tests/fixtures/events/status-of-line.json'));
  fetchMock.once(process.env.MTA_STATUS_URL, fs.readFileSync(process.cwd() + '/tests/fixtures/mta-status.xml', 'utf-8'));

  const result = await LambdaTester(handler)
    .event(statusOfLineEvent)
    .expectSucceed(r => r);


  t.is(result.response.outputSpeech.ssml, `<speak> The <say-as interpret-as="spell-out">ACE</say-as> line is experiencing delays. I've added a card with the details on the Alexa App. </speak>`);
  t.is(result.response.card.title, 'Subway Status for ACE');
  t.true(/Due to an earlier incident at 23 St/.test(result.response.card.content));

  fetchMock.restore();
});

test.serial('handling "ask subway status to check on the <subway-line> line?" and the service the service is good', async t => {
  t.plan(2);

  const statusOfLineEvent = JSON.parse(fs.readFileSync(process.cwd() + '/tests/fixtures/events/status-of-line.json'));
  fetchMock.once(process.env.MTA_STATUS_URL, fs.readFileSync(process.cwd() + '/tests/fixtures/mta-status.xml', 'utf-8'));

  statusOfLineEvent.request.intent.slots.subwayLineOrGroup.value = '456'; // Fixture has good service on 456

  const result = await LambdaTester(handler)
    .event(statusOfLineEvent)
    .expectSucceed(r => r);

  t.is(result.response.outputSpeech.ssml, '<speak> Good service on the <say-as interpret-as="spell-out">456</say-as> line </speak>');
  t.is(result.response.card, undefined);

  fetchMock.restore();
});

test.serial('handling "ask subway status to check on the <subway-line> line?" without a valid slot value', async t => {
  t.plan(1);

  const statusOfLineEvent = JSON.parse(fs.readFileSync(process.cwd() + '/tests/fixtures/events/bad-status-of-line-without-value.json'));
  fetchMock.once(process.env.MTA_STATUS_URL, fs.readFileSync(process.cwd() + '/tests/fixtures/mta-status.xml', 'utf-8'));

  const result = await LambdaTester(handler)
    .event(statusOfLineEvent)
    .expectSucceed(r => r);

  t.is(result.response.outputSpeech.ssml, "<speak> Sorry, I didn't hear a subway line I understand </speak>");

  fetchMock.restore();
});

test.serial('handling "ask subway status for an update and there are bad services"', async t => {
  t.plan(3);

  const fullServiceUpdateEvent = JSON.parse(fs.readFileSync(process.cwd() + '/tests/fixtures/events/full-service-update.json'));
  fetchMock.once(process.env.MTA_STATUS_URL, fs.readFileSync(process.cwd() + '/tests/fixtures/mta-status.xml', 'utf-8'));

  const result = await LambdaTester(handler)
    .event(fullServiceUpdateEvent)
    .expectSucceed(r => r);

  let speechMarkup = result.response.outputSpeech.ssml;
  t.true(speechMarkup.search("123<break/>BDFM<break/>JZ<break/>NQR") !== -1);
  t.true(speechMarkup.search('ACE') !== -1);
  t.true(speechMarkup.search('<s>Good service on all other lines</s>') !== -1);

  fetchMock.restore();
});

test.serial('handling "ask subway status for an update and all services are good"', async t => {
  t.plan(1);

  const fullServiceUpdateEvent = JSON.parse(fs.readFileSync(process.cwd() + '/tests/fixtures/events/full-service-update.json'));
  fetchMock.get(process.env.MTA_STATUS_URL, fs.readFileSync(process.cwd() + '/tests/fixtures/mta-status-all-good.xml', 'utf-8'));
  const result = await LambdaTester(handler)
    .event(fullServiceUpdateEvent)
    .expectSucceed(r => r);

  let speechMarkup = result.response.outputSpeech.ssml;

  t.true(/Good service on all lines/.test(speechMarkup));

  fetchMock.restore();
});

test.serial('handling "open subway status"', async t => {
  t.plan(1);

  const launchRequst = JSON.parse(fs.readFileSync(process.cwd() + '/tests/fixtures/events/launch-request.json'));
  fetchMock.get(process.env.MTA_STATUS_URL, fs.readFileSync(process.cwd() + '/tests/fixtures/mta-status-all-good.xml', 'utf-8'));
  const result = await LambdaTester(handler)
    .event(launchRequst)
    .expectSucceed(r => r);

  let speechMarkup = result.response.outputSpeech.ssml;

  t.true(/Good service on all lines/.test(speechMarkup));

  fetchMock.restore();
});



