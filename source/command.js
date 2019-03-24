import { _base_, setRoot, copyFromGit, setPWA } from './core';

import request from 'request-promise-native';

import { parse, stringify } from 'yaml';

import {
    ensureDirSync, writeJSON, readJSON, remove, existsSync, readdirSync, move,
    readFile, writeFile
} from 'fs-extra';

import { join } from 'path';

import { step, spawn, ensureCommand } from '@tech_query/node-toolkit';

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
            await copyFromGit(item.link,  join(cwd, `themes/${item.name}/`));

    return  NPM.concat( Git.map(item => item.name) );
}


async function addTheme(cwd, name, config) {

    const theme = await install(cwd, 'theme', name);

    if (! theme[0])
        throw ReferenceError(
            `Theme "${name}" can't be found in Hexo offical index`
        );

    for (let key of theme) {

        const path = join(cwd, `themes/${key}`);

        if ( existsSync(`${path}/_config.yml`) )  continue;

        for (let file  of  readdirSync( path ))
            if (/^_config\..*yml.*/.test( file )) {

                await move(`${path}/${file}`, `${path}/_config.yml`);  break;
            }
    }

    await remove( join(cwd, 'themes/landscape') );

    return  config.replace(/^theme:.+/m,  `theme: ${theme[0]}`);
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

        await ensureCommand('hexo');

        await copyFromGit('https://github.com/hexojs/hexo-starter.git', cwd);
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
  branch: master`
        );
    });

    await step('NPM package',  setRoot.bind(null, cwd, git));

    await step('Hexo plugin',  async () => {

        const meta = parse( config );

        config += '\n\n' + stringify({
            pwa:  setPWA({
                name:         meta.title,
                description:  meta.subtitle || meta.description,
                lang:         meta.language,
                start_url:    meta.url,
                scope:        meta.root,
                icon:         {
                    src:    'image/Hexo.png',
                    type:   'image/png',
                    sizes:  '128x128'
                }
            })
        });

        await spawn('npm',  ['install'],  command_option);

        if ( plugin[0] )  await install(cwd, 'plugin', plugin);
    });

    await step('Hexo theme',  async () => {

        if ( theme[0] )  try {

            config = await addTheme(cwd, theme, config);

        } catch (error) {

            console.error( error.message );
        }

        await writeFile(config_path,  config);
    });

    await step('Git commit',  async () => {

        await git.add('.');

        await git.commit('[ Add ]  Framework of Hexo wiki');
    });
}
