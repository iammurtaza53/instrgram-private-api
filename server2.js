const { IgApiClient } = require("instagram-private-api");
const util = require("util");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ig = new IgApiClient();

const fs = require("fs");
require('dotenv').config();

ig.state.generateDevice("aliasghernooruddin");

ig.state.proxyUrl = process.env.IG_PROXY;
(async () => {
  console.log("server2")
  await ig.simulate.preLoginFlow();
  const loggedInUser = await ig.account.login(
    process.env.INSTA_USERNAME,
    process.env.INSTA_PASSWORD
  );

  const lvl2 = require('./lvl2.json');

  let temp = 0

  let lvl3 = [];
  const csvWriter3 = createCsvWriter({
    path: 'level3.csv',
    header: [
      { id: 'pk', title: 'ID' },
      { id: 'username', title: 'User Name' },
      { id: 'parent', title: 'Parent' }
    ],
    append: true
  });

  const half = Math.ceil(lvl2.length / 2);
  const secondHalf = lvl2.splice(-half)
  var stream = fs.createWriteStream("lvl3.json", { flags: 'a' });
  console.log("here starting")
  for (let parentInd = 0; parentInd <= secondHalf.length; parentInd++) {
    console.log("fetched parents", parentInd)
    if (!secondHalf || !secondHalf.length || !secondHalf[parentInd] || !secondHalf[parentInd].length) {
      continue
    }
    for (let childInd = 0; childInd < secondHalf[parentInd].length; childInd++) {
      let parent = secondHalf[parentInd][childInd]
      console.log("first parent", parent)
      try {
        let child = await ig.discover.chaining(parent.pk);
        console.log("fetch child")
        child = child["users"].map((item) => {
          return {
            pk: item.pk,
            username: item.username,
            parent: parent.username,
          };
        });
        stream.write(JSON.stringify(child))
        lvl3.push(child)
        csvWriter3.writeRecords(child)       // returns a promise
          .then(() => {
            console.log('...Done');
          });
      } catch (err) {
        console.log(err)
        childInd--
        await sleep(3000)
      }

    }
  }


})().catch((err) => {
  console.log(err);
});
