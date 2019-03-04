#! /usr/bin/env node

import '@babel/polyfill';

import { _meta_ } from './core';

import Commander from 'commander';

import { ensureCommand } from '@tech_query/node-toolkit';

import { update, boot } from './command';


const package_pattern = /^([@\-\w]+,?)+$/;


Commander
    .name( _meta_.name )
    .version( _meta_.version )
    .description( _meta_.description )
    .option(
        '-p, --plugins <list>',
        'Plugins to install (comma separated)',
        package_pattern
    )
    .option(
        '-t, --theme <name>',  'A theme to install',  package_pattern
    )
    .option(
        '-r, --remote <URL>',
        'Git URL of a Remote repository',
        /^(git|https?)/
    )
    .command('update', 'Update list of Plugins & Themes')
    .on('command:update',  async () => {

        console.time('Update');

        await ensureCommand('hexo');

        await update('plugin');

        await update('theme');

        console.info('---------');
        console.timeEnd('Update');
    })
    .parse( process.argv );


(async () => {

    if (Commander._execs[ Commander.rawArgs[2] ])  return;

    console.time('Boot Wiki');

    await boot(
        process.argv[2] || process.cwd(),
        (Commander.plugins || '').split(','),
        [Commander.theme || 'Wikitten'],
        Commander.remote
    );

    console.info('--------------------');
    console.timeEnd('Boot Wiki');
    console.info('\n[ Document ]  https://tech-query.me/create-hexo-wiki/\n');
})();
