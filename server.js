const { IgApiClient } = require("instagram-private-api");
const util = require("util");

const ig = new IgApiClient();

const fs = require("fs");

ig.state.generateDevice("aliasghernooruddin");

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
    return {
      pk: item.pk,
      username: item.username,
      parent: "sephora",
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

})().catch((err) => {
  console.log(err);
});
