#! /usr/bin/env node

import { Command, Executor, createCommand } from 'commander-jsx';

import { meta } from './core';
import { update, boot, BootOption } from './command';

const package_pattern = /^([@\-\w]+,?)+$/,
    repository_pattern = /^(git|ssh|https?):\/\/\S+\.git$/;

const create: Executor<BootOption> = async (option, path) => {
    console.time('Boot Wiki');

    await boot({ ...option, path } as BootOption);

    console.info('--------------------');
    console.timeEnd('Boot Wiki');
    console.info('\n[ Document ]  https://tech-query.me/create-hexo-wiki/\n');
};

async function refresh() {
    console.time('Update');

    await update('plugin');
    await update('theme');

    console.info('---------');
    console.timeEnd('Update');
}

Command.execute(
    <Command
        name="create-hexo-wiki"
        parameters="<command> [options]"
        description={meta.description}
    >
        <Command<Omit<BootOption, 'path'>>
            name="create"
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
        <Command
            name="update"
            description="Update list of Plugins &amp; Themes"
            executor={refresh}
        />
    </Command>,
    process.argv.slice(2)
);
