import { creator_meta, bootGit, setRoot } from './core';

import request from 'request-promise-native';

import { parse } from 'yaml';

import {
    ensureDirSync, writeJSON, readJSON, remove, readFile, writeFile
} from 'fs-extra';

import spawn from 'cross-spawn';

import { join } from 'path';


const { path } = creator_meta;


export  function ensureHexo() {
    try {
        spawn.sync('hexo', ['-v']);

    } catch (error) {

        spawn.sync('npm',  ['install', 'hexo-cli', '-g'],  {stdio: 'inherit'});
    }
}


/**
 * @param {String} type - `plugin` or `theme`
 */
export  async function update(type) {

    const list = parse(await request(
        `https://raw.githubusercontent.com/hexojs/site/master/source/_data/${type}s.yml`
    ));

    ensureDirSync(`${path}/data`);

    await writeJSON(`${path}/data/${type}.json`,  list,  {spaces: 4});

    console.info(`[ Update ]  ${list.length} ${type}s`);
}


function packageMatch(simple, full) {

    simple = simple.toLowerCase(),  full = full.toLowerCase();

    return  [simple, `hexo-${simple}`, `hexo-theme-${simple}`].includes( full );
}

/**
 * @param {String}   cwd  - Root path of a Wiki-site
 * @param {String}   type - `plugin` or `theme`
 * @param {String[]} name - Package name (Common prefix is optional)
 *
 * @return {String[]} Names of installed packages
 */
export  async function install(cwd, type, name) {

    const list = await readJSON(`${path}/data/${type}.json`);

    const NPM = [ ],  Git = [ ],  command_option = {stdio: 'inherit', cwd};

    for (let item of list)
        if (name.find(key  =>  packageMatch(key, item.name))) {

            if (item.link.includes('npmjs.com/')  ||  (type === 'plugin'))
                NPM.push( item.name );
            else
                Git.push( item );
        }

    if ( NPM[0] )
        spawn.sync('npm',  ['install'].concat( NPM ),  command_option);

    if ( Git[0] )
        for (let item of Git) {

            spawn.sync(
                'git',
                ['clone',  item.link + '.git',  `themes/${item.name}/`],
                command_option
            );

            await remove( join(cwd, `themes/${item.name}/.git/`) );
        }

    return  NPM.concat( Git );
}


/**
 * Boot a directory as a WebCell project
 *
 * @param {String}   [cwd='.'] - Current working directory
 * @param {String[]} [plugin]
 * @param {String[]} [theme]
 */
export  async function boot(cwd = '.',  plugin,  theme) {

    console.time('Boot Wiki');

    ensureDirSync( cwd );

    const command_option = {stdio: 'inherit', cwd},
        config_path = join(cwd, '_config.yml');

    spawn.sync('hexo',  ['init'],  command_option);

    var config = await readFile(config_path)  +  '';

    const git = await bootGit( cwd );

    config = config.replace(/\ndeploy:[\s\S]+/, `
deploy:
  type: git,
  repo: ${git.getRemotes()[0]}
  branch:`
    );

    await setRoot(cwd, git);

    spawn.sync('npm',  ['install'],  command_option);

    if ( plugin[0] )  await install(cwd, 'plugin', plugin);

    if ( theme[0] )
        config = config.replace(
            /^theme:.+/m,  `theme: ${await install(cwd, 'theme', theme)}`
        );

    await writeFile(config_path,  config);

    console.info('--------------------');
    console.timeEnd('Boot Wiki');
    console.info('');
}
