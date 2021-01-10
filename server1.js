const { IgApiClient } = require("instagram-private-api");
const util = require("util");
require('dotenv').config();
const ig = new IgApiClient();
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const fs = require("fs");

ig.state.generateDevice("aliasghernooruddin");

ig.state.proxyUrl = process.env.IG_PROXY;
(async () => {
  console.log("server1")
  await ig.simulate.preLoginFlow();
  const loggedInUser = await ig.account.login(
    process.env.INSTA_USERNAME,
    process.env.INSTA_PASSWORD
  );

  const lvl2 = require("./lvl2.json");

  const half = Math.ceil(lvl2.length / 2);
  const firstHalf = lvl2.splice(0, half);
  let lvl3 = []
  const csvWriter3 = createCsvWriter({
    path: 'level3.csv',
    header: [
      { id: 'pk', title: 'ID' },
      { id: 'username', title: 'User Name' },
      { id: 'parent', title: 'Parent' }
    ],
    append: true
  });
  var stream = fs.createWriteStream("lvl3.json", { flags: 'a' });
  console.log("here starting")
  for (let parentInd = 0; parentInd <= firstHalf.length; parentInd++) {
    console.log("fetched parents", parentInd)
    for (let childInd = 0; childInd < firstHalf[parentInd].length; childInd++) {
      let parent = firstHalf[parentInd][childInd]
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



  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

})().catch((err) => {
  console.log(err);
});
