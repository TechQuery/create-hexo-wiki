import fetch from 'node-fetch';
import { parse } from 'yaml';
import { basePath, copyFromGit, setRoot } from './core';
import { join } from 'path';
import {
    outputJSON,
    readJSON,
    existsSync,
    readdirSync,
    move,
    remove,
    readFile,
    outputFile
} from 'fs-extra';
import { SpawnOptions } from 'child_process';
import { spawn, step, ensureCommand } from '@tech_query/node-toolkit';
import { bootGit } from 'create-es-pack/dist/core';
import { SimpleGit } from 'simple-git/promise';

export type PackageType = 'plugin' | 'theme';

export interface Package {
    name: string;
    link: string;
}

export async function update(type: PackageType) {
    const list = parse(
        await (
            await fetch(
                `https://raw.githubusercontent.com/hexojs/site/master/source/_data/${type}s.yml`
            )
        ).text()
    );
    await outputJSON(join(basePath, `data/${type}.json`), list, { spaces: 4 });

    console.info(`[ Update ]  ${list.length} ${type}s`);
}

/**
 * @return Names of installed packages
 */
export async function install(
    path: string,
    type: PackageType,
    packages: string[]
) {
    const list: Package[] = await readJSON(join(basePath, `data/${type}.json`)),
        NPM: string[] = [],
        Git: Package[] = [],
        command_option: SpawnOptions = { stdio: 'inherit', cwd: path };

    for (const item of list) {
        if (
            !packages.find(key =>
                RegExp(`^(hexo-(theme-)?)?${key}$`, 'i').test(item.name)
            )
        )
            continue;

        if (item.link.includes('npmjs.com/')) NPM.push(item.name);
        else if (type === 'plugin') NPM.push(item.link);
        else Git.push(item);
    }

    if (NPM[0]) await spawn('npm', ['install', ...NPM], command_option);

    if (Git[0])
        for (const { link, name } of Git)
            await copyFromGit(link, join(path, `themes/${name}/`));

    return [...NPM, ...Git.map(({ name }) => name)];
}

async function addTheme(path: string, name: string, config) {
    name = (await install(path, 'theme', [name]))[0];

    if (!name)
        return console.error(
            `Theme "${name}" can't be found in Hexo offical index`
        );

    const root_path = join(path, 'themes', name);

    if (!existsSync(join(root_path, '_config.yml')))
        for (const file of readdirSync(root_path))
            if (/^_config\..*yml.*/.test(file)) {
                await move(
                    join(root_path, file),
                    join(root_path, '_config.yml')
                );
                break;
            }
    await remove(join(path, 'themes/landscape'));

    return config.replace(/^theme:.+/m, `theme: ${name}`);
}

/**
 * Boot a directory as a Hexo Wiki project
 */
export async function boot({
    path = '.',
    plugins = [],
    theme,
    pages = [],
    remote
}: {
    path?: string;
    plugins?: string[];
    theme?: string;
    pages?: string[];
    remote?: string | URL;
} = {}) {
    const command_option: SpawnOptions = { stdio: 'inherit', cwd: path },
        config_path = join(path, '_config.yml');

    await step('Hexo framework', async () => {
        await ensureCommand('hexo');

        await copyFromGit('https://github.com/hexojs/hexo-starter.git', path);
    });

    let config: string, git: SimpleGit;

    await step('Git repository & branch', async () => {
        (config = (await readFile(config_path)) + ''),
            (git = await bootGit(path, remote));

        await git.raw(['checkout', '--orphan', 'hexo']);

        config = config.replace(
            /\ndeploy:[\s\S]+/,
            `
deploy:
  type: git
  repo: ${(await git.getRemotes(true))[0]?.refs.push}
  branch: master`
        );
    });

    await step('NPM package', () => setRoot(path, git));

    await step('Hexo plugins', async () => {
        await spawn('npm', ['install'], command_option);

        if (plugins[0]) await install(path, 'plugin', plugins);
    });

    await step('Hexo theme', async () => {
        if (theme) config = (await addTheme(path, theme, config)) || config;

        for (const name of pages) {
            const file = join(path, 'source', name, 'index.md');

            await outputFile(
                file,
                `---
type: ${name}
layout: ${name}
---\n`
            );
            console.info(`[ Create ]  ${file}`);
        }

        await outputFile(config_path, config);
    });

    await step('Git commit', async () => {
        await git.add('.');

        await git.commit('[ Add ]  Framework of Hexo wiki');
    });
}
