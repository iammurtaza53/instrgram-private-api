const { IgApiClient } = require("instagram-private-api");
const util = require("util");
require('dotenv').config();
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ig = new IgApiClient();
const { spawn } = require("child_process");

const fs = require("fs");
const { exit } = require("process");

ig.state.generateDevice("itsmemzian");

ig.state.proxyUrl = process.env.IG_PROXY;
(async () => {
  await ig.simulate.preLoginFlow();
  const loggedInUser = await ig.account.login(
    process.env.INSTA_USERNAME,
    process.env.INSTA_PASSWORD
  );

  const user = await ig.user.getIdByUsername("adidas");
  // const userFeed = await ig.user.info(user)
  // console.log(userFeed)


  // exit()
  // let feed = await userFeed.items()
  // console.log(feed[4].caption.text)
  // console.log(feed[4].caption.text.match(/@[^\s#\.:\;]*/gmi))
  // console.log(feed[4].caption.text.match(/#[^\s#\.\;]*/gmi))
  // exit()
  // let firstPostDate = 99999999999999
  // let i = 0
  // while (feed.length > 0) {
  //   if (feed[feed.length - 1].taken_at < firstPostDate) {
  //     firstPostDate = feed[feed.length - 1].taken_at
  //   }
  //   feed = await userFeed.items()
  //   console.log("fetched ", i, " feedlength ", feed.length)
  //   console.log(feed[feed.length-1].pk, " ", firstPostDate)
  //   i+=1;
  // }
  // console.log(firstPostDate)

  // exit()




  let data = await ig.discover.chaining(user);
  
  let lvl1 = data["users"];

  lvl1 = lvl1.map((item) => {
    console.log(item)
    return {
      pk: item.pk,
      username: item.username,
      parent: "adidas",
      is_verified: item.is_verified,
      full_name: item.full_name,
      profile_pic_url: item.profile_pic_url,
    };
  });

  const csvWriter1 = createCsvWriter({
    path: 'level1.csv',
    header: [
      { id: 'pk', title: 'ID' },
      { id: 'username', title: 'User Name' },
      { id: 'parent', title: 'Parent' }
    ]
  });
  csvWriter1.writeRecords(lvl1)       // returns a promise
    .then(() => {
      console.log('...Done');
    });

  // fs.writeFile("lvl1.json", JSON.stringify(lvl1), function (err) {
  //   if (err) {
  //     console.log(err);
  //   }
  // });

  let lvl2 = [];
  const csvWriter2 = createCsvWriter({
    path: 'level2.csv',
    header: [
      { id: 'pk', title: 'ID' },
      { id: 'username', title: 'User Name' },
      { id: 'parent', title: 'Parent' }
    ]
  });
  await Promise.all(
    lvl1.map(async (lvl) => {
      let obj = await ig.discover.chaining(lvl.pk);
      obj = obj["users"].map((item) => {
        return {
          pk: item.pk,
          username: item.username,
          parent: lvl.username,
        };
      });
      csvWriter2.writeRecords(obj)       // returns a promise
        .then(() => {
          console.log('...Done');
        });

      lvl2.push(obj);
    })
  ).then(() => {
    fs.writeFile("lvl2.json", JSON.stringify(lvl2), function (err) {
      if (err) {
        console.log(err);
      }
    });
  });
  console.log("done level1 and level2")

  const level3Run = spawn("npm", ['run', 'level3']);
  level3Run.stdout.on("data", data => {
    console.log(`stdout: ${data}`);
  });

  level3Run.stderr.on("data", data => {
    console.log(`stderr: ${data}`);
  });

  level3Run.on('error', (error) => {
    console.log(`error: ${error.message}`);
  });

  level3Run.on("close", code => {
    console.log(`child process exited with code ${code}`);
  });


})().catch((err) => {
  console.log(err);
});

