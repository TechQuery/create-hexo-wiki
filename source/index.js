#! /usr/bin/env node

import '@babel/polyfill';

import { creator_meta } from './core';

import Commander from 'commander';

import { ensureHexo, update, boot } from './command';


const { meta } = creator_meta, package_pattern = /^([@\-\w]+,?)+$/;


Commander
    .name( meta.name ).version( meta.version ).description( meta.description )
    .option(
        '-p, --plugins <list>',  'Plugins to install (comma separated)',  package_pattern
    )
    .option(
        '-t, --theme <name>',  'A theme to install',  package_pattern
    )
    .command('update', 'Update list of Plugins & Themes')
    .on('command:update',  async () => {

        console.time('Update');

        ensureHexo();

        await update('plugin');

        await update('theme');

        console.info('---------');
        console.timeEnd('Update');
    })
    .parse( process.argv );


if (! Commander._execs[ Commander.rawArgs[2] ])
    boot(
        process.argv[2] || process.cwd(),
        (Commander.plugins || '').split(','),
        [ Commander.theme ]
    );
