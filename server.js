const { IgApiClient } = require("instagram-private-api");
const util = require("util");
require('dotenv').config();
const ig = new IgApiClient();
const { spawn } = require("child_process");

const fs = require("fs");

ig.state.generateDevice("itsmemzian");

ig.state.proxyUrl = process.env.IG_PROXY;
(async () => {
  await ig.simulate.preLoginFlow();
  const loggedInUser = await ig.account.login(
    process.env.INSTA_USERNAME,
    process.env.INSTA_PASSWORD
  );
  
  const user = await ig.user.getIdByUsername("sephora");
  data = await ig.discover.chaining(user);

  let lvl1 = data["users"];

  lvl1 = lvl1.map((item) => {
    console.log(item)
    return {
      pk: item.pk,
      username: item.username,
      parent: "sephora",
      is_verified: item.is_verified,
      full_name: item.full_name,
      profile_pic_url: item.profile_pic_url,
      

    };
  });

  fs.writeFile("lvl1.json", JSON.stringify(lvl1), function (err) {
    if (err) {
      console.log(err);
    }
  });

  let lvl2 = [];

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

