const child_process = require("child_process");
const { version, name } = require("./package.json");

let buildCmd = `sudo docker build -t ${name}:${version} .`;

console.log("running", buildCmd);

child_process.exec(buildCmd, {
  error: (e) => {
    console.log(e);
  },
  stdout: (s) => {
    console.log(s);
  },
});
