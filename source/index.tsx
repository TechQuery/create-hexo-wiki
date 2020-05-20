#! /usr/bin/env node

import { Command, createCommand } from 'commander-jsx';

import { meta } from './core';
import { update, boot } from './command';

const package_pattern = /^([@\-\w]+,?)+$/,
    repository_pattern = /^(git|ssh|https?):\/\/\S+\.git$/;

async function create(
    { plugins, theme = 'Wikitten', pages, remote },
    path: string
) {
    console.time('Boot Wiki');

    await boot({ path, plugins, theme, pages, remote });

    console.info('--------------------');
    console.timeEnd('Boot Wiki');
    console.info('\n[ Document ]  https://tech-query.me/create-hexo-wiki/\n');
}

async function refresh() {
    console.time('Update');

    await update('plugin');
    await update('theme');

    console.info('---------');
    console.timeEnd('Update');
}

Command.execute(
    <create-hexo-wiki
        parameters="<command> [options]"
        version={meta.version}
        description={meta.description}
    >
        <create
            parameters="<path>"
            description="Create a Hexo Wiki project"
            options={{
                plugins: {
                    shortcut: 'p',
                    parameters: '<list>',
                    pattern: package_pattern,
                    description: 'Plugins to install (comma separated)'
                },
                theme: {
                    shortcut: 't',
                    parameters: '<name>',
                    pattern: package_pattern,
                    description: 'A theme to install'
                },
                pages: {
                    shortcut: 'P',
                    parameters: '<list>',
                    description: 'Required pages of installed theme'
                },
                remote: {
                    shortcut: 'r',
                    parameters: '<URL>',
                    pattern: repository_pattern,
                    description: 'Git URL of a Remote repository'
                }
            }}
            executor={create}
        />
        <update
            description="Update list of Plugins &amp; Themes"
            executor={refresh}
        />
    </create-hexo-wiki>,
    process.argv.slice(2)
);
