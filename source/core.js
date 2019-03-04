import { currentModulePath, spawn, findFile, packageNameOf } from '@tech_query/node-toolkit';

import { join } from 'path';

import { remove, outputJSON } from 'fs-extra';

import { copyFrom, setReadMe, setAuthor } from 'create-es-pack/dist/core';

import config from '../package.json';


/**
 * @type {String}
 */
export  const _base_ = join(currentModulePath(), '../../');


/**
 * @type {Object}
 */
export  const _meta_ = JSON.parse( config );


/**
 * @param {String|URL} URI       - Git URL
 * @param {String}     [path=''] - Copy to the path
 * @param {String}     [cwd='.']
 */
export  async function copyFromGit(URI,  path = '',  cwd = '.') {

    await spawn('git',  ['clone', URI , path],  {stdio: 'inherit', cwd});

    await remove( join(cwd, path, '.git/') );
}


/**
 * @param {String}    path - Project root
 * @param {SimpleGit} git  - Git repository instance of `path`
 */
export  async function setRoot(path, git) {

    await copyFrom(join(_base_, 'template'),  path);

    if (! findFile(/ReadMe(\.(md|markdown))?/i, path))
        await setReadMe.call(_meta_, path, git);

    const config = await setAuthor(path, git);

    config.meta.name = packageNameOf( path ), config.meta.version = '1.0.0';

    await outputJSON(config.path, config.meta);
}
