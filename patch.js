(async () => {
    const patches = require("./patches.json")
    const fs = require('fs');
    const path = require('path');
    const request = require('request');

    function patchHex(input, patchTable, patchState) {
        try {
            const offset = parseInt(patchTable.offset, 16);
            let fileBuffer = input;
            const patchBytes = patchState ? Buffer.from(patchTable.on) : Buffer.from(patchTable.off);
            patchBytes.copy(fileBuffer, offset);
            console.log(`Patch ${patchTable.offset} = ${patchState} applied successfully.`);
            return fileBuffer;
        } catch (error) {
            console.error('Failed to apply patch:', error.message);
            return input;
        }
    }

    const remote_options = await new Promise(ok => {
        request(`http://127.0.0.1:6799/lce/rtopts/config.json`, {
            timeout: 15000
        }, async (error, response, body) => {
            if (!error && response.statusCode === 200) {
                try {
                    const json = JSON.parse(body.toString());
                    ok(json);
                } catch (e) {
                    ok(false);
                }
            } else {
                console.error("Failed to get valid configuration from LCC");
                if (error)
                    console.error(error.message)
                ok(undefined);
            }
        })
    })
    if (remote_options) {
        const enabledPatches = Object.keys(remote_options);

        await Promise.all(Object.keys(patches).map(k => {
            return {key: k, ...patches[k]}
        }).map(async e => {
            try {
                const filePath = path.resolve((e.path.includes(':\\')) ? e.path : path.join("X:\\", e.path))
                if (fs.existsSync(filePath)) {
                    let fileBuffer = await fs.readFileSync(filePath);
                    Object.keys(e.options).map(f => {
                        e.options[f].patches.map(g => {
                            fileBuffer = patchHex(fileBuffer, g, (enabledPatches.includes(f.toLowerCase())))
                        })
                    })
                    await fs.writeFileSync(filePath, fileBuffer);
                }
            } catch (err) {
                console.error(`Unable to apply configuration for ${e.key}: ${err.message}`)
            }
        }))
    } else {
        console.error("Failed to get enabled configuration from LCC");
    }
})()
