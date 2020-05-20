import {
    packageOf,
    currentModulePath,
    spawn,
    findFile,
    packageNameOf
} from '@tech_query/node-toolkit';
import { join } from 'path';
import { remove, outputJSON } from 'fs-extra';
import { SimpleGit } from 'simple-git/promise';
import {
    copyFrom,
    setReadMe,
    setAuthor,
    fixIgnore
} from 'create-es-pack/dist/core';

export const { path: basePath, meta } = packageOf(currentModulePath());

const Git_file = [
    '.git/',
    '.gitignore',
    '.gitattributes',
    '.gitmodules',
    '.github/'
];

export async function copyFromGit(
    URI: string | URL,
    path = '',
    recurse?: boolean
) {
    await spawn(
        'git',
        ['clone', recurse ? '--recurse-submodules' : '', URI + '', path].filter(
            Boolean
        ),
        { stdio: 'inherit' }
    );

    for (const name of Git_file) await remove(join(path, name));
}

export async function setRoot(path: string, git: SimpleGit) {
    await copyFrom(join(basePath, 'template'), path);

    fixIgnore('git', path);

    if (!findFile(/ReadMe(\.(md|markdown))?/i, path))
        await setReadMe.call(meta, path, git);

    const config = await setAuthor(path, git);

    (config.meta.name = packageNameOf(path)), (config.meta.version = '1.0.0');

    await outputJSON(join(config.path, 'package.json'), config.meta);
}

export interface WebManifest {
    name: string;
    start_url: string;
    description: string;
    scope?: string;
    lang?: string;
    dir?: string;
    icons?: {
        type: string;
        sizes: string;
        src: string;
    }[];
}

export function setPWA(
    {
        name,
        start_url,
        description,
        scope = '/',
        lang = 'en-US',
        dir = 'ltr',
        icons = []
    }: WebManifest = {} as WebManifest
) {
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
                icons
            }
        },
        serviceWorker: {
            globDirectory: 'public/',
            globPatterns: ['**/*.{html,css,js,ico,gif,png}'],
            swDest: 'public/sw.js',
            importWorkboxFrom: 'disabled',
            importScripts: [
                'https://cdn.jsdelivr.net/npm/workbox-sw@4.3.1/build/workbox-sw.min.js'
            ]
        }
    };
}
