import test from 'ava';

import fs from 'fs';

test('intents.json is a valid JSON file', t => {
  let intents = fs.readFileSync(process.cwd() + '/intents.json');
  let parseJSON = () => JSON.parse(intents);

  t.notThrows(parseJSON, "intents.json contains invalid JSON");
});
