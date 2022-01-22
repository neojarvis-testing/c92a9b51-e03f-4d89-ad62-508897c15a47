const { exec, execSync } = require('child_process');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get("/", (req, res) => res.send("Hello from Render!"));

app.post("/compile", (req, res) => {
    const fs = require('fs');
    const uuidv4 = require('uuid/v4');
    const dir = `${uuidv4()}`;

    if (!fs.existsSync(`./${dir}`)) {
        fs.mkdirSync(`./${dir}`);
    }
    const options = req.body;
    const files = options.files;

    files.forEach(element => {
        // console.log(element.filename);

        fs.writeFileSync(`./${dir}/${element.filename}`, element.content)
    });
    if (options.input) {
        fs.writeFileSync(`./${dir}/input.txt`, options.input)
    }
    const uid = execSync(`./createusr.sh ${dir.replace(/-/g, "")} ${dir}`).toString() * 1;
    exec(`cp /run.sh ./${dir}/run.sh`)
    exec(`javac -cp .:/guava-28.2-jre.jar ./${dir}/*.java`, {timeout: (process.env.timeout || 20) * 1000}, (compileerr, compilestdout, compilestderr) => {
        // let lines = compilestderr.toString().split('\n');
        // lines.splice(0, 1);
        // compilestderr = lines.join('\n');
        if (compilestderr.includes("error")) {
            exec(`rm -rf ./${dir}`);
            exec(`deluser --remove-home ${dir.replace(/-/g, "")}`) 
            res.send({ stderr: compilestderr.replace(new RegExp(`./${dir}/`, 'g'), ''), id: dir })
        } else {
            const starttime = Date.now();
            exec(`sh run.sh ${options.input ? `< ./input.txt` : ''}`, {cwd: `/${dir}`, timeout: (process.env.timeout || 20) * 1000}, (err, stdout, stderr) => {
                const endtime = Date.now();
                const memfile = fs.readFileSync(`./${dir}/time.txt`).toString('utf8');
                let mem = memfile.match(/Maximum resident set size \(kbytes\): (.*)/) &&
                      memfile.match(/Maximum resident set size \(kbytes\): (.*)/)[1];
                mem = Math.abs((mem * 1) - (process.env.constant_space || 0) )
                exec(`rm -rf ./${dir}`);
                exec(`deluser --remove-home ${dir.replace(/-/g, "")}`)   
                let lines = stderr.toString().split('\n');
                lines.splice(0, 1);
                stderr = lines.join('\n');
                res.send({ stdout, stderr: stderr.replace(new RegExp(`/${dir}`, 'g'), '') || err, id: dir, time: endtime - starttime, mem });
            });
        }

    });

})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
});
