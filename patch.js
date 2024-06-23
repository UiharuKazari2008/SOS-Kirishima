(async () => {
    const fs = require('fs');
    const path = require('path');
    const request = require('request');

    let patches = {};

    try {
        if (fs.existsSync(path.resolve(path.join('X:\\', 'patches.json')))) {
            patches = JSON.parse(fs.readFileSync(path.resolve(path.join('X:\\', 'patches.json'))).toString());
        } else if (fs.existsSync(path.resolve(path.join('Q:\\lib\\rtp\\', 'patches.json')))) {
            patches = JSON.parse(fs.readFileSync(path.resolve(path.join('Q:\\lib\\rtp\\', 'patches.json'))).toString());
        } else {
            console.log("Patch matrix does not exist!");
            process.exit(0);
        }
    } catch (e) {
        console.error("Failed to load patch matrix", e.message)
    }

    function patchHex(input, patchTable, patchState) {
        try {
            const offset = parseInt(patchTable.offset, 16);
            let fileBuffer = input;
            const patchBytes = patchState ? Buffer.from(patchTable.on) : Buffer.from(patchTable.off);
            patchBytes.copy(fileBuffer, offset);
            //console.log(`Patch ${patchTable.offset} = ${patchState} applied successfully.`);
            return fileBuffer;
        } catch (error) {
            console.error('Failed to apply patch:', error.message);
            return input;
        }
    }

    const enabled_options = await (async () => {
        if (fs.existsSync(path.resolve(path.join('Y:\\', 'enabled_options.json')))) {
            try {
                return JSON.parse(fs.readFileSync(path.resolve(path.join('Y:\\', 'enabled_options.json'))).toString());
            } catch (e) {
                console.error("Failed to load enabled options", e.message)
            }
        }
        return new Promise(ok => {
            request(`http://127.0.0.1:6799/lce/rtopts/config.json?raw=true`, {
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
    })()
    if (enabled_options) {
        let base_patches = [];
        let base_patches_toggles = {};
        let versioned_patches = {};
        let versioned_patches_toggles = {};
        Object.keys(enabled_options)
            .filter(k => enabled_options[k] !== undefined || enabled_options[k] !== null)
            .map(k => {
                const j = k.toString().toLowerCase().split(':');
                base_patches.push(j[0]);
                base_patches_toggles[j[0]] = enabled_options[k];
                if (j.length > 1) {
                    const kj = j[1];
                    if (!versioned_patches[kj])
                        versioned_patches[kj] = [];
                    versioned_patches[kj].push(j[0]);
                    versioned_patches_toggles[j[0]] = enabled_options[k];
                }
            });
        const versions = Object.keys(versioned_patches);

        await Promise.all(Object.keys(patches).map(k => {
            return {key: k, ...patches[k]}
        }).map(async e => {
            try {
                const filePath = path.resolve((e.path.includes(':\\')) ? e.path : path.join("X:\\", e.path))
                if (fs.existsSync(filePath)) {
                    let fileBuffer = await fs.readFileSync(filePath);
                    Object.keys(e.options).filter(f => base_patches.includes(f.toLowerCase())).map(f => {
                        e.options[f].patches.map(g => {
                            fileBuffer = patchHex(fileBuffer, g, (base_patches_toggles[f.toLowerCase()]))
                        })
                    })
                    Object.keys(e.versions).filter(f => versions.includes(f.toLowerCase())).map(f => {
                        Object.keys(e.versions[f]).map(g => {
                            e.versions[f][g].patches.map(h => {
                                fileBuffer = patchHex(fileBuffer, h, (versioned_patches_toggles[g.toLowerCase()]))
                            })
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
