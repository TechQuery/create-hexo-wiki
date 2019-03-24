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
 * @param {?Boolean}   recurse   - Recurse sub-modules
 */
export  async function copyFromGit(URI,  path = '',  recurse) {

    const parameter = ['clone', URI , path];

    if ( recurse )  parameter.splice(1, 0, '--recurse-submodules');

    await spawn('git',  parameter,  {stdio: 'inherit'});

    await remove( join(path, '.git/') );

    if (! recurse)  await remove( join(path, '.gitmodules') );
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


/**
 * @param {Object} [meta={}] - https://github.com/lavas-project/hexo-pwa#options
 *
 * @return {Object}
 */
export function setPWA({
    name, start_url, description, scope = '/', lang = 'en-US', dir = 'ltr', icon
} = { }) {

    return {
        manifest: {
            path: '/manifest.json',
            body: {
                name,
                short_name: name,
                start_url,
                description,
                scope,
                display: 'standalone',
                orientation: 'any',
                lang,
                dir,
                theme_color: 'rgba(0,0,0,0.5)',
                background_color: 'transparent',
                icons: [icon]
            }
        },
        serviceWorker: {
            path: '/sw.js',
            preload: {
                urls: [scope],
                posts: 5
            },
            opts: {
                networkTimeoutSeconds: 5
            },
            routes: [
                {
                    pattern: '!!js/regexp /\\//',
                    strategy: 'networkFirst'
                },
                {
                    pattern: '!!js/regexp /.*\\.(css|js|jpg|jpeg|png|gif|webp)$/',
                    strategy: 'cacheFirst'
                },
                {
                    pattern: '!!js/regexp /google.*\\.com/',
                    strategy: 'networkOnly'
                },
                {
                    pattern: '!!js/regexp /disqus.*\\.com/',
                    strategy: 'networkOnly'
                },
                {
                    pattern: '!!js/regexp /cnzz\\.com/',
                    strategy: 'networkOnly'
                }
            ]
        },
        priority: 5
    };
}
