import { _base_, setRoot, copyFromGit } from './core';

import request from 'request-promise-native';

import { parse } from 'yaml';

import {
    ensureDirSync, writeJSON, readJSON, remove, existsSync, readdirSync, move,
    readFile, writeFile
} from 'fs-extra';

import { join } from 'path';

import { step, spawn } from '@tech_query/node-toolkit';

import { bootGit } from 'create-es-pack/dist/core';


/**
 * @param {String} type - `plugin` or `theme`
 */
export  async function update(type) {

    const list = parse(await request(
        `https://raw.githubusercontent.com/hexojs/site/master/source/_data/${type}s.yml`
    ));

    ensureDirSync(`${_base_}/data`);

    await writeJSON(`${_base_}/data/${type}.json`,  list,  {spaces: 4});

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

    const list = await readJSON(`${_base_}/data/${type}.json`);

    const NPM = [ ],  Git = [ ],  command_option = {stdio: 'inherit', cwd};

    list.forEach(item => {

        if (! name.find(key  =>  packageMatch(key, item.name)))  return;

        if ( item.link.includes('npmjs.com/') )
            NPM.push( item.name );
        else if (type === 'plugin')
            NPM.push( item.link );
        else
            Git.push( item );
    });

    if ( NPM[0] )
        await spawn('npm',  ['install'].concat( NPM ),  command_option);

    if ( Git[0] )
        for (let item of Git)
            await copyFromGit(item.link, `themes/${item.name}/`, cwd);

    return  NPM.concat( Git.map(item => item.name) );
}


async function addTheme(cwd, name, config) {

    name = await install(cwd, 'theme', name);

    if (! name[0])  return;

    for (let key of name) {

        const path = join(cwd, `themes/${key}`);

        if ( existsSync(`${path}/_config.yml`) )  continue;

        for (let file  of  readdirSync( path ))
            if (/^_config\..*yml.*/.test( file )) {

                await move(`${path}/${file}`, `${path}/_config.yml`);  break;
            }
    }

    await remove( join(cwd, 'themes/landscape') );

    return  config.replace(/^theme:.+/m,  `theme: ${name[0]}`);
}

/**
 * Boot a directory as a WebCell project
 *
 * @param {String}     [cwd='.'] - Current working directory
 * @param {String[]}   [plugin]
 * @param {String[]}   [theme]
 * @param {String|URL} [remote]  - Git URL of a Remote repository
 */
export  async function boot(cwd = '.',  plugin,  theme,  remote) {

    const command_option = {stdio: 'inherit', cwd},
        config_path = join(cwd, '_config.yml');

    await step('Hexo framework',  async () => {

        ensureDirSync( cwd );

        await spawn('hexo',  ['init'],  command_option);
    });

    var config, git;

    await step('Git repository & branch',  async () => {

        config = await readFile(config_path)  +  '',
        git = await bootGit(cwd, remote);

        await git.raw(['checkout', '--orphan', 'hexo']);

        config = config.replace(/\ndeploy:[\s\S]+/, `
deploy:
  type: git
  repo: ${(await git.getRemotes( true ))[0].refs.push}
  branch:`
        );
    });

    await step('NPM package',  setRoot.bind(null, cwd, git));

    await step('Hexo plugin',  async () => {

        await spawn('npm',  ['install'],  command_option);

        if ( plugin[0] )  await install(cwd, 'plugin', plugin);
    });

    await step('Hexo theme',  async () => {

        if ( theme[0] )  config = await addTheme(cwd, theme, config);

        await writeFile(config_path,  config);
    });

    await step('Git commit',  async () => {

        await git.add('.');

        await git.commit('[ Add ]  Framework of Hexo wiki');
    });
}
